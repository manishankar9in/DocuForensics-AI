from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ReportGenerationResponse(BaseModel):
    investigation_id: str
    report_id: str
    status: str
    generated_at: str
    download_url: str

