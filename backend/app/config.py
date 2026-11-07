import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    APP_HOST: str = "127.0.0.1"
    APP_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:3000,http://127.0.0.1:3000"

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "docuforensics"

    # Storage
    STORAGE_MODE: str = "local"
    LOCAL_STORAGE_PATH: str = "./storage"

    # OCR
    OCR_ENGINE: str = "tesseract"
    TESSERACT_CMD: str = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    # LLM (Optional Grounding)
    LLM_PROVIDER: str = "none"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-1.5-flash"

    # Security & File Limits
    MAX_UPLOAD_MB: int = 25
    MAX_DOCUMENTS_PER_INVESTIGATION: int = 10
    ALLOWED_EXTENSIONS: str = "pdf,png,jpg,jpeg"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",") if ext.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

