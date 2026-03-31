import logging

from fastapi import APIRouter, Depends, HTTPException
import httpx

from app.dependencies import get_token
from app.schemas import CreatePullRequestRequest
from app.services.github_service import GitHubService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pulls", tags=["Pull Requests"])


@router.post("/create", summary="Create a pull request")
async def create_pull_request(
    payload: CreatePullRequestRequest,
    token: str = Depends(get_token),
):
    """Create a new pull request in the specified repository (bonus feature)."""
    service = GitHubService(token)
    try:
        pr = await service.create_pull_request(
            owner=payload.owner,
            repo=payload.repo,
            title=payload.title,
            head=payload.head,
            base=payload.base,
            body=payload.body,
        )
        return {
            "id": pr["id"],
            "number": pr["number"],
            "title": pr["title"],
            "html_url": pr["html_url"],
            "state": pr["state"],
            "created_at": pr["created_at"],
        }
    except httpx.HTTPStatusError as exc:
        logger.error("GitHub API error: %s", exc.response.text)
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=str(exc),
        ) from exc
