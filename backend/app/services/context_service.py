import uuid
from typing import List, Dict, Any
from datetime import datetime
from app.schemas.finding_schema import EvidenceReference
from app.schemas.document_schema import ExtractedField

class ContextService:
    def check_within_document(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        findings = []
        doc_id = doc["_id"]
        filename = doc["original_filename"]
        fields: Dict[str, Any] = doc.get("extracted_fields", {})
        doc_type = doc.get("classification", {}).get("predicted_type", "general_document")

        # 1. OCR Extraction Uncertainty Flag
        ocr_summary = doc.get("ocr_summary", {})
        avg_conf = ocr_summary.get("avg_confidence", 100.0)
        if avg_conf < 75.0:
            findings.append({
                "_id": f"fnd_unc_{uuid.uuid4().hex[:10]}",
                "category": "extraction_uncertainty",
                "finding_type": "low_ocr_confidence",
                "severity": "warning",
                "title": f"Low OCR extraction confidence ({avg_conf:.1f}%)",
                "explanation": (
                    f"Average text recognition confidence for '{filename}' is {avg_conf:.1f}%, indicating scan degradation, "
                    f"blur, or complex font rendering. Information extracted from this document requires manual human verification."
                ),
                "source_documents": [doc_id],
                "evidence": [
                    EvidenceReference(
                        document_id=doc_id,
                        filename=filename,
                        page=1,
                        field_name="document_scan_quality",
                        value_observed=f"OCR Confidence: {avg_conf:.1f}%",
                        bbox=None
                    ).model_dump()
                ],
                "detection_method": "ocr_confidence_threshold_screening",
                "confidence_score": round((100.0 - avg_conf) / 100.0, 2),
                "review_status": "unreviewed",
                "reviewer_notes": None
            })

        # 2. Missing Mandatory Fields for Invoices
        if doc_type == "invoice":
            if "total_amount" not in fields:
                findings.append({
                    "_id": f"fnd_ctx_{uuid.uuid4().hex[:10]}",
                    "category": "contextual",
                    "finding_type": "missing_required_field",
                    "severity": "warning",
                    "title": "Mandatory field 'total_amount' not identified",
                    "explanation": f"Document classified as an invoice with high confidence, but no clear total billing amount was identified.",
                    "source_documents": [doc_id],
                    "evidence": [],
                    "detection_method": "document_schema_validation",
                    "confidence_score": 0.85,
                    "review_status": "unreviewed",
                    "reviewer_notes": None
                })

        # 3. Future Date Check
        date_field = fields.get("date")
        if date_field and date_field.get("normalized_value"):
            try:
                doc_dt = datetime.strptime(date_field["normalized_value"], "%Y-%m-%d")
                now_dt = datetime.utcnow()
                if doc_dt > now_dt and (doc_dt - now_dt).days > 7:
                    findings.append({
                        "_id": f"fnd_ctx_{uuid.uuid4().hex[:10]}",
                        "category": "contextual",
                        "finding_type": "future_dated_document",
                        "severity": "warning",
                        "title": f"Document date '{date_field['normalized_value']}' is in the future",
                        "explanation": (
                            f"The extracted issue date '{date_field['raw_value']}' (normalized: {date_field['normalized_value']}) "
                            f"is situated in the future relative to system inspection time."
                        ),
                        "source_documents": [doc_id],
                        "evidence": [
                            EvidenceReference(
                                document_id=doc_id,
                                filename=filename,
                                page=date_field.get("page", 1),
                                field_name="date",
                                value_observed=date_field.get("raw_value", ""),
                                bbox=date_field.get("bbox")
                            ).model_dump()
                        ],
                        "detection_method": "chronological_sanity_check",
                        "confidence_score": 0.95,
                        "review_status": "unreviewed",
                        "reviewer_notes": None
                    })
            except Exception:
                pass

        return findings

context_service = ContextService()

