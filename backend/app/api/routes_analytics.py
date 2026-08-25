from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Network Analytics (Phase 3 Stub)"])


@router.get("/centrality")
async def get_network_centrality(
    scope: str = Query("network", enum=["case", "network"]),
    current_user: User = Depends(get_current_user),
):
    return {
        "status": "Phase 3 Feature: NetworkX degree/betweenness centrality calculations pending Phase 3 activation",
        "centrality": {},
    }


@router.get("/communities")
async def get_network_communities(
    current_user: User = Depends(get_current_user),
):
    return {
        "status": "Phase 3 Feature: Louvain community / cluster detection pending Phase 3 activation",
        "communities": [],
    }
