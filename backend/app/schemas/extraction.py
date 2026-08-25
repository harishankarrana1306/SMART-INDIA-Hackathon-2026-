from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ExtractedEntitySchema(BaseModel):
    id: str
    record_id: str
    record_code: Optional[str] = None
    case_id: Optional[str] = None
    entity_type: str
    raw_value: str
    normalized_value: str
    confidence: float
    status: str  # pending, approved, rejected
    char_start: Optional[int] = None
    char_end: Optional[int] = None
    context_snippet: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None


class EntityReviewActionResponse(BaseModel):
    id: str
    status: str
    normalized_value: str
    entity_type: str
    synced_to_graph: bool
    message: str
    disclaimer: str = "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review."


class EntityCorrectRequest(BaseModel):
    normalized_value: str
    entity_type: str
    reason: Optional[str] = "Investigator correction during staging review"


class BatchApproveRequest(BaseModel):
    extraction_ids: List[str]
    min_confidence: Optional[float] = 0.85
