"""
Entity Resolution & Deduplication Service
=========================================
Identifies candidate duplicate entities using string similarity, phonetic matching,
and shared identifiers. Provides supervised merge authorization.
"""

from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone
import difflib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.entity import GraphEntity, EntityMatchCandidate
from app.models.user import User
from app.db.neo4j_driver import neo4j_service
from app.core.audit import record_audit_log


def compute_string_similarity(s1: str, s2: str) -> float:
    """Computes normalized similarity ratio between two strings (0.0 - 1.0)."""
    s1_clean = s1.lower().strip()
    s2_clean = s2.lower().strip()
    if s1_clean == s2_clean:
        return 1.0

    t1 = set(s1_clean.split())
    t2 = set(s2_clean.split())
    if t1 & t2:
        overlap_score = len(t1 & t2) / max(len(t1), len(t2))
        seq_ratio = difflib.SequenceMatcher(None, s1_clean, s2_clean).ratio()
        return round(max(overlap_score, seq_ratio), 2)

    return round(difflib.SequenceMatcher(None, s1_clean, s2_clean).ratio(), 2)


class ResolutionService:

    @staticmethod
    async def generate_match_candidates(db: AsyncSession) -> int:
        """Discovers probabilistic entity match candidates across the entity registry."""
        entities_res = await db.execute(select(GraphEntity))
        entities = entities_res.scalars().all()

        new_candidates_count = 0
        seen_pairs = set()

        for i in range(len(entities)):
            for j in range(i + 1, len(entities)):
                e1 = entities[i]
                e2 = entities[j]

                if e1.entity_type != e2.entity_type:
                    continue

                pair_key = tuple(sorted([e1.id, e2.id]))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)

                existing_res = await db.execute(
                    select(EntityMatchCandidate).where(
                        (
                            (EntityMatchCandidate.entity_a_id == e1.id)
                            & (EntityMatchCandidate.entity_b_id == e2.id)
                        )
                        | (
                            (EntityMatchCandidate.entity_a_id == e2.id)
                            & (EntityMatchCandidate.entity_b_id == e1.id)
                        )
                    )
                )
                if existing_res.scalar_one_or_none():
                    continue

                sim = compute_string_similarity(e1.display_name, e2.display_name)
                reason = None
                confidence = sim

                if sim >= 0.80:
                    reason = f"High lexical name similarity ({int(sim * 100)}%) across investigative records."
                elif e1.entity_type in ["Phone", "BankAccount", "Vehicle"] and e1.display_name == e2.display_name:
                    confidence = 0.99
                    reason = f"Exact matching {e1.entity_type} identifier recorded across disparate cases."

                if reason:
                    candidate = EntityMatchCandidate(
                        entity_a_id=e1.id,
                        entity_b_id=e2.id,
                        match_confidence=confidence,
                        match_reason=reason,
                        status="pending",
                        created_at=datetime.now(timezone.utc),
                    )
                    db.add(candidate)
                    new_candidates_count += 1

        if new_candidates_count > 0:
            await db.commit()

        return new_candidates_count

    @staticmethod
    async def list_candidates(
        db: AsyncSession,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Tuple[EntityMatchCandidate, GraphEntity, GraphEntity]]:
        """Queries match candidates with entity details."""
        query = select(EntityMatchCandidate).order_by(desc(EntityMatchCandidate.match_confidence))
        if status and status != "ALL":
            query = query.where(EntityMatchCandidate.status == status)

        query = query.limit(limit).offset(offset)
        candidates_res = await db.execute(query)
        candidates = candidates_res.scalars().all()

        results = []
        for c in candidates:
            e1_res = await db.execute(select(GraphEntity).where(GraphEntity.id == c.entity_a_id))
            e2_res = await db.execute(select(GraphEntity).where(GraphEntity.id == c.entity_b_id))
            e1 = e1_res.scalar_one_or_none()
            e2 = e2_res.scalar_one_or_none()
            if e1 and e2:
                results.append((c, e1, e2))

        return results

    @staticmethod
    async def approve_merge(
        db: AsyncSession,
        candidate_id: str,
        user: User,
    ) -> EntityMatchCandidate:
        """Merges Entity B into Entity A in both relational and Neo4j graph stores."""
        query = select(EntityMatchCandidate).where(EntityMatchCandidate.id == str(candidate_id))
        res = await db.execute(query)
        candidate = res.scalar_one_or_none()
        if not candidate:
            raise ValueError(f"Match candidate {candidate_id} not found")

        e1_res = await db.execute(select(GraphEntity).where(GraphEntity.id == candidate.entity_a_id))
        e2_res = await db.execute(select(GraphEntity).where(GraphEntity.id == candidate.entity_b_id))
        e1 = e1_res.scalar_one_or_none()
        e2 = e2_res.scalar_one_or_none()
        if not e1 or not e2:
            raise ValueError("Entities associated with match candidate not found")

        # 1. Update candidate status
        candidate.status = "merged"
        candidate.reviewed_by = user.id
        candidate.reviewed_at = datetime.now(timezone.utc)

        # 2. Merge properties into e1
        merged_props = {**(e1.properties_json or {}), **(e2.properties_json or {})}
        merged_props["merged_aliases"] = list(set((merged_props.get("merged_aliases") or []) + [e2.display_name]))
        e1.properties_json = merged_props

        # 3. Redirect edges in Neo4j Mock Store
        store = neo4j_service.mock_store
        for e in store.edges.values():
            if e["source"] == e2.neo4j_node_id:
                e["source"] = e1.neo4j_node_id
            if e["target"] == e2.neo4j_node_id:
                e["target"] = e1.neo4j_node_id

        # Remove redundant node e2 from graph
        if e2.neo4j_node_id in store.nodes:
            del store.nodes[e2.neo4j_node_id]

        # 4. Record SHA-256 Audit Log
        await record_audit_log(
            db=db,
            user_id=user.id,
            action="merge_approve",
            target_type="entity_match_candidate",
            target_id=str(candidate_id),
            metadata={
                "surviving_entity_id": e1.id,
                "surviving_name": e1.display_name,
                "merged_entity_id": e2.id,
                "merged_name": e2.display_name,
                "neo4j_surviving_id": e1.neo4j_node_id,
            },
        )

        await db.commit()
        await db.refresh(candidate)
        return candidate

    @staticmethod
    async def reject_candidate(
        db: AsyncSession,
        candidate_id: str,
        user: User,
        reason: Optional[str] = None,
    ) -> EntityMatchCandidate:
        """Marks candidate match as rejected."""
        query = select(EntityMatchCandidate).where(EntityMatchCandidate.id == str(candidate_id))
        res = await db.execute(query)
        candidate = res.scalar_one_or_none()
        if not candidate:
            raise ValueError(f"Match candidate {candidate_id} not found")

        candidate.status = "rejected"
        candidate.reviewed_by = user.id
        candidate.reviewed_at = datetime.now(timezone.utc)

        await record_audit_log(
            db=db,
            user_id=user.id,
            action="merge_reject",
            target_type="entity_match_candidate",
            target_id=str(candidate_id),
            metadata={"reason": reason or "Investigator rejected merge proposal"},
        )

        await db.commit()
        await db.refresh(candidate)
        return candidate
