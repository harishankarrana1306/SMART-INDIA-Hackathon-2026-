"""
Executive Case Brief Service
============================
Aggregates network intelligence, generates standardized decision-support briefs,
computes cryptographic SHA-256 custody seals, and renders export PDFs.
"""

from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timezone
import hashlib
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.case import Case
from app.models.record import SourceRecord
from app.models.report import CaseBrief
from app.models.alert import Alert
from app.models.user import User
from app.db.neo4j_driver import neo4j_service
from app.reports.pdf_generator import pdf_generator
from app.core.audit import record_audit_log


class ReportService:

    @staticmethod
    async def build_case_brief(
        db: AsyncSession,
        case_id: str,
        user: User,
        custom_notes: Optional[str] = None,
    ) -> Tuple[Dict[str, Any], bytes]:
        """Generates comprehensive case brief data and generates PDF export bytes."""
        # 1. Fetch Case
        case_res = await db.execute(select(Case).where((Case.id == str(case_id)) | (Case.case_code == str(case_id))))
        case_obj = case_res.scalar_one_or_none()
        if not case_obj:
            raise ValueError(f"Case '{case_id}' not found")

        # 2. Fetch associated records
        records_res = await db.execute(select(SourceRecord).where(SourceRecord.case_id == case_obj.id))
        records = list(records_res.scalars().all())

        # 3. Fetch graph nodes & relationships linked to this case
        store = neo4j_service.mock_store
        case_node_id = f"case_{case_obj.case_code.lower().replace('-', '_')}"

        key_entities = []
        key_relationships = []

        seen_node_ids = set()
        for edge in store.edges.values():
            if edge["source"] == case_node_id or edge["target"] == case_node_id or edge["properties"].get("source_record_id") in [r.record_code for r in records]:
                other_id = edge["target"] if edge["source"] == case_node_id else edge["source"]
                other_node = store.nodes.get(other_id)
                if other_node and other_id not in seen_node_ids:
                    seen_node_ids.add(other_id)
                    key_entities.append({
                        "id": other_id,
                        "name": other_node["properties"].get("name") or other_node["properties"].get("display_name") or other_id,
                        "type": other_node["label"],
                        "role_or_label": edge["type"].replace("_", " "),
                        "masked_identifier": other_node["properties"].get("number_masked") or other_node["properties"].get("account_masked"),
                    })

                src_n = store.nodes.get(edge["source"])
                tgt_n = store.nodes.get(edge["target"])
                src_name = src_n["properties"].get("name", edge["source"]) if src_n else edge["source"]
                tgt_name = tgt_n["properties"].get("name", edge["target"]) if tgt_n else edge["target"]

                key_relationships.append({
                    "source_name": src_name,
                    "target_name": tgt_name,
                    "relationship_type": edge["type"],
                    "source_record_code": edge["properties"].get("source_record_id", "REC-EVID"),
                    "confidence": float(edge["properties"].get("confidence", 0.9)),
                    "explanation": edge["properties"].get("explanation", "Discovered through case record analysis."),
                })

        # 4. Fetch active alerts related to this case
        alerts_res = await db.execute(select(Alert).where(Alert.status.in_(["unreviewed", "acknowledged"])).limit(5))
        active_alerts = [a.title for a in alerts_res.scalars().all()]

        # 5. Build timeline highlights
        timeline_highlights = [
            {
                "timestamp": str(r.ingested_at.strftime("%Y-%m-%d %H:%M")),
                "event_type": r.source_type,
                "title": r.title or f"Record {r.record_code}",
                "source_record_code": r.record_code,
            }
            for r in records[:5]
        ]

        # 6. Generate narrative summary
        narrative = (
            f"Case {case_obj.case_code} ('{case_obj.title}') currently holds status '{case_obj.status}'. "
            f"Analysis across {len(records)} linked source records identified {len(key_entities)} core network entities "
            f"and {len(key_relationships)} evidentiary relationships. "
            f"{custom_notes or 'All findings are advisory and provided strictly for human investigator decision-support.'}"
        )

        # 7. Compute SHA-256 Custody Hash
        canonical_content = f"{case_obj.case_code}:{case_obj.title}:{len(key_entities)}:{len(key_relationships)}:{datetime.utcnow().strftime('%Y-%m-%d')}"
        custody_hash = hashlib.sha256(canonical_content.encode("utf-8")).hexdigest()

        brief_dict = {
            "brief_id": f"brief_{case_obj.case_code.lower()}_{datetime.utcnow().strftime('%Y%m%d')}",
            "case_id": case_obj.id,
            "case_code": case_obj.case_code,
            "case_title": case_obj.title,
            "case_status": case_obj.status,
            "summary_narrative": narrative,
            "key_entities": key_entities,
            "key_relationships": key_relationships,
            "timeline_highlights": timeline_highlights,
            "active_alerts": active_alerts,
            "custody_hash": custody_hash,
            "generated_by": user.full_name,
            "generated_at": datetime.now(timezone.utc),
            "is_synthetic": True,
            "disclaimer": "Decision-support only. Not a determination of guilt or risk. All findings require human investigator review.",
        }

        # 8. Save CaseBrief record
        brief_entry = CaseBrief(
            case_id=case_obj.id,
            title=f"Executive Brief: {case_obj.title}",
            summary_narrative=narrative,
            key_entities_json=key_entities,
            key_relationships_json=key_relationships,
            timeline_highlights_json=timeline_highlights,
            active_alerts_json=active_alerts,
            custody_hash=custody_hash,
            generated_by=user.id,
            generated_at=datetime.now(timezone.utc),
            is_synthetic=True,
        )
        db.add(brief_entry)
        await db.commit()

        # 9. Cryptographic Audit Log
        await record_audit_log(
            db=db,
            user_id=user.id,
            action="brief_generate",
            target_type="case_brief",
            target_id=case_obj.case_code,
            metadata={"custody_hash": custody_hash, "case_code": case_obj.case_code},
        )
        await db.commit()

        # 10. Generate PDF Bytes
        pdf_bytes = pdf_generator.generate_pdf(brief_dict)
        return brief_dict, pdf_bytes
