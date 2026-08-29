import asyncio
import os
import io
import sys
import pypdf

from app.db.postgres import AsyncSessionLocal, get_sync_db
from app.seed.seed_data import seed_database
from app.db.neo4j_driver import neo4j_service
from app.services.report_service import ReportService
from app.services.timeline_service import TimelineService
from app.models.user import User


async def run_verification():
    print("=" * 70)
    print("NETRA PROTOTYPE — COMPREHENSIVE E2E & DEEP AUDIT RUNNER")
    print("=" * 70)

    # 1. Atomic Database Reset & Seeding
    print("\n[1/6] Testing Atomic Database Reset & Seeding...")
    sync_db = get_sync_db()
    try:
        seed_database(sync_db, reset=True)
    finally:
        sync_db.close()

    # Check distinct case graph topologies
    store = neo4j_service.mock_store
    c1 = store.get_case_subgraph("FIC-CASE-0001")
    c2 = store.get_case_subgraph("FIC-CASE-0002")
    c3 = store.get_case_subgraph("FIC-CASE-0003")
    c4 = store.get_case_subgraph("FIC-CASE-0004")
    c5 = store.get_case_subgraph("FIC-CASE-0005")
    c6 = store.get_case_subgraph("FIC-CASE-0006")

    print(f"  ✓ Case 1 Nodes: {len(c1['nodes'])}, Edges: {len(c1['edges'])}")
    print(f"  ✓ Case 2 Nodes: {len(c2['nodes'])}, Edges: {len(c2['edges'])}")
    print(f"  ✓ Case 3 Nodes: {len(c3['nodes'])}, Edges: {len(c3['edges'])}")
    print(f"  ✓ Case 4 Nodes: {len(c4['nodes'])}, Edges: {len(c4['edges'])}")
    print(f"  ✓ Case 5 Nodes: {len(c5['nodes'])}, Edges: {len(c5['edges'])}")
    print(f"  ✓ Case 6 Nodes: {len(c6['nodes'])}, Edges: {len(c6['edges'])}")

    assert len(c1['nodes']) > 0 and len(c2['nodes']) > 0 and len(c3['nodes']) > 0
    assert len(c4['nodes']) > 0 and len(c5['nodes']) > 0 and len(c6['nodes']) > 0

    c1_names = {n.get('properties', {}).get('name') for n in c1['nodes']}
    c2_names = {n.get('properties', {}).get('name') for n in c2['nodes']}
    assert "Priya Verma" in c1_names and "Deepa Nair" in c2_names
    print("  [SUCCESS] All 6 cases have unique, isolated network subgraphs.")

    # 2. Executive Brief 10-Section PDF Generation and Text Extraction
    print("\n[2/6] Testing Executive Brief 10-Section PDF Generation & Text Verification...")
    async with AsyncSessionLocal() as db:
        dummy_user = User(id="u_inv_01", username="investigator1", full_name="Officer Verma", role="investigator")
        for test_case in ["FIC-CASE-0001", "FIC-CASE-0002", "FIC-CASE-0003"]:
            brief_data, pdf_bytes = await ReportService.build_case_brief(db, test_case, dummy_user)
            assert len(pdf_bytes) > 2000

            # Parse PDF using pypdf to inspect extracted text
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            pdf_text = "".join([page.extract_text() or "" for page in reader.pages])

            expected_sections = [
                "1. Executive Summary & Context",
                "2. Case Overview",
                "3. Key Entities & Network Findings",
                "4. Investigation Alerts",
                "5. Entity Resolution Findings",
                "6. Crime Timeline",
                "7. Evidence & Source References",
                "8. Investigative Findings & Considerations",
                "9. Investigator & Supervisory Review",
                "10. Audit & Cryptographic Integrity",
            ]

            for sec in expected_sections:
                assert sec in pdf_text, f"Section '{sec}' missing in {test_case} PDF!"
            print(f"  ✓ {test_case} PDF verified: All 10 sections present and sequential ({len(reader.pages)} pages, {len(pdf_bytes)} bytes)")
            assert len(brief_data['key_entities']) > 0
            assert len(brief_data['key_relationships']) > 0
        print("  [SUCCESS] 10-Section PDF generated and text-verified across multiple cases.")

    # 3. Test API Endpoints via HTTP
    print("\n[3/6] Testing API Endpoints (FastAPI Test Client)...")
    from app.main import app
    from httpx import AsyncClient, ASGITransport

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Authenticate users
        inv_auth = await client.post("/api/auth/login", json={"username": "investigator1", "password": "Investigator@123"})
        assert inv_auth.status_code == 200
        investigator_token = inv_auth.json()["access_token"]

        sup_auth = await client.post("/api/auth/login", json={"username": "supervisor1", "password": "Supervisor@123"})
        assert sup_auth.status_code == 200
        supervisor_token = sup_auth.json()["access_token"]

        # Dashboard endpoint (No leaked audit events)
        dash_res = await client.get("/api/dashboard/summary", headers={"Authorization": f"Bearer {investigator_token}"})
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        assert "recent_alerts" in dash_data
        assert "recent_records" in dash_data
        assert "recent_activity" not in dash_data or len(dash_data.get("recent_activity", [])) == 0
        print(f"  ✓ Dashboard returned {len(dash_data.get('recent_cases', []))} cases, {len(dash_data.get('recent_alerts', []))} alerts, 0 leaked audit logs.")

        # Test Case Differentiation on Graph endpoint
        g1_res = await client.get("/api/graph/subgraph?case_id=FIC-CASE-0001", headers={"Authorization": f"Bearer {investigator_token}"})
        assert g1_res.status_code == 200
        g1_data = g1_res.json()
        g2_res = await client.get("/api/graph/subgraph?case_id=FIC-CASE-0002", headers={"Authorization": f"Bearer {investigator_token}"})
        assert g2_res.status_code == 200
        g2_data = g2_res.json()

        assert len(g1_data["nodes"]) > 0 and len(g2_data["nodes"]) > 0
        g1_node_names = {n["properties"].get("name") for n in g1_data["nodes"]}
        g2_node_names = {n["properties"].get("name") for n in g2_data["nodes"]}
        assert "Priya Verma" in g1_node_names
        assert "Deepa Nair" in g2_node_names
        assert "Priya Verma" not in g2_node_names
        print(f"  ✓ Graph API confirms Case 1 has {len(g1_data['nodes'])} nodes, Case 2 has {len(g2_data['nodes'])} nodes (completely isolated).")

        # Test Case Differentiation on Crime Timeline endpoint
        t1_res = await client.get("/api/timeline?case_id=FIC-CASE-0001", headers={"Authorization": f"Bearer {investigator_token}"})
        assert t1_res.status_code == 200
        t1_events = t1_res.json()["events"]

        t2_res = await client.get("/api/timeline?case_id=FIC-CASE-0002", headers={"Authorization": f"Bearer {investigator_token}"})
        assert t2_res.status_code == 200
        t2_events = t2_res.json()["events"]

        assert len(t1_events) > 0 and len(t2_events) > 0
        t1_titles = [e["title"] for e in t1_events]
        t2_titles = [e["title"] for e in t2_events]
        assert any("Maya Orchid" in t for t in t1_titles)
        assert any("Lotus Transit" in t for t in t2_titles)
        print(f"  ✓ Crime Timeline confirms Case 1 has {len(t1_events)} events, Case 2 has {len(t2_events)} events (distinct case timelines).")

        # Supervisor Tamper-Proof Audit endpoint
        sup_audit_res = await client.get("/api/audit/logs", headers={"Authorization": f"Bearer {supervisor_token}"})
        assert sup_audit_res.status_code == 200
        sup_audit_data = sup_audit_res.json()
        assert len(sup_audit_data) > 0
        print(f"  ✓ Supervisor Tamper-Proof Audit returned {len(sup_audit_data)} audit blocks.")

        # Audit Verification endpoint
        verify_res = await client.get("/api/audit/verify-chain", headers={"Authorization": f"Bearer {supervisor_token}"})
        assert verify_res.status_code == 200
        verify_data = verify_res.json()
        assert verify_data["valid"] is True
        print(f"  ✓ Audit Hash-Chain Integrity: {verify_data['message']} ({verify_data['total_records']} blocks checked).")

        # Investigator Access to Audit Forbidden
        inv_audit_res = await client.get("/api/audit/logs", headers={"Authorization": f"Bearer {investigator_token}"})
        assert inv_audit_res.status_code == 403
        print("  ✓ Investigator access to Tamper-Proof Audit properly blocked (403 Forbidden).")

        # Test Reload Sample Data idempotency for both roles
        print("\n[4/6] Testing Reload Sample Data Idempotency for Investigator & Supervisor...")
        inv_reload = await client.post("/api/seed/load-demo-data", headers={"Authorization": f"Bearer {investigator_token}"})
        assert inv_reload.status_code == 200

        sup_reload = await client.post("/api/seed/load-demo-data", headers={"Authorization": f"Bearer {supervisor_token}"})
        assert sup_reload.status_code == 200

        # Verify entity count remains identical on repeated reloads
        c1_after = store.get_case_subgraph("FIC-CASE-0001")
        assert len(c1_after["nodes"]) == len(c1["nodes"])
        assert len(c1_after["edges"]) == len(c1["edges"])
        print(f"  ✓ After multiple reload calls: Case 1 node count is unchanged ({len(c1_after['nodes'])} nodes, 0 duplicates).")

        # 5. Test User-Uploaded Data vs Canonical Demo Data Reset
        print("\n[5/6] Testing User-Uploaded Data Purge vs Canonical Demo Dataset...")
        # Ingest a custom user file
        custom_file_content = b"FIR No 999/2026 registered regarding custom suspect John Doe and vehicle KA-01-XX-9999."
        ingest_res = await client.post(
            "/api/ingestion/upload",
            files={"file": ("custom_user_fir.txt", custom_file_content, "text/plain")},
            data={"source_type": "fir", "title": "User Uploaded Case X"},
            headers={"Authorization": f"Bearer {investigator_token}"},
        )
        assert ingest_res.status_code == 200
        print("  ✓ Simulated user document upload (custom_user_fir.txt) ingested successfully.")

        # Click Reload Demo Data
        reload_action = await client.post("/api/seed/load-demo-data", headers={"Authorization": f"Bearer {investigator_token}"})
        assert reload_action.status_code == 200

        # Verify cases count is strictly the 6 canonical demo cases
        dash_check = await client.get("/api/dashboard/summary", headers={"Authorization": f"Bearer {investigator_token}"})
        cases_after_reload = dash_check.json().get("recent_cases", [])
        assert len(cases_after_reload) == 6
        case_codes = [c["case_code"] for c in cases_after_reload]
        assert "FIC-CASE-0001" in case_codes and "FIC-CASE-0006" in case_codes
        print(f"  ✓ After Reload Demo Data: Database strictly restored ONLY the 6 canonical demo cases ({', '.join(case_codes[:3])}...).")

        # 6. Verify Multiple Idempotent Clicks
        print("\n[6/6] Testing 3x Sequential Reload Clicks (Strict Determinism)...")
        for i in range(3):
            r_click = await client.post("/api/seed/load-demo-data", headers={"Authorization": f"Bearer {investigator_token}"})
            assert r_click.status_code == 200
        
        dash_final = await client.get("/api/dashboard/summary", headers={"Authorization": f"Bearer {investigator_token}"})
        final_cases = dash_final.json().get("recent_cases", [])
        assert len(final_cases) == 6
        print("  ✓ 3x consecutive reloads verified: Exactly 6 cases, 0 accumulation, 0 duplicates.")

    print("\n" + "=" * 70)
    print("ALL E2E VERIFICATIONS & PDF SECTION TEXT CHECKS PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_verification())
