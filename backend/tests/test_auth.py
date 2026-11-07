import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.repositories.document_repo import document_repo
from app.repositories.finding_repo import finding_repo


@pytest.mark.asyncio
async def test_authentication_and_investigation_isolation(isolated_local_store):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as first_user:
        unauthenticated = await first_user.get("/api/investigations")
        assert unauthenticated.status_code == 401
        assert (await first_user.get("/api/documents/private-doc")).status_code == 401

        weak_password = await first_user.post(
            "/api/auth/signup",
            json={"email": "first@example.com", "password": "short"},
        )
        assert weak_password.status_code == 422

        first_signup = await first_user.post(
            "/api/auth/signup",
            json={"email": "First@Example.com", "password": "safe-password-123"},
        )
        assert first_signup.status_code == 201
        assert first_signup.json()["email"] == "first@example.com"
        assert "httponly" in first_signup.headers["set-cookie"].lower()

        duplicate_signup = await first_user.post(
            "/api/auth/signup",
            json={"email": "first@example.com", "password": "safe-password-123"},
        )
        assert duplicate_signup.status_code == 409
        bad_login = await first_user.post(
            "/api/auth/login",
            json={"email": "first@example.com", "password": "incorrect-password"},
        )
        assert bad_login.status_code == 401

        created = await first_user.post(
            "/api/investigations",
            json={"title": "Private first-user case"},
        )
        assert created.status_code == 201
        investigation_id = created.json()["_id"]
        demo_named_case = await first_user.post(
            "/api/investigations",
            json={
                "title": "E2E Test Investigation",
                "case_ref": "E2E-2026-001",
                "description": "A real, privately owned investigation.",
            },
        )
        assert demo_named_case.status_code == 201
        await document_repo.create(
            {"_id": "private-doc", "investigation_id": investigation_id}
        )
        await finding_repo.create(
            {"_id": "private-finding", "investigation_id": investigation_id}
        )

        second_user = AsyncClient(transport=transport, base_url="http://test")
        try:
            second_signup = await second_user.post(
                "/api/auth/signup",
                json={"email": "second@example.com", "password": "safe-password-456"},
            )
            assert second_signup.status_code == 201
            second_list = await second_user.get("/api/investigations")
            assert second_list.status_code == 200
            assert second_list.json()["total"] == 0

            inaccessible_case = await second_user.get(
                f"/api/investigations/{investigation_id}"
            )
            assert inaccessible_case.status_code == 404
            assert (await second_user.get("/api/documents/private-doc")).status_code == 404
            assert (await second_user.get("/api/findings/private-finding")).status_code == 404

            logout = await second_user.post("/api/auth/logout")
            assert logout.status_code == 204
            assert (await second_user.get("/api/investigations")).status_code == 401
        finally:
            await second_user.aclose()

        login = await first_user.post(
            "/api/auth/login",
            json={"email": "FIRST@example.com", "password": "safe-password-123"},
        )
        assert login.status_code == 200
        assert (await first_user.get("/api/auth/me")).status_code == 200

        rejected_origin = await first_user.post(
            "/api/investigations",
            headers={"Origin": "https://untrusted.example"},
            json={"title": "Blocked cross-site request"},
        )
        assert rejected_origin.status_code == 403
