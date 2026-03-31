import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
import httpx

from app.dependencies import get_token
from app.services.github_service import GitHubService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/repos", tags=["Repositories"])


@router.get("", summary="Fetch repositories")
async def get_repos(
    username: Optional[str] = Query(None, description="GitHub username"),
    org: Optional[str] = Query(None, description="GitHub organisation"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(30, ge=1, le=100, description="Results per page"),
    token: str = Depends(get_token),
):
    """
    Fetch repositories for a user, org, or the authenticated user.

    - Provide **username** to fetch a user's public repos.
    - Provide **org** to fetch an organisation's repos.
    - Omit both to fetch the authenticated user's repos.
    """
    service = GitHubService(token)
    try:
        repos = await service.get_repos(
            username=username, org=org, page=page, per_page=per_page
        )
        return {
            "count": len(repos),
            "page": page,
            "per_page": per_page,
            "repos": [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "full_name": r["full_name"],
                    "private": r["private"],
                    "html_url": r["html_url"],
                    "description": r.get("description"),
                    "language": r.get("language"),
                    "stargazers_count": r.get("stargazers_count", 0),
                    "forks_count": r.get("forks_count", 0),
                    "updated_at": r.get("updated_at"),
                }
                for r in repos
            ],
        }
    except httpx.HTTPStatusError as exc:
        logger.error("GitHub API error: %s", exc.response.text)
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=str(exc),
        ) from exc
