from typing import List, Optional, Dict, Any
from datetime import datetime
from app.database import get_collection


class InvestigationRepository:
    def __init__(self):
        self.collection_name = "investigations"

    @property
    def col(self):
        return get_collection(self.collection_name)

    async def create(self, inv_dict: Dict[str, Any]) -> str:
        await self.col.insert_one(inv_dict)
        return inv_dict["_id"]

    async def get_by_id(self, inv_id: str, owner_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        query = {"_id": inv_id}
        if owner_id:
            query["owner_id"] = owner_id
        return await self.col.find_one(query)

    async def list_all(self, skip: int = 0, limit: int = 50, status: Optional[str] = None, owner_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {}
        if status and status != "all":
            query["status"] = status
        if owner_id:
            query["owner_id"] = owner_id

        cursor = self.col.find(query).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def count(self, status: Optional[str] = None, owner_id: Optional[str] = None) -> int:
        query = {}
        if status and status != "all":
            query["status"] = status
        if owner_id:
            query["owner_id"] = owner_id

        return await self.col.count_documents(query)

    async def update(self, inv_id: str, update_dict: Dict[str, Any]) -> bool:
        update_dict["updated_at"] = datetime.utcnow().isoformat() + "Z"
        res = await self.col.update_one({"_id": inv_id}, {"$set": update_dict})
        return res.modified_count > 0

    async def delete(self, inv_id: str) -> bool:
        res = await self.col.delete_one({"_id": inv_id})
        return res.deleted_count > 0

investigation_repo = InvestigationRepository()
