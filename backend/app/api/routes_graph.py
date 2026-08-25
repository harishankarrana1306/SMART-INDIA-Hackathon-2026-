from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.postgres import get_db
from app.deps import get_current_user
from app.models.user import User
from app.core.audit import write_audit_log
from app.services.graph_service import GraphService
from app.schemas.graph import (
    GraphNode,
    GraphSubgraphResponse,
    NodeProfileResponse,
    EdgeEvidenceResponse,
    RevealSensitiveRequest,
)

router = APIRouter(prefix="/graph", tags=["Graph Visualisation"])


@router.get("/subgraph", response_model=GraphSubgraphResponse)
async def get_subgraph(
    case_id: Optional[str] = None,
    node_type: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    subgraph = await GraphService.get_subgraph(db=db, case_id=case_id, node_type=node_type, limit=limit)
    return subgraph


@router.get("/nodes", response_model=List[GraphNode])
async def search_nodes(
    type: Optional[str] = Query(None, description="Entity type filter"),
    search: Optional[str] = Query(None, description="Search term"),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    nodes = await GraphService.get_nodes(db=db, node_type=type, search=search, limit=limit)
    
    if search:
        # Audit search action
        await write_audit_log(
            db=db,
            action="search",
            user_id=current_user.id,
            target_type="graph_entity",
            target_id=None,
            metadata={"search_query": search, "filter_type": type, "results_count": len(nodes)},
        )
        await db.commit()

    return nodes


@router.get("/expand", response_model=GraphSubgraphResponse)
async def expand_node(
    node_id: str = Query(..., description="Target node ID to expand"),
    depth: int = Query(1, ge=1, le=2, description="Expansion hop depth (1 or 2)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    subgraph = await GraphService.expand_node(db=db, node_id=node_id, depth=depth)
    return subgraph


@router.get("/node/{node_id}", response_model=NodeProfileResponse)
async def get_node_profile(
    node_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await GraphService.get_node_profile(db=db, node_id=node_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node with ID '{node_id}' not found",
        )
    
    # Audit profile view
    await write_audit_log(
        db=db,
        action="record_view",
        user_id=current_user.id,
        target_type="node_profile",
        target_id=node_id,
        metadata={"display_name": profile.display_name, "label": profile.label},
    )
    await db.commit()

    return profile


@router.get("/edge/{edge_id}", response_model=EdgeEvidenceResponse)
async def get_edge_evidence(
    edge_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    evidence = await GraphService.get_edge_evidence(db=db, edge_id=edge_id)
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edge evidence with ID '{edge_id}' not found",
        )
    return evidence


@router.post("/reveal-sensitive/{node_id}")
async def reveal_sensitive_field(
    node_id: str,
    payload: RevealSensitiveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Audited unmasking of sensitive phone numbers and bank account numbers.
    """
    profile = await GraphService.get_node_profile(db=db, node_id=node_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entity '{node_id}' not found",
        )
    
    # Audit reveal action
    await write_audit_log(
        db=db,
        action="reveal_sensitive",
        user_id=current_user.id,
        target_type=profile.label,
        target_id=node_id,
        metadata={
            "reason": payload.reason,
            "display_name": profile.display_name,
            "entity_label": profile.label,
        },
    )
    await db.commit()

    # Unmasked raw value
    props = profile.properties
    raw_val = props.get("number") or props.get("account_number") or props.get("name") or profile.display_name

    return {
        "node_id": node_id,
        "unmasked_value": raw_val,
        "audited": True,
        "disclaimer": "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review.",
    }
