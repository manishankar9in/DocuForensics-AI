import os
import json
import asyncio
from typing import Optional, Dict, Any, List
from pathlib import Path
from app.config import settings


class LocalAsyncCollection:
    """
    File-backed async collection. All operations are run in executor so the
    event loop is never blocked by synchronous file I/O.
    """

    def __init__(self, collection_name: str, base_dir: Path):
        self.name = collection_name
        self.file_path = base_dir / f"{collection_name}.json"
        self._ensure_file()

    def _ensure_file(self):
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self.file_path.write_text("[]", encoding="utf-8")

    # ── sync helpers (called in executor) ──────────────────────────────────

    def _read_all(self) -> List[Dict[str, Any]]:
        try:
            return json.loads(self.file_path.read_text(encoding="utf-8"))
        except Exception:
            return []

    def _write_all(self, docs: List[Dict[str, Any]]):
        self.file_path.write_text(
            json.dumps(docs, indent=2, default=str), encoding="utf-8"
        )

    def _sync_insert_one(self, document: Dict[str, Any]):
        docs = self._read_all()
        docs.append(dict(document))
        self._write_all(docs)

    def _sync_find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for doc in self._read_all():
            if all(doc.get(k) == v for k, v in query.items()):
                return dict(doc)
        return None

    def _sync_find(
        self,
        query: Dict[str, Any],
        sort: Optional[List],
        skip: int,
        limit: int,
    ) -> List[Dict[str, Any]]:
        matched = [
            dict(d)
            for d in self._read_all()
            if all(d.get(k) == v for k, v in query.items())
        ]
        if sort:
            for key, direction in reversed(sort):
                matched.sort(
                    key=lambda d: str(d.get(key, "")),
                    reverse=(direction == -1 or direction == "desc"),
                )
        if skip:
            matched = matched[skip:]
        if limit and limit > 0:
            matched = matched[:limit]
        return matched

    def _sync_update_one(self, filter_q: Dict[str, Any], update_doc: Dict[str, Any]) -> int:
        docs = self._read_all()
        for idx, doc in enumerate(docs):
            if all(doc.get(k) == v for k, v in filter_q.items()):
                if "$set" in update_doc:
                    doc.update(update_doc["$set"])
                else:
                    doc.update(update_doc)
                docs[idx] = doc
                self._write_all(docs)
                return 1
        return 0

    def _sync_delete_one(self, filter_q: Dict[str, Any]) -> int:
        docs = self._read_all()
        for idx, doc in enumerate(docs):
            if all(doc.get(k) == v for k, v in filter_q.items()):
                docs.pop(idx)
                self._write_all(docs)
                return 1
        return 0

    def _sync_count(self, filter_q: Dict[str, Any]) -> int:
        if not filter_q:
            return len(self._read_all())
        return sum(
            1
            for d in self._read_all()
            if all(d.get(k) == v for k, v in filter_q.items())
        )

    # ── async public API ───────────────────────────────────────────────────

    async def _run(self, fn, *args):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, fn, *args)

    async def insert_one(self, document: Dict[str, Any]):
        await self._run(self._sync_insert_one, document)

        class _R:
            def __init__(self, iid):
                self.inserted_id = iid

        return _R(document.get("_id"))

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self._run(self._sync_find_one, query)

    def find(self, query: Optional[Dict[str, Any]] = None, sort: Optional[List] = None):
        return _LocalCursor(self, query or {}, sort)

    async def update_one(self, filter_query: Dict[str, Any], update_doc: Dict[str, Any]):
        modified = await self._run(self._sync_update_one, filter_query, update_doc)

        class _R:
            def __init__(self, c):
                self.modified_count = c

        return _R(modified)

    async def delete_one(self, filter_query: Dict[str, Any]):
        deleted = await self._run(self._sync_delete_one, filter_query)

        class _R:
            def __init__(self, c):
                self.deleted_count = c

        return _R(deleted)

    async def count_documents(self, filter_query: Dict[str, Any]) -> int:
        return await self._run(self._sync_count, filter_query)


class _LocalCursor:
    def __init__(self, col: LocalAsyncCollection, query: Dict, sort: Optional[List]):
        self._col = col
        self._query = query
        self._sort = sort or []
        self._skip_n = 0
        self._limit_n = 0

    def skip(self, n: int):
        self._skip_n = n
        return self

    def limit(self, n: int):
        self._limit_n = n
        return self

    def sort(self, key_or_list, direction=None):
        if isinstance(key_or_list, list):
            self._sort = key_or_list
        else:
            self._sort = [(key_or_list, direction or 1)]
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        eff_limit = length if length is not None else self._limit_n
        return await self._col._run(
            self._col._sync_find, self._query, self._sort, self._skip_n, eff_limit
        )


class DatabaseManager:
    def __init__(self):
        self.client: Optional[Any] = None
        self.db: Optional[Any] = None
        self.mode: str = "disconnected"
        self._local: Dict[str, LocalAsyncCollection] = {}

    async def connect(self):
        if not settings.MONGODB_URI:
            self._start_local()
            return

        # Quick synchronous socket probe — avoids Motor's slow topology
        # discovery when the server is offline.
        import socket, urllib.parse

        try:
            parsed = urllib.parse.urlparse(settings.MONGODB_URI)
            host = parsed.hostname or "127.0.0.1"
            port = parsed.port or 27017
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.15)
            reachable = sock.connect_ex((host, port)) == 0
            sock.close()
        except Exception:
            reachable = False

        if not reachable:
            self._start_local()
            return

        try:
            from motor.motor_asyncio import AsyncIOMotorClient

            client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=1000,
                connectTimeoutMS=1000,
            )
            await client.admin.command("ping")
            self.client = client
            self.db = client[settings.MONGODB_DATABASE]
            self.mode = "mongodb"
            print(
                f"[Database] Connected to MongoDB at {settings.MONGODB_URI} "
                f"(database: {settings.MONGODB_DATABASE})"
            )
            await self._ensure_indexes()
        except Exception as exc:
            self._start_local()
            print(f"[Database] MongoDB ping failed ({exc}). Falling back to local store.")

    def _start_local(self):
        self.mode = "local_store"
        self.client = None
        self.db = None
        base = Path(settings.LOCAL_STORAGE_PATH) / "local_db"
        base.mkdir(parents=True, exist_ok=True)
        print(f"[Database] Local persistent JSON store at {base}")

    async def _ensure_indexes(self):
        if self.db is not None:
            try:
                await self.db.investigations.create_index([("created_at", -1)])
                await self.db.documents.create_index([("investigation_id", 1)])
                await self.db.findings.create_index([("investigation_id", 1)])
                await self.db.audit_logs.create_index(
                    [("investigation_id", 1), ("timestamp", -1)]
                )
                await self.db.auth_users.create_index("email", unique=True)
                await self.db.auth_sessions.create_index(
                    "expires_at", expireAfterSeconds=0
                )
            except Exception as exc:
                print(f"[Database] Index note: {exc}")

    def get_collection(self, name: str):
        if self.mode == "mongodb" and self.db is not None:
            return self.db[name]
        if name not in self._local:
            base = Path(settings.LOCAL_STORAGE_PATH) / "local_db"
            self._local[name] = LocalAsyncCollection(name, base)
        return self._local[name]

    async def disconnect(self):
        if self.client:
            self.client.close()
            print("[Database] MongoDB connection closed.")


db_manager = DatabaseManager()


def get_collection(name: str):
    return db_manager.get_collection(name)
