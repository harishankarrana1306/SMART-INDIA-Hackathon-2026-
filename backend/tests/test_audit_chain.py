import pytest
from app.models.user import User
from app.models.audit_log import AuditLog
from app.core.security import get_password_hash
from app.core.audit import write_audit_log, verify_audit_chain


@pytest.mark.asyncio
async def test_audit_hash_chain_and_tamper_detection(client, db_session):
    # Setup test supervisor
    user = User(
        id="u-sup-audit",
        username="supervisor1",
        password_hash=get_password_hash("Supervisor@123"),
        full_name="Vikramaditya Sen",
        role="supervisor",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Append 5 sequential audit logs
    actions = ["login", "search", "record_view", "reveal_sensitive", "search"]
    for idx, act in enumerate(actions, start=1):
        await write_audit_log(
            db=db_session,
            action=act,
            user_id=user.id,
            target_type="test_entity",
            target_id=f"target-{idx}",
            metadata={"step": idx, "test": True},
        )
    await db_session.commit()

    # 1. Verify chain is valid
    is_valid, total_records, broken_seq = await verify_audit_chain(db_session)
    assert is_valid is True
    assert total_records >= 5
    assert broken_seq is None

    # Test via API endpoint
    login_resp = await client.post(
        "/api/auth/login",
        json={"username": "supervisor1", "password": "Supervisor@123"},
    )
    token = login_resp.json()["access_token"]

    verify_resp = await client.get(
        "/api/audit/verify-chain",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert verify_resp.status_code == 200
    data = verify_resp.json()
    assert data["valid"] is True
    assert data["total_records"] >= 5

    # 2. Tamper Test: Corrupt metadata of sequence #3
    from sqlalchemy import select
    res = await db_session.execute(select(AuditLog).where(AuditLog.seq_no == 3))
    corrupt_row = res.scalar_one()
    corrupt_row.metadata_json = {"step": 3, "tampered": True}
    await db_session.commit()

    # Verify chain now detects tampering at sequence #3
    is_valid, total_records, broken_seq = await verify_audit_chain(db_session)
    assert is_valid is False
    assert broken_seq == 3

    # Test API response for tampered chain
    verify_resp_tampered = await client.get(
        "/api/audit/verify-chain",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert verify_resp_tampered.status_code == 200
    data_tampered = verify_resp_tampered.json()
    assert data_tampered["valid"] is False
    assert data_tampered["first_broken_seq"] == 3
    assert "TAMPER ALERT" in data_tampered["message"]
