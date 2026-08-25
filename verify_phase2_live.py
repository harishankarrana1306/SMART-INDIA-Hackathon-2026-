import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

print("=" * 70)
print("PHASE 2 LIVE SYSTEM VERIFICATION SUITE")
print("=" * 70)

# Step 1: Login
print("\n[1/7] Authenticating Users...")
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

# Step 2: Ingest Document
print("\n[2/7] Testing Document Ingestion & NLP Extraction Pipeline...")
sample_fir_text = (
    "FIRST INFORMATION REPORT (SYNTHETIC RECORD)\n"
    "Police Station: Cyber Crime Cell, New Delhi\n"
    "FIR No.: 999/2026 | Date: 2026-08-22\n"
    "Complainant states Vikramaditya Singh called from mobile +91-98765-43210 instructing unauthorized "
    "transfers to bank account A/C 987654321098.\n"
    "Suspect vehicle DL-01-AB-1234 was spotted near Sector 18 Noida.\n"
    "Associate Priya Verma was contacted at +91 91234 56789."
)

files = {"file": ("FIR_999_2026.txt", sample_fir_text.encode("utf-8"), "text/plain")}
data = {"source_type": "fir", "title": "FIR No. 999/2026 - Cyber Cell New Delhi"}

upload_resp = requests.post(f"{BASE_URL}/ingestion/upload", files=files, data=data, headers=inv_headers)
assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
upload_data = upload_resp.json()
print(f"  ✓ Document ingested: {upload_data['record_code']} (Job ID: {upload_data['job_id']})")
print(f"  ✓ Extracted entities count: {upload_data['entities_extracted_count']}")
rec_id = upload_data["record_id"]

# Step 3: Verify Staged Extractions
print("\n[3/7] Verifying Staged NLP Extractions with Explainability Offsets...")
ext_resp = requests.get(f"{BASE_URL}/entities/extracted?record_id={rec_id}", headers=inv_headers)
assert ext_resp.status_code == 200
extractions = ext_resp.json()
print(f"  ✓ Retrieved {len(extractions)} staged extractions:")
for ent in extractions:
    print(f"    - [{ent['entity_type']}] '{ent['normalized_value']}' (Conf: {ent['confidence']:.2f}) -> \"{ent.get('context_snippet', '')[:40]}...\"")

# Step 4: Human-in-the-Loop Review (Approve & Correct)
print("\n[4/7] Testing Human-in-the-Loop Approval & Graph Sync...")
assert len(extractions) >= 2, "Expected at least 2 extractions"
first_eid = extractions[0]["id"]
app_resp = requests.post(f"{BASE_URL}/entities/{first_eid}/approve", headers=inv_headers)
assert app_resp.status_code == 200, f"Approve failed: {app_resp.text}"
app_data = app_resp.json()
assert app_data["status"] == "approved"
assert app_data["synced_to_graph"] is True
print(f"  ✓ Entity '{app_data['normalized_value']}' approved & synced to Neo4j graph")

second_eid = extractions[1]["id"]
corr_resp = requests.post(
    f"{BASE_URL}/entities/{second_eid}/correct",
    json={"normalized_value": "DL-01-AB-1234", "entity_type": "Vehicle", "reason": "Corrected plate formatting"},
    headers=inv_headers
)
assert corr_resp.status_code == 200
corr_data = corr_resp.json()
assert corr_data["status"] == "approved"
print(f"  ✓ Entity corrected & approved: '{corr_data['normalized_value']}' ({corr_data['entity_type']})")

# Step 5: Entity Resolution Workbench
print("\n[5/7] Testing Entity Resolution & Deduplication Workbench...")
gen_resp = requests.post(f"{BASE_URL}/resolution/generate", headers=sup_headers)
assert gen_resp.status_code == 200
print(f"  ✓ Resolution scan executed: {gen_resp.json()['message']}")

cand_resp = requests.get(f"{BASE_URL}/resolution/candidates", headers=sup_headers)
assert cand_resp.status_code == 200
candidates = cand_resp.json()
print(f"  ✓ Found {len(candidates)} match proposals in registry")
if candidates:
    first_cand = candidates[0]
    print(f"    - Candidate: '{first_cand['entity_a']['display_name']}' <-> '{first_cand['entity_b']['display_name']}' (Confidence: {first_cand['match_confidence']:.2f})")
    print(f"      Reason: {first_cand['match_reason']}")
    # Approve merge as supervisor
    merge_resp = requests.post(f"{BASE_URL}/resolution/{first_cand['id']}/approve", headers=sup_headers)
    assert merge_resp.status_code == 200
    print(f"  ✓ Supervisor approved merge: {merge_resp.json()['message']}")

# Step 6: Timeline Chronology
print("\n[6/7] Testing Timeline Chronology Reconstruction...")
tl_resp = requests.get(f"{BASE_URL}/timeline", headers=inv_headers)
assert tl_resp.status_code == 200
tl_data = tl_resp.json()
print(f"  ✓ Reconstructed timeline with {tl_data['total_events']} events across CDR, Banking, Surveillance & FIRs")
for evt in tl_data["events"][:3]:
    print(f"    - [{evt['timestamp']}] ({evt['event_type']}) {evt['title']} [Source: {evt['source_record_code']}]")

# Step 7: Tamper-Evident Audit Chain Verification
print("\n[7/7] Verifying Cryptographic Audit Log Chain Integrity...")
audit_resp = requests.get(f"{BASE_URL}/audit/verify-chain", headers=sup_headers)
assert audit_resp.status_code == 200
audit_res = audit_resp.json()
assert audit_res["valid"] is True
print(f"  ✓ Audit chain VERIFIED INTACT: {audit_res['total_records']} hash-chained events, 0 tampering detected")

print("\n" + "=" * 70)
print(">>> ALL 7 PHASE 2 CHECKPOINTS PASSED LIVE WITH 100% SUCCESS <<<")
print("=" * 70)
