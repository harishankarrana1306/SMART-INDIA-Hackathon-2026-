"""
Extraction Review & Graph Synchronization Service
=================================================
Implements human-in-the-loop validation for NLP-extracted entities.
Synchronizes approved entities and relationships to the Neo4j graph.
"""

from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone
import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.extraction import ExtractedEntity
from app.models.record import SourceRecord
from app.models.entity import GraphEntity
from app.models.case import Case
from app.models.user import User
from app.db.neo4j_driver import neo4j_service
from app.core.audit import record_audit_log


class ExtractionService:

    @staticmethod
    async def list_extractions(
        db: AsyncSession,
        record_id: Optional[str] = None,
        status: Optional[str] = None,
        entity_type: Optional[str] = None,
        min_confidence: Optional[float] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Tuple[ExtractedEntity, Optional[str], Optional[str]]]:
        """Queries staged extractions with joined source record code and case ID."""
        query = (
            select(ExtractedEntity, SourceRecord.record_code, SourceRecord.case_id)
            .join(SourceRecord, ExtractedEntity.source_record_id == SourceRecord.id)
            .order_by(desc(ExtractedEntity.created_at))
        )

        if record_id:
            query = query.where(ExtractedEntity.source_record_id == record_id)
        if status and status != "ALL":
            query = query.where(ExtractedEntity.status == status)
        if entity_type and entity_type != "ALL":
            query = query.where(ExtractedEntity.entity_type == entity_type)
        if min_confidence:
            query = query.where(ExtractedEntity.confidence >= min_confidence)

        query = query.limit(limit).offset(offset)
        res = await db.execute(query)
        return [(row[0], row[1], row[2]) for row in res.all()]

    @staticmethod
    async def approve_extraction(
        db: AsyncSession,
        extraction_id: str,
        user: User,
    ) -> Tuple[ExtractedEntity, bool]:
        """Approves a staged extraction and syncs it to relational & Neo4j graph models."""
        query = select(ExtractedEntity).where(ExtractedEntity.id == extraction_id)
        res = await db.execute(query)
        item = res.scalar_one_or_none()
        if not item:
            raise ValueError(f"Extracted entity {extraction_id} not found")

        # 1. Update status
        item.status = "approved"
        item.reviewed_by = user.id
        item.reviewed_at = datetime.now(timezone.utc)

        # 2. Get parent Source Record & Case
        rec_res = await db.execute(select(SourceRecord).where(SourceRecord.id == item.source_record_id))
        source_rec = rec_res.scalar_one_or_none()
        case_id = source_rec.case_id if source_rec else None

        # 3. Synchronize to GraphEntity (Relational mirror)
        safe_val = re.sub(r"[^a-zA-Z0-9_]", "_", item.normalized_value).lower()
        neo4j_id = f"{item.entity_type.lower()}_{safe_val}"

        existing_ge_res = await db.execute(
            select(GraphEntity).where(GraphEntity.neo4j_node_id == neo4j_id)
        )
        ge = existing_ge_res.scalar_one_or_none()

        is_sensitive = item.entity_type in ["Phone", "BankAccount"]

        if not ge:
            ge = GraphEntity(
                neo4j_node_id=neo4j_id,
                entity_type=item.entity_type,
                display_name=item.normalized_value,
                is_masked_sensitive=is_sensitive,
                properties_json={"created_from_record": source_rec.record_code if source_rec else None},
                created_at=datetime.now(timezone.utc),
            )
            db.add(ge)

        # 4. Synchronize to Neo4j / In-Memory Graph Store
        neo4j_service.mock_store.add_node(
            node_id=neo4j_id,
            label=item.entity_type,
            properties={
                "name": item.normalized_value,
                "display_name": item.normalized_value,
                "is_synthetic": True,
                "source_record": source_rec.record_code if source_rec else "MANUAL",
            },
        )

        # 5. Establish canonical case relationship in knowledge graph
        target_case_node = "case_node_01"
        rec_code = source_rec.record_code if source_rec else "REC-000101"
        rec_type = source_rec.source_type if source_rec else "fir"
        rec_title = source_rec.title if source_rec else "Investigative Document"

        if case_id:
            case_res = await db.execute(select(Case).where((Case.id == case_id) | (Case.case_code == case_id)))
            case_obj = case_res.scalar_one_or_none()
            if case_obj:
                c_code = case_obj.case_code.lower()
                for nid in ["case_node_01", "case_node_02", "case_node_03", "case_node_04", "case_node_05", "case_node_06"]:
                    idx_str = nid.split("_")[-1]
                    if f"000{int(idx_str)}" in c_code or f"0{int(idx_str)}" in c_code or f"case {int(idx_str)}" in c_code:
                        target_case_node = nid
                        break

        edge_id = f"e_sync_{extraction_id}_{target_case_node}"
        neo4j_service.mock_store.add_edge(
            edge_id=edge_id,
            source_id=neo4j_id,
            target_id=target_case_node,
            rel_type="LINKED_THROUGH_REPORT",
            properties={
                "source_record_id": rec_code,
                "source_record_type": rec_type,
                "explanation": f"Extracted from {rec_title} ({rec_code}) and verified by investigator.",
                "confidence": item.confidence if item.confidence is not None else 0.9,
                "date": str(source_rec.ingested_at.date()) if source_rec and source_rec.ingested_at else "2026-08-24",
                "raw_source_snippet": item.context_snippet or item.raw_value,
            },
        )

        # 6. Cryptographic Audit Log
        await record_audit_log(
            db=db,
            user_id=user.id,
            action="extraction_approve",
            target_type="extracted_entity",
            target_id=extraction_id,
            metadata={
                "entity_type": item.entity_type,
                "normalized_value": item.normalized_value,
                "record_code": source_rec.record_code if source_rec else None,
                "neo4j_id": neo4j_id,
            },
        )

        await db.commit()
        await db.refresh(item)
        return item, True

    @staticmethod
    async def correct_extraction(
        db: AsyncSession,
        extraction_id: str,
        new_value: str,
        new_type: str,
        user: User,
        reason: Optional[str] = None,
    ) -> ExtractedEntity:
        """Corrects an extracted entity's normalized value/type and approves it."""
        query = select(ExtractedEntity).where(ExtractedEntity.id == extraction_id)
        res = await db.execute(query)
        item = res.scalar_one_or_none()
        if not item:
            raise ValueError(f"Extracted entity {extraction_id} not found")

        old_val = item.normalized_value
        old_type = item.entity_type

        item.normalized_value = new_value.strip()
        item.entity_type = new_type.strip()
        item.confidence = 1.0
        item.status = "approved"
        item.reviewed_by = user.id
        item.reviewed_at = datetime.now(timezone.utc)

        await record_audit_log(
            db=db,
            user_id=user.id,
            action="extraction_correct",
            target_type="extracted_entity",
            target_id=extraction_id,
            metadata={
                "old_value": old_val,
                "new_value": new_value,
                "old_type": old_type,
                "new_type": new_type,
                "reason": reason or "Investigator manual correction",
            },
        )

        await db.commit()
        await ExtractionService.approve_extraction(db, extraction_id, user)
        return item

    @staticmethod
    async def reject_extraction(
        db: AsyncSession,
        extraction_id: str,
        user: User,
    ) -> ExtractedEntity:
        """Rejects a staged extraction."""
        query = select(ExtractedEntity).where(ExtractedEntity.id == extraction_id)
        res = await db.execute(query)
        item = res.scalar_one_or_none()
        if not item:
            raise ValueError(f"Extracted entity {extraction_id} not found")

        item.status = "rejected"
        item.reviewed_by = user.id
        item.reviewed_at = datetime.now(timezone.utc)

        await record_audit_log(
            db=db,
            user_id=user.id,
            action="extraction_reject",
            target_type="extracted_entity",
            target_id=extraction_id,
            metadata={
                "entity_type": item.entity_type,
                "raw_value": item.raw_value,
                "record_id": item.source_record_id,
            },
        )

        await db.commit()
        await db.refresh(item)
        return item
