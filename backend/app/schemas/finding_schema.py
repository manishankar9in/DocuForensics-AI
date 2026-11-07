from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any

class EvidenceReference(BaseModel):
    document_id: str
    filename: str
    page: int
    field_name: str
    value_observed: str
    bbox: Optional[List[float]] = None  # [x0, y0, x1, y1] normalized coords

class FindingReviewUpdate(BaseModel):
    review_status: str = Field(..., pattern="^(unreviewed|reviewed|confirmed|dismissed)$")
    reviewer_notes: Optional[str] = None

class FindingResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., alias="_id")
    investigation_id: str
    category: str  # contextual, visual, extraction_uncertainty
    finding_type: str
    severity: str  # critical, warning, info
    title: str
    explanation: str
    source_documents: List[str]
    evidence: List[EvidenceReference]
    detection_method: str
    confidence_score: float
    review_status: str = "unreviewed"  # unreviewed, confirmed, dismissed
    reviewer_notes: Optional[str] = None
    created_at: Optional[str] = None

class ComparisonEntry(BaseModel):
    field_name: str
    field_label: str
    values_by_doc: Dict[str, Optional[str]]
    normalized_values: Dict[str, Optional[Any]]
    is_match: bool
    discrepancy_explanation: Optional[str] = None
    evidence_refs: List[EvidenceReference] = []

class CrossDocumentComparisonResponse(BaseModel):
    investigation_id: str
    document_ids: List[str]
    document_names: Dict[str, str]
    comparisons: List[ComparisonEntry]
