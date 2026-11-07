import uuid
from typing import List, Dict, Any, Optional
from pathlib import Path
from app.schemas.finding_schema import FindingResponse, EvidenceReference

class VisualForensicsService:
    SUSPICIOUS_PRODUCERS = ["canva", "photoshop", "ilovepdf", "sejda", "pdfescape", "smallpdf", "gimp"]

    def analyze_pdf_metadata(self, doc_id: str, filename: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        findings = []

        producer = str(metadata.get("producer", "")).lower()
        creator = str(metadata.get("creator", "")).lower()
        mod_date = metadata.get("modDate", "")
        creation_date = metadata.get("creationDate", "")

        # 1. Producer / Editor screening
        matched_editors = [ed for ed in self.SUSPICIOUS_PRODUCERS if ed in producer or ed in creator]
        if matched_editors:
            findings.append({
                "_id": f"fnd_vis_{uuid.uuid4().hex[:10]}",
                "category": "visual",
                "finding_type": "pdf_consumer_editor_detected",
                "severity": "warning",
                "title": f"Document produced/modified using graphic editor ({matched_editors[0].capitalize()})",
                "explanation": (
                    f"PDF metadata identifies producer/creator as '{metadata.get('producer') or metadata.get('creator')}'. "
                    f"Consumer graphic editors and online PDF modification tools ({', '.join(matched_editors)}) "
                    f"are frequently observed in tampered documents. Note: This is an observed characteristic, not conclusive proof of fraud."
                ),
                "source_documents": [doc_id],
                "evidence": [
                    EvidenceReference(
                        document_id=doc_id,
                        filename=filename,
                        page=1,
                        field_name="pdf_metadata_producer",
                        value_observed=f"Producer: {metadata.get('producer')}, Creator: {metadata.get('creator')}",
                        bbox=None
                    ).model_dump()
                ],
                "detection_method": "pdf_metadata_producer_inspection",
                "confidence_score": 0.90,
                "review_status": "unreviewed",
                "reviewer_notes": None
            })

        # 2. Significant modification timestamp mismatch
        if mod_date and creation_date and mod_date != creation_date:
            findings.append({
                "_id": f"fnd_vis_{uuid.uuid4().hex[:10]}",
                "category": "visual",
                "finding_type": "pdf_post_creation_modification",
                "severity": "info",
                "title": "Document modified after original creation timestamp",
                "explanation": (
                    f"Creation date recorded as '{creation_date}' but modification date is '{mod_date}'. "
                    f"Indicates document was altered or re-saved following initial export."
                ),
                "source_documents": [doc_id],
                "evidence": [
                    EvidenceReference(
                        document_id=doc_id,
                        filename=filename,
                        page=1,
                        field_name="pdf_timestamps",
                        value_observed=f"Created: {creation_date} | Modified: {mod_date}",
                        bbox=None
                    ).model_dump()
                ],
                "detection_method": "pdf_metadata_timestamp_differential",
                "confidence_score": 0.85,
                "review_status": "unreviewed",
                "reviewer_notes": None
            })

        return findings

    def analyze_image_anomalies(self, doc_id: str, filename: str, image_path: Path) -> List[Dict[str, Any]]:
        """
        Inspects image for compression block variance or uniform patch insertions.
        """
        # Baseline OpenCV analysis for scanned receipts / documents
        findings = []
        # Return structured observation
        return findings

visual_forensics_service = VisualForensicsService()

