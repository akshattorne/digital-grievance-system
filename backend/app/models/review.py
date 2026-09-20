import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class AdminReportStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    VALID = "VALID"
    INVALID = "INVALID"
    DISMISSED = "DISMISSED"

class AdminReport(Base):
    __tablename__ = "admin_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_no = Column(String(50), unique=True, nullable=False, index=True)
    reported_admin_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    district_code = Column(String(10), ForeignKey("districts.code"), nullable=False, index=True)
    reporter_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reporter_token_hash = Column(String(255), nullable=True, index=True)

    reason = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    evidence_attachment_id = Column(String(36), ForeignKey("complaint_attachments.id", ondelete="SET NULL"), nullable=True)
    related_complaint_no = Column(String(50), nullable=True)

    status = Column(Enum(AdminReportStatus), default=AdminReportStatus.SUBMITTED, nullable=False, index=True)
    resolution_remarks = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    reported_admin = relationship("User", foreign_keys=[reported_admin_user_id])
    district = relationship("District")
    reporter = relationship("User", foreign_keys=[reporter_user_id])
    evidence_attachment = relationship("ComplaintAttachment")
    history = relationship("AdminReportHistory", back_populates="report", cascade="all, delete-orphan")

class AdminReportHistory(Base):
    __tablename__ = "admin_report_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String(36), ForeignKey("admin_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    actor_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    remarks = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    report = relationship("AdminReport", back_populates="history")
