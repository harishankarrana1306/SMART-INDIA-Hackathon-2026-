import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Numeric, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class GraphEntity(Base):
    __tablename__ = "graph_entities"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    neo4j_node_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(32), nullable=False)
    display_name: Mapped[str] = mapped_column(String(256), nullable=False)
    is_masked_sensitive: Mapped[bool] = mapped_column(Boolean, default=False)
    properties_json: Mapped[dict] = mapped_column("properties", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class EntityMatchCandidate(Base):
    __tablename__ = "entity_match_candidates"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    entity_a_id: Mapped[str] = mapped_column(String(36), ForeignKey("graph_entities.id"), nullable=False)
    entity_b_id: Mapped[str] = mapped_column(String(36), ForeignKey("graph_entities.id"), nullable=False)
    match_confidence: Mapped[float] = mapped_column(Numeric(4, 3), nullable=True)
    match_reason: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="pending")  # pending, merged, rejected
    reviewed_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    entity_a = relationship("GraphEntity", foreign_keys=[entity_a_id])
    entity_b = relationship("GraphEntity", foreign_keys=[entity_b_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
