import pytest
from httpx import AsyncClient, ASGITransport
from pathlib import Path
from app.main import app
from app.services.document_service import document_service

@pytest.mark.asyncio
async def test_full_investigation_lifecycle(isolated_local_store):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res_health = await client.get("/api/health")
        assert res_health.status_code == 200
        health_data = res_health.json()
        assert health_data["status"] == "healthy"

        # 2. Create an isolated account before creating its private investigation
        res_signup = await client.post("/api/auth/signup", json={
            "email": "pipeline@example.com",
            "password": "pipeline-test-password-2026"
        })
        assert res_signup.status_code == 201

        # 3. Create Investigation
        res_create = await client.post("/api/investigations", json={
            "title": "Vendor Transit Audit Case #8891",
            "case_ref": "CASE-2026-8891",
            "description": "Verifying stated invoice charges against bank deposit receipts"
        })
        assert res_create.status_code == 201
        inv_data = res_create.json()
        inv_id = inv_data["_id"]
        assert inv_id.startswith("inv_")

        # 4. Upload Sample Documents
        pdf_path1 = Path("sample_data/invoice_vendor_a.pdf")
        pdf_path2 = Path("sample_data/invoice_modified_canva.pdf")
        assert pdf_path1.exists()
        assert pdf_path2.exists()

        files = [
            ("files", (pdf_path1.name, open(pdf_path1, "rb"), "application/pdf")),
            ("files", (pdf_path2.name, open(pdf_path2, "rb"), "application/pdf"))
        ]

        res_upload = await client.post(f"/api/investigations/{inv_id}/documents", files=files)
        assert res_upload.status_code == 201
        docs = res_upload.json()
        assert len(docs) == 2

        # 4. Process documents synchronously for test verification
        for doc in docs:
            await document_service.process_document(doc["_id"])

        # Verify documents completed processing
        res_docs = await client.get(f"/api/investigations/{inv_id}/documents")
        assert res_docs.status_code == 200
        processed_docs = res_docs.json()
        assert all(d["processing_status"] == "completed" for d in processed_docs)

        # 5. Run Investigation Analysis
        await document_service.analyze_investigation(inv_id)

        # 6. Check Findings
        res_findings = await client.get(f"/api/investigations/{inv_id}/findings")
        assert res_findings.status_code == 200
        findings = res_findings.json()
        assert len(findings) >= 1

        # 7. Check Cross-Document Comparison
        res_comp = await client.get(f"/api/investigations/{inv_id}/comparison")
        assert res_comp.status_code == 200
        comp_data = res_comp.json()
        assert len(comp_data["comparisons"]) > 0

        # Verify Document preview endpoint returns valid image/png
        first_doc_id = processed_docs[0]["_id"]
        res_preview = await client.get(f"/api/documents/{first_doc_id}/preview?page=1&dpi=72")
        assert res_preview.status_code == 200
        assert res_preview.headers["content-type"] == "image/png"
        assert res_preview.content.startswith(b"\x89PNG")

        # 8. Human Review Attestation
        first_finding = findings[0]
        finding_id = first_finding["_id"]
        res_review = await client.patch(f"/api/findings/{finding_id}/review", json={
            "review_status": "confirmed",
            "reviewer_notes": "Confirmed financial variance between billing invoice and posted bank deposit."
        })
        assert res_review.status_code == 200
        updated_finding = res_review.json()
        assert updated_finding["review_status"] == "confirmed"

        # 9. Generate & Download Official Dossier PDF
        res_report = await client.get(f"/api/investigations/{inv_id}/report/download")
        assert res_report.status_code == 200
        assert res_report.headers["content-type"] == "application/pdf"
        assert res_report.content.startswith(b"%PDF") # Valid PDF signature!
