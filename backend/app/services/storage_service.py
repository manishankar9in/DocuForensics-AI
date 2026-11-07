import os
import hashlib
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import HTTPException
from app.config import settings

class StorageService:
    def __init__(self):
        self.base_path = Path(settings.LOCAL_STORAGE_PATH).resolve()
        self.base_path.mkdir(parents=True, exist_ok=True)

    def compute_sha256(self, content: bytes) -> str:
        sha = hashlib.sha256()
        sha.update(content)
        return sha.hexdigest()

    def validate_file(self, filename: str, content: bytes):
        # 1. Size check
        size_mb = len(content) / (1024 * 1024)
        if size_mb > settings.MAX_UPLOAD_MB:
            raise HTTPException(
                status_code=400,
                detail=f"File '{filename}' exceeds maximum allowed size of {settings.MAX_UPLOAD_MB}MB ({size_mb:.2f}MB)"
            )

        # 2. Extension check
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in settings.allowed_extensions_list:
            raise HTTPException(
                status_code=400,
                detail=f"File extension '.{ext}' is not supported. Allowed formats: {', '.join(settings.allowed_extensions_list)}"
            )

        # 3. Magic header check
        if ext == "pdf":
            if not content.startswith(b"%PDF"):
                raise HTTPException(
                    status_code=400,
                    detail=f"File '{filename}' does not have a valid PDF header signature."
                )
        elif ext in ["png", "jpg", "jpeg"]:
            is_png = content.startswith(b"\x89PNG\r\n\x1a\n")
            is_jpg = content.startswith(b"\xff\xd8\xff")
            if not (is_png or is_jpg):
                raise HTTPException(
                    status_code=400,
                    detail=f"File '{filename}' does not have a valid PNG or JPEG image signature."
                )

    def save_file(self, investigation_id: str, original_filename: str, content: bytes) -> Tuple[str, str, int]:
        """
        Saves document to disk under storage/{investigation_id}/{doc_id}_{clean_filename}.
        Returns (relative_path, sha256_hash, file_size).
        """
        self.validate_file(original_filename, content)
        
        # Sanitize filename
        safe_name = "".join(c for c in original_filename if c.isalnum() or c in "._- ")
        if not safe_name:
            safe_name = "document"

        doc_dir = self.base_path / investigation_id
        doc_dir.mkdir(parents=True, exist_ok=True)

        unique_prefix = uuid.uuid4().hex[:8]
        filename = f"{unique_prefix}_{safe_name}"
        target_path = (doc_dir / filename).resolve()

        # Path traversal guard
        if not str(target_path).startswith(str(self.base_path)):
            raise HTTPException(status_code=400, detail="Invalid file storage path.")

        with open(target_path, "wb") as f:
            f.write(content)

        relative_path = str(target_path.relative_to(self.base_path)).replace("\\", "/")
        sha256 = self.compute_sha256(content)
        file_size = len(content)

        return relative_path, sha256, file_size

    def get_absolute_path(self, relative_path: str) -> Path:
        resolved = (self.base_path / relative_path).resolve()
        if not str(resolved).startswith(str(self.base_path)):
            raise HTTPException(status_code=403, detail="Access denied: path outside storage root.")
        if not resolved.exists():
            raise HTTPException(status_code=404, detail="Requested file not found on disk.")
        return resolved

storage_service = StorageService()

