import uuid
from datetime import datetime
from fastapi import APIRouter, Response, Request, Depends
from app.repositories.investigation_repo import investigation_repo
from app.repositories.document_repo import document_repo
from app.repositories.finding_repo import finding_repo
from app.repositories.audit_repo import audit_repo
from app.services.dossier_service import dossier_service
from app.services.correlation_service import correlation_service
from app.schemas.report_schema import ReportGenerationResponse
from app.routes.auth import require_authenticated_user, require_owned_investigation

router = APIRouter(
    tags=["Reports & Dossiers"],
    dependencies=[Depends(require_authenticated_user)],
)

@router.post("/investigations/{investigation_id}/report", response_model=ReportGenerationResponse)
async def generate_report_metadata(investigation_id: str, request: Request):
    inv = await require_owned_investigation(
        investigation_id, request.state.current_user["_id"]
    )

    report_id = f"rep_{uuid.uuid4().hex[:10]}"
    now_str = datetime.utcnow().isoformat() + "Z"

    await audit_repo.log_event(
        investigation_id=investigation_id,
        event_type="report_generated",
        details={"report_id": report_id}
    )

    return {
        "investigation_id": investigation_id,
        "report_id": report_id,
        "status": "ready",
        "generated_at": now_str,
        "download_url": f"/api/investigations/{investigation_id}/report/download"
    }

@router.get("/investigations/{investigation_id}/report/download")
async def download_dossier_pdf(investigation_id: str, request: Request):
    inv = await require_owned_investigation(
        investigation_id, request.state.current_user["_id"]
    )

    docs = await document_repo.get_by_investigation(investigation_id)
    findings = await finding_repo.get_by_investigation(investigation_id)
    comparisons, _ = correlation_service.compare_documents(docs)

    pdf_bytes = dossier_service.generate_pdf(
        investigation=inv,
        documents=docs,
        findings=findings,
        comparisons=comparisons
    )

    clean_title = "".join(c for c in inv.get("title", "investigation") if c.isalnum() or c in "-_")
    filename = f"Dossier_{clean_title}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
