from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any

class PageDimension(BaseModel):
    page: int
    width_pts: float
    height_pts: float

class ExtractedField(BaseModel):
    key: str
    raw_value: str
    normalized_value: Optional[Any] = None
    confidence: float = 1.0
    page: int = 1
    bbox: Optional[List[float]] = None  # [x0, y0, x1, y1] in normalized 0.0-1.0 coords
    source_type: str = "pdf_text"  # pdf_text, ocr

class OCRBlock(BaseModel):
    text: str
    confidence: float
    page: int
    bbox: List[float]  # [x0, y0, x1, y1] normalized coords

class ClassificationResult(BaseModel):
    predicted_type: str = "unknown"
    confidence: float = 0.5
    rule_basis: str = ""

class DocumentResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., alias="_id")
    investigation_id: str
    original_filename: str
    mime_type: str
    file_size: int
    sha256_hash: str
    page_count: int = 1
    page_dimensions: List[PageDimension] = []
    classification: ClassificationResult = ClassificationResult()
    extracted_fields: Dict[str, ExtractedField] = {}
    ocr_summary: Dict[str, Any] = {}
    processing_status: str = "queued"  # queued, processing, completed, failed
    error_message: Optional[str] = None
    created_at: str

class DocumentFieldsResponse(BaseModel):
    document_id: str
    fields: Dict[str, ExtractedField]
    raw_ocr_blocks: List[OCRBlock] = []
