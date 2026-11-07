from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class InvestigationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    case_ref: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)

class InvestigationStats(BaseModel):
    total_documents: int = 0
    total_findings: int = 0
    unreviewed_findings: int = 0
    critical_findings: int = 0
    warning_findings: int = 0

class InvestigationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., alias="_id")
    title: str
    case_ref: Optional[str] = None
    description: Optional[str] = None
    status: str = "draft"  # draft, processing, completed, failed
    document_ids: List[str] = []
    stats: InvestigationStats = InvestigationStats()
    created_at: str
    updated_at: str

class InvestigationListResponse(BaseModel):
    items: List[InvestigationResponse]
    total: int
    skip: int
    limit: int
