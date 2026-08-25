from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.postgres import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services.extraction_service import ExtractionService
from app.schemas.extraction import (
    ExtractedEntitySchema,
    EntityReviewActionResponse,
    EntityCorrectRequest,
    BatchApproveRequest,
)

router = APIRouter(prefix="/entities", tags=["Entities"])


@router.get("/extracted", response_model=List[ExtractedEntitySchema])
async def list_extracted_entities(
    record_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    min_confidence: Optional[float] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves staged extracted entities with filtering options."""
    rows = await ExtractionService.list_extractions(
        db=db,
        record_id=record_id,
        status=status,
        entity_type=entity_type,
        min_confidence=min_confidence,
        limit=limit,
        offset=offset,
    )
    return [
        ExtractedEntitySchema(
            id=item.id,
            record_id=item.source_record_id,
            record_code=rec_code,
            case_id=c_id,
            entity_type=item.entity_type,
            raw_value=item.raw_value,
            normalized_value=item.normalized_value or item.raw_value,
            confidence=float(item.confidence) if item.confidence else 0.9,
            status=item.status,
            char_start=item.char_start,
            char_end=item.char_end,
            context_snippet=item.context_snippet,
            created_at=item.created_at,
            reviewed_at=item.reviewed_at,
        )
        for item, rec_code, c_id in rows
    ]


@router.post("/{id}/approve", response_model=EntityReviewActionResponse)
async def approve_entity(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approves an extracted entity and synchronizes it into the Neo4j graph network."""
    try:
        item, synced = await ExtractionService.approve_extraction(db, id, current_user)
        return EntityReviewActionResponse(
            id=item.id,
            status=item.status,
            normalized_value=item.normalized_value,
            entity_type=item.entity_type,
            synced_to_graph=synced,
            message="Entity approved and successfully synced to knowledge graph.",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{id}/correct", response_model=EntityReviewActionResponse)
async def correct_entity(
    id: str,
    payload: EntityCorrectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Corrects the value/type of an extracted entity, approves it, and syncs to graph."""
    try:
        item = await ExtractionService.correct_extraction(
            db=db,
            extraction_id=id,
            new_value=payload.normalized_value,
            new_type=payload.entity_type,
            user=current_user,
            reason=payload.reason,
        )
        return EntityReviewActionResponse(
            id=item.id,
            status=item.status,
            normalized_value=item.normalized_value,
            entity_type=item.entity_type,
            synced_to_graph=True,
            message="Entity corrected, approved, and synced to knowledge graph.",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{id}/reject", response_model=EntityReviewActionResponse)
async def reject_entity(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rejects an incorrectly extracted entity."""
    try:
        item = await ExtractionService.reject_extraction(db, id, current_user)
        return EntityReviewActionResponse(
            id=item.id,
            status=item.status,
            normalized_value=item.normalized_value,
            entity_type=item.entity_type,
            synced_to_graph=False,
            message="Entity rejected from knowledge graph.",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/batch-approve", response_model=List[EntityReviewActionResponse])
async def batch_approve_entities(
    payload: BatchApproveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approves a list of extracted entities in batch."""
    results = []
    for eid in payload.extraction_ids:
        try:
            item, synced = await ExtractionService.approve_extraction(db, eid, current_user)
            results.append(
                EntityReviewActionResponse(
                    id=item.id,
                    status=item.status,
                    normalized_value=item.normalized_value,
                    entity_type=item.entity_type,
                    synced_to_graph=synced,
                    message="Batch approved.",
                )
            )
        except Exception:
            continue
    return results
