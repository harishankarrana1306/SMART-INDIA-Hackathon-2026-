from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.postgres import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services.timeline_service import TimelineService
from app.schemas.timeline import TimelineResponse

router = APIRouter(prefix="/timeline", tags=["Timeline"])


@router.get("", response_model=TimelineResponse)
async def get_event_timeline(
    entity_id: Optional[str] = Query(None),
    case_id: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves unified chronological event stream with explainable citations."""
    return await TimelineService.get_timeline(
        db=db,
        entity_id=entity_id,
        case_id=case_id,
        from_date=from_date,
        to_date=to_date,
        event_type=event_type,
    )
