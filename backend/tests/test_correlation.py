import pytest
from app.services.correlation_service import correlation_service

def test_cross_document_amount_mismatch():
    doc1 = {
        "_id": "doc_1",
        "original_filename": "invoice.pdf",
        "extracted_fields": {
            "total_amount": {"raw_value": "$14,500.00", "normalized_value": 14500.0, "page": 1, "bbox": [0.1, 0.1, 0.2, 0.2]}
        }
    }
    doc2 = {
        "_id": "doc_2",
        "original_filename": "receipt.png",
        "extracted_fields": {
            "total_amount": {"raw_value": "$11,500.00", "normalized_value": 11500.0, "page": 1, "bbox": [0.3, 0.3, 0.4, 0.4]}
        }
    }

    comparisons, findings = correlation_service.compare_documents([doc1, doc2])
    assert len(comparisons) > 0
    
    amount_comp = next((c for c in comparisons if c.field_name == "total_amount"), None)
    assert amount_comp is not None
    assert amount_comp.is_match is False
    assert len(findings) == 1
    assert findings[0]["severity"] == "critical"
    assert "cross_doc_total_amount_mismatch" in findings[0]["finding_type"]

def test_cross_document_matching():
    doc1 = {
        "_id": "doc_1",
        "original_filename": "invoice.pdf",
        "extracted_fields": {
            "document_number": {"raw_value": "INV-100", "normalized_value": "INV-100", "page": 1, "bbox": [0.1, 0.1, 0.2, 0.2]}
        }
    }
    doc2 = {
        "_id": "doc_2",
        "original_filename": "statement.pdf",
        "extracted_fields": {
            "document_number": {"raw_value": " INV - 100 ", "normalized_value": "INV-100", "page": 1, "bbox": [0.2, 0.2, 0.3, 0.3]}
        }
    }

    comparisons, findings = correlation_service.compare_documents([doc1, doc2])
    num_comp = next((c for c in comparisons if c.field_name == "document_number"), None)
    assert num_comp is not None
    assert num_comp.is_match is True
    assert len(findings) == 0

