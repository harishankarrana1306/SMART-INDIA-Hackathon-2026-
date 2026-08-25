from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: int
    seq_no: int
    user_id: Optional[str] = None
    username: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    timestamp: datetime
    prev_hash: str
    record_hash: str

    model_config = ConfigDict(from_attributes=True)


class AuditChainVerifyResponse(BaseModel):
    valid: bool
    total_records: int
    first_broken_seq: Optional[int] = None
    message: str
    verified_at: datetime
