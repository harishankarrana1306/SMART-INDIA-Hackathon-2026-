from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IngestionUploadResponse(BaseModel):
    job_id: str
    record_id: str
    record_code: str
    source_type: str
    title: str
    filename: str
    entities_extracted_count: int
    status: str = "completed"
    message: str
    is_synthetic: bool = True
    disclaimer: str = "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review."


class IngestionStatusResponse(BaseModel):
    job_id: str
    status: str
    record_code: Optional[str] = None
    extracted_count: int = 0
    created_at: datetime
