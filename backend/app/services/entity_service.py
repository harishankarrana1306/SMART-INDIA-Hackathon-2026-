from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.entity import GraphEntity


class EntityService:
    @staticmethod
    async def list_entities(
        db: AsyncSession,
        entity_type: Optional[str] = None,
        limit: int = 50
    ) -> List[GraphEntity]:
        query = select(GraphEntity)
        if entity_type:
            query = query.where(GraphEntity.entity_type == entity_type)
        query = query.limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())


class ResolutionService:
    """Stub for Phase 2 Entity Resolution and Deduplication."""
    @staticmethod
    async def get_match_candidates(db: AsyncSession):
        return []
