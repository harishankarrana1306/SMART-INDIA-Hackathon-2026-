from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime


class DashboardTotals(BaseModel):
    total_cases: int
    total_entities: int
    total_records: int
    total_alerts: int
    total_relationships: Optional[int] = 0
    total_high_risk_entities: Optional[int] = 0
    total_audit_events: Optional[int] = 0
    entity_breakdown: Optional[Dict[str, int]] = None


class CaseSummary(BaseModel):
    id: str
    case_code: str
    title: str
    case_type: Optional[str] = None
    status: str
    opened_on: Optional[str] = None
    records_count: int = 0
    entities_count: int = 0


class AlertSummaryItem(BaseModel):
    id: str
    rule_name: str
    title: str
    severity: str
    description: str
    created_at: datetime


class RecordSummaryItem(BaseModel):
    id: str
    record_code: str
    source_type: str
    file_name: Optional[str] = None
    ingested_at: datetime


class ActivityItem(BaseModel):
    id: int
    action: str
    user: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    timestamp: datetime
    metadata: Optional[dict] = None


class DashboardSummaryResponse(BaseModel):
    totals: DashboardTotals
    recent_cases: List[CaseSummary]
    recent_alerts: List[AlertSummaryItem] = []
    recent_records: List[RecordSummaryItem] = []
    recent_activity: List[ActivityItem] = []
    entity_breakdown: Optional[Dict[str, int]] = None
    disclaimer: str = "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review."
