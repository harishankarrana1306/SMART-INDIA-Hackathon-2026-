from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class TimelineEventItem(BaseModel):
    event_id: str
    event_type: str  # call, financial_transfer, surveillance_sighting, fir_filed, bank_activity
    timestamp: str
    title: str
    description: str
    source_record_code: str
    source_record_type: str
    confidence: float
    actors: List[Dict[str, Any]] = []
    location: Optional[str] = None
    properties: Dict[str, Any] = {}


class TimelineResponse(BaseModel):
    events: List[TimelineEventItem]
    total_events: int
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    entity_filter: Optional[str] = None
    disclaimer: str = "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review."
