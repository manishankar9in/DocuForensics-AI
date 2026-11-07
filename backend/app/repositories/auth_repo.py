import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from app.database import get_collection

SESSION_DURATION = timedelta(days=7)


class AuthRepository:
    @property
    def users(self):
        return get_collection("auth_users")

    @property
    def sessions(self):
        return get_collection("auth_sessions")

    async def create_user(self, email: str, password_hash: str) -> Dict[str, Any]:
        user = {
            "_id": f"user_{secrets.token_hex(12)}",
            "email": email,
            "password_hash": password_hash,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await self.users.insert_one(user)
        return user

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return await self.users.find_one({"email": email})

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.users.find_one({"_id": user_id})

    async def create_session(self, user_id: str) -> str:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        expires_at = datetime.now(timezone.utc) + SESSION_DURATION
        await self.sessions.insert_one(
            {
                "_id": token_hash,
                "user_id": user_id,
                "expires_at": expires_at,
            }
        )
        return token

    async def get_session_user(self, token: str) -> Optional[Dict[str, Any]]:
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        session = await self.sessions.find_one({"_id": token_hash})
        if not session:
            return None

        try:
            expires_at = session["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if not isinstance(expires_at, datetime):
                raise ValueError("Invalid session expiration.")
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
        except (KeyError, TypeError, ValueError):
            await self.sessions.delete_one({"_id": token_hash})
            return None

        if expires_at <= datetime.now(timezone.utc):
            await self.sessions.delete_one({"_id": token_hash})
            return None
        user_id = session.get("user_id")
        if not user_id:
            await self.sessions.delete_one({"_id": token_hash})
            return None
        return await self.get_user_by_id(user_id)

    async def delete_session(self, token: str) -> None:
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        await self.sessions.delete_one({"_id": token_hash})


auth_repo = AuthRepository()
