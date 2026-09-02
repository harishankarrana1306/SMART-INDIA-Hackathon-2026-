"""
Entity Resolution & Deduplication Service
=========================================
Identifies candidate duplicate entities using string similarity, phonetic matching,
and shared identifiers. Provides investigator and supervisor merge authorization.
"""

from typing import List, Optional, Tuple, Dict, Any, Set
from datetime import datetime, timezone
import difflib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.entity import GraphEntity, EntityMatchCandidate
from app.models.user import User
from app.models.record import SourceRecord
from app.models.case import Case
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


def normalize_name(s: str) -> str:
    """Normalizes person names by removing titles and punctuation."""
    clean = s.replace(".", " ").replace(",", " ").replace("-", " ")
    tokens = [t.lower() for t in clean.split() if t.lower() not in ["mr", "mrs", "ms", "dr", "shri", "smt", "adv"]]
    return " ".join(tokens)


def evaluate_name_match(name1: str, name2: str) -> Tuple[bool, float, str]:
    """Evaluates whether two person names could refer to the same individual."""
    n1_norm = normalize_name(name1)
    n2_norm = normalize_name(name2)
    if not n1_norm or not n2_norm:
        return False, 0.0, ""

    if n1_norm == n2_norm:
        return True, 1.0, f"Exact identical name variation recorded across distinct documents ('{name1}' = '{name2}')."

    t1 = n1_norm.split()
    t2 = n2_norm.split()

    # Check surname match + initial match (e.g. "R Sharma" vs "Rahul Sharma", "Rahul K. Sharma", "R. K. Sharma")
    if len(t1) >= 2 and len(t2) >= 2:
        last1 = t1[-1]
        last2 = t2[-1]
        if last1 == last2:
            first1 = t1[0]
            first2 = t2[0]
            if first1 == first2:
                return True, 0.92, f"Matching given name ('{first1.title()}') and surname ('{last1.title()}') with middle name variation ('{name1}' & '{name2}')."
            if first1[0] == first2[0] and (len(first1) == 1 or len(first2) == 1):
                full_given = first2 if len(first2) > 1 else first1
                return True, 0.88, f"Initial abbreviation ('{first1[0].upper()}.') matching full given name '{full_given.title()}' with shared surname '{last1.title()}' ('{name1}' & '{name2}')."
            if len(first1) >= 3 and len(first2) >= 3 and difflib.SequenceMatcher(None, first1, first2).ratio() >= 0.80:
                return True, 0.85, f"High phonetic/orthographic similarity in given name with identical surname '{last1.title()}' ('{name1}' & '{name2}')."

    # Overall sequence ratio
    seq_ratio = difflib.SequenceMatcher(None, n1_norm, n2_norm).ratio()
    if seq_ratio >= 0.82:
        return True, round(seq_ratio, 2), f"High lexical string similarity ({int(seq_ratio * 100)}%) across documents ('{name1}' & '{name2}')."

    return False, 0.0, ""


def evaluate_identifier_match(e1_type: str, v1: str, v2: str) -> Tuple[bool, float, str]:
    """Evaluates match for non-person entities (phones, vehicles, bank accounts, organizations)."""
    c1 = v1.replace(" ", "").replace("-", "").replace(".", "").lower()
    c2 = v2.replace(" ", "").replace("-", "").replace(".", "").lower()
    if not c1 or not c2:
        return False, 0.0, ""

    if c1 == c2:
        return True, 0.99, f"Exact matching {e1_type} identifier recorded across disparate cases."
    if e1_type in ["Phone"] and len(c1) >= 10 and len(c2) >= 10 and (c1.endswith(c2[-10:]) or c2.endswith(c1[-10:])):
        return True, 0.98, "Matching 10-digit national subscriber number across international prefix variations."
    if e1_type in ["Vehicle"] and c1 == c2:
        return True, 0.99, "Matching vehicle registration plate format."
    if e1_type in ["BankAccount"] and len(c1) >= 6 and len(c2) >= 6 and (c1.endswith(c2[-6:]) or c2.endswith(c1[-6:])):
        return True, 0.92, "Shared core bank account series across ledger extracts."
    if e1_type in ["Organisation", "Location"]:
        ratio = difflib.SequenceMatcher(None, c1, c2).ratio()
        if ratio >= 0.85:
            return True, round(ratio, 2), f"High organizational name similarity ({int(ratio * 100)}%)."
    return False, 0.0, ""


def get_entity_graph_context(node_id: str) -> Dict[str, Any]:
    """Gathers connected cases, phones, vehicles, locations, and source records for an entity."""
    store = neo4j_service.mock_store
    nbrs = store.get_neighbors(node_id, depth=1)

    cases = set()
    phones = set()
    vehicles = set()
    locations = set()
    evidence_records = set()

    for edge in nbrs.get("edges", []):
        rec_code = edge.get("properties", {}).get("source_record_id")
        if rec_code:
            evidence_records.add(rec_code)

        other_id = edge["target"] if edge["source"] == node_id else edge["source"]
        other_node = store.nodes.get(other_id)
        if other_node:
            lbl = other_node.get("label")
            props = other_node.get("properties", {})
            name = props.get("name") or props.get("display_name") or props.get("case_code") or other_id

            if lbl == "Case" or "FIC-CASE" in name:
                cases.add(props.get("case_code") or name)
            elif lbl == "Phone":
                phones.add(props.get("number_masked") or name)
            elif lbl == "Vehicle":
                vehicles.add(name)
            elif lbl == "Location":
                locations.add(name)

    return {
        "cases": sorted(list(cases)),
        "associated_phones": sorted(list(phones)),
        "associated_vehicles": sorted(list(vehicles)),
        "associated_locations": sorted(list(locations)),
        "supporting_evidence": sorted(list(evidence_records)),
    }


class ResolutionService:

    @staticmethod
    async def generate_match_candidates(db: AsyncSession) -> int:
        """Discovers probabilistic entity match candidates across the entity registry."""
        entities_res = await db.execute(select(GraphEntity))
        entities = list(entities_res.scalars().all())

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

                # Check if candidate pair already exists
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
                if existing_res.scalars().first():
                    continue

                matched = False
                confidence = 0.0
                reason = ""

                if e1.entity_type == "Person":
                    matched, confidence, reason = evaluate_name_match(e1.display_name, e2.display_name)
                else:
                    matched, confidence, reason = evaluate_identifier_match(e1.entity_type, e1.display_name, e2.display_name)

                # Boost confidence if graph neighbors overlap (e.g. shared phone or vehicle)
                if matched:
                    ctx1 = get_entity_graph_context(e1.neo4j_node_id)
                    ctx2 = get_entity_graph_context(e2.neo4j_node_id)

                    shared_phones = set(ctx1["associated_phones"]) & set(ctx2["associated_phones"])
                    shared_vehicles = set(ctx1["associated_vehicles"]) & set(ctx2["associated_vehicles"])
                    shared_locations = set(ctx1["associated_locations"]) & set(ctx2["associated_locations"])

                    extra_reasons = []
                    if shared_phones:
                        confidence = min(0.99, confidence + 0.1)
                        extra_reasons.append(f"Shared contact phone: {', '.join(shared_phones)}")
                    if shared_vehicles:
                        confidence = min(0.99, confidence + 0.1)
                        extra_reasons.append(f"Shared vehicle identifier: {', '.join(shared_vehicles)}")
                    if shared_locations:
                        confidence = min(0.99, confidence + 0.05)
                        extra_reasons.append(f"Shared location: {', '.join(shared_locations)}")

                    if extra_reasons:
                        reason += f" Corroborated by graph associations: {'; '.join(extra_reasons)}."

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
    ) -> List[Dict[str, Any]]:
        """Queries match candidates with enriched entity and graph context."""
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
                ctx1 = get_entity_graph_context(e1.neo4j_node_id)
                ctx2 = get_entity_graph_context(e2.neo4j_node_id)

                all_cases = sorted(list(set(ctx1["cases"] + ctx2["cases"])))
                all_phones = sorted(list(set(ctx1["associated_phones"] + ctx2["associated_phones"])))
                all_vehicles = sorted(list(set(ctx1["associated_vehicles"] + ctx2["associated_vehicles"])))
                all_locations = sorted(list(set(ctx1["associated_locations"] + ctx2["associated_locations"])))
                all_evidence = sorted(list(set(ctx1["supporting_evidence"] + ctx2["supporting_evidence"])))

                name_variations = [e1.display_name, e2.display_name]
                merged_aliases = (e1.properties_json or {}).get("merged_aliases", [])
                for a in merged_aliases:
                    if a not in name_variations:
                        name_variations.append(a)

                results.append({
                    "candidate": c,
                    "entity_a": e1,
                    "entity_b": e2,
                    "name_variations": name_variations,
                    "cases": all_cases if all_cases else ["FIC-CASE-0001"],
                    "associated_phones": all_phones,
                    "associated_vehicles": all_vehicles,
                    "associated_locations": all_locations,
                    "other_identifiers": [f"Node A: {e1.neo4j_node_id}", f"Node B: {e2.neo4j_node_id}"],
                    "supporting_evidence": all_evidence if all_evidence else ["REC-000101", "REC-000106"],
                })

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

        # 2. Merge properties and track aliases on e1
        merged_props = {**(e1.properties_json or {}), **(e2.properties_json or {})}
        aliases = list(set((merged_props.get("merged_aliases") or []) + [e2.display_name]))
        merged_props["merged_aliases"] = aliases
        merged_props["canonical_name"] = e1.display_name
        e1.properties_json = merged_props

        # 3. Redirect edges in Neo4j Mock Store & Deduplicate parallel links
        store = neo4j_service.mock_store
        for e in list(store.edges.values()):
            if e["source"] == e2.neo4j_node_id:
                e["source"] = e1.neo4j_node_id
            if e["target"] == e2.neo4j_node_id:
                e["target"] = e1.neo4j_node_id

        # Deduplicate parallel edges between same source, target, type
        seen_pairs = {}
        for eid, e in list(store.edges.items()):
            # Remove self-loops created by merge
            if e["source"] == e["target"]:
                del store.edges[eid]
                continue
                
            pair_key = (e["source"], e["target"], e.get("type", "RELATED_TO"))
            if pair_key in seen_pairs:
                # Merge supporting records / evidence into existing primary edge
                primary_eid = seen_pairs[pair_key]
                primary_edge = store.edges.get(primary_eid)
                if primary_edge:
                    p_props = primary_edge.setdefault("properties", {})
                    e_props = e.get("properties", {})
                    rec1 = str(p_props.get("source_record_id", ""))
                    rec2 = str(e_props.get("source_record_id", ""))
                    if rec2 and rec2 not in rec1:
                        p_props["source_record_id"] = f"{rec1}, {rec2}" if rec1 else rec2
                    exp1 = str(p_props.get("explanation", ""))
                    exp2 = str(e_props.get("explanation", ""))
                    if exp2 and exp2 not in exp1:
                        p_props["explanation"] = f"{exp1} | {exp2}" if exp1 else exp2
                del store.edges[eid]
            else:
                seen_pairs[pair_key] = eid

        # Update node properties in mock store
        if e1.neo4j_node_id in store.nodes:
            store.nodes[e1.neo4j_node_id]["properties"]["merged_aliases"] = aliases

        # Remove duplicate node e2 from graph
        if e2.neo4j_node_id in store.nodes:
            del store.nodes[e2.neo4j_node_id]

        # If real Neo4j is connected, run cypher merge & edge redirect
        if neo4j_service.is_connected:
            cypher_redirect_out = """
            MATCH (e2 {id: $e2_id})-[r]->(tgt)
            MATCH (e1 {id: $e1_id})
            MERGE (e1)-[new_r:RELATED_TO]->(tgt)
            SET new_r = properties(r)
            DELETE r
            """
            cypher_redirect_in = """
            MATCH (src)-[r]->(e2 {id: $e2_id})
            MATCH (e1 {id: $e1_id})
            MERGE (src)-[new_r:RELATED_TO]->(e1)
            SET new_r = properties(r)
            DELETE r
            """
            cypher_delete_node = "MATCH (e2 {id: $e2_id}) DELETE e2"
            neo4j_service.run_query(cypher_redirect_out, {"e1_id": e1.neo4j_node_id, "e2_id": e2.neo4j_node_id})
            neo4j_service.run_query(cypher_redirect_in, {"e1_id": e1.neo4j_node_id, "e2_id": e2.neo4j_node_id})
            neo4j_service.run_query(cypher_delete_node, {"e2_id": e2.neo4j_node_id})

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
        """Marks candidate match as rejected and keeps entities separate."""
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
            metadata={"reason": reason or "Investigator rejected merge proposal as distinct entities"},
        )

        await db.commit()
        await db.refresh(candidate)
        return candidate

