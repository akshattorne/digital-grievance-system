from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.permissions import require_officer, enforce_district_isolation
from app.models.user import User
from app.models.complaint import Complaint, ComplaintStatus
from app.schemas.complaint import ComplaintResponse, ComplaintDetailResponse, StatusUpdateRequest
from app.services.complaint_service import ComplaintService
from app.services.assignment_service import AssignmentService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/officer", tags=["Grievance Officer"])

@router.get("/dashboard")
async def get_officer_dashboard(
    current_user: User = Depends(require_officer),
    db: AsyncSession = Depends(get_db)
):
    await ComplaintService.update_overdue_statuses(db, current_user.officer_profile.district_code)

    status_counts = {}
    for st in ComplaintStatus:
        res = await db.execute(
            select(func.count(Complaint.id)).where(
                Complaint.assigned_officer_id == current_user.id,
                Complaint.status == st
            )
        )
        status_counts[st.value] = res.scalar() or 0

    total_res = await db.execute(
        select(func.count(Complaint.id)).where(Complaint.assigned_officer_id == current_user.id)
    )

    overdue_res = await db.execute(
        select(func.count(Complaint.id)).where(
            Complaint.assigned_officer_id == current_user.id,
            Complaint.is_overdue == True
        )
    )

    return {
        "officer_id": current_user.officer_profile.officer_id,
        "department_id": current_user.officer_profile.department_id,
        "district_code": current_user.officer_profile.district_code,
        "total_assigned": total_res.scalar() or 0,
        "assigned": status_counts.get("ASSIGNED", 0),
        "in_progress": status_counts.get("IN_PROGRESS", 0),
        "on_hold": status_counts.get("ON_HOLD", 0),
        "resolved": status_counts.get("RESOLVED", 0),
        "overdue": overdue_res.scalar() or 0
    }

@router.get("/assigned-complaints", response_model=List[ComplaintResponse])
async def get_officer_assigned_complaints(
    current_user: User = Depends(require_officer),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Complaint)
        .options(selectinload(Complaint.district), selectinload(Complaint.department), selectinload(Complaint.category))
        .where(Complaint.assigned_officer_id == current_user.id)
        .order_by(Complaint.created_at.desc())
    )
    return result.scalars().all()

@router.post("/complaints/{complaint_id}/start")
async def start_complaint_progress(
    complaint_id: str,
    remarks: Optional[str] = None,
    current_user: User = Depends(require_officer),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint or complaint.assigned_officer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned complaint not found")
    if complaint.status not in [ComplaintStatus.ASSIGNED, ComplaintStatus.REOPENED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only assigned or reopened complaints can be started")

    prev_status = complaint.status.value
    complaint.status = ComplaintStatus.IN_PROGRESS
    db.add(complaint)

    await ComplaintService.record_status_history(
        db, complaint.id, prev_status, ComplaintStatus.IN_PROGRESS.value,
        current_user.id, "OFFICER", remarks or "Officer commenced resolution work."
    )
    await db.commit()
    return {"message": "Complaint status updated to IN_PROGRESS."}

@router.post("/complaints/{complaint_id}/hold")
async def put_complaint_on_hold(
    complaint_id: str,
    remarks: str,
    current_user: User = Depends(require_officer),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint or complaint.assigned_officer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned complaint not found")
    if complaint.status != ComplaintStatus.IN_PROGRESS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only in-progress complaints can be placed on hold")

    prev_status = complaint.status.value
    complaint.status = ComplaintStatus.ON_HOLD
    db.add(complaint)

    await ComplaintService.record_status_history(
        db, complaint.id, prev_status, ComplaintStatus.ON_HOLD.value,
        current_user.id, "OFFICER", f"On Hold: {remarks}"
    )
    await db.commit()
    return {"message": "Complaint placed ON_HOLD."}

@router.post("/complaints/{complaint_id}/resolve")
async def mark_complaint_resolved(
    complaint_id: str,
    resolution_summary: str,
    remarks: Optional[str] = None,
    current_user: User = Depends(require_officer),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint or complaint.assigned_officer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned complaint not found")
    if complaint.status != ComplaintStatus.IN_PROGRESS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only in-progress complaints can be resolved")

    prev_status = complaint.status.value
    complaint.status = ComplaintStatus.RESOLVED
    complaint.resolution_summary = resolution_summary
    complaint.resolved_at = datetime.now(timezone.utc)
    db.add(complaint)

    await AssignmentService.update_officer_workload(db, current_user.id, -1)

    await ComplaintService.record_status_history(
        db, complaint.id, prev_status, ComplaintStatus.RESOLVED.value,
        current_user.id, "OFFICER", f"Resolution: {resolution_summary}. {remarks or ''}"
    )

    if complaint.citizen_id:
        await NotificationService.create_notification(
            db, recipient_user_id=complaint.citizen_id,
            type="RESOLUTION",
            title=f"Grievance Resolved: {complaint.complaint_no}",
            message=f"Your grievance {complaint.complaint_no} has been resolved. Please rate your experience.",
            complaint_id=complaint.id
        )

    await db.commit()
    return {"message": "Complaint marked RESOLVED successfully."}
