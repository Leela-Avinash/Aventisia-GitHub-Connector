import logging
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
import httpx

from app.dependencies import get_token
from app.services.github_service import GitHubService
from app.config.settings import GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/verify", summary="Verify GitHub PAT")
async def verify_token(token: str = Depends(get_token)):
    """Verify the provided GitHub Personal Access Token."""
    service = GitHubService(token)
    try:
        user = await service.get_authenticated_user()
        return {
            "authenticated": True,
            "user": {
                "login": user["login"],
                "id": user["id"],
                "avatar_url": user["avatar_url"],
                "name": user.get("name"),
            },
        }
    except Exception as exc:
        logger.error("Authentication failed: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid or expired token.") from exc


@router.get("/github", summary="Redirect to GitHub OAuth authorization")
async def github_oauth_redirect():
    """Redirect the user to GitHub's OAuth authorization page."""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth is not configured. Set GITHUB_CLIENT_ID environment variable.",
        )
    params = urlencode({
        "client_id": GITHUB_CLIENT_ID,
        "scope": "repo user",
    })
    return RedirectResponse(url=f"https://github.com/login/oauth/authorize?{params}")


@router.get("/github/callback", summary="Exchange OAuth code for access token")
async def github_oauth_callback(
    code: str = Query(..., description="Authorization code from GitHub"),
):
    """Exchange the authorization code for a GitHub access token."""
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.",
        )

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
            timeout=30.0,
        )

    if resp.status_code != 200:
        logger.error("OAuth token exchange failed: %s", resp.text)
        raise HTTPException(status_code=502, detail="Failed to exchange code for token.")

    data = resp.json()
    access_token = data.get("access_token")
    if not access_token:
        error_code = data.get("error", "unknown_error")
        error_desc = data.get("error_description", error_code)
        logger.error("GitHub OAuth token exchange error: %s — %s", error_code, error_desc)
        raise HTTPException(status_code=400, detail=f"GitHub OAuth error: {error_desc}")

    # Fetch user info with the new token
    service = GitHubService(access_token)
    try:
        user = await service.get_authenticated_user()
    except Exception as exc:
        logger.error("Failed to fetch user after OAuth: %s", exc)
        raise HTTPException(status_code=502, detail="Token obtained but failed to verify user.") from exc

    return {
        "access_token": access_token,
        "user": {
            "login": user["login"],
            "id": user["id"],
            "avatar_url": user["avatar_url"],
            "name": user.get("name"),
        },
    }
