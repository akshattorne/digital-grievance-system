import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    suggested_category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    suggested_department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    suggested_priority = Column(String(20), nullable=True)
    confidence = Column(Float, nullable=False, default=0.0)
    reasoning = Column(Text, nullable=True)
    provider = Column(String(50), nullable=False, default="gemini")  # gemini or rule_fallback
    model = Column(String(50), nullable=False, default="gemini-1.5-flash")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    complaint = relationship("Complaint")
    suggested_category = relationship("Category")
    suggested_department = relationship("Department")

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    district_code = Column(String(10), ForeignKey("districts.code"), nullable=True, index=True)
    insight_type = Column(String(50), nullable=False)  # TRENDS, BOTTLENECK, SUMMARY
    summary_text = Column(Text, nullable=False)
    payload = Column(Text, nullable=True)  # JSON string of detailed items
    provider = Column(String(50), nullable=False, default="gemini")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
