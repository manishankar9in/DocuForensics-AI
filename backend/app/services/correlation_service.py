import uuid
from typing import List, Dict, Any, Tuple
from app.schemas.finding_schema import ComparisonEntry, EvidenceReference

class CorrelationService:
    def compare_documents(self, documents: List[Dict[str, Any]]) -> Tuple[List[ComparisonEntry], List[Dict[str, Any]]]:
        """
        Cross-correlates extracted fields across all documents in an investigation.
        Returns: (matrix_comparisons, cross_document_findings)
        """
        comparisons: List[ComparisonEntry] = []
        findings: List[Dict[str, Any]] = []

        if len(documents) < 2:
            return comparisons, findings

        # Check key semantic fields
        field_keys = [
            ("document_number", "Document / Reference #"),
            ("date", "Issue / Transaction Date"),
            ("total_amount", "Total Amount"),
            ("vendor_name", "Vendor / Biller Entity"),
            ("client_name", "Client / Payee Entity"),
        ]

        for key, label in field_keys:
            values_by_doc: Dict[str, Any] = {}
            normalized_by_doc: Dict[str, Any] = {}
            evidence_refs: List[EvidenceReference] = []

            for doc in documents:
                doc_id = doc["_id"]
                fname = doc["original_filename"]
                fields = doc.get("extracted_fields", {})
                field_obj = fields.get(key)

                if field_obj:
                    raw = field_obj.get("raw_value")
                    norm = field_obj.get("normalized_value")
                    values_by_doc[doc_id] = raw
                    normalized_by_doc[doc_id] = norm
                    evidence_refs.append(EvidenceReference(
                        document_id=doc_id,
                        filename=fname,
                        page=field_obj.get("page", 1),
                        field_name=key,
                        value_observed=str(raw),
                        bbox=field_obj.get("bbox")
                    ))
                else:
                    values_by_doc[doc_id] = None
                    normalized_by_doc[doc_id] = None

            # Determine match status if at least two documents have the field
            present_norms = [v for v in normalized_by_doc.values() if v is not None]
            is_match = True
            discrepancy_note = None

            if len(present_norms) >= 2:
                first_val = present_norms[0]
                for other_val in present_norms[1:]:
                    if str(first_val).strip() != str(other_val).strip():
                        is_match = False
                        break

                if not is_match:
                    discrepancy_note = f"Discrepancy detected across {len(present_norms)} documents for '{label}'."
                    
                    # Generate an actionable finding
                    source_doc_ids = [ref.document_id for ref in evidence_refs]
                    explanation_lines = []
                    for ref in evidence_refs:
                        explanation_lines.append(f"• In '{ref.filename}' (page {ref.page}): observed '{ref.value_observed}'")

                    severity = "critical" if key == "total_amount" else "warning"
                    
                    findings.append({
                        "_id": f"fnd_crx_{uuid.uuid4().hex[:10]}",
                        "category": "contextual",
                        "finding_type": f"cross_doc_{key}_mismatch",
                        "severity": severity,
                        "title": f"Cross-document mismatch in {label}",
                        "explanation": (
                            f"Discrepancy found between related documents for field '{label}':\n" +
                            "\n".join(explanation_lines) +
                            "\nReview is required to reconcile this inconsistency."
                        ),
                        "source_documents": source_doc_ids,
                        "evidence": [ref.model_dump() for ref in evidence_refs],
                        "detection_method": "cross_document_semantic_correlation",
                        "confidence_score": 1.0,
                        "review_status": "unreviewed",
                        "reviewer_notes": None
                    })

            comparisons.append(ComparisonEntry(
                field_name=key,
                field_label=label,
                values_by_doc=values_by_doc,
                normalized_values=normalized_by_doc,
                is_match=is_match,
                discrepancy_explanation=discrepancy_note,
                evidence_refs=evidence_refs
            ))

        return comparisons, findings

correlation_service = CorrelationService()

