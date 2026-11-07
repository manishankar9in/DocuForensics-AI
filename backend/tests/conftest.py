import pytest
import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


@pytest.fixture
def isolated_local_store(tmp_path: Path, monkeypatch):
    from app.config import settings
    from app.database import db_manager
    from app.services.storage_service import storage_service

    monkeypatch.setattr(settings, "LOCAL_STORAGE_PATH", str(tmp_path))
    monkeypatch.setattr(db_manager, "mode", "local_store")
    monkeypatch.setattr(storage_service, "base_path", tmp_path)
    db_manager._local.clear()
    yield
    db_manager._local.clear()
