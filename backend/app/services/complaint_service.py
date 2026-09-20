import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.grievance import Category, SLARule, PriorityEnum, CategoryDepartmentMapping
from app.models.complaint import Complaint, ComplaintStatus, ComplaintStatusHistory
from app.models.audit import AuditLog

class ComplaintService:
    @staticmethod
    async def generate_complaint_no(db: AsyncSession, district_code: str) -> str:
        """
        Generates unique, race-condition safe Complaint ID:
        Format: DISTRICT-CODE-GRV-YEAR-SEQUENCE (e.g., IND-GRV-2026-000001)
        """
        year = datetime.now(timezone.utc).year
        prefix = f"{district_code.upper()}-GRV-{year}-"
        
        # Query highest sequence number for this district & year prefix
        result = await db.execute(
            select(func.count(Complaint.id)).where(Complaint.complaint_no.like(f"{prefix}%"))
        )
        count = result.scalar() or 0
        sequence_num = count + 1
        
        # Ensure uniqueness in case of concurrent execution
        while True:
            complaint_no = f"{prefix}{sequence_num:06d}"
            existing = await db.execute(select(Complaint.id).where(Complaint.complaint_no == complaint_no))
            if not existing.scalar_one_or_none():
                return complaint_no
            sequence_num += 1

    @staticmethod
    def generate_tracking_code() -> str:
        """Generates random 8-character uppercase alphanumeric tracking code (e.g., 'TRK-98A4B2')."""
        chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"TRK-{chars}"

    @staticmethod
    async def calculate_sla_deadline(
        db: AsyncSession,
        category_id: str,
        priority: PriorityEnum
    ) -> Tuple[datetime, float]:
        """
        Calculates SLA deadline based on:
        Category Default SLA Hours * Priority Multiplier
        HIGH: 0.5x, MEDIUM: 1.0x, LOW: 1.5x
        """
        cat_result = await db.execute(select(Category).where(Category.id == category_id))
        category = cat_result.scalar_one_or_none()
        default_hours = category.default_sla_hours if category else 48.0

        multiplier = 1.0
        if priority == PriorityEnum.HIGH:
            multiplier = 0.5
        elif priority == PriorityEnum.LOW:
            multiplier = 1.5

        # Check for explicit SLA rule override
        rule_res = await db.execute(
            select(SLARule).where(SLARule.category_id == category_id, SLARule.priority == priority)
        )
        rule = rule_res.scalar_one_or_none()
        if rule:
            effective_hours = rule.resolution_deadline_hours
        else:
            effective_hours = default_hours * multiplier

        deadline = datetime.now(timezone.utc) + timedelta(hours=effective_hours)
        return deadline, effective_hours

    @staticmethod
    async def record_status_history(
        db: AsyncSession,
        complaint_id: str,
        previous_status: Optional[str],
        new_status: str,
        actor_user_id: Optional[str],
        actor_role: str,
        remarks: Optional[str] = None
    ) -> ComplaintStatusHistory:
        """Creates an immutable audit timeline event."""
        history = ComplaintStatusHistory(
            complaint_id=complaint_id,
            previous_status=previous_status,
            new_status=new_status,
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            remarks=remarks
        )
        db.add(history)
        
        # Log to system audit trail
        audit = AuditLog(
            action=f"COMPLAINT_STATUS_{new_status}",
            actor_user_id=actor_user_id,
            resource_type="COMPLAINT",
            resource_id=complaint_id,
            details=f"Status changed from {previous_status} to {new_status}. Remarks: {remarks or 'None'}"
        )
        db.add(audit)
        
        await db.commit()
        await db.refresh(history)
        return history

    @staticmethod
    async def update_overdue_statuses(db: AsyncSession, district_code: Optional[str] = None):
        """Batch checks and updates is_overdue flag for active complaints."""
        now = datetime.now(timezone.utc)
        query = select(Complaint).where(
            Complaint.sla_deadline < now,
            Complaint.status.notin_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED, ComplaintStatus.REJECTED]),
            Complaint.is_overdue == False
        )
        if district_code:
            query = query.where(Complaint.district_code == district_code)

        result = await db.execute(query)
        overdue_complaints = result.scalars().all()
        
        for c in overdue_complaints:
            c.is_overdue = True
            db.add(c)
        if overdue_complaints:
            await db.commit()
