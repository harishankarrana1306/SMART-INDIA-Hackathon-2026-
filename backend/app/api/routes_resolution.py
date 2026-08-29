from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.postgres import get_db
from app.deps import get_current_user, require_role
from app.models.user import User
from app.services.resolution_service import ResolutionService
from app.schemas.resolution import (
    EntityMatchCandidateSchema,
    MatchCandidateEntityInfo,
    MergeApprovalResponse,
    MatchCandidateRejectRequest,
    GenerateCandidatesResponse,
    MatchRejectResponse,
)

router = APIRouter(prefix="/resolution", tags=["Entity Resolution"])


@router.get("/candidates", response_model=List[EntityMatchCandidateSchema])
async def list_match_candidates(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists duplicate entity match candidates for human investigator review."""
    candidates_data = await ResolutionService.list_candidates(
        db=db,
        status=status,
        limit=limit,
        offset=offset,
    )

    results = []
    for item in candidates_data:
        cand = item["candidate"]
        e1 = item["entity_a"]
        e2 = item["entity_b"]
        results.append(
            EntityMatchCandidateSchema(
                id=cand.id,
                entity_a_id=cand.entity_a_id,
                entity_b_id=cand.entity_b_id,
                entity_a=MatchCandidateEntityInfo(
                    id=e1.id,
                    neo4j_id=e1.neo4j_node_id,
                    display_name=e1.display_name,
                    entity_type=e1.entity_type,
                    properties=e1.properties_json or {},
                    is_masked_sensitive=e1.is_masked_sensitive,
                ),
                entity_b=MatchCandidateEntityInfo(
                    id=e2.id,
                    neo4j_id=e2.neo4j_node_id,
                    display_name=e2.display_name,
                    entity_type=e2.entity_type,
                    properties=e2.properties_json or {},
                    is_masked_sensitive=e2.is_masked_sensitive,
                ),
                name_variations=item.get("name_variations", [e1.display_name, e2.display_name]),
                cases=item.get("cases", []),
                associated_phones=item.get("associated_phones", []),
                associated_vehicles=item.get("associated_vehicles", []),
                associated_locations=item.get("associated_locations", []),
                other_identifiers=item.get("other_identifiers", []),
                supporting_evidence=item.get("supporting_evidence", []),
                match_confidence=float(cand.match_confidence) if cand.match_confidence else 0.85,
                match_reason=cand.match_reason or "Automated entity similarity",
                status=cand.status,
                created_at=cand.created_at,
                reviewed_at=cand.reviewed_at,
            )
        )
    return results


@router.post("/generate", response_model=GenerateCandidatesResponse)
async def generate_resolution_candidates(
    current_user: User = Depends(require_role(["investigator", "supervisor"])),
    db: AsyncSession = Depends(get_db),
):
    """Scans entities and generates new probabilistic match candidates."""
    count = await ResolutionService.generate_match_candidates(db)
    return GenerateCandidatesResponse(
        generated_count=count,
        message=f"Entity resolution scan complete. {count} new match candidates staged.",
    )


@router.post("/{id}/approve", response_model=MergeApprovalResponse)
async def approve_entity_merge(
    id: str,
    current_user: User = Depends(require_role(["investigator", "supervisor"])),
    db: AsyncSession = Depends(get_db),
):
    """Approves duplicate entity match and redirects graph relationships."""
    try:
        cand = await ResolutionService.approve_merge(db, id, current_user)
        return MergeApprovalResponse(
            candidate_id=cand.id,
            surviving_entity_id=cand.entity_a_id,
            merged_entity_id=cand.entity_b_id,
            status=cand.status,
            message="Entities merged and graph relationships seamlessly redirected.",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{id}/reject", response_model=MatchRejectResponse)
async def reject_entity_match(
    id: str,
    payload: MatchCandidateRejectRequest = MatchCandidateRejectRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rejects an entity match candidate proposal and keeps entities separate."""
    try:
        cand = await ResolutionService.reject_candidate(db, id, current_user, payload.reason)
        return MatchRejectResponse(
            candidate_id=cand.id,
            status=cand.status,
            message="Entity match candidate rejected. Entities will remain separate in graph.",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

