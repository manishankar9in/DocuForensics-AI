"""Full E2E API test against live backend at http://127.0.0.1:8000"""
import httpx
import json
import sys
import time
from pathlib import Path

BASE = "http://127.0.0.1:8000"
SAMPLE_DIR = Path("d:/YELLUMGUDLA MANI SHANKAR/UNSTOP/backend/sample_data")

client = httpx.Client(base_url=BASE, timeout=60)

def check(label, cond, detail=""):
    if cond:
        print(f"  [PASS] {label}")
    else:
        print(f"  [FAIL] {label} {detail}")
        sys.exit(1)

print("\n=== DocuForensics AI - E2E API Test ===\n")

# 1. Health Check
print("[1] Health Check")
r = client.get("/api/health")
check("Status 200", r.status_code == 200)
hd = r.json()
check("Status healthy", hd["status"] == "healthy")
check("Database connected", hd["database"]["connected"])
print(f"     DB mode: {hd['database']['mode']}")

# 2. Create an isolated account
print("\n[2] Create Account")
account_email = f"e2e-{int(time.time())}@example.com"
r = client.post("/api/auth/signup", json={
    "email": account_email,
    "password": "automated-e2e-password-2026"
})
check("Sign-up 201", r.status_code == 201, f"got {r.status_code}: {r.text}")

# 3. Create Investigation
print("\n[3] Create Investigation")
r = client.post("/api/investigations", json={
    "title": "E2E Test Investigation",
    "case_ref": "E2E-2026-001",
    "description": "Automated end-to-end test of DocuForensics AI pipeline"
})
check("Status 201", r.status_code == 201, f"got {r.status_code}: {r.text}")
inv = r.json()
inv_id = inv["_id"]
check("Has _id", inv_id.startswith("inv_"))
check("Status draft/pending", inv["status"] in ("draft", "pending"))
print(f"     Investigation ID: {inv_id}")

# 3. Upload Documents (processing is triggered automatically in background)
print("\n[3] Upload Documents")
pdf1 = SAMPLE_DIR / "invoice_vendor_a.pdf"
pdf2 = SAMPLE_DIR / "invoice_modified_canva.pdf"
check("Sample PDF 1 exists", pdf1.exists(), str(pdf1))
check("Sample PDF 2 exists", pdf2.exists(), str(pdf2))

files = [
    ("files", ("invoice_vendor_a.pdf", open(pdf1, "rb"), "application/pdf")),
    ("files", ("invoice_modified_canva.pdf", open(pdf2, "rb"), "application/pdf")),
]
r = client.post(f"/api/investigations/{inv_id}/documents", files=files)
check("Upload 201", r.status_code == 201, f"got {r.status_code}: {r.text}")
docs_uploaded = r.json()
check("Got 2 docs", len(docs_uploaded) == 2)
doc_ids = [d["_id"] for d in docs_uploaded]
print(f"     Doc IDs: {doc_ids}")
print("     (Background processing triggered automatically on upload)")

# 4. Wait for document processing to complete (poll for up to 20 seconds)
print("\n[4] Wait for Document Processing")
max_wait = 20
for attempt in range(max_wait):
    time.sleep(1)
    r = client.get(f"/api/investigations/{inv_id}/documents")
    if r.status_code == 200:
        docs_status = r.json()
        statuses = [d["processing_status"] for d in docs_status]
        completed = sum(1 for s in statuses if s in ("completed", "failed"))
        print(f"     [{attempt+1}s] Statuses: {statuses}")
        if completed == len(docs_status):
            print("     Processing complete!")
            break
    if attempt == max_wait - 1:
        print("     Warning: processing did not complete in time, proceeding anyway")

check("Docs list 200", r.status_code == 200)
docs_final = r.json()
for d in docs_final:
    print(f"     {d['original_filename']}: {d['processing_status']}")

# 5. Run Investigation Analysis
print("\n[5] Run Cross-Document Analysis")
r = client.post(f"/api/investigations/{inv_id}/analyze")
check("Analyze 200/202", r.status_code in (200, 202), f"got {r.status_code}: {r.text}")
print("     Analysis triggered (runs in background)")
time.sleep(3)  # Give analysis a moment to run

# 6. Check Findings
print("\n[6] Check Findings")
r = client.get(f"/api/investigations/{inv_id}/findings")
check("Findings 200", r.status_code == 200, f"got {r.status_code}: {r.text}")
findings = r.json()
print(f"     Found {len(findings)} findings")
for f in findings[:5]:
    print(f"     - [{f.get('category','?')}] {f.get('title','?')[:60]}")

# 7. Check Comparison
print("\n[7] Cross-Document Comparison")
r = client.get(f"/api/investigations/{inv_id}/comparison")
check("Comparison 200", r.status_code == 200, f"got {r.status_code}: {r.text}")
comp = r.json()
comps = comp.get("comparisons", [])
print(f"     {len(comps)} field comparisons found")

# 8. Document Preview (renders PDF page to PNG)
print("\n[8] Document Preview")
first_doc_id = doc_ids[0]
r = client.get(f"/api/documents/{first_doc_id}/preview?page=1&dpi=72")
check("Preview 200", r.status_code == 200, f"got {r.status_code}: {r.text[:100]}")
check("Returns PNG", r.headers.get("content-type", "").startswith("image/"), 
      f"content-type: {r.headers.get('content-type')}")
print(f"     Preview size: {len(r.content):,} bytes")

# 9. Document Fields
print("\n[9] Document Fields API")
r = client.get(f"/api/documents/{first_doc_id}/fields")
check("Fields 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")
fields_data = r.json()
fields = fields_data.get("fields", {})
print(f"     Extracted fields: {list(fields.keys())[:8]}")

# 10. List Investigations History
print("\n[10] Investigation History")
r = client.get("/api/investigations")
check("List 200", r.status_code == 200)
invs_resp = r.json()
total = invs_resp.get("total", len(invs_resp.get("items", [])))
print(f"     Total investigations: {total}")

# 11. Human Review - Mark Finding
if findings:
    print("\n[11] Human Review - Mark Finding as Confirmed")
    fid = findings[0]["_id"]
    r = client.patch(f"/api/findings/{fid}/review", json={
        "review_status": "confirmed",
        "reviewer_notes": "Confirmed by E2E automated test"
    })
    check("Review 200", r.status_code == 200, f"got {r.status_code}: {r.text}")
    reviewed = r.json()
    check("Status confirmed", reviewed["review_status"] == "confirmed")
    print(f"     Finding {fid} marked confirmed")
else:
    print("\n[11] Human Review - SKIPPED (no findings yet)")

# 12. Download Dossier PDF
print("\n[12] Download Investigation Dossier PDF")
r = client.get(f"/api/investigations/{inv_id}/report/download")
check("Report 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")
check("Is valid PDF", r.content[:4] == b"%PDF", f"starts with: {r.content[:8]}")
print(f"     PDF dossier size: {len(r.content):,} bytes")

# Save dossier for verification
out_path = Path("d:/YELLUMGUDLA MANI SHANKAR/UNSTOP/backend/test_output_dossier.pdf")
out_path.write_bytes(r.content)
print(f"     Saved to: {out_path}")

print("\n=== ALL TESTS PASSED ===\n")
