import asyncio
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models import (
    User, UserRole, DistrictAdminProfile, OfficerProfile,
    District, Department, Category, CategoryDepartmentMapping, SLARule, PriorityEnum,
    Complaint, ComplaintStatus, ComplaintStatusHistory, ComplaintMessage, Feedback
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

MP_DISTRICTS = [
    ("IND", "Indore", "इन्दौर"),
    ("BHO", "Bhopal", "भोपाल"),
    ("GWL", "Gwalior", "ग्वालियर"),
    ("JAB", "Jabalpur", "जबलपुर"),
    ("UJJ", "Ujjain", "उज्जैन"),
    ("SAG", "Sagar", "सागर"),
    ("REW", "Rewa", "रीवा"),
    ("SAT", "Satna", "सतना")
]

DEPARTMENTS = [
    ("PWD", "Public Works Department (PWD)", "लोक निर्माण विभाग"),
    ("MPPKVVCL", "Electricity Board (Discom)", "विद्युत वितरण कम्पनी"),
    ("NAGAR_NIGAM", "Urban Administration & Housing", "नगरीय विकास एवं आवास विभाग"),
    ("PHE", "Public Health Engineering (Water)", "लोक स्वास्थ्य यांत्रिकी विभाग"),
    ("SANITATION", "Waste Management & Sanitation", "स्वच्छता एवं अपशिष्ट प्रबंधन"),
    ("TRANSPORT", "Regional Transport Office (RTO)", "परिवहन विभाग"),
    ("REVENUE", "Revenue & Public Certificates", "राजस्व एवं लोक सेवा गारंटी"),
    ("IT_EGOV", "IT & MPOnline Governance", "इलेक्ट्रॉनिक्स एवं सुशासन (MPOnline)")
]

CATEGORIES = [
    ("WATER_SUPPLY", "Water Supply & Contamination", "पेयजल आपूर्ति एवं प्रदूषण", "PHE", 24.0),
    ("ELECTRICITY_POWER", "Electricity Outage & Transformer", "बिजली कटौती एवं ट्रांसफार्मर समस्या", "MPPKVVCL", 24.0),
    ("ROADS_POTHOLES", "Road Repair & Potholes", "सड़क मरम्मत एवं गड्ढे", "PWD", 48.0),
    ("DRAINAGE_SEWAGE", "Drainage & Sewage Overflow", "नाली एवं सीवरेज ओवरफ्लो", "NAGAR_NIGAM", 36.0),
    ("GARBAGE_WASTE", "Garbage Clearance & Waste Management", "कचरा उठान एवं अपशिष्ट प्रबंधन", "SANITATION", 24.0),
    ("STREET_LIGHTS", "Street Light Failure", "स्ट्रीट लाइट खराबी", "NAGAR_NIGAM", 24.0),
    ("OTHER", "Other Civic Grievance", "अन्य नागरिक शिकायत", "NAGAR_NIGAM", 72.0)
]

async def seed_data(session: AsyncSession):
    for code, en, hi in MP_DISTRICTS:
        res = await session.execute(select(District).where(District.code == code))
        if not res.scalar_one_or_none():
            session.add(District(code=code, name_en=en, name_hi=hi, is_active=True))

    dept_map = {}
    for code, en, hi in DEPARTMENTS:
        res = await session.execute(select(Department).where(Department.code == code))
        dept = res.scalar_one_or_none()
        if not dept:
            dept = Department(code=code, name_en=en, name_hi=hi, is_active=True)
            session.add(dept)
            await session.flush()
        dept_map[code] = dept.id

    cat_map = {}
    for cat_code, en, hi, dept_code, sla_hours in CATEGORIES:
        res = await session.execute(select(Category).where(Category.code == cat_code))
        cat = res.scalar_one_or_none()
        if not cat:
            cat = Category(code=cat_code, name_en=en, name_hi=hi, default_sla_hours=sla_hours, is_active=True)
            session.add(cat)
            await session.flush()

            dept_id = dept_map.get(dept_code)
            if dept_id:
                session.add(CategoryDepartmentMapping(category_id=cat.id, department_id=dept_id, is_active=True))

            session.add(SLARule(category_id=cat.id, priority=PriorityEnum.HIGH, multiplier=0.5, resolution_deadline_hours=sla_hours * 0.5))
            session.add(SLARule(category_id=cat.id, priority=PriorityEnum.MEDIUM, multiplier=1.0, resolution_deadline_hours=sla_hours * 1.0))
            session.add(SLARule(category_id=cat.id, priority=PriorityEnum.LOW, multiplier=1.5, resolution_deadline_hours=sla_hours * 1.5))
        cat_map[cat_code] = cat.id

    # Accounts
    c_res = await session.execute(select(User).where(User.email == "citizen@example.com"))
    citizen = c_res.scalar_one_or_none()
    if not citizen:
        citizen = User(
            email="citizen@example.com",
            password_hash=get_password_hash(settings.SEED_CITIZEN_PASSWORD),
            full_name="Rajesh Kumar Sharma",
            mobile="9876543210",
            role=UserRole.CITIZEN,
            is_active=True,
            is_verified=True
        )
        session.add(citizen)
        await session.flush()

    da_res = await session.execute(select(User).where(User.email == "admin.indore@mp.gov.in"))
    admin_indore = da_res.scalar_one_or_none()
    if not admin_indore:
        admin_indore = User(
            email="admin.indore@mp.gov.in",
            password_hash=get_password_hash(settings.SEED_ADMIN_PASSWORD),
            full_name="Indore District Collector Admin",
            mobile="9826011111",
            role=UserRole.DISTRICT_ADMIN,
            is_active=True,
            is_verified=True
        )
        session.add(admin_indore)
        await session.flush()
        session.add(DistrictAdminProfile(user_id=admin_indore.id, district_code="IND"))

    off1_res = await session.execute(select(User).where(User.email == "officer.pwd.indore@mp.gov.in"))
    off1 = off1_res.scalar_one_or_none()
    if not off1:
        off1 = User(
            email="officer.pwd.indore@mp.gov.in",
            password_hash=get_password_hash(settings.SEED_OFFICER_PASSWORD),
            full_name="Er. Ramesh Verma (PWD Indore)",
            mobile="9425012345",
            role=UserRole.OFFICER,
            is_active=True,
            is_verified=True
        )
        session.add(off1)
        await session.flush()
        session.add(OfficerProfile(
            user_id=off1.id, officer_id="OFF-IND-001",
            district_code="IND", department_id=dept_map["PWD"],
            is_available=True, active_workload=1
        ))

    await session.commit()

    # Seed demo complaint
    cmp_cnt = await session.execute(select(Complaint))
    if len(cmp_cnt.scalars().all()) == 0:
        now = datetime.now(timezone.utc)
        c1 = Complaint(
            complaint_no="IND-GRV-2026-000001",
            tracking_code="TRK-WTR88A",
            citizen_id=citizen.id,
            is_anonymous=False,
            subject="Main Water Supply Pipe Leakage at Vijay Nagar",
            description="Heavy water leakage from municipal supply line near Scheme No. 54 Vijay Nagar.",
            district_code="IND",
            location_address="Vijay Nagar, Indore",
            category_id=cat_map["WATER_SUPPLY"],
            department_id=dept_map["PHE"],
            priority=PriorityEnum.HIGH,
            status=ComplaintStatus.IN_PROGRESS,
            assigned_officer_id=off1.id,
            sla_deadline=now + timedelta(hours=12),
            is_overdue=False
        )
        session.add(c1)
        await session.commit()

async def seed_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        await seed_data(session)

if __name__ == "__main__":
    asyncio.run(seed_db())
