from typing import List, Optional
from fastapi import APIRouter, Query, Request, Depends
from app.schemas.finding_schema import (
    FindingResponse, FindingReviewUpdate, CrossDocumentComparisonResponse
)
from app.repositories.finding_repo import finding_repo
from app.repositories.document_repo import document_repo
from app.repositories.investigation_repo import investigation_repo
from app.repositories.audit_repo import audit_repo
from app.services.correlation_service import correlation_service
from app.routes.auth import (
    require_authenticated_user,
    require_owned_finding,
    require_owned_investigation,
)

router = APIRouter(
    tags=["Findings & Comparison"],
    dependencies=[Depends(require_authenticated_user)],
)

@router.get("/investigations/{investigation_id}/findings", response_model=List[FindingResponse])
async def list_findings(
    investigation_id: str,
    request: Request,
    severity: Optional[str] = Query(None, pattern="^(critical|warning|info)$"),
    category: Optional[str] = Query(None, pattern="^(contextual|visual|extraction_uncertainty)$"),
    review_status: Optional[str] = Query(None, pattern="^(unreviewed|reviewed|confirmed|dismissed)$")
):
    await require_owned_investigation(investigation_id, request.state.current_user["_id"])
    return await finding_repo.get_by_investigation(
        investigation_id, severity=severity, category=category, review_status=review_status
    )

@router.get("/investigations/{investigation_id}/comparison", response_model=CrossDocumentComparisonResponse)
async def get_cross_document_comparison(investigation_id: str, request: Request):
    await require_owned_investigation(investigation_id, request.state.current_user["_id"])
    docs = await document_repo.get_by_investigation(investigation_id)
    comparisons, _ = correlation_service.compare_documents(docs)
    
    doc_ids = [d["_id"] for d in docs]
    doc_names = {d["_id"]: d["original_filename"] for d in docs}

    return {
        "investigation_id": investigation_id,
        "document_ids": doc_ids,
        "document_names": doc_names,
        "comparisons": comparisons
    }

@router.get("/findings/{finding_id}", response_model=FindingResponse)
async def get_finding(finding_id: str, request: Request):
    return await require_owned_finding(finding_id, request.state.current_user["_id"])

@router.patch("/findings/{finding_id}/review", response_model=FindingResponse)
async def update_finding_review(finding_id: str, payload: FindingReviewUpdate, request: Request):
    finding = await require_owned_finding(finding_id, request.state.current_user["_id"])

    await finding_repo.update_review(
        finding_id=finding_id,
        review_status=payload.review_status,
        notes=payload.reviewer_notes
    )

    inv_id = finding["investigation_id"]
    await audit_repo.log_event(
        investigation_id=inv_id,
        event_type="finding_reviewed",
        details={
            "finding_id": finding_id,
            "new_status": payload.review_status,
            "has_notes": bool(payload.reviewer_notes)
        }
    )

    # Recalculate investigation stats
    all_findings = await finding_repo.get_by_investigation(inv_id)
    unrev_count = sum(1 for f in all_findings if f.get("review_status") == "unreviewed")
    await investigation_repo.update(inv_id, {"stats.unreviewed_findings": unrev_count})

    updated_finding = await finding_repo.get_by_id(finding_id)
    return updated_finding
