from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class AlertEntityItem(BaseModel):
    id: str
    name: str
    type: str


class AlertSchema(BaseModel):
    id: str
    rule_name: str
    title: str
    description: str
    severity: str  # HIGH, MEDIUM, LOW
    threshold_description: Optional[str] = None
    entity_id: Optional[str] = None
    entity_name: Optional[str] = None
    entity_type: Optional[str] = None
    risk_indicator: Optional[str] = None
    connections_count: Optional[int] = None
    related_entities: List[Any] = []
    cases: List[str] = []
    supporting_entity_ids: List[Any] = []
    supporting_record_ids: List[str] = []
    status: str  # unreviewed, acknowledged, dismissed, investigating
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime
    disclaimer: str = "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review."


class AlertReviewRequest(BaseModel):
    notes: Optional[str] = "Reviewed and acknowledged by investigator"


class AlertDismissRequest(BaseModel):
    reason: str = "Deemed benign following evidentiary evaluation"


class AlertScanResponse(BaseModel):
    new_alerts_count: int
    total_active_alerts: int
    message: str
    disclaimer: str = "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review."
