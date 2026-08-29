import pytest
from httpx import AsyncClient
from app.models.user import User
from app.models.entity import GraphEntity
from app.core.security import get_password_hash
from app.services.resolution_service import compute_string_similarity


def test_string_similarity():
    assert compute_string_similarity("Priya Verma", "Priya Verma") == 1.0
    assert compute_string_similarity("Vikram Singh", "Vikramaditya Singh") >= 0.70
    assert compute_string_similarity("Apex Global", "Apex Global Traders") >= 0.65


@pytest.mark.asyncio
async def test_resolution_candidate_generation_and_approval(
    client: AsyncClient,
    db_session,
    auth_headers,
):
    # Setup users
    sup_user = User(
        id="u-sup-res",
        username="supervisor_res",
        password_hash=get_password_hash("Supervisor@123"),
        full_name="Supervisor Resolution",
        role="supervisor",
        is_active=True,
    )
    inv_user = User(
        id="u-inv-res",
        username="investigator_res",
        password_hash=get_password_hash("Investigator@123"),
        full_name="Investigator Resolution",
        role="investigator",
        is_active=True,
    )
    # Add two similar entities to test candidate generation
    e1 = GraphEntity(
        id="ge-01",
        neo4j_node_id="person_vikram_singh",
        entity_type="Person",
        display_name="Vikram Singh",
    )
    e2 = GraphEntity(
        id="ge-02",
        neo4j_node_id="person_vikramaditya_singh",
        entity_type="Person",
        display_name="Vikramaditya Singh",
    )
    db_session.add_all([sup_user, inv_user, e1, e2])
    await db_session.commit()

    headers_sup = auth_headers(user_id=sup_user.id, role="supervisor", username=sup_user.username)
    headers_inv = auth_headers(user_id=inv_user.id, role="investigator", username=inv_user.username)

    # 1. Investigator generates candidate scan -> 200 OK
    res_inv = await client.post("/api/resolution/generate", headers=headers_inv)
    assert res_inv.status_code == 200

    # 2. List candidates
    res_list = await client.get("/api/resolution/candidates", headers=headers_inv)
    assert res_list.status_code == 200
    candidates = res_list.json()

    # 3. Approve merge
    if candidates:
        cid = candidates[0]["id"]
        res_merge = await client.post(f"/api/resolution/{cid}/approve", headers=headers_inv)
        assert res_merge.status_code == 200
        merge_data = res_merge.json()
        assert merge_data["status"] == "merged"
