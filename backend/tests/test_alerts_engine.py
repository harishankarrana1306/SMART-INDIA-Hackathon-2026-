import pytest
from httpx import AsyncClient
from app.models.user import User
from app.core.security import get_password_hash
from app.analytics.alerts_engine import alerts_engine


def test_rule_based_alerts_detector_offline():
    # Rule engine detects patterns without error
    alerts = alerts_engine.scan_all_patterns()
    assert isinstance(alerts, list)
    for a in alerts:
        assert a.severity in ["HIGH", "MEDIUM", "LOW"]
        assert len(a.supporting_entity_ids) >= 1
        assert "criminal" not in a.description.lower()
        assert "threat level" not in a.description.lower()


@pytest.mark.asyncio
async def test_alerts_scan_and_review_workflow(client: AsyncClient, db_session, auth_headers):
    # Setup test investigator
    user = User(
        id="u-inv-alerts",
        username="investigator_alt",
        password_hash=get_password_hash("Investigator@123"),
        full_name="Alert Investigator",
        role="investigator",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    headers = auth_headers(user_id=user.id, role="investigator", username=user.username)

    # 1. Run Alert Scan
    res_scan = await client.post("/api/alerts/scan", headers=headers)
    assert res_scan.status_code == 200
    scan_data = res_scan.json()
    assert "total_active_alerts" in scan_data
    assert "disclaimer" in scan_data

    # 2. List Alerts
    res_list = await client.get("/api/alerts", headers=headers)
    assert res_list.status_code == 200
    alerts = res_list.json()

    if alerts:
        aid = alerts[0]["id"]
        # 3. Acknowledge Alert
        res_ack = await client.post(
            f"/api/alerts/{aid}/acknowledge",
            json={"notes": "Investigator evaluated and confirmed bridge communication pattern"},
            headers=headers,
        )
        assert res_ack.status_code == 200
        ack_data = res_ack.json()
        assert ack_data["status"] == "acknowledged"

        # 4. Dismiss Alert
        if len(alerts) > 1:
            aid2 = alerts[1]["id"]
            res_dis = await client.post(
                f"/api/alerts/{aid2}/dismiss",
                json={"reason": "Evaluated and cleared as legitimate corporate commercial contact"},
                headers=headers,
            )
            assert res_dis.status_code == 200
            dis_data = res_dis.json()
            assert dis_data["status"] == "dismissed"
