from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class AIRecommendationRequest(BaseModel):
    description: str
    subject: Optional[str] = None
    district_code: Optional[str] = None

class AIRecommendationResponse(BaseModel):
    suggested_category_id: Optional[str] = None
    suggested_category_name: Optional[str] = None
    suggested_department_id: Optional[str] = None
    suggested_department_name: Optional[str] = None
    suggested_priority: Optional[str] = None
    confidence: float
    reasoning: str
    provider: str  # 'gemini' or 'rule_fallback'
    model: str

class AIInsightResponse(BaseModel):
    insight_type: str
    summary_text: str
    highlights: List[str] = []
    recurring_themes: List[str] = []
    operational_suggestions: List[str] = []
    provider: str
    created_at: datetime
