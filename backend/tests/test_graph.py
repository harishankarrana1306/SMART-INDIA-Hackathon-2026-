import pytest
from app.models.user import User
from app.core.security import get_password_hash
from app.seed.seed_data import seed_database
from tests.conftest import TestSyncSessionLocal


@pytest.mark.asyncio
async def test_graph_features_and_evidence(client, db_session):
    # Seed full test data
    sync_db = TestSyncSessionLocal()
    try:
        seed_database(sync_db)
    finally:
        sync_db.close()

    # Login as investigator
    login_resp = await client.post(
        "/api/auth/login",
        json={"username": "investigator1", "password": "Investigator@123"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Test GET /api/graph/subgraph
    resp = await client.get("/api/graph/subgraph", headers=headers)
    assert resp.status_code == 200
    subgraph = resp.json()
    assert len(subgraph["nodes"]) > 0
    assert len(subgraph["edges"]) > 0
    assert "disclaimer" in subgraph

    # 2. Test GET /api/graph/nodes (Search)
    resp = await client.get("/api/graph/nodes?search=Priya", headers=headers)
    assert resp.status_code == 200
    nodes = resp.json()
    assert len(nodes) >= 1
    assert "Priya" in str(nodes[0]["properties"])

    # 3. Test GET /api/graph/node/person_01 (Node Profile)
    resp = await client.get("/api/graph/node/person_01", headers=headers)
    assert resp.status_code == 200
    profile = resp.json()
    assert profile["id"] == "person_01"
    assert profile["display_name"] == "Priya Verma"
    assert len(profile["connected_entities"]) > 0
    assert len(profile["linked_cases"]) > 0
    assert "disclaimer" in profile

    # 4. Test GET /api/graph/edge/e01 (Edge Evidence Panel)
    resp = await client.get("/api/graph/edge/e01", headers=headers)
    assert resp.status_code == 200
    evidence = resp.json()
    assert evidence["source_record_code"] == "REC-000101"
    assert evidence["explanation"] != ""
    assert evidence["confidence"] > 0
    assert "disclaimer" in evidence

    # 5. Test GET /api/graph/expand?node_id=person_01&depth=2 (Depth-2 Expansion)
    resp = await client.get("/api/graph/expand?node_id=person_01&depth=2", headers=headers)
    assert resp.status_code == 200
    expanded = resp.json()
    assert len(expanded["nodes"]) >= 3
    assert len(expanded["edges"]) >= 2

    # 6. Test POST /api/graph/reveal-sensitive/phone_01 (Audited Unmasking)
    resp = await client.post(
        "/api/graph/reveal-sensitive/phone_01",
        json={"reason": "Test unmasking for investigator review"},
        headers=headers,
    )
    assert resp.status_code == 200
    reveal_data = resp.json()
    assert reveal_data["audited"] is True
    assert "unmasked_value" in reveal_data
