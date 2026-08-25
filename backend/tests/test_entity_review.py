import pytest
from httpx import AsyncClient
from app.models.user import User
from app.core.security import get_password_hash


@pytest.mark.asyncio
async def test_document_ingestion_and_review_workflow(client: AsyncClient, db_session, auth_headers):
    # Ensure test investigator exists in db
    user = User(
        id="u-inv-review",
        username="investigator_rev",
        password_hash=get_password_hash("Investigator@123"),
        full_name="Review Investigator",
        role="investigator",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    headers_inv = auth_headers(user_id=user.id, role="investigator", username=user.username)

    # 1. Ingest sample document
    sample_text = (
        "FIR Report: Suspect vehicle HR-26-CD-5678 was operated by Rohan Sharma. "
        "Contact mobile number was +91 99887 76655."
    )
    files = {"file": ("fir_sample.txt", sample_text.encode("utf-8"), "text/plain")}
    data = {"source_type": "fir", "title": "Test Staged FIR"}

    res = await client.post("/api/ingestion/upload", files=files, data=data, headers=headers_inv)
    assert res.status_code == 200
    upload_data = res.json()
    assert upload_data["entities_extracted_count"] >= 2
    rec_id = upload_data["record_id"]

    # 2. List staged extractions
    res = await client.get(f"/api/entities/extracted?record_id={rec_id}", headers=headers_inv)
    assert res.status_code == 200
    extractions = res.json()
    assert len(extractions) >= 2

    # 3. Approve first entity
    eid = extractions[0]["id"]
    res_app = await client.post(f"/api/entities/{eid}/approve", headers=headers_inv)
    assert res_app.status_code == 200
    app_data = res_app.json()
    assert app_data["status"] == "approved"
    assert app_data["synced_to_graph"] is True

    # 4. Correct and approve second entity
    if len(extractions) > 1:
        eid2 = extractions[1]["id"]
        res_corr = await client.post(
            f"/api/entities/{eid2}/correct",
            json={"normalized_value": "HR-26-CD-5678", "entity_type": "Vehicle"},
            headers=headers_inv,
        )
        assert res_corr.status_code == 200
        corr_data = res_corr.json()
        assert corr_data["status"] == "approved"
        assert corr_data["normalized_value"] == "HR-26-CD-5678"
