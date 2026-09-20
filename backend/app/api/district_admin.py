from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.permissions import require_district_admin, enforce_district_isolation
from app.models.user import User, UserRole, OfficerProfile, DistrictAdminProfile
from app.models.grievance import Category, Department, CategoryDepartmentMapping, SLARule
from app.models.complaint import Complaint, ComplaintStatus, ReopenRequest, ComplaintStatusHistory
from app.schemas.complaint import (
    ComplaintResponse, ComplaintDetailResponse, StatusUpdateRequest,
    AssignOfficerRequest, ComplaintCorrectionRequest
)
from app.schemas.officer import OfficerCreateRequest, OfficerUpdateRequest, OfficerResponse
from app.schemas.grievance import CategoryResponse, CategoryCreateRequest, CategoryUpdateRequest
from app.services.complaint_service import ComplaintService
from app.services.assignment_service import AssignmentService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/district-admin", tags=["District Admin"])

@router.get("/dashboard")
async def get_district_dashboard(
    current_user: User = Depends(require_district_admin),
    db: AsyncSession = Depends(get_db)
):
    district_code = current_user.district_admin_profile.district_code

    # Batch compute status metrics isolated strictly to admin's district
    await ComplaintService.update_overdue_statuses(db, district_code)

    status_counts = {}
    for st in ComplaintStatus:
        res = await db.execute(
            select(func.count(Complaint.id)).where(Complaint.district_code == district_code, Complaint.status == st)
        )
        status_counts[st.value] = res.scalar() or 0

    overdue_res = await db.execute(
        select(func.count(Complaint.id)).where(Complaint.district_code == district_code, Complaint.is_overdue == True)
    )
    overdue_count = overdue_res.scalar() or 0

    total_res = await db.execute(
        select(func.count(Complaint.id)).where(Complaint.district_code == district_code)
    )
    total_count = total_res.scalar() or 0

    officer_count_res = await db.execute(
        select(func.count(OfficerProfile.id)).where(OfficerProfile.district_code == district_code)
    )

    return {
        "district_code": district_code,
        "total_complaints": total_count,
        "submitted": status_counts.get("SUBMITTED", 0),
        "received": status_counts.get("RECEIVED", 0),
        "assigned": status_counts.get("ASSIGNED", 0),
        "in_progress": status_counts.get("IN_PROGRESS", 0),
        "on_hold": status_counts.get("ON_HOLD", 0),
        "resolved": status_counts.get("RESOLVED", 0),
        "closed": status_counts.get("CLOSED", 0),
        "rejected": status_counts.get("REJECTED", 0),
        "reopened": status_counts.get("REOPENED", 0),
        "overdue": overdue_count,
        "active_officers": officer_count_res.scalar() or 0
    }

@router.get("/complaints", response_model=List[ComplaintResponse])
async def get_district_complaints(
    status_filter: Optional[str] = None,
    category_id: Optional[str] = None,
    priority: Optional[str] = None,
    search_query: Optional[str] = None,
    is_overdue: Optional[bool] = None,
    current_user: User = Depends(require_district_admin),
    db: AsyncSession = Depends(get_db)
):
    district_code = current_user.district_admin_profile.district_code
    query = (
        select(Complaint)
        .options(selectinload(Complaint.district), selectinload(Complaint.department), selectinload(Complaint.category), selectinload(Complaint.assigned_officer))
        .where(Complaint.district_code == district_code)
    )

    if status_filter:
        query = query.where(Complaint.status == status_filter)
    if category_id:
        query = query.where(Complaint.category_id == category_id)
    if priority:
        query = query.where(Complaint.priority == priority)
    if is_overdue is not None:
        query = query.where(Complaint.is_overdue == is_overdue)
    if search_query:
        term = f"%{search_query.strip()}%"
        query = query.where(
            or_(
                Complaint.complaint_no.ilike(term),
                Complaint.subject.ilike(term),
                Complaint.description.ilike(term)
            )
        )

    query = query.order_by(Complaint.created_at.desc())
    result = await db.execute(query)
    complaints = result.scalars().all()

    responses = []
    for c in complaints:
        resp = ComplaintResponse.model_validate(c)
        if c.assigned_officer:
            resp.assigned_officer_name = c.assigned_officer.full_name
        responses.append(resp)
    return responses

@router.patch("/complaints/{complaint_id}/correct", response_model=ComplaintDetailResponse)
async def correct_complaint_metadata(
    complaint_id: str,
    data: ComplaintCorrectionRequest,
    current_user: User = Depends(require_district_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    enforce_district_isolation(current_user, complaint.district_code)

    if data.category_id:
        complaint.category_id = data.category_id
    if data.department_id:
        complaint.department_id = data.department_id
    if data.priority:
        complaint.priority = data.priority
        # Recalculate SLA deadline on priority correction
        new_deadline, _ = await ComplaintService.calculate_sla_deadline(db, complaint.category_id, complaint.priority)
        complaint.sla_deadline = new_deadline

    db.add(complaint)
    await ComplaintService.record_status_history(
        db, complaint.id, complaint.status.value, complaint.status.value,
        current_user.id, "DISTRICT_ADMIN", f"Metadata correction by Admin. Remarks: {data.remarks or 'None'}"
    )
    await db.commit()

    # Re-fetch detail
    res = await db.execute(
        select(Complaint)
        .options(
            selectinload(Complaint.district), selectinload(Complaint.department),
            selectinload(Complaint.category), selectinload(Complaint.assigned_officer),
            selectinload(Complaint.attachments), selectinload(Complaint.status_history)
        )
        .where(Complaint.id == complaint.id)
    )
    return res.scalar_one()

@router.post("/complaints/{complaint_id}/assign")
async def assign_officer_to_complaint(
    complaint_id: str,
    data: AssignOfficerRequest,
    current_user: User = Depends(require_district_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    enforce_district_isolation(current_user, complaint.district_code)
    if complaint.status in [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED, ComplaintStatus.REJECTED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Closed, resolved, or rejected complaints cannot be assigned")

    # Validate target officer exists in same district
    off_res = await db.execute(
        select(User)
        .options(selectinload(User.officer_profile))
        .where(User.id == data.officer_id, User.role == UserRole.OFFICER)
    )
    officer_user = off_res.scalar_one_or_none()
    if not officer_user or not officer_user.officer_profile or officer_user.officer_profile.district_code != complaint.district_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected officer does not belong to this district")

    prev_officer_id = complaint.assigned_officer_id
    if prev_officer_id:
        await AssignmentService.update_officer_workload(db, prev_officer_id, -1)

    complaint.assigned_officer_id = officer_user.id
    prev_status = complaint.status.value
    complaint.status = ComplaintStatus.ASSIGNED
    db.add(complaint)

    await AssignmentService.update_officer_workload(db, officer_user.id, +1)

    await ComplaintService.record_status_history(
        db, complaint.id, prev_status, ComplaintStatus.ASSIGNED.value,
        current_user.id, "DISTRICT_ADMIN", f"Assigned to Officer {officer_user.full_name}. Remarks: {data.remarks or 'None'}"
    )

    await NotificationService.create_notification(
        db, recipient_user_id=officer_user.id,
        type="ASSIGNMENT",
        title=f"New Assignment: {complaint.complaint_no}",
        message=f"You have been assigned grievance {complaint.complaint_no}: {complaint.subject}",
        complaint_id=complaint.id,
        recipient_email=officer_user.email
    )

    await db.commit()
    return {"message": f"Assigned to {officer_user.full_name} successfully."}

@router.get("/recommend-officer/{complaint_id}")
async def recommend_officer_for_complaint(
    complaint_id: str,
    current_user: User = Depends(require_district_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    enforce_district_isolation(current_user, complaint.district_code)

    officer_profile = await AssignmentService.recommend_officer(db, complaint.district_code, complaint.department_id)
    if not officer_profile:
        return {"recommended": False, "message": "No eligible active officer found for this department."}

    return {
        "recommended": True,
        "officer_user_id": officer_profile.user_id,
        "officer_name": officer_profile.user.full_name,
        "officer_code": officer_profile.officer_id,
        "active_workload": officer_profile.active_workload
    }

@router.post("/complaints/{complaint_id}/status")
async def update_complaint_status_admin(
    complaint_id: str,
    data: StatusUpdateRequest,
    current_user: User = Depends(require_district_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    enforce_district_isolation(current_user, complaint.district_code)

    prev_status = complaint.status.value
    complaint.status = data.status

    if data.status == ComplaintStatus.CLOSED and prev_status != ComplaintStatus.CLOSED:
        complaint.closed_at = datetime.now(timezone.utc)
        if complaint.assigned_officer_id:
            await AssignmentService.update_officer_workload(db, complaint.assigned_officer_id, -1)

    db.add(complaint)
    await ComplaintService.record_status_history(
        db, complaint.id, prev_status, data.status.value,
        current_user.id, "DISTRICT_ADMIN", data.remarks or f"Status set to {data.status.value}"
    )

    await db.commit()
    return {"message": f"Status updated to {data.status.value}"}

# Officer Management Endpoints
@router.get("/officers", response_model=List[OfficerResponse])
async def list_district_officers(
    current_user: User = Depends(require_district_admin),
    db: AsyncSession = Depends(get_db)
):
    district_code = current_user.district_admin_profile.district_code
    result = await db.execute(
        select(OfficerProfile)
        .options(selectinload(OfficerProfile.user), selectinload(OfficerProfile.department), selectinload(OfficerProfile.district))
        .where(OfficerProfile.district_code == district_code)
    )
    profiles = result.scalars().all()

    out = []
    for p in profiles:
        out.append(OfficerResponse(
            id=p.id,
            user_id=p.user_id,
            officer_id=p.officer_id,
            full_name=p.user.full_name,
            email=p.user.email,
            mobile=p.user.mobile,
            district_code=p.district_code,
            department_id=p.department_id,
            is_available=p.is_available,
            is_active=p.user.is_active,
            active_workload=p.active_workload,
            department=p.department,
            district=p.district
        ))
    return out

@router.post("/officers", response_model=OfficerResponse, status_code=status.HTTP_201_CREATED)
async def create_district_officer(
    data: OfficerCreateRequest,
    current_user: User = Depends(require_district_admin),
    db: AsyncSession = Depends(get_db)
):
    admin_district = current_user.district_admin_profile.district_code
    enforce_district_isolation(current_user, data.district_code)

    existing = await db.execute(select(User.id).where(User.email == data.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email address already exists")

    department = await db.execute(select(Department).where(Department.id == data.department_id, Department.is_active == True))
    if not department.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected department not found or inactive")

    # Count existing officers for sequence code
    cnt_res = await db.execute(select(func.count(OfficerProfile.id)).where(OfficerProfile.district_code == admin_district))
    officer_seq = (cnt_res.scalar() or 0) + 1
    officer_code = f"OFF-{admin_district}-{officer_seq:03d}"

    # Create User
    user = User(
        email=data.email.lower(),
        password_hash=get_password_hash(data.password),
        full_name=data.full_name,
        mobile=data.mobile,
        role=UserRole.OFFICER,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.flush()

    profile = OfficerProfile(
        user_id=user.id,
        officer_id=officer_code,
        district_code=admin_district,
        department_id=data.department_id,
        is_available=True,
        active_workload=0
    )
    db.add(profile)
    await db.commit()

    res = await db.execute(
        select(OfficerProfile)
        .options(selectinload(OfficerProfile.user), selectinload(OfficerProfile.department), selectinload(OfficerProfile.district))
        .where(OfficerProfile.id == profile.id)
    )
    p = res.scalar_one()
    return OfficerResponse(
        id=p.id,
        user_id=p.user_id,
        officer_id=p.officer_id,
        full_name=p.user.full_name,
        email=p.user.email,
        mobile=p.user.mobile,
        district_code=p.district_code,
        department_id=p.department_id,
        is_available=p.is_available,
        is_active=p.user.is_active,
        active_workload=p.active_workload,
        department=p.department,
        district=p.district
    )
