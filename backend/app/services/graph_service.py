from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.neo4j_driver import neo4j_service
from app.models.record import SourceRecord
from app.models.case import Case
from app.models.entity import GraphEntity
from app.schemas.graph import (
    GraphNode,
    GraphEdge,
    GraphSubgraphResponse,
    NodeProfileResponse,
    EdgeEvidenceResponse,
    LinkedCaseItem,
    ConnectedEntityItem,
)


def mask_sensitive_value(val: str, entity_type: str) -> str:
    """Masks phone numbers and bank account numbers for privacy preservation."""
    if not val:
        return ""
    if entity_type.lower() == "phone":
        # E.g. +91 9876543210 -> +91-9XXXX-XX001
        clean = val.replace(" ", "").replace("-", "")
        if len(clean) >= 10:
            return f"{clean[:3]}-XXXX-XX{clean[-3:]}"
        return "****-****"
    elif entity_type.lower() in ("bankaccount", "account"):
        # E.g. 123456789012 -> XXXX-XXXX-9012
        if len(val) >= 4:
            return f"XXXX-XXXX-{val[-4:]}"
        return "XXXX-XXXX"
    return val


class GraphService:
    @staticmethod
    async def get_nodes(
        db: AsyncSession,
        node_type: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[GraphNode]:
        if neo4j_service.is_connected:
            # Query Neo4j
            query = "MATCH (n) WHERE 1=1"
            params = {}
            if node_type and node_type.lower() != "all":
                query += f" AND '{node_type.capitalize()}' IN labels(n)"
            if search:
                query += " AND (toLower(n.name) CONTAINS toLower($s) OR toLower(n.display_name) CONTAINS toLower($s) OR toLower(n.case_code) CONTAINS toLower($s))"
                params["s"] = search
            query += f" RETURN n, labels(n) as labels LIMIT {limit}"
            records = neo4j_service.run_query(query, params)
            nodes = []
            for r in records:
                n_data = r.get("n", {})
                labels = r.get("labels", ["Entity"])
                label = labels[0] if labels else "Entity"
                nid = str(n_data.get("id") or n_data.get("pg_id") or "")
                nodes.append(GraphNode(id=nid, label=label, properties=n_data))
            return nodes
        else:
            # Fallback to mock store
            raw_nodes = neo4j_service.mock_store.get_nodes(node_type=node_type, search=search)
            return [
                GraphNode(
                    id=n["id"],
                    label=n["label"],
                    properties=n["properties"]
                )
                for n in raw_nodes[:limit]
            ]

    @staticmethod
    async def get_subgraph(
        db: AsyncSession,
        case_id: Optional[str] = None,
        node_type: Optional[str] = None,
        limit: int = 100
    ) -> GraphSubgraphResponse:
        if neo4j_service.is_connected:
            if case_id and case_id.lower() != "all":
                query = """
                MATCH (c:Case) WHERE toLower(c.case_code) CONTAINS toLower($case_id) OR c.id = $case_id
                MATCH path = (c)-[*1..2]-(m)
                UNWIND relationships(path) as r
                RETURN startNode(r) as n, labels(startNode(r)) as n_labels, r, type(r) as r_type, endNode(r) as m, labels(endNode(r)) as m_labels LIMIT $limit
                """
                records = neo4j_service.run_query(query, {"case_id": case_id, "limit": limit})
            else:
                query = "MATCH (n)-[r]->(m) RETURN n, labels(n) as n_labels, r, type(r) as r_type, m, labels(m) as m_labels LIMIT $limit"
                records = neo4j_service.run_query(query, {"limit": limit})

            nodes_dict = {}
            edges_list = []
            for rec in records:
                n = rec.get("n", {})
                m = rec.get("m", {})
                r = rec.get("r", {})
                n_id = str(n.get("id") or n.get("pg_id"))
                m_id = str(m.get("id") or m.get("pg_id"))
                n_label = (rec.get("n_labels") or ["Entity"])[0]
                m_label = (rec.get("m_labels") or ["Entity"])[0]

                if n_id not in nodes_dict:
                    nodes_dict[n_id] = GraphNode(id=n_id, label=n_label, properties=n)
                if m_id not in nodes_dict:
                    nodes_dict[m_id] = GraphNode(id=m_id, label=m_label, properties=m)

                edge_id = str(r.get("id") or f"{n_id}_{m_id}_{rec.get('r_type')}")
                edges_list.append(
                    GraphEdge(
                        id=edge_id,
                        source=n_id,
                        target=m_id,
                        type=rec.get("r_type", "RELATED_TO"),
                        properties=r
                    )
                )
            return GraphSubgraphResponse(
                nodes=list(nodes_dict.values()),
                edges=edges_list,
                total_nodes=len(nodes_dict),
                total_edges=len(edges_list),
            )
        else:
            if case_id and case_id.lower() != "all":
                # Resolve case_id if a UUID or alternative identifier was passed
                c_query = select(Case).where((Case.id == case_id) | (Case.case_code == case_id))
                c_res = await db.execute(c_query)
                c_obj = c_res.scalar_one_or_none()
                target_case = c_obj.case_code if c_obj else case_id
                sub = neo4j_service.mock_store.get_case_subgraph(case_id=target_case, limit=limit)
            else:
                sub = neo4j_service.mock_store.get_all_subgraph(limit=limit)

            nodes = [
                GraphNode(id=n["id"], label=n["label"], properties=n["properties"])
                for n in sub["nodes"]
            ]
            edges = [
                GraphEdge(
                    id=e["id"],
                    source=e["source"],
                    target=e["target"],
                    type=e["type"],
                    properties=e["properties"]
                )
                for e in sub["edges"]
            ]
            return GraphSubgraphResponse(
                nodes=nodes,
                edges=edges,
                total_nodes=len(nodes),
                total_edges=len(edges),
            )

    @staticmethod
    async def expand_node(
        db: AsyncSession,
        node_id: str,
        depth: int = 1
    ) -> GraphSubgraphResponse:
        depth = min(max(depth, 1), 2)  # Clamp to 1 or 2
        if neo4j_service.is_connected:
            query = f"""
            MATCH path = (n {{id: $node_id}})-[r*1..{depth}]-(m)
            UNWIND nodes(path) as nd
            UNWIND relationships(path) as rel
            RETURN DISTINCT nd, labels(nd) as nd_labels, rel, type(rel) as rel_type, startNode(rel) as s, endNode(rel) as e
            """
            records = neo4j_service.run_query(query, {"node_id": node_id})
            nodes_dict = {}
            edges_dict = {}
            for rec in records:
                nd = rec.get("nd", {})
                nid = str(nd.get("id") or nd.get("pg_id"))
                lbl = (rec.get("nd_labels") or ["Entity"])[0]
                if nid and nid not in nodes_dict:
                    nodes_dict[nid] = GraphNode(id=nid, label=lbl, properties=nd)

                rel = rec.get("rel", {})
                s = rec.get("s", {})
                e = rec.get("e", {})
                sid = str(s.get("id") or s.get("pg_id"))
                eid = str(e.get("id") or e.get("pg_id"))
                eid_rel = str(rel.get("id") or f"{sid}_{eid}_{rec.get('rel_type')}")
                if eid_rel not in edges_dict:
                    edges_dict[eid_rel] = GraphEdge(
                        id=eid_rel,
                        source=sid,
                        target=eid,
                        type=rec.get("rel_type", "RELATED_TO"),
                        properties=rel
                    )
            return GraphSubgraphResponse(
                nodes=list(nodes_dict.values()),
                edges=list(edges_dict.values()),
                total_nodes=len(nodes_dict),
                total_edges=len(edges_dict),
            )
        else:
            nbrs = neo4j_service.mock_store.get_neighbors(node_id=node_id, depth=depth)
            nodes = [
                GraphNode(id=n["id"], label=n["label"], properties=n["properties"])
                for n in nbrs["nodes"]
            ]
            edges = [
                GraphEdge(
                    id=e["id"],
                    source=e["source"],
                    target=e["target"],
                    type=e["type"],
                    properties=e["properties"]
                )
                for e in nbrs["edges"]
            ]
            return GraphSubgraphResponse(
                nodes=nodes,
                edges=edges,
                total_nodes=len(nodes),
                total_edges=len(edges),
            )

    @staticmethod
    async def get_node_profile(db: AsyncSession, node_id: str) -> Optional[NodeProfileResponse]:
        # Fetch node from graph
        node_raw = None
        if neo4j_service.is_connected:
            records = neo4j_service.run_query("MATCH (n {id: $id}) RETURN n, labels(n) as labels", {"id": node_id})
            if records:
                n = records[0].get("n", {})
                lbl = (records[0].get("labels") or ["Entity"])[0]
                node_raw = {"id": node_id, "label": lbl, "properties": n}
        else:
            node_raw = neo4j_service.mock_store.get_node(node_id)

        if not node_raw:
            # Check postgres mirror
            q = select(GraphEntity).where(GraphEntity.neo4j_node_id == node_id)
            res = await db.execute(q)
            ge = res.scalar_one_or_none()
            if ge:
                node_raw = {
                    "id": ge.neo4j_node_id,
                    "label": ge.entity_type,
                    "properties": {
                        "name": ge.display_name,
                        "display_name": ge.display_name,
                        "is_masked_sensitive": ge.is_masked_sensitive,
                        "is_synthetic": True,
                    }
                }
            else:
                return None

        # Fetch connected entities & linked cases
        connected_entities = []
        linked_cases = []
        source_records_list = []

        # Pull neighbors from graph
        if neo4j_service.is_connected:
            q_nbrs = """
            MATCH (n {id: $id})-[r]-(m)
            RETURN m, labels(m) as m_labels, r, type(r) as r_type
            """
            nbr_records = neo4j_service.run_query(q_nbrs, {"id": node_id})
            for rec in nbr_records:
                m = rec.get("m", {})
                r = rec.get("r", {})
                m_label = (rec.get("m_labels") or ["Entity"])[0]
                mid = str(m.get("id") or m.get("pg_id"))
                m_name = m.get("name") or m.get("display_name") or m.get("case_code") or mid
                connected_entities.append(
                    ConnectedEntityItem(
                        id=mid,
                        label=m_label,
                        display_name=m_name,
                        relationship_type=rec.get("r_type", "RELATED_TO"),
                        confidence=float(r.get("confidence", 1.0)) if r.get("confidence") is not None else 1.0,
                        source_record_id=r.get("source_record_id")
                    )
                )
                if m_label == "Case":
                    linked_cases.append(
                        LinkedCaseItem(
                            id=mid,
                            case_code=m.get("case_code", ""),
                            title=m.get("title", ""),
                            status=m.get("status", "open")
                        )
                    )
        else:
            nbrs = neo4j_service.mock_store.get_neighbors(node_id, depth=1)
            for edge in nbrs["edges"]:
                other_id = edge["target"] if edge["source"] == node_id else edge["source"]
                other_node = neo4j_service.mock_store.get_node(other_id)
                if other_node:
                    props = other_node["properties"]
                    name = props.get("name") or props.get("display_name") or props.get("case_code") or other_id
                    connected_entities.append(
                        ConnectedEntityItem(
                            id=other_id,
                            label=other_node["label"],
                            display_name=name,
                            relationship_type=edge["type"],
                            confidence=float(edge["properties"].get("confidence", 1.0)),
                            source_record_id=edge["properties"].get("source_record_id")
                        )
                    )
                    if other_node["label"] == "Case":
                        linked_cases.append(
                            LinkedCaseItem(
                                id=other_id,
                                case_code=props.get("case_code", ""),
                                title=props.get("title", ""),
                                status=props.get("status", "open")
                            )
                        )

        # Retrieve source record metadata from postgres
        rec_ids = set()
        for ce in connected_entities:
            if ce.source_record_id:
                rec_ids.add(ce.source_record_id)

        if rec_ids:
            q_rec = select(SourceRecord).where(SourceRecord.record_code.in_(rec_ids))
            res_rec = await db.execute(q_rec)
            for r in res_rec.scalars().all():
                source_records_list.append({
                    "record_code": r.record_code,
                    "source_type": r.source_type,
                    "file_name": r.file_name,
                    "snippet": (r.raw_text[:140] + "...") if r.raw_text and len(r.raw_text) > 140 else r.raw_text
                })

        label = node_raw.get("label", "Entity")
        props = dict(node_raw.get("properties", {}))
        display_name = props.get("name") or props.get("display_name") or props.get("case_code") or node_id
        is_sensitive = label.lower() in ("phone", "bankaccount", "account")

        # Sanitize properties so initial node profile response does not leak raw sensitive identifiers
        safe_props = dict(props)
        if label.lower() == "phone":
            masked_num = props.get("number_masked") or props.get("name") or mask_sensitive_value(props.get("number", ""), "phone")
            safe_props["number"] = masked_num
            safe_props["number_masked"] = masked_num
            safe_props["phone_number"] = masked_num
        elif label.lower() in ("bankaccount", "account"):
            masked_acc = props.get("account_masked") or props.get("name") or mask_sensitive_value(props.get("account_number", ""), "bankaccount")
            safe_props["account_number"] = masked_acc
            safe_props["account_masked"] = masked_acc

        return NodeProfileResponse(
            id=node_id,
            label=label,
            display_name=display_name,
            properties=safe_props,
            is_masked_sensitive=is_sensitive,
            linked_cases=linked_cases,
            connected_entities=connected_entities,
            source_records=source_records_list,
        )

    @staticmethod
    async def get_edge_evidence(db: AsyncSession, edge_id: str) -> Optional[EdgeEvidenceResponse]:
        edge_raw = None
        if neo4j_service.is_connected:
            q = "MATCH (s)-[r {id: $id}]->(t) RETURN r, type(r) as r_type, s, labels(s) as s_labels, t, labels(t) as t_labels"
            recs = neo4j_service.run_query(q, {"id": edge_id})
            if recs:
                r = recs[0].get("r", {})
                s = recs[0].get("s", {})
                t = recs[0].get("t", {})
                s_lbl = (recs[0].get("s_labels") or ["Entity"])[0]
                t_lbl = (recs[0].get("t_labels") or ["Entity"])[0]
                edge_raw = {
                    "id": edge_id,
                    "type": recs[0].get("r_type", "RELATED_TO"),
                    "source": str(s.get("id")),
                    "source_label": s_lbl,
                    "source_name": s.get("name") or s.get("display_name") or str(s.get("id")),
                    "target": str(t.get("id")),
                    "target_label": t_lbl,
                    "target_name": t.get("name") or t.get("display_name") or str(t.get("id")),
                    "properties": r
                }
        else:
            e = neo4j_service.mock_store.get_edge(edge_id)
            if e:
                s_node = neo4j_service.mock_store.get_node(e["source"]) or {"label": "Entity", "properties": {}}
                t_node = neo4j_service.mock_store.get_node(e["target"]) or {"label": "Entity", "properties": {}}
                s_name = s_node["properties"].get("name") or s_node["properties"].get("display_name") or e["source"]
                t_name = t_node["properties"].get("name") or t_node["properties"].get("display_name") or e["target"]
                edge_raw = {
                    "id": edge_id,
                    "type": e["type"],
                    "source": e["source"],
                    "source_label": s_node["label"],
                    "source_name": s_name,
                    "target": e["target"],
                    "target_label": t_node["label"],
                    "target_name": t_name,
                    "properties": e["properties"]
                }

        if not edge_raw:
            return None

        props = edge_raw.get("properties", {})
        source_rec_code = props.get("source_record_id", "REC-000101")
        explanation = props.get("explanation", "Insufficient evidence.")
        confidence = float(props.get("confidence", 1.0)) if props.get("confidence") is not None else 1.0
        date_val = props.get("date")

        # Fetch source record from postgres
        q_rec = select(SourceRecord).where(SourceRecord.record_code == source_rec_code)
        res_rec = await db.execute(q_rec)
        rec_obj = res_rec.scalar_one_or_none()

        source_type = rec_obj.source_type if rec_obj else "fir"
        raw_text = rec_obj.raw_text if rec_obj else "Fictional case record log snippet."

        return EdgeEvidenceResponse(
            edge_id=edge_id,
            relationship_type=edge_raw["type"],
            source_id=edge_raw["source"],
            source_label=edge_raw["source_label"],
            source_name=edge_raw["source_name"],
            target_id=edge_raw["target"],
            target_label=edge_raw["target_label"],
            target_name=edge_raw["target_name"],
            source_record_code=source_rec_code,
            source_record_type=source_type,
            raw_source_snippet=raw_text,
            explanation=explanation,
            confidence=confidence,
            date=date_val,
            is_synthetic=True
        )
