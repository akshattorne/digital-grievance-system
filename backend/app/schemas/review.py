from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from app.models.review import AdminReportStatus

class AdminReportCreateRequest(BaseModel):
    reported_admin_user_id: Optional[str] = None
    district_code: str
    reason: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    related_complaint_no: Optional[str] = None

class AdminReportStatusUpdateRequest(BaseModel):
    status: AdminReportStatus
    resolution_remarks: Optional[str] = None

class AdminReportHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    previous_status: Optional[str] = None
    new_status: str
    actor_user_id: Optional[str] = None
    remarks: Optional[str] = None
    timestamp: datetime

class AdminReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    report_no: str
    reported_admin_user_id: str
    reported_admin_name: Optional[str] = None
    district_code: str
    reason: str
    description: str
    related_complaint_no: Optional[str] = None
    status: AdminReportStatus
    resolution_remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class AdminReportDetailResponse(AdminReportResponse):
    history: List[AdminReportHistoryResponse] = []
