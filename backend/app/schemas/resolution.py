from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class MatchCandidateEntityInfo(BaseModel):
    id: str
    neo4j_id: str
    display_name: str
    entity_type: str
    properties: Dict[str, Any] = {}
    is_masked_sensitive: bool = False


class EntityMatchCandidateSchema(BaseModel):
    id: str
    entity_a_id: str
    entity_b_id: str
    entity_a: MatchCandidateEntityInfo
    entity_b: MatchCandidateEntityInfo
    match_confidence: float
    match_reason: str
    status: str  # pending, merged, rejected
    created_at: datetime
    reviewed_at: Optional[datetime] = None


class MergeApprovalResponse(BaseModel):
    candidate_id: str
    surviving_entity_id: str
    merged_entity_id: str
    status: str = "merged"
    message: str
    audited: bool = True
    disclaimer: str = "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review."


class MatchCandidateRejectRequest(BaseModel):
    reason: Optional[str] = "Investigator rejected merge proposal as distinct entities"


class GenerateCandidatesResponse(BaseModel):
    generated_count: int
    message: str


class MatchRejectResponse(BaseModel):
    candidate_id: str
    status: str
    message: str
