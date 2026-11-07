from typing import List, Optional, Dict, Any
from app.database import get_collection

class FindingRepository:
    def __init__(self):
        self.collection_name = "findings"

    @property
    def col(self):
        return get_collection(self.collection_name)

    async def create(self, finding_dict: Dict[str, Any]) -> str:
        if "created_at" not in finding_dict or not finding_dict["created_at"]:
            from datetime import datetime
            finding_dict["created_at"] = datetime.utcnow().isoformat() + "Z"
        await self.col.insert_one(finding_dict)
        return finding_dict["_id"]

    async def create_many(self, finding_dicts: List[Dict[str, Any]]) -> List[str]:
        ids = []
        for f in finding_dicts:
            await self.col.insert_one(f)
            ids.append(f["_id"])
        return ids

    async def get_by_id(self, finding_id: str) -> Optional[Dict[str, Any]]:
        return await self.col.find_one({"_id": finding_id})

    async def get_by_investigation(
        self,
        inv_id: str,
        severity: Optional[str] = None,
        category: Optional[str] = None,
        review_status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"investigation_id": inv_id}
        if severity:
            query["severity"] = severity
        if category:
            query["category"] = category
        if review_status:
            query["review_status"] = review_status
        cursor = self.col.find(query).sort("created_at", -1)
        return await cursor.to_list(length=500)

    async def update_review(self, finding_id: str, review_status: str, notes: Optional[str] = None) -> bool:
        update_data: Dict[str, Any] = {"review_status": review_status}
        if notes is not None:
            update_data["reviewer_notes"] = notes
        res = await self.col.update_one({"_id": finding_id}, {"$set": update_data})
        return res.modified_count > 0

    async def delete_by_investigation(self, inv_id: str) -> int:
        findings = await self.get_by_investigation(inv_id)
        count = 0
        for f in findings:
            await self.col.delete_one({"_id": f["_id"]})
            count += 1
        return count

finding_repo = FindingRepository()

