import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
import httpx

from app.dependencies import get_token
from app.services.github_service import GitHubService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/commits", tags=["Commits"])


@router.get("/{owner}/{repo}", summary="Fetch commits from a repository")
async def get_commits(
    owner: str,
    repo: str,
    sha: Optional[str] = Query(None, description="Branch name or commit SHA to start from"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(30, ge=1, le=100, description="Results per page"),
    token: str = Depends(get_token),
):
    """Fetch commits from the specified repository with optional branch/SHA filter."""
    service = GitHubService(token)
    try:
        commits = await service.get_commits(
            owner=owner, repo=repo, sha=sha, page=page, per_page=per_page
        )
        return {
            "count": len(commits),
            "page": page,
            "per_page": per_page,
            "commits": [
                {
                    "sha": c["sha"],
                    "message": c["commit"]["message"],
                    "author": c["commit"]["author"]["name"],
                    "date": c["commit"]["author"]["date"],
                    "html_url": c["html_url"],
                }
                for c in commits
            ],
        }
    except httpx.HTTPStatusError as exc:
        logger.error("GitHub API error: %s", exc.response.text)
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=str(exc),
        ) from exc


@router.get("/detail/{owner}/{repo}/{sha}", summary="Fetch a single commit's details")
async def get_commit_detail(
    owner: str,
    repo: str,
    sha: str,
    token: str = Depends(get_token),
):
    """Fetch full detail for a single commit including files changed and stats."""
    service = GitHubService(token)
    try:
        c = await service.get_commit_detail(owner=owner, repo=repo, sha=sha)
        return {
            "sha": c["sha"],
            "message": c["commit"]["message"],
            "author": c["commit"]["author"]["name"],
            "author_login": (c.get("author") or {}).get("login"),
            "author_avatar": (c.get("author") or {}).get("avatar_url"),
            "date": c["commit"]["author"]["date"],
            "html_url": c["html_url"],
            "stats": c.get("stats", {}),
            "files": [
                {
                    "filename": f["filename"],
                    "status": f["status"],
                    "additions": f["additions"],
                    "deletions": f["deletions"],
                    "changes": f["changes"],
                    "patch": f.get("patch", ""),
                }
                for f in c.get("files", [])
            ],
        }
    except httpx.HTTPStatusError as exc:
        logger.error("GitHub API error: %s", exc.response.text)
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=str(exc),
        ) from exc
