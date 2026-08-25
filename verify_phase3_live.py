import requests
import json

BASE_URL = "http://localhost:8000/api"

print("=" * 75)
print("PHASE 3 COMPLETE SYSTEM VERIFICATION SUITE")
print("=" * 75)

# Step 1: Authentication
print("\n[1/8] Authenticating Users...")
resp_inv = requests.post(f"{BASE_URL}/auth/login", json={"username": "investigator1", "password": "Investigator@123"})
assert resp_inv.status_code == 200, f"Investigator login failed: {resp_inv.text}"
inv_token = resp_inv.json()["access_token"]
inv_headers = {"Authorization": f"Bearer {inv_token}"}
print("  ✓ Investigator authenticated successfully")

resp_sup = requests.post(f"{BASE_URL}/auth/login", json={"username": "supervisor1", "password": "Supervisor@123"})
assert resp_sup.status_code == 200, f"Supervisor login failed: {resp_sup.text}"
sup_token = resp_sup.json()["access_token"]
sup_headers = {"Authorization": f"Bearer {sup_token}"}
print("  ✓ Supervisor authenticated successfully")

# Step 2: Document Ingestion & Extraction (Phase 2)
print("\n[2/8] Testing Document Ingestion & NLP Extraction...")
sample_fir_text = (
    "FIRST INFORMATION REPORT (SYNTHETIC RECORD)\n"
    "Police Station: Cyber Crime Cell, New Delhi\n"
    "FIR No.: 1042/2026 | Date: 2026-08-23\n"
    "Complainant states Vikram Singh called from mobile +91-98765-43210 directing unauthorized wire "
    "transfers to bank account A/C 987654321098 at State Bank of India.\n"
    "Suspect vehicle DL-01-AB-1234 was observed near Sector 18 Noida.\n"
    "Associate Priya Verma was contacted at mobile +91-91234-56789."
)
files = {"file": ("FIR_1042_2026.txt", sample_fir_text.encode("utf-8"), "text/plain")}
data = {"source_type": "fir", "title": "FIR No. 1042/2026 - Cyber Fraud Network"}

upload_resp = requests.post(f"{BASE_URL}/ingestion/upload", files=files, data=data, headers=inv_headers)
assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
upload_data = upload_resp.json()
print(f"  ✓ Document ingested: {upload_data['record_code']} ({upload_data['entities_extracted_count']} entities staged)")

# Step 3: Human-in-the-Loop Approval (Phase 2)
print("\n[3/8] Testing Human-in-the-Loop Extraction Review...")
rec_id = upload_data["record_id"]
ext_resp = requests.get(f"{BASE_URL}/entities/extracted?record_id={rec_id}", headers=inv_headers)
assert ext_resp.status_code == 200
extractions = ext_resp.json()
assert len(extractions) > 0
first_eid = extractions[0]["id"]
app_resp = requests.post(f"{BASE_URL}/entities/{first_eid}/approve", headers=inv_headers)
assert app_resp.status_code == 200
print(f"  ✓ Extracted entity approved & synchronized to graph: '{app_resp.json()['normalized_value']}'")

# Step 4: Rule-Based Pattern Alerts Engine (Phase 3)
print("\n[4/8] Testing Rule-Based Pattern Alerts Engine...")
scan_resp = requests.post(f"{BASE_URL}/alerts/scan", headers=inv_headers)
assert scan_resp.status_code == 200
scan_data = scan_resp.json()
print(f"  ✓ Alert pattern scan completed: {scan_data['message']}")
print(f"  ✓ Active alerts in system: {scan_data['total_active_alerts']}")

alerts_resp = requests.get(f"{BASE_URL}/alerts", headers=inv_headers)
assert alerts_resp.status_code == 200
alerts = alerts_resp.json()
assert len(alerts) > 0, "Expected at least 1 rule-based alert to trigger"
print(f"  ✓ Retrieved {len(alerts)} advisory pattern alerts:")
for a in alerts[:3]:
    print(f"    - [{a['severity']}] {a['rule_name']}: {a['title']}")

# Step 5: Alert Review Workflow (Phase 3)
print("\n[5/8] Testing Alert Acknowledge Workflow...")
target_alert_id = alerts[0]["id"]
ack_resp = requests.post(
    f"{BASE_URL}/alerts/{target_alert_id}/acknowledge",
    json={"notes": "Investigator evaluated and confirmed pattern for deeper inquiry"},
    headers=inv_headers
)
assert ack_resp.status_code == 200
ack_data = ack_resp.json()
assert ack_data["status"] == "acknowledged"
print(f"  ✓ Alert acknowledged: '{ack_data['title']}' (Status: {ack_data['status']})")

# Step 6: Executive Case Brief JSON Generation (Phase 3)
print("\n[6/8] Testing Executive Case Brief Generation...")
dash_resp = requests.get(f"{BASE_URL}/dashboard/summary", headers=inv_headers)
assert dash_resp.status_code == 200
cases = dash_resp.json()["recent_cases"]
assert len(cases) > 0
case_id = cases[0]["id"]
case_code = cases[0]["case_code"]

brief_resp = requests.get(f"{BASE_URL}/reports/brief/{case_id}", headers=inv_headers)
assert brief_resp.status_code == 200
brief_data = brief_resp.json()
print(f"  ✓ Brief generated for Case {brief_data['case_code']}: '{brief_data['case_title']}'")
print(f"    - Discovered Key Entities: {len(brief_data['key_entities'])}")
print(f"    - Evidentiary Relationships: {len(brief_data['key_relationships'])}")
print(f"    - Active Pattern Alerts: {len(brief_data['active_alerts'])}")
print(f"    - Cryptographic Custody Seal (SHA-256): {brief_data['custody_hash']}")

# Step 7: Executive Case Brief PDF Export (Phase 3)
print("\n[7/8] Testing Standardized PDF Brief Export...")
pdf_resp = requests.get(f"{BASE_URL}/reports/brief/{case_id}/pdf", headers=inv_headers)
assert pdf_resp.status_code == 200
assert pdf_resp.headers["content-type"] == "application/pdf"
assert len(pdf_resp.content) > 1000, "PDF payload too small"
assert pdf_resp.content[:4] == b"%PDF", "Invalid PDF magic bytes"
print(f"  ✓ Standardized PDF Brief exported successfully ({len(pdf_resp.content) / 1024:.1f} KB)")

# Step 8: Cryptographic Audit Chain Verification
print("\n[8/8] Verifying Cryptographic SHA-256 Audit Ledger Chain...")
audit_resp = requests.get(f"{BASE_URL}/audit/verify-chain", headers=sup_headers)
assert audit_resp.status_code == 200
audit_res = audit_resp.json()
assert audit_res["valid"] is True
print(f"  ✓ Audit chain VERIFIED INTACT: {audit_res['total_records']} hash-chained events, 0 tampering detected")

print("\n" + "=" * 75)
print(">>> ALL 8 PHASE 3 CHECKPOINTS PASSED LIVE WITH 100% SUCCESS <<<")
print("=" * 75)
