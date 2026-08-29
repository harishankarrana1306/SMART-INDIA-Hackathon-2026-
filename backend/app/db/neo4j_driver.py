import logging
from typing import Dict, Any, List, Optional
# pyrefly: ignore [missing-import]
from neo4j import GraphDatabase, Driver
from app.config import settings

logger = logging.getLogger("neo4j_driver")


class MockGraphStore:
    """
    In-memory graph fallback store used when Neo4j is offline or during testing.
    Maintains graph consistency with identical Cypher semantics for demo & local dev.
    """
    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}  # id -> {id, label, properties}
        self.edges: Dict[str, Dict[str, Any]] = {}  # id -> {id, source, target, type, properties}

    def clear(self):
        self.nodes.clear()
        self.edges.clear()

    def add_node(self, node_id: str, label: str, properties: Dict[str, Any]):
        props = dict(properties)
        props["id"] = node_id
        props["label"] = label
        self.nodes[node_id] = {
            "id": node_id,
            "label": label,
            "properties": props
        }

    def add_edge(
        self,
        edge_id: str,
        source_id: Optional[str] = None,
        target_id: Optional[str] = None,
        rel_type: str = "RELATED_TO",
        properties: Optional[Dict[str, Any]] = None,
        source: Optional[str] = None,
        target: Optional[str] = None,
        **kwargs,
    ):
        src = source_id or source or kwargs.get("src", "")
        tgt = target_id or target or kwargs.get("tgt", "")
        props = dict(properties or {})
        props["id"] = edge_id
        props["type"] = rel_type
        self.edges[edge_id] = {
            "id": edge_id,
            "source": src,
            "target": tgt,
            "type": rel_type,
            "properties": props,
        }

    def get_nodes(self, node_type: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        result = []
        for n in self.nodes.values():
            if node_type and node_type.lower() != "all":
                if n["label"].lower() != node_type.lower():
                    continue
            if search:
                s = search.lower()
                props = n["properties"]
                name = str(props.get("name") or props.get("display_name") or props.get("number_masked") or props.get("case_code") or "").lower()
                if s not in name and s not in n["id"].lower():
                    continue
            result.append(n)
        return result

    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        return self.nodes.get(node_id)

    def get_edge(self, edge_id: str) -> Optional[Dict[str, Any]]:
        return self.edges.get(edge_id)

    def get_neighbors(self, node_id: str, depth: int = 1) -> Dict[str, Any]:
        visited_nodes = {node_id}
        current_layer = {node_id}
        found_edges = {}

        for _ in range(depth):
            next_layer = set()
            for edge in self.edges.values():
                src = edge["source"]
                tgt = edge["target"]
                if src in current_layer or tgt in current_layer:
                    found_edges[edge["id"]] = edge
                    if src not in visited_nodes:
                        next_layer.add(src)
                        visited_nodes.add(src)
                    if tgt not in visited_nodes:
                        next_layer.add(tgt)
                        visited_nodes.add(tgt)
            current_layer = next_layer
            if not current_layer:
                break

        nodes_res = [self.nodes[nid] for nid in visited_nodes if nid in self.nodes]
        edges_res = list(found_edges.values())
        return {"nodes": nodes_res, "edges": edges_res}

    def get_case_subgraph(self, case_id: str, limit: int = 100) -> Dict[str, Any]:
        """Returns the isolated subgraph for a specific case plus its inter-case syndicate bridges."""
        if not case_id or case_id.upper() == "ALL":
            return self.get_all_subgraph(limit=limit)

        c_lower = case_id.lower().strip()

        # Case definition mappings
        case_records_map = {
            1: ["REC-000101", "REC-000102", "REC-000103", "REC-000104", "REC-000106"],
            2: ["REC-000107", "REC-000108", "REC-000109", "REC-000110"],
            3: ["REC-000111", "REC-000112"],
            4: ["REC-000113", "REC-000114"],
            5: ["REC-000115", "REC-000105"],
            6: ["REC-000116"],
        }

        case_idx = None
        if any(k in c_lower for k in ["0001", "maya", "case_node_01", "fic-case-0001"]) or c_lower in ["case 1", "1"]:
            case_idx = 1
        elif any(k in c_lower for k in ["0002", "lotus", "case_node_02", "fic-case-0002"]) or c_lower in ["case 2", "2"]:
            case_idx = 2
        elif any(k in c_lower for k in ["0003", "falcon", "case_node_03", "fic-case-0003"]) or c_lower in ["case 3", "3"]:
            case_idx = 3
        elif any(k in c_lower for k in ["0004", "silver", "case_node_04", "fic-case-0004"]) or c_lower in ["case 4", "4"]:
            case_idx = 4
        elif any(k in c_lower for k in ["0005", "horizon", "blue", "case_node_05", "fic-case-0005"]) or c_lower in ["case 5", "5"]:
            case_idx = 5
        elif any(k in c_lower for k in ["0006", "asteroid", "case_node_06", "fic-case-0006"]) or c_lower in ["case 6", "6"]:
            case_idx = 6

        target_case_node_id = f"case_node_0{case_idx}" if case_idx else None
        if not target_case_node_id:
            for nid, node in self.nodes.items():
                props = node.get("properties", {})
                code = str(props.get("case_code", "")).lower()
                name = str(props.get("name", "")).lower()
                if c_lower == nid.lower() or c_lower == code or c_lower in name:
                    target_case_node_id = nid
                    break

        case_edges = {}
        case_node_ids = set()

        if target_case_node_id and target_case_node_id in self.nodes:
            case_node_ids.add(target_case_node_id)

        target_records = set(case_records_map.get(case_idx, []))

        # Collect internal case edges
        for eid, edge in self.edges.items():
            props = edge.get("properties", {})
            rec_id = str(props.get("source_record_id", "")).upper()
            src = edge["source"]
            tgt = edge["target"]

            is_case_edge = False
            if target_case_node_id and (src == target_case_node_id or tgt == target_case_node_id):
                is_case_edge = True
            elif rec_id and rec_id in target_records:
                is_case_edge = True
            elif c_lower in rec_id.lower():
                is_case_edge = True

            if is_case_edge:
                case_edges[eid] = edge
                case_node_ids.add(src)
                case_node_ids.add(tgt)

        # Include direct 1-hop cross-case bridge connections so investigator sees how cases interconnect
        for eid, edge in self.edges.items():
            if eid in case_edges:
                continue
            src = edge["source"]
            tgt = edge["target"]
            if (src in case_node_ids and tgt in self.nodes) or (tgt in case_node_ids and src in self.nodes):
                # Inter-case link
                case_edges[eid] = edge
                case_node_ids.add(src)
                case_node_ids.add(tgt)

        if not case_node_ids:
            return {"nodes": [], "edges": []}

        nodes_res = [self.nodes[nid] for nid in case_node_ids if nid in self.nodes][:limit]
        valid_nids = {n["id"] for n in nodes_res}
        edges_res = [e for e in case_edges.values() if e["source"] in valid_nids and e["target"] in valid_nids]
        return {"nodes": nodes_res, "edges": edges_res}

    def get_all_subgraph(self, limit: int = 100) -> Dict[str, Any]:
        nodes_list = list(self.nodes.values())[:limit]
        node_ids = {n["id"] for n in nodes_list}
        edges_list = [e for e in self.edges.values() if e["source"] in node_ids and e["target"] in node_ids]
        return {"nodes": nodes_list, "edges": edges_list}


class Neo4jService:
    def __init__(self):
        self._driver: Optional[Driver] = None
        self._connected: bool = False
        self.mock_store = MockGraphStore()
        self._init_driver()

    def _init_driver(self):
        try:
            self._driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                connection_timeout=3.0,
                max_connection_lifetime=300
            )
            # Verify connectivity
            self._driver.verify_connectivity()
            self._connected = True
            logger.info("Successfully connected to Neo4j database.")
        except Exception as e:
            self._connected = False
            logger.warning(f"Neo4j connection unavailable ({e}). Using resilient in-memory graph store.")

    @property
    def is_connected(self) -> bool:
        return self._connected

    def close(self):
        if self._driver:
            self._driver.close()

    def run_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        if not self._connected or not self._driver:
            return []
        try:
            with self._driver.session() as session:
                result = session.run(query, parameters or {})
                return [record.data() for record in result]
        except Exception as e:
            logger.error(f"Error running Neo4j Cypher query: {e}")
            return []


# Global singleton instance
neo4j_service = Neo4jService()
