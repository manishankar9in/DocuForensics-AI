from contextlib import asynccontextmanager
import re
from urllib.parse import urlsplit
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import db_manager
from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.investigations import router as investigations_router
from app.routes.documents import router as documents_router
from app.routes.findings import router as findings_router
from app.routes.reports import router as reports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to database & verify storage
    print(f"[DocuForensics AI] Starting up backend in {settings.APP_ENV} mode...")
    await db_manager.connect()
    yield
    # Shutdown
    print("[DocuForensics AI] Shutting down backend...")
    await db_manager.disconnect()

app = FastAPI(
    title="DocuForensics AI API",
    description="AI-Powered Document Forensics and Contextual Intelligence System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware - allows configured origins and any local dev port (localhost / 127.0.0.1 on any port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "InternalServerError", "detail": str(exc)}
    )


@app.middleware("http")
async def validate_api_request_origin(request: Request, call_next):
    origin = request.headers.get("origin")
    if (
        request.url.path.startswith("/api/")
        and request.method in {"POST", "PUT", "PATCH", "DELETE"}
        and origin
    ):
        parsed_origin = urlsplit(origin)
        allowed = origin in settings.cors_origins_list or (
            parsed_origin.scheme in {"http", "https"}
            and bool(
                re.fullmatch(
                    r"(localhost|127\.0\.0\.1)(:\d+)?",
                    parsed_origin.netloc,
                )
            )
        )
        if not allowed:
            return JSONResponse(
                status_code=403,
                content={"detail": "Request origin is not allowed."},
            )
    return await call_next(request)


# Register API routes under /api
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(investigations_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(findings_router, prefix="/api")
app.include_router(reports_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "service": "DocuForensics AI API",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/api/health"
    }
