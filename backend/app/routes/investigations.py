import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Request, Depends
from app.schemas.investigation_schema import (
    InvestigationCreate, InvestigationResponse, InvestigationListResponse
)
from app.repositories.investigation_repo import investigation_repo
from app.repositories.document_repo import document_repo
from app.repositories.finding_repo import finding_repo
from app.repositories.audit_repo import audit_repo
from app.services.document_service import document_service
from app.routes.auth import require_authenticated_user

router = APIRouter(
    prefix="/investigations",
    tags=["Investigations"],
    dependencies=[Depends(require_authenticated_user)],
)

@router.post("", response_model=InvestigationResponse, status_code=201)
async def create_investigation(payload: InvestigationCreate, request: Request):
    inv_id = f"inv_{uuid.uuid4().hex[:12]}"
    now_str = datetime.utcnow().isoformat() + "Z"
    
    inv_doc = {
        "_id": inv_id,
        "owner_id": request.state.current_user["_id"],
        "title": payload.title.strip(),
        "case_ref": payload.case_ref.strip() if payload.case_ref else None,
        "description": payload.description.strip() if payload.description else None,
        "status": "draft",
        "document_ids": [],
        "stats": {
            "total_documents": 0,
            "total_findings": 0,
            "unreviewed_findings": 0,
            "critical_findings": 0,
            "warning_findings": 0
        },
        "created_at": now_str,
        "updated_at": now_str
    }
    
    await investigation_repo.create(inv_doc)
    await audit_repo.log_event(
        investigation_id=inv_id,
        event_type="investigation_created",
        details={"title": payload.title, "case_ref": payload.case_ref}
    )
    return inv_doc

@router.get("", response_model=InvestigationListResponse)
async def list_investigations(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None
):
    owner_id = request.state.current_user["_id"]
    items = await investigation_repo.list_all(skip=skip, limit=limit, status=status, owner_id=owner_id)
    total = await investigation_repo.count(status=status, owner_id=owner_id)
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(investigation_id: str, request: Request):
    inv = await investigation_repo.get_by_id(investigation_id, request.state.current_user["_id"])
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return inv

@router.post("/{investigation_id}/analyze")
async def trigger_analysis(investigation_id: str, background_tasks: BackgroundTasks, request: Request):
    inv = await investigation_repo.get_by_id(investigation_id, request.state.current_user["_id"])
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    background_tasks.add_task(document_service.analyze_investigation, investigation_id)
    return {"message": "Investigation analysis started in background", "status": "processing"}

@router.delete("/{investigation_id}")
async def delete_investigation(investigation_id: str, request: Request):
    inv = await investigation_repo.get_by_id(investigation_id, request.state.current_user["_id"])
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    await document_repo.delete_by_investigation(investigation_id)
    await finding_repo.delete_by_investigation(investigation_id)
    await investigation_repo.delete(investigation_id)
    return {"success": True, "message": "Investigation and related records deleted"}
