import hashlib
import hmac
import secrets
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request, Response
from pymongo.errors import DuplicateKeyError

from app.repositories.auth_repo import SESSION_DURATION, auth_repo
from app.schemas.auth_schema import Credentials, SignUpRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
COOKIE_NAME = "docuforensics_session"
PBKDF2_ITERATIONS = 600_000
PASSWORD_SALT_BYTES = 16


def _hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(PASSWORD_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return f"{salt.hex()}:{digest.hex()}"


_DUMMY_PASSWORD_HASH = _hash_password("dummy-password-for-timing")


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, digest_hex = stored_hash.split(":", 1)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except (AttributeError, ValueError):
        return False
    actual = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return hmac.compare_digest(actual, expected)


def _public_user(user: Dict[str, Any]) -> UserResponse:
    return UserResponse(
        id=user["_id"],
        email=user["email"],
        created_at=user["created_at"],
    )


def _set_session_cookie(response: Response, token: str) -> None:
    from app.config import settings

    is_production = settings.APP_ENV.lower() in {"production", "prod"}
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=int(SESSION_DURATION.total_seconds()),
        httponly=True,
        secure=is_production,
        samesite="none" if is_production else "lax",
        path="/api",
    )


def _delete_session_cookie(response: Response) -> None:
    from app.config import settings

    is_production = settings.APP_ENV.lower() in {"production", "prod"}
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/api",
        httponly=True,
        secure=is_production,
        samesite="none" if is_production else "lax",
    )


@router.post("/signup", response_model=UserResponse, status_code=201)
async def sign_up(payload: SignUpRequest, response: Response):
    if await auth_repo.get_user_by_email(payload.email):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    try:
        user = await auth_repo.create_user(payload.email, _hash_password(payload.password))
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        ) from exc
    token = await auth_repo.create_session(user["_id"])
    _set_session_cookie(response, token)
    return _public_user(user)


@router.post("/login", response_model=UserResponse)
async def log_in(payload: Credentials, response: Response):
    user = await auth_repo.get_user_by_email(payload.email)
    password_hash = user.get("password_hash", "") if user else _DUMMY_PASSWORD_HASH
    valid_password = _verify_password(payload.password, password_hash)
    if not user or not valid_password:
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")

    token = await auth_repo.create_session(user["_id"])
    _set_session_cookie(response, token)
    return _public_user(user)


@router.post("/logout", status_code=204)
async def log_out(request: Request, response: Response):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        await auth_repo.delete_session(token)
    _delete_session_cookie(response)


@router.get("/me", response_model=UserResponse)
async def current_user(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    user = await auth_repo.get_session_user(token) if token else None
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return _public_user(user)


async def require_authenticated_user(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    user = await auth_repo.get_session_user(token) if token else None
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    request.state.current_user = user
    return user


async def require_owned_investigation(investigation_id: str, owner_id: str):
    from app.repositories.investigation_repo import investigation_repo

    investigation = await investigation_repo.get_by_id(investigation_id, owner_id)
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return investigation


async def require_owned_document(document_id: str, owner_id: str):
    from app.repositories.document_repo import document_repo

    document = await document_repo.get_by_id(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    await require_owned_investigation(document["investigation_id"], owner_id)
    return document


async def require_owned_finding(finding_id: str, owner_id: str):
    from app.repositories.finding_repo import finding_repo

    finding = await finding_repo.get_by_id(finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    await require_owned_investigation(finding["investigation_id"], owner_id)
    return finding
