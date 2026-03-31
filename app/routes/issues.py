import logging

from fastapi import APIRouter, Depends, HTTPException, Query
import httpx

from app.dependencies import get_token
from app.schemas import CreateIssueRequest
from app.services.github_service import GitHubService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/issues", tags=["Issues"])


@router.get("/{owner}/{repo}", summary="List issues from a repository")
async def list_issues(
    owner: str,
    repo: str,
    state: str = Query("open", pattern="^(open|closed|all)$", description="Issue state filter"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(30, ge=1, le=100, description="Results per page"),
    token: str = Depends(get_token),
):
    """List issues from the specified repository with pagination."""
    service = GitHubService(token)
    try:
        issues = await service.list_issues(
            owner=owner, repo=repo, state=state, page=page, per_page=per_page
        )
        return {
            "count": len(issues),
            "page": page,
            "per_page": per_page,
            "issues": [
                {
                    "id": i["id"],
                    "number": i["number"],
                    "title": i["title"],
                    "state": i["state"],
                    "html_url": i["html_url"],
                    "user": i["user"]["login"],
                    "labels": [l["name"] for l in i.get("labels", [])],
                    "created_at": i["created_at"],
                    "updated_at": i["updated_at"],
                }
                for i in issues
            ],
        }
    except httpx.HTTPStatusError as exc:
        logger.error("GitHub API error: %s", exc.response.text)
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=str(exc),
        ) from exc


@router.post("/create", summary="Create an issue in a repository")
async def create_issue(
    payload: CreateIssueRequest,
    token: str = Depends(get_token),
):
    """Create a new issue in the specified repository."""
    service = GitHubService(token)
    try:
        issue = await service.create_issue(
            owner=payload.owner,
            repo=payload.repo,
            title=payload.title,
            body=payload.body,
            labels=payload.labels,
            assignees=payload.assignees,
        )
        return {
            "id": issue["id"],
            "number": issue["number"],
            "title": issue["title"],
            "html_url": issue["html_url"],
            "state": issue["state"],
            "created_at": issue["created_at"],
        }
    except httpx.HTTPStatusError as exc:
        logger.error("GitHub API error: %s", exc.response.text)
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=str(exc),
        ) from exc


@router.get("/detail/{owner}/{repo}/{number}", summary="Get full issue details")
async def get_issue_detail(
    owner: str,
    repo: str,
    number: int,
    token: str = Depends(get_token),
):
    """Fetch full issue details including body and comments."""
    service = GitHubService(token)
    try:
        issue = await service.get_issue_detail(owner=owner, repo=repo, number=number)
        comments = await service.get_issue_comments(owner=owner, repo=repo, number=number)
        return {
            "id": issue["id"],
            "number": issue["number"],
            "title": issue["title"],
            "state": issue["state"],
            "html_url": issue["html_url"],
            "body": issue.get("body") or "",
            "user": issue["user"]["login"],
            "labels": [l["name"] for l in issue.get("labels", [])],
            "assignees": [a["login"] for a in issue.get("assignees", [])],
            "milestone": issue["milestone"]["title"] if issue.get("milestone") else None,
            "created_at": issue["created_at"],
            "updated_at": issue["updated_at"],
            "closed_at": issue.get("closed_at"),
            "comments_count": issue.get("comments", 0),
            "reactions": {
                "total": issue.get("reactions", {}).get("total_count", 0),
                "+1": issue.get("reactions", {}).get("+1", 0),
                "-1": issue.get("reactions", {}).get("-1", 0),
                "laugh": issue.get("reactions", {}).get("laugh", 0),
                "heart": issue.get("reactions", {}).get("heart", 0),
                "rocket": issue.get("reactions", {}).get("rocket", 0),
                "eyes": issue.get("reactions", {}).get("eyes", 0),
            },
            "comments": [
                {
                    "id": c["id"],
                    "user": c["user"]["login"],
                    "body": c.get("body", ""),
                    "created_at": c["created_at"],
                }
                for c in comments
            ],
        }
    except httpx.HTTPStatusError as exc:
        logger.error("GitHub API error: %s", exc.response.text)
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=str(exc),
        ) from exc
