from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import settings
from app.core.security import generate_random_token, hash_token
from app.core.permissions import require_admin_review_authority, get_current_user_optional
from app.models.user import User, UserRole, DistrictAdminProfile
from app.models.review import AdminReport, AdminReportStatus, AdminReportHistory
from app.schemas.review import (
    AdminReportCreateRequest, AdminReportStatusUpdateRequest,
    AdminReportResponse, AdminReportDetailResponse
)

router = APIRouter(prefix="/admin-review", tags=["Administrative Review Authority"])

@router.post("/reports", status_code=status.HTTP_201_CREATED)
async def submit_admin_report(
    data: AdminReportCreateRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    # Find District Admin for target district
    admin_res = await db.execute(
        select(DistrictAdminProfile).where(DistrictAdminProfile.district_code == data.district_code.upper())
    )
    admin_profile = admin_res.scalar_one_or_none()
    if not admin_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No District Admin registered for specified district")

    # Generate Report ID
    cnt_res = await db.execute(select(func.count(AdminReport.id)))
    seq = (cnt_res.scalar() or 0) + 1
    report_no = f"REP-{data.district_code.upper()}-{datetime.now(timezone.utc).year}-{seq:06d}"

    raw_reporter_token = None
    token_hash = None
    if not current_user:
        raw_reporter_token = generate_random_token(32)
        token_hash = hash_token(raw_reporter_token)

    report = AdminReport(
        report_no=report_no,
        reported_admin_user_id=admin_profile.user_id,
        district_code=data.district_code.upper(),
        reporter_user_id=current_user.id if current_user else None,
        reporter_token_hash=token_hash,
        reason=data.reason,
        description=data.description,
        related_complaint_no=data.related_complaint_no,
        status=AdminReportStatus.SUBMITTED
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    # Initial history log
    hist = AdminReportHistory(
        report_id=report.id,
        previous_status=None,
        new_status=AdminReportStatus.SUBMITTED.value,
        actor_user_id=current_user.id if current_user else None,
        remarks="Admin misconduct/dissatisfaction report submitted."
    )
    db.add(hist)
    await db.commit()

    return {
        "report_no": report_no,
        "status": AdminReportStatus.SUBMITTED.value,
        "anonymous_reporter_token": raw_reporter_token,
        "message": "District Admin report submitted successfully to the Administrative Review Authority."
    }

@router.get("/reports", response_model=List[AdminReportResponse])
async def list_admin_reports(
    status_filter: Optional[AdminReportStatus] = None,
    district_code: Optional[str] = None,
    current_user: User = Depends(require_admin_review_authority),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(AdminReport)
        .options(selectinload(AdminReport.reported_admin), selectinload(AdminReport.district))
        .order_by(AdminReport.created_at.desc())
    )
    if status_filter:
        query = query.where(AdminReport.status == status_filter)
    if district_code:
        query = query.where(AdminReport.district_code == district_code.upper())

    result = await db.execute(query)
    reports = result.scalars().all()

    out = []
    for r in reports:
        resp = AdminReportResponse.model_validate(r)
        if r.reported_admin:
            resp.reported_admin_name = r.reported_admin.full_name
        out.append(resp)
    return out

@router.get("/reports/{report_id}", response_model=AdminReportDetailResponse)
async def get_admin_report_detail(
    report_id: str,
    current_user: User = Depends(require_admin_review_authority),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AdminReport)
        .options(selectinload(AdminReport.reported_admin), selectinload(AdminReport.district), selectinload(AdminReport.history))
        .where(or_(AdminReport.id == report_id, AdminReport.report_no == report_id.upper()))
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin report not found")

    detail = AdminReportDetailResponse.model_validate(report)
    if report.reported_admin:
        detail.reported_admin_name = report.reported_admin.full_name
    return detail

@router.patch("/reports/{report_id}/status")
async def update_admin_report_status(
    report_id: str,
    data: AdminReportStatusUpdateRequest,
    current_user: User = Depends(require_admin_review_authority),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AdminReport).where(AdminReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin report not found")

    prev_status = report.status.value
    report.status = data.status
    if data.resolution_remarks:
        report.resolution_remarks = data.resolution_remarks

    db.add(report)

    hist = AdminReportHistory(
        report_id=report.id,
        previous_status=prev_status,
        new_status=data.status.value,
        actor_user_id=current_user.id,
        remarks=data.resolution_remarks or f"Status set to {data.status.value}"
    )
    db.add(hist)
    await db.commit()

    return {"message": f"Report status updated to {data.status.value}"}

@router.get("/flagged-admins")
async def get_flagged_district_admins(
    current_user: User = Depends(require_admin_review_authority),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns District Admins with count of VALID reports.
    If valid count >= threshold, marks admin as FLAGGED_FOR_HUMAN_REVIEW.
    Does NOT auto-punish or auto-replace. Decision stays with human authority.
    """
    threshold = settings.ADMIN_REPORT_THRESHOLD

    result = await db.execute(
        select(
            AdminReport.district_code,
            AdminReport.reported_admin_user_id,
            func.count(AdminReport.id).label("valid_count")
        )
        .where(AdminReport.status == AdminReportStatus.VALID)
        .group_by(AdminReport.district_code, AdminReport.reported_admin_user_id)
    )
    rows = result.all()

    flagged_list = []
    for r in rows:
        district_code, admin_user_id, valid_count = r
        admin_user_res = await db.execute(select(User).where(User.id == admin_user_id))
        admin_user = admin_user_res.scalar_one_or_none()

        flagged_list.append({
            "district_code": district_code,
            "admin_user_id": admin_user_id,
            "admin_name": admin_user.full_name if admin_user else "Unknown",
            "admin_email": admin_user.email if admin_user else "Unknown",
            "validated_reports_count": valid_count,
            "configured_threshold": threshold,
            "is_flagged_for_review": valid_count >= threshold,
            "note": "Flagged for human administrative review. No automated penalty applied."
        })

    return flagged_list
