from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class GraphNode(BaseModel):
    id: str
    label: str
    properties: Dict[str, Any]


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str
    properties: Dict[str, Any]


class GraphSubgraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_nodes: int
    total_edges: int
    disclaimer: str = "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review."


class ConnectedEntityItem(BaseModel):
    id: str
    label: str
    display_name: str
    relationship_type: str
    confidence: Optional[float] = None
    source_record_id: Optional[str] = None


class LinkedCaseItem(BaseModel):
    id: str
    case_code: str
    title: str
    status: str


class NodeProfileResponse(BaseModel):
    id: str
    label: str
    display_name: str
    properties: Dict[str, Any]
    is_masked_sensitive: bool = False
    linked_cases: List[LinkedCaseItem] = []
    connected_entities: List[ConnectedEntityItem] = []
    source_records: List[Dict[str, Any]] = []
    disclaimer: str = "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review."


class EdgeEvidenceResponse(BaseModel):
    edge_id: str
    relationship_type: str
    source_id: str
    source_label: str
    source_name: str
    target_id: str
    target_label: str
    target_name: str
    source_record_code: str
    source_record_type: str
    raw_source_snippet: Optional[str] = None
    explanation: str
    confidence: Optional[float] = 1.0
    date: Optional[str] = None
    is_synthetic: bool = True
    disclaimer: str = "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review."


class RevealSensitiveRequest(BaseModel):
    reason: Optional[str] = "Investigative verification"
