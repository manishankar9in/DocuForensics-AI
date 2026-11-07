from typing import List, Optional, Dict, Any
from app.database import get_collection

class DocumentRepository:
    def __init__(self):
        self.collection_name = "documents"

    @property
    def col(self):
        return get_collection(self.collection_name)

    async def create(self, doc_dict: Dict[str, Any]) -> str:
        await self.col.insert_one(doc_dict)
        return doc_dict["_id"]

    async def get_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        return await self.col.find_one({"_id": doc_id})

    async def get_by_investigation(self, inv_id: str) -> List[Dict[str, Any]]:
        cursor = self.col.find({"investigation_id": inv_id}).sort("created_at", 1)
        return await cursor.to_list(length=100)

    async def update(self, doc_id: str, update_dict: Dict[str, Any]) -> bool:
        res = await self.col.update_one({"_id": doc_id}, {"$set": update_dict})
        return res.modified_count > 0

    async def delete_by_investigation(self, inv_id: str) -> int:
        docs = await self.get_by_investigation(inv_id)
        count = 0
        for doc in docs:
            await self.col.delete_one({"_id": doc["_id"]})
            count += 1
        return count

document_repo = DocumentRepository()

