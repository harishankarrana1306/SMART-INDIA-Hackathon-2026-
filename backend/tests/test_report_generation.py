import pytest
from httpx import AsyncClient
from app.models.user import User
from app.models.case import Case
from app.core.security import get_password_hash


@pytest.mark.asyncio
async def test_executive_brief_and_pdf_generation(client: AsyncClient, db_session, auth_headers):
    # Setup test investigator and case
    user = User(
        id="u-inv-rep",
        username="investigator_rep",
        password_hash=get_password_hash("Investigator@123"),
        full_name="Report Investigator",
        role="investigator",
        is_active=True,
    )
    case_obj = Case(
        id="c-rep-01",
        case_code="FIC-CASE-9901",
        title="Operation Cyber Fortress",
        case_type="cyber_fraud",
        status="under_investigation",
    )
    db_session.add_all([user, case_obj])
    await db_session.commit()

    headers = auth_headers(user_id=user.id, role="investigator", username=user.username)

    # 1. Generate Case Brief JSON
    res_brief = await client.get(f"/api/reports/brief/{case_obj.id}", headers=headers)
    assert res_brief.status_code == 200
    brief_data = res_brief.json()
    assert brief_data["case_code"] == "FIC-CASE-9901"
    assert "custody_hash" in brief_data
    assert len(brief_data["custody_hash"]) == 64  # Valid SHA-256 length
    assert "disclaimer" in brief_data

    # 2. Export Case Brief PDF
    res_pdf = await client.get(f"/api/reports/brief/{case_obj.id}/pdf", headers=headers)
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert len(res_pdf.content) > 1000  # Non-empty PDF payload
    assert res_pdf.content[:4] == b"%PDF"  # Valid PDF magic bytes header
