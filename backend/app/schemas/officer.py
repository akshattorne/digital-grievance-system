from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr
from app.schemas.grievance import DepartmentResponse, DistrictResponse

class OfficerCreateRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    mobile: Optional[str] = None
    district_code: str
    department_id: str

class OfficerUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    department_id: Optional[str] = None
    is_available: Optional[bool] = None
    is_active: Optional[bool] = None

class OfficerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    officer_id: str
    full_name: str
    email: str
    mobile: Optional[str] = None
    district_code: str
    department_id: str
    is_available: bool
    is_active: bool
    active_workload: int
    department: Optional[DepartmentResponse] = None
    district: Optional[DistrictResponse] = None
