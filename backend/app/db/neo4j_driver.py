import logging
from typing import Dict, Any, List, Optional
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

    def add_edge(self, edge_id: str, source_id: str, target_id: str, rel_type: str, properties: Dict[str, Any]):
        props = dict(properties)
        props["id"] = edge_id
        props["type"] = rel_type
        self.edges[edge_id] = {
            "id": edge_id,
            "source": source_id,
            "target": target_id,
            "type": rel_type,
            "properties": props
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
