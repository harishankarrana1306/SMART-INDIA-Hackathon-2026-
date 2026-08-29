import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    rule_name: Mapped[str] = mapped_column(String(128), nullable=False)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(16), default="MEDIUM")  # HIGH, MEDIUM, LOW
    threshold_description: Mapped[str] = mapped_column(Text, nullable=True)
    supporting_entity_ids: Mapped[list] = mapped_column(JSON, nullable=True)
    supporting_record_ids: Mapped[list] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(24), default="unreviewed")  # unreviewed, acknowledged, dismissed, investigating
    reviewed_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    review_notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    reviewer = relationship("User", foreign_keys=[reviewed_by], backref="reviewed_alerts")
