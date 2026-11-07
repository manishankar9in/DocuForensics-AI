import uuid
from typing import List, Dict, Any, Optional
from pathlib import Path
from PIL import Image

from app.repositories.document_repo import document_repo
from app.repositories.investigation_repo import investigation_repo
from app.repositories.finding_repo import finding_repo
from app.repositories.audit_repo import audit_repo
from app.services.storage_service import storage_service
from app.services.pdf_service import pdf_service
from app.services.ocr_service import ocr_service
from app.services.classification_service import classification_service
from app.services.extraction_service import extraction_service
from app.services.visual_forensics_service import visual_forensics_service
from app.services.context_service import context_service
from app.services.correlation_service import correlation_service
from app.schemas.document_schema import PageDimension, OCRBlock

class DocumentService:
    async def process_document(self, doc_id: str):
        doc = await document_repo.get_by_id(doc_id)
        if not doc:
            return

        try:
            await document_repo.update(doc_id, {"processing_status": "processing"})
            inv_id = doc["investigation_id"]
            rel_path = doc["storage_path"]
            file_path = storage_service.get_absolute_path(rel_path)
            ext = doc["original_filename"].rsplit(".", 1)[-1].lower() if "." in doc["original_filename"] else ""

            full_text = ""
            blocks: List[OCRBlock] = []
            page_dimensions: List[PageDimension] = []
            ocr_summary: Dict[str, Any] = {"engine": "none", "avg_confidence": 100.0}
            meta_findings: List[Dict[str, Any]] = []

            if ext == "pdf":
                page_count, page_dimensions, metadata = pdf_service.get_document_info(file_path)
                full_text, blocks = pdf_service.extract_text_and_blocks(file_path)
                ocr_summary = {"engine": "pdf_vector", "avg_confidence": 100.0}

                # Check if scanned PDF (few or no vector text extracted)
                if len(full_text.strip()) < 30:
                    # Rasterize first page and run Tesseract OCR
                    png_bytes = pdf_service.render_page_to_png(file_path, page_number=1, dpi=150)
                    ocr_text, ocr_blocks, avg_conf = ocr_service.run_ocr_on_image_bytes(png_bytes, page_number=1)
                    if ocr_text:
                        full_text = ocr_text
                        blocks = ocr_blocks
                        ocr_summary = {"engine": "tesseract_scan", "avg_confidence": avg_conf}

                # Screen PDF metadata for editing anomalies
                meta_findings = visual_forensics_service.analyze_pdf_metadata(
                    doc_id, doc["original_filename"], metadata
                )

            elif ext in ["png", "jpg", "jpeg"]:
                with open(file_path, "rb") as f:
                    img_bytes = f.read()
                
                with Image.open(file_path) as img:
                    w, h = img.size
                    page_dimensions = [PageDimension(page=1, width_pts=float(w), height_pts=float(h))]
                    page_count = 1

                ocr_text, ocr_blocks, avg_conf = ocr_service.run_ocr_on_image_bytes(img_bytes, page_number=1)
                full_text = ocr_text
                blocks = ocr_blocks
                ocr_summary = {"engine": "tesseract_image", "avg_confidence": avg_conf}

            else:
                page_count = 1

            # 1. Classification
            classification = classification_service.classify_text(full_text)

            # 2. Field Extraction
            extracted_fields = extraction_service.extract_fields(full_text, blocks)

            # Update document in database
            update_payload = {
                "page_count": page_count,
                "page_dimensions": [p.model_dump() for p in page_dimensions],
                "classification": classification.model_dump(),
                "extracted_fields": {k: v.model_dump() for k, v in extracted_fields.items()},
                "ocr_summary": ocr_summary,
                "raw_ocr_blocks": [b.model_dump() for b in blocks[:100]],  # Store first 100 blocks
                "processing_status": "completed",
                "error_message": None
            }
            await document_repo.update(doc_id, update_payload)

            # Insert metadata findings
            for mf in meta_findings:
                mf["investigation_id"] = inv_id
                await finding_repo.create(mf)

            # 3. Within-document contextual checks
            updated_doc = await document_repo.get_by_id(doc_id)
            if updated_doc:
                ctx_findings = context_service.check_within_document(updated_doc)
                for cf in ctx_findings:
                    cf["investigation_id"] = inv_id
                    await finding_repo.create(cf)

            await audit_repo.log_event(
                investigation_id=inv_id,
                event_type="document_processed",
                details={"document_id": doc_id, "filename": doc["original_filename"], "page_count": page_count},
                document_id=doc_id
            )

        except Exception as e:
            await document_repo.update(doc_id, {
                "processing_status": "failed",
                "error_message": str(e)
            })
            await audit_repo.log_event(
                investigation_id=doc.get("investigation_id", ""),
                event_type="document_processing_failed",
                details={"document_id": doc_id, "error": str(e)},
                document_id=doc_id
            )

    async def analyze_investigation(self, inv_id: str):
        inv = await investigation_repo.get_by_id(inv_id)
        if not inv:
            return

        await investigation_repo.update(inv_id, {"status": "processing"})
        documents = await document_repo.get_by_investigation(inv_id)

        # Cross-document correlation
        comparisons, cross_findings = correlation_service.compare_documents(documents)

        # Store cross-document findings
        for f in cross_findings:
            f["investigation_id"] = inv_id
            await finding_repo.create(f)

        # Recalculate stats
        all_findings = await finding_repo.get_by_investigation(inv_id)
        crit_count = sum(1 for f in all_findings if f.get("severity") == "critical")
        warn_count = sum(1 for f in all_findings if f.get("severity") == "warning")
        unrev_count = sum(1 for f in all_findings if f.get("review_status") == "unreviewed")

        stats = {
            "total_documents": len(documents),
            "total_findings": len(all_findings),
            "unreviewed_findings": unrev_count,
            "critical_findings": crit_count,
            "warning_findings": warn_count
        }

        await investigation_repo.update(inv_id, {
            "status": "completed",
            "stats": stats
        })

        await audit_repo.log_event(
            investigation_id=inv_id,
            event_type="analysis_completed",
            details=stats
        )

document_service = DocumentService()

