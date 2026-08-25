"""
Document Ingestion Service
==========================
Handles multi-format parsing (.txt, .pdf, .csv, .json), creates SourceRecord,
and stages candidate extracted entities with explainability metadata.
"""

import io
import csv
import json
import uuid
from typing import Optional, Tuple, List
from datetime import datetime, timezone
from pypdf import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.record import SourceRecord
from app.models.extraction import ExtractedEntity
from app.nlp.extractor import nlp_extractor
from app.core.audit import record_audit_log


class IngestionService:

    @staticmethod
    def extract_text_from_bytes(filename: str, content: bytes) -> str:
        """Extracts plain text from various file formats."""
        lower_name = filename.lower()
        if lower_name.endswith(".pdf"):
            try:
                reader = PdfReader(io.BytesIO(content))
                text_parts = [page.extract_text() or "" for page in reader.pages]
                return "\n".join(text_parts).strip()
            except Exception as e:
                return f"[PDF Parsing Error: {str(e)}]"

        elif lower_name.endswith(".csv"):
            try:
                decoded = content.decode("utf-8", errors="replace")
                reader = csv.reader(io.StringIO(decoded))
                rows = [", ".join(row) for row in reader]
                return "\n".join(rows).strip()
            except Exception as e:
                return f"[CSV Parsing Error: {str(e)}]"

        elif lower_name.endswith(".json"):
            try:
                decoded = content.decode("utf-8", errors="replace")
                data = json.loads(decoded)
                return json.dumps(data, indent=2)
            except Exception as e:
                return f"[JSON Parsing Error: {str(e)}]"

        else:
            return content.decode("utf-8", errors="replace").strip()

    @staticmethod
    async def process_document_upload(
        db: AsyncSession,
        user_id: str,
        filename: str,
        content: bytes,
        source_type: str = "fir",
        case_id: Optional[str] = None,
        title: Optional[str] = None,
    ) -> Tuple[SourceRecord, int, str]:
        """Ingests a document, creates SourceRecord, extracts entities, and stages them."""
        raw_text = IngestionService.extract_text_from_bytes(filename, content)
        if not raw_text:
            raw_text = f"Uploaded document: {filename}"

        # Generate sequential record code
        count_res = await db.execute(select(func.count(SourceRecord.id)))
        next_num = (count_res.scalar() or 0) + 101
        record_code = f"REC-00{next_num}"

        doc_title = title or f"Uploaded Document: {filename}"

        # 1. Create SourceRecord
        record = SourceRecord(
            record_code=record_code,
            case_id=case_id,
            source_type=source_type,
            title=doc_title,
            file_name=filename,
            raw_text=raw_text,
            ingested_by=user_id,
            is_synthetic=True,
            ingested_at=datetime.now(timezone.utc),
        )
        db.add(record)
        await db.flush()

        # 2. Extract Entities using NLP Engine
        extracted_results = nlp_extractor.extract_all(raw_text)

        # 3. Stage candidate ExtractedEntity rows
        staged_entities: List[ExtractedEntity] = []
        for item in extracted_results:
            ee = ExtractedEntity(
                source_record_id=record.id,
                entity_type=item.entity_type,
                raw_value=item.raw_value,
                normalized_value=item.normalized_value,
                confidence=item.confidence,
                char_start=item.char_start,
                char_end=item.char_end,
                context_snippet=item.context_snippet,
                status="pending",
                created_at=datetime.now(timezone.utc),
            )
            staged_entities.append(ee)

        if staged_entities:
            db.add_all(staged_entities)

        # 4. Log cryptographic audit entry
        job_id = f"job_{uuid.uuid4().hex[:10]}"
        await record_audit_log(
            db=db,
            user_id=user_id,
            action="document_ingest",
            target_type="source_record",
            target_id=record_code,
            metadata={
                "job_id": job_id,
                "filename": filename,
                "source_type": source_type,
                "case_id": case_id,
                "extracted_count": len(staged_entities),
            },
        )

        await db.commit()
        await db.refresh(record)

        return record, len(staged_entities), job_id
