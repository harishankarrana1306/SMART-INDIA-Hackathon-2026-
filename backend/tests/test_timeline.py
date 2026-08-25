import pytest
from httpx import AsyncClient
from app.models.user import User
from app.models.record import SourceRecord
from app.core.security import get_password_hash


@pytest.mark.asyncio
async def test_timeline_event_aggregation(client: AsyncClient, db_session, auth_headers):
    # Setup test investigator
    user = User(
        id="u-inv-tl",
        username="investigator_tl",
        password_hash=get_password_hash("Investigator@123"),
        full_name="Timeline Investigator",
        role="investigator",
        is_active=True,
    )
    # Add a sample record so timeline has data
    rec = SourceRecord(
        id="rec-tl-01",
        record_code="REC-000999",
        source_type="fir",
        title="Test Timeline FIR Report",
        raw_text="FIR filed in Cyber Cell New Delhi",
        ingested_by=user.id,
    )
    db_session.add_all([user, rec])
    await db_session.commit()

    headers_inv = auth_headers(user_id=user.id, role="investigator", username=user.username)

    # 1. Query full timeline
    res = await client.get("/api/timeline", headers=headers_inv)
    assert res.status_code == 200
    timeline = res.json()
    assert timeline["total_events"] > 0
    assert "disclaimer" in timeline

    # 2. Query timeline with filter
    res_filt = await client.get("/api/timeline?event_type=fir_filed", headers=headers_inv)
    assert res_filt.status_code == 200
    filtered_tl = res_filt.json()
    for evt in filtered_tl["events"]:
        assert evt["event_type"] == "fir_filed"
