from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime


class DashboardTotals(BaseModel):
    total_cases: int
    total_entities: int
    total_records: int
    total_alerts: int
    total_audit_events: int


class CaseSummary(BaseModel):
    id: str
    case_code: str
    title: str
    case_type: Optional[str] = None
    status: str
    opened_on: Optional[str] = None
    records_count: int = 0
    entities_count: int = 0


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
    recent_activity: List[ActivityItem]
    disclaimer: str = "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review."
