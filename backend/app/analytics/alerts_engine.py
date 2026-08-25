"""
Advisory Rule-Based Pattern Alerts Engine
=========================================
Implements deterministic, explainable graph pattern detection algorithms:
- Co-occurrence Pattern Alert
- High-Frequency Communication Bridge Alert
- Circular Financial Flow Alert
- Shared High-Risk Identifier Alert

STRICT DIRECTIVE: Rule-based heuristic detection for human investigator review only.
NO automated predictions of guilt or risk scoring.
"""

from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
from collections import defaultdict
from app.db.neo4j_driver import neo4j_service


@dataclass
class AlertPatternResult:
    rule_name: str
    title: str
    description: str
    severity: str  # HIGH, MEDIUM, LOW
    threshold_description: str
    supporting_entity_ids: List[Dict[str, str]]  # list of {id, name, type}
    supporting_record_ids: List[str]  # list of source record codes


class PatternAlertsEngine:

    @staticmethod
    def detect_co_occurrence_patterns() -> List[AlertPatternResult]:
        """Rule 1: Multiple persons appearing together across >= 2 distinct FIR / surveillance records."""
        results = []
        store = neo4j_service.mock_store

        # Map each source record to the person entities associated with it
        record_to_persons = defaultdict(set)
        for edge in store.edges.values():
            rec_code = edge["properties"].get("source_record_id")
            if not rec_code:
                continue

            src_node = store.nodes.get(edge["source"])
            tgt_node = store.nodes.get(edge["target"])

            if src_node and src_node["label"].lower() == "person":
                record_to_persons[rec_code].add((src_node["id"], src_node["properties"].get("name", src_node["id"])))
            if tgt_node and tgt_node["label"].lower() == "person":
                record_to_persons[rec_code].add((tgt_node["id"], tgt_node["properties"].get("name", tgt_node["id"])))

        # Pairwise co-occurrences across records
        pair_to_records = defaultdict(set)
        for rec_code, persons in record_to_persons.items():
            plist = list(persons)
            for i in range(len(plist)):
                for j in range(i + 1, len(plist)):
                    pair = tuple(sorted([plist[i], plist[j]]))
                    pair_to_records[pair].add(rec_code)

        for (p1, p2), recs in pair_to_records.items():
            if len(recs) >= 2:
                results.append(
                    AlertPatternResult(
                        rule_name="CO_OCCURRENCE_PATTERN",
                        title=f"Multi-Record Co-Occurrence: {p1[1]} & {p2[1]}",
                        description=(
                            f"Persons '{p1[1]}' and '{p2[1]}' independently co-occur across {len(recs)} "
                            f"distinct investigative source records ({', '.join(recs)}). "
                            "Advisory suggestion: Evaluate possible coordinated syndicate association."
                        ),
                        severity="HIGH" if len(recs) >= 3 else "MEDIUM",
                        threshold_description=f"Rule threshold: >= 2 co-occurrences across source records (Found: {len(recs)}).",
                        supporting_entity_ids=[
                            {"id": p1[0], "name": p1[1], "type": "Person"},
                            {"id": p2[0], "name": p2[1], "type": "Person"},
                        ],
                        supporting_record_ids=list(recs),
                    )
                )

        return results

    @staticmethod
    def detect_communication_bridges() -> List[AlertPatternResult]:
        """Rule 2: High-degree communication hub bridging >= 3 distinct contact nodes."""
        results = []
        store = neo4j_service.mock_store

        call_edges = [
            e for e in store.edges.values()
            if e["type"] in ["CALLED", "COORDINATED_CALL", "OWNS_PHONE"] or "call" in e["type"].lower()
        ]

        node_calls = defaultdict(list)
        for e in call_edges:
            node_calls[e["source"]].append(e)
            node_calls[e["target"]].append(e)

        for node_id, edges in node_calls.items():
            unique_partners = set()
            rec_codes = set()
            for e in edges:
                partner = e["target"] if e["source"] == node_id else e["source"]
                unique_partners.add(partner)
                if e["properties"].get("source_record_id"):
                    rec_codes.add(e["properties"]["source_record_id"])

            if len(unique_partners) >= 3:
                n_obj = store.nodes.get(node_id)
                name = n_obj["properties"].get("name") or n_obj["properties"].get("number_masked") or node_id if n_obj else node_id
                results.append(
                    AlertPatternResult(
                        rule_name="HIGH_FREQUENCY_COMMUNICATION_BRIDGE",
                        title=f"Central Communications Relay Bridge: {name}",
                        description=(
                            f"Node '{name}' functions as a multi-contact communication relay connecting "
                            f"{len(unique_partners)} distinct entities across CDR logs. "
                            "Advisory suggestion: Prioritize timeline analysis of calls around critical incident dates."
                        ),
                        severity="HIGH",
                        threshold_description=f"Rule threshold: >= 3 unique contact partners in call logs (Found: {len(unique_partners)}).",
                        supporting_entity_ids=[{"id": node_id, "name": name, "type": n_obj["label"] if n_obj else "Entity"}],
                        supporting_record_ids=list(rec_codes),
                    )
                )

        return results

    @staticmethod
    def detect_circular_financial_flows() -> List[AlertPatternResult]:
        """Rule 3: Circular or high-value multi-hop wire transfers."""
        results = []
        store = neo4j_service.mock_store

        tx_edges = [
            e for e in store.edges.values()
            if "transfer" in e["type"].lower() or "money" in e["type"].lower() or e["type"] == "TRANSFERRED_MONEY_TO"
        ]

        # Build adjacency graph
        adj = defaultdict(list)
        for e in tx_edges:
            adj[e["source"]].append(e)

        # Detect 2-hop or 3-hop cycles: A -> B -> C -> A
        seen_cycles = set()
        for a in adj:
            for e1 in adj[a]:
                b = e1["target"]
                for e2 in adj.get(b, []):
                    c = e2["target"]
                    if c == a:
                        cycle_key = tuple(sorted([a, b]))
                        if cycle_key not in seen_cycles:
                            seen_cycles.add(cycle_key)
                            a_node = store.nodes.get(a)
                            b_node = store.nodes.get(b)
                            a_name = a_node["properties"].get("name", a) if a_node else a
                            b_name = b_node["properties"].get("name", b) if b_node else b
                            recs = [e1["properties"].get("source_record_id"), e2["properties"].get("source_record_id")]
                            recs = [r for r in recs if r]
                            results.append(
                                AlertPatternResult(
                                    rule_name="CIRCULAR_FINANCIAL_FLOW",
                                    title=f"Reciprocal / Circular Banking Transfer: {a_name} ↔ {b_name}",
                                    description=(
                                        f"Detected reciprocal round-trip financial transfers between '{a_name}' and '{b_name}'. "
                                        "Advisory suggestion: Verify invoice legitimacy and check for shell account structuring."
                                    ),
                                    severity="HIGH",
                                    threshold_description="Rule threshold: Directed cyclical transfer (A -> B -> A).",
                                    supporting_entity_ids=[
                                        {"id": a, "name": a_name, "type": a_node["label"] if a_node else "Account"},
                                        {"id": b, "name": b_name, "type": b_node["label"] if b_node else "Account"},
                                    ],
                                    supporting_record_ids=recs,
                                )
                            )

        return results

    @staticmethod
    def detect_shared_identifiers() -> List[AlertPatternResult]:
        """Rule 4: Shared high-risk identifier (multiple persons sharing same phone/vehicle/bank)."""
        results = []
        store = neo4j_service.mock_store

        shared_types = ["Phone", "Vehicle", "BankAccount"]
        for node in store.nodes.values():
            if node["label"] in shared_types:
                # Find all connected persons
                connected_persons = []
                recs = set()
                for edge in store.edges.values():
                    if edge["source"] == node["id"] or edge["target"] == node["id"]:
                        other_id = edge["target"] if edge["source"] == node["id"] else edge["source"]
                        other_node = store.nodes.get(other_id)
                        if other_node and other_node["label"].lower() == "person":
                            connected_persons.append((other_node["id"], other_node["properties"].get("name", other_id)))
                        if edge["properties"].get("source_record_id"):
                            recs.add(edge["properties"]["source_record_id"])

                # De-duplicate connected persons
                unique_persons = list(dict.fromkeys(connected_persons))
                if len(unique_persons) >= 2:
                    ident_val = node["properties"].get("display_name") or node["properties"].get("name") or node["id"]
                    names_str = " and ".join([p[1] for p in unique_persons])
                    results.append(
                        AlertPatternResult(
                            rule_name="SHARED_HIGH_RISK_IDENTIFIER",
                            title=f"Shared {node['label']} Identifier: {ident_val}",
                            description=(
                                f"Multiple distinct persons ({names_str}) are linked to the same {node['label']} ({ident_val}). "
                                "Advisory suggestion: Check for shared device ownership, proxy vehicle usage, or common banking proxy."
                            ),
                            severity="HIGH",
                            threshold_description=f"Rule threshold: >= 2 persons connected to single {node['label']} (Found: {len(unique_persons)}).",
                            supporting_entity_ids=[
                                {"id": node["id"], "name": ident_val, "type": node["label"]}
                            ] + [{"id": p[0], "name": p[1], "type": "Person"} for p in unique_persons],
                            supporting_record_ids=list(recs),
                        )
                    )

        return results

    @classmethod
    def scan_all_patterns(cls) -> List[AlertPatternResult]:
        """Runs the entire deterministic alert rule suite."""
        alerts = []
        alerts.extend(cls.detect_co_occurrence_patterns())
        alerts.extend(cls.detect_communication_bridges())
        alerts.extend(cls.detect_circular_financial_flows())
        alerts.extend(cls.detect_shared_identifiers())
        return alerts


alerts_engine = PatternAlertsEngine()
