import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class SourceRecord(Base):
    __tablename__ = "source_records"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    record_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id"), nullable=True)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)  # fir, cdr, financial, surveillance, social_media, criminal_history
    raw_text: Mapped[str] = mapped_column(Text, nullable=True)
    file_name: Mapped[str] = mapped_column(String(256), nullable=True)
    title: Mapped[str] = mapped_column(String(256), nullable=True)
    ingested_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    ingested_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=True)

    case = relationship("Case", foreign_keys=[case_id], backref="source_records")
    user = relationship("User", foreign_keys=[ingested_by], backref="ingested_records")
