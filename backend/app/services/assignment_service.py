from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.user import User, OfficerProfile, UserRole

class AssignmentService:
    @staticmethod
    async def recommend_officer(
        db: AsyncSession,
        district_code: str,
        department_id: str
    ) -> Optional[OfficerProfile]:
        """
        Recommends an eligible officer based on:
        - Same district
        - Matching department
        - Active user status & is_available == True
        - Lowest active workload
        """
        result = await db.execute(
            select(OfficerProfile)
            .join(User, OfficerProfile.user_id == User.id)
            .where(
                OfficerProfile.district_code == district_code,
                OfficerProfile.department_id == department_id,
                OfficerProfile.is_available == True,
                User.is_active == True,
                User.role == UserRole.OFFICER
            )
            .options(selectinload(OfficerProfile.user))
            .order_by(OfficerProfile.active_workload.asc())
        )
        officers = result.scalars().all()
        if officers:
            return officers[0]
        return None

    @staticmethod
    async def update_officer_workload(db: AsyncSession, officer_user_id: str, delta: int):
        """Adjusts active workload count for officer profile."""
        result = await db.execute(
            select(OfficerProfile).where(OfficerProfile.user_id == officer_user_id)
        )
        profile = result.scalar_one_or_none()
        if profile:
            profile.active_workload = max(0, profile.active_workload + delta)
            db.add(profile)
            await db.commit()
