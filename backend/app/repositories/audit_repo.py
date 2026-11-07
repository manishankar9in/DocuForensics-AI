import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.database import get_collection

class AuditRepository:
    def __init__(self):
        self.collection_name = "audit_logs"

    @property
    def col(self):
        return get_collection(self.collection_name)

    async def log_event(self, investigation_id: str, event_type: str, details: Dict[str, Any], document_id: Optional[str] = None):
        log_entry = {
            "_id": f"aud_{uuid.uuid4().hex[:12]}",
            "investigation_id": investigation_id,
            "document_id": document_id,
            "event_type": event_type,
            "details": details,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        await self.col.insert_one(log_entry)
        return log_entry["_id"]

    async def get_by_investigation(self, inv_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        cursor = self.col.find({"investigation_id": inv_id}).sort("timestamp", -1).limit(limit)
        return await cursor.to_list(length=limit)

audit_repo = AuditRepository()

