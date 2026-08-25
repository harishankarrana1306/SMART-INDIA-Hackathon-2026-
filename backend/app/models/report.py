import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class CaseBrief(Base):
    __tablename__ = "case_briefs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    summary_narrative: Mapped[str] = mapped_column(Text, nullable=False)
    key_entities_json: Mapped[dict] = mapped_column("key_entities", JSON, nullable=True)
    key_relationships_json: Mapped[dict] = mapped_column("key_relationships", JSON, nullable=True)
    timeline_highlights_json: Mapped[dict] = mapped_column("timeline_highlights", JSON, nullable=True)
    active_alerts_json: Mapped[dict] = mapped_column("active_alerts", JSON, nullable=True)
    custody_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    generated_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=True)

    case = relationship("Case", foreign_keys=[case_id], backref="briefs")
    generator = relationship("User", foreign_keys=[generated_by], backref="generated_briefs")
