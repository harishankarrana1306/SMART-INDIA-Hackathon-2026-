import pytest
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select


@pytest.mark.asyncio
async def test_auth_flows_and_rbac(client, db_session):
    # Setup test users idempotently
    users_data = [
        ("u-inv-1", "investigator1", "Investigator@123", "Rhea Sharma", "investigator"),
        ("u-sup-1", "supervisor1", "Supervisor@123", "Vikramaditya Sen", "supervisor"),
        ("u-adm-1", "admin1", "Admin@123", "Aditi Deshmukh", "administrator"),
    ]
    for uid, uname, pwd, fname, role in users_data:
        existing = (await db_session.execute(select(User).where(User.username == uname))).scalar_one_or_none()
        if not existing:
            u = User(
                id=uid,
                username=uname,
                password_hash=get_password_hash(pwd),
                full_name=fname,
                role=role,
                is_active=True,
            )
            db_session.add(u)
    await db_session.commit()

    # 1. Test Login for Investigator
    resp = await client.post(
        "/api/auth/login",
        json={"username": "investigator1", "password": "Investigator@123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "investigator"
    inv_token = data["access_token"]

    # 2. Test Login for Supervisor
    resp = await client.post(
        "/api/auth/login",
        json={"username": "supervisor1", "password": "Supervisor@123"},
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "supervisor"
    sup_token = resp.json()["access_token"]

    # 3. Test Login for Admin
    resp = await client.post(
        "/api/auth/login",
        json={"username": "admin1", "password": "Admin@123"},
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "administrator"

    # 4. Test Invalid Password
    resp = await client.post(
        "/api/auth/login",
        json={"username": "investigator1", "password": "WrongPassword!"},
    )
    assert resp.status_code == 401

    # 5. Test GET /api/auth/me
    resp = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {inv_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["username"] == "investigator1"

    # 6. Test RBAC: Investigator cannot access /api/audit/logs (Expect 403)
    resp = await client.get(
        "/api/audit/logs",
        headers={"Authorization": f"Bearer {inv_token}"},
    )
    assert resp.status_code == 403

    # 7. Test RBAC: Supervisor CAN access /api/audit/logs (Expect 200)
    resp = await client.get(
        "/api/audit/logs",
        headers={"Authorization": f"Bearer {sup_token}"},
    )
    assert resp.status_code == 200
