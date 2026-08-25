from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class BriefEntityHighlight(BaseModel):
    id: str
    name: str
    type: str
    role_or_label: str
    masked_identifier: Optional[str] = None


class BriefRelationshipHighlight(BaseModel):
    source_name: str
    target_name: str
    relationship_type: str
    source_record_code: str
    confidence: float
    explanation: str


class BriefTimelineMilestone(BaseModel):
    timestamp: str
    event_type: str
    title: str
    source_record_code: str


class ExecutiveCaseBriefSchema(BaseModel):
    brief_id: str
    case_id: str
    case_code: str
    case_title: str
    case_status: str
    summary_narrative: str
    key_entities: List[BriefEntityHighlight]
    key_relationships: List[BriefRelationshipHighlight]
    timeline_highlights: List[BriefTimelineMilestone]
    active_alerts: List[str]
    custody_hash: str
    generated_by: str
    generated_at: datetime
    is_synthetic: bool = True
    disclaimer: str = "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review."


class GenerateBriefRequest(BaseModel):
    case_id: str
    custom_notes: Optional[str] = None
