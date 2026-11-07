import uuid
import io
from datetime import datetime
from typing import List
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Query, Response, Request, Depends
from app.schemas.document_schema import DocumentResponse, DocumentFieldsResponse
from app.repositories.investigation_repo import investigation_repo
from app.repositories.document_repo import document_repo
from app.services.storage_service import storage_service
from app.services.document_service import document_service
from app.services.pdf_service import pdf_service
from app.routes.auth import (
    require_authenticated_user,
    require_owned_document,
    require_owned_investigation,
)

router = APIRouter(
    tags=["Documents"], dependencies=[Depends(require_authenticated_user)]
)

@router.post("/investigations/{investigation_id}/documents", response_model=List[DocumentResponse], status_code=201)
async def upload_documents(
    investigation_id: str,
    background_tasks: BackgroundTasks,
    request: Request,
    files: List[UploadFile] = File(...)
):
    inv = await require_owned_investigation(
        investigation_id, request.state.current_user["_id"]
    )

    created_docs = []
    new_doc_ids = list(inv.get("document_ids", []))

    for upload in files:
        content = await upload.read()
        rel_path, sha256_hash, file_size = storage_service.save_file(
            investigation_id, upload.filename, content
        )
        doc_id = f"doc_{uuid.uuid4().hex[:12]}"
        now_str = datetime.utcnow().isoformat() + "Z"

        doc_record = {
            "_id": doc_id,
            "investigation_id": investigation_id,
            "original_filename": upload.filename,
            "storage_path": rel_path,
            "mime_type": upload.content_type or "application/octet-stream",
            "file_size": file_size,
            "sha256_hash": sha256_hash,
            "page_count": 1,
            "page_dimensions": [],
            "classification": {"predicted_type": "unknown", "confidence": 0.0, "rule_basis": "Pending processing"},
            "extracted_fields": {},
            "ocr_summary": {},
            "raw_ocr_blocks": [],
            "processing_status": "queued",
            "error_message": None,
            "created_at": now_str
        }

        await document_repo.create(doc_record)
        new_doc_ids.append(doc_id)
        created_docs.append(doc_record)

        # Trigger document processing
        background_tasks.add_task(document_service.process_document, doc_id)

    # Update document list in investigation
    await investigation_repo.update(investigation_id, {
        "document_ids": new_doc_ids,
        "stats.total_documents": len(new_doc_ids)
    })

    return created_docs

@router.get("/investigations/{investigation_id}/documents", response_model=List[DocumentResponse])
async def list_documents(investigation_id: str, request: Request):
    await require_owned_investigation(investigation_id, request.state.current_user["_id"])
    return await document_repo.get_by_investigation(investigation_id)

@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, request: Request):
    return await require_owned_document(document_id, request.state.current_user["_id"])

@router.get("/documents/{document_id}/fields", response_model=DocumentFieldsResponse)
async def get_document_fields(document_id: str, request: Request):
    doc = await require_owned_document(document_id, request.state.current_user["_id"])
    
    return {
        "document_id": document_id,
        "fields": doc.get("extracted_fields", {}),
        "raw_ocr_blocks": doc.get("raw_ocr_blocks", [])
    }

@router.get("/documents/{document_id}/preview")
async def get_document_preview(document_id: str, request: Request, page: int = Query(1, ge=1), dpi: int = Query(150, ge=72, le=300)):
    doc = await require_owned_document(document_id, request.state.current_user["_id"])
    
    file_path = storage_service.get_absolute_path(doc["storage_path"])
    ext = doc["original_filename"].rsplit(".", 1)[-1].lower() if "." in doc["original_filename"] else ""

    if ext == "pdf":
        png_bytes = pdf_service.render_page_to_png(file_path, page_number=page, dpi=dpi)
        return Response(content=png_bytes, media_type="image/png")
    elif ext in ["png", "jpg", "jpeg"]:
        with open(file_path, "rb") as f:
            content = f.read()
        media_type = "image/png" if ext == "png" else "image/jpeg"
        return Response(content=content, media_type=media_type)
    else:
        raise HTTPException(status_code=400, detail="Preview unsupported for this file type")

@router.post("/documents/{document_id}/retry")
async def retry_document_processing(document_id: str, background_tasks: BackgroundTasks, request: Request):
    doc = await require_owned_document(document_id, request.state.current_user["_id"])
    
    background_tasks.add_task(document_service.process_document, document_id)
    return {"message": "Document processing re-queued", "status": "queued"}
