from fastapi import APIRouter
from app.config import settings
from app.database import db_manager
from app.services.ocr_service import ocr_service

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app_env": settings.APP_ENV,
        "database": {
            "mode": db_manager.mode,
            "connected": db_manager.mode in ["mongodb", "local_store"]
        },
        "ocr": {
            "engine": settings.OCR_ENGINE,
            "available": ocr_service.is_engine_available()
        },
        "storage": {
            "mode": settings.STORAGE_MODE,
            "path": settings.LOCAL_STORAGE_PATH
        },
        "llm": {
            "provider": settings.LLM_PROVIDER,
            "configured": bool(settings.LLM_API_KEY)
        }
    }

