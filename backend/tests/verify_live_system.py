"""
Live E2E Verification Script for Phase 1 System
===============================================
Executes against live running backend at http://localhost:8000
"""

import httpx

BASE_URL = "http://localhost:8000"


def run_live_verification():
    results = {}
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    print("=================================================================")
    print("AI-POWERED CRIMINAL NETWORK ANALYSIS SYSTEM — PHASE 1 E2E AUDIT")
    print("=================================================================\n")

    # 1. Health & Root
    r = client.get("/")
    assert r.status_code == 200, f"Root failed: {r.status_code}"
    root_data = r.json()
    assert "ethics_statement" in root_data
    results["1_Health_Root_API"] = "PASS"
    print("[✓] 1. Root & Health API: PASS")

    # 2. Login as investigator1
    r = client.post("/api/auth/login", json={"username": "investigator1", "password": "Investigator@123"})
    assert r.status_code == 200, f"Investigator login failed: {r.status_code}"
    inv_token = r.json()["access_token"]
    inv_headers = {"Authorization": f"Bearer {inv_token}"}
    results["2_Investigator_Login"] = "PASS"
    print("[✓] 2. Investigator Login & JWT Generation: PASS")

    # 3. Login as supervisor1 & admin1
    r_sup = client.post("/api/auth/login", json={"username": "supervisor1", "password": "Supervisor@123"})
    assert r_sup.status_code == 200
    sup_token = r_sup.json()["access_token"]
    sup_headers = {"Authorization": f"Bearer {sup_token}"}

    r_adm = client.post("/api/auth/login", json={"username": "admin1", "password": "Admin@123"})
    assert r_adm.status_code == 200
    adm_token = r_adm.json()["access_token"]
    adm_headers = {"Authorization": f"Bearer {adm_token}"}
    results["3_Supervisor_Admin_Logins"] = "PASS"
    print("[✓] 3. Supervisor & Admin Logins: PASS")

    # 4. Dashboard Summary
    r = client.get("/api/dashboard/summary", headers=inv_headers)
    assert r.status_code == 200
    dash = r.json()
    assert dash["totals"]["total_cases"] >= 6
    assert dash["totals"]["total_entities"] >= 20
    assert dash["totals"]["total_records"] >= 16
    assert "disclaimer" in dash
    results["4_Dashboard_Summary"] = "PASS"
    print(f"[✓] 4. Dashboard Summary ({dash['totals']['total_cases']} cases, {dash['totals']['total_entities']} entities, {dash['totals']['total_records']} records): PASS")

    # 5. Graph Subgraph Retrieval
    r = client.get("/api/graph/subgraph", headers=inv_headers)
    assert r.status_code == 200
    subgraph = r.json()
    assert len(subgraph["nodes"]) > 0
    assert len(subgraph["edges"]) > 0
    results["5_Graph_Subgraph"] = "PASS"
    print(f"[✓] 5. Graph Subgraph ({len(subgraph['nodes'])} nodes, {len(subgraph['edges'])} edges): PASS")

    # 6. Graph Search
    r = client.get("/api/graph/nodes?search=Priya", headers=inv_headers)
    assert r.status_code == 200
    nodes = r.json()
    assert len(nodes) >= 1
    target_node = nodes[0]["id"]
    results["6_Graph_Search"] = "PASS"
    print(f"[✓] 6. Graph Search ('Priya' -> Node {target_node}): PASS")

    # 7. Node Profile Drawer
    r = client.get(f"/api/graph/node/{target_node}", headers=inv_headers)
    assert r.status_code == 200
    prof = r.json()
    assert prof["display_name"] == "Priya Verma"
    assert len(prof["connected_entities"]) > 0
    assert len(prof["linked_cases"]) > 0
    assert "disclaimer" in prof
    results["7_Node_Profile_Drawer"] = "PASS"
    print(f"[✓] 7. Node Profile Drawer (Linked cases: {len(prof['linked_cases'])}, Connected: {len(prof['connected_entities'])}): PASS")

    # 8. Edge Evidence Lookup
    r = client.get("/api/graph/edge/e01", headers=inv_headers)
    assert r.status_code == 200
    ev = r.json()
    assert ev["source_record_code"] == "REC-000101"
    assert ev["explanation"] != ""
    assert ev["confidence"] > 0
    assert "disclaimer" in ev
    results["8_Edge_Evidence_Panel"] = "PASS"
    print(f"[✓] 8. Edge Evidence Traceability ({ev['source_record_code']} - {ev['explanation'][:50]}...): PASS")

    # 9. Multi-Degree Expansion
    r = client.get(f"/api/graph/expand?node_id={target_node}&depth=2", headers=inv_headers)
    assert r.status_code == 200
    exp = r.json()
    assert len(exp["nodes"]) >= 3
    results["9_MultiDegree_Expansion"] = "PASS"
    print(f"[✓] 9. Depth-2 Network Expansion ({len(exp['nodes'])} connected nodes): PASS")

    # 10. Sensitive Data Unmasking (Audited)
    r = client.post(
        "/api/graph/reveal-sensitive/phone_01",
        json={"reason": "Investigative review"},
        headers=inv_headers,
    )
    assert r.status_code == 200
    rev = r.json()
    assert rev["audited"] is True
    assert "unmasked_value" in rev
    results["10_Audited_Sensitive_Unmasking"] = "PASS"
    print(f"[✓] 10. Sensitive Masking & Audited Unmasking: PASS")

    # 11. RBAC Endpoint Protection
    r = client.get("/api/audit/logs", headers=inv_headers)
    assert r.status_code == 403, f"Investigator should be forbidden from audit logs, got {r.status_code}"
    r_sup_audit = client.get("/api/audit/logs", headers=sup_headers)
    assert r_sup_audit.status_code == 200
    results["11_RBAC_Protection"] = "PASS"
    print("[✓] 11. RBAC Endpoint Protection (Investigator 403, Supervisor 200): PASS")

    # 12. Cryptographic Hash Chain Verification
    r = client.get("/api/audit/verify-chain", headers=sup_headers)
    assert r.status_code == 200
    audit_ver = r.json()
    assert audit_ver["valid"] is True
    assert audit_ver["total_records"] > 0
    results["12_Cryptographic_Audit_Chain"] = "PASS"
    print(f"[✓] 12. Cryptographic SHA-256 Audit Chain ({audit_ver['total_records']} verified blocks): PASS")

    # 13. Idempotent Seeding
    r = client.post("/api/seed/load-demo-data", headers=adm_headers)
    assert r.status_code == 200
    results["13_Idempotent_Demo_Seeder"] = "PASS"
    print("[✓] 13. Idempotent Demo Seeder: PASS")

    print("\n=================================================================")
    print("ALL 13 PHASE-1 CHECKLIST CRITERIA VERIFIED AND PASSED!")
    print("=================================================================")
    return results


if __name__ == "__main__":
    run_live_verification()
