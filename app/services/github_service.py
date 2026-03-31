import logging
from typing import Any, Optional

import httpx

from app.config.settings import GITHUB_API_BASE

logger = logging.getLogger(__name__)


class GitHubService:
    """Service layer for interacting with the GitHub API."""

    def __init__(self, token: str):
        self.token = token
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    async def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[dict] = None,
        json_body: Optional[dict] = None,
    ) -> Any:
        """Make an authenticated request to the GitHub API."""
        url = f"{GITHUB_API_BASE}{endpoint}"
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method,
                url,
                headers=self.headers,
                params=params,
                json=json_body,
                timeout=30.0,
            )
            if response.status_code >= 400:
                self._raise_detailed_error(response, endpoint)
            return response.json()

    @staticmethod
    def _raise_detailed_error(response: httpx.Response, endpoint: str) -> None:
        """Parse GitHub's error response and raise an httpx.HTTPStatusError with a
        human-friendly message that includes validation details when available."""
        try:
            body = response.json()
        except Exception:
            body = {}

        message = body.get("message", "GitHub API error")
        status = response.status_code

        # Build a contextual prefix from the endpoint
        resource = "Resource"
        if "/repos/" in endpoint:
            parts = endpoint.split("/")
            # e.g. /repos/owner/repo/...
            if len(parts) >= 4:
                resource = f"Repository '{parts[2]}/{parts[3]}'"

        # Map common status codes to friendly messages
        status_messages = {
            401: "Authentication failed. Your token may be invalid or expired.",
            403: f"{resource}: Access denied. Your token may lack the required permissions (needs 'repo' scope for private repos).",
            404: f"{resource} was not found, or you don't have permission to access it.",
            422: None,  # handled below with validation details
        }

        if status == 422:
            # Include GitHub's validation error details
            errors = body.get("errors", [])
            if errors:
                details = "; ".join(
                    e.get("message", f"field '{e.get('field', '?')}' {e.get('code', 'invalid')}")
                    for e in errors
                )
                message = f"Validation failed: {details}"
            else:
                message = f"Validation failed: {message}"
        elif status in status_messages and status_messages[status]:
            message = status_messages[status]

        # Raise so existing except blocks still work
        raise httpx.HTTPStatusError(
            message=message,
            request=response.request,
            response=response,
        )

    # ── Repositories ─────────────────────────────────────────────

    async def get_repos(
        self,
        username: Optional[str] = None,
        org: Optional[str] = None,
        page: int = 1,
        per_page: int = 30,
    ) -> list[dict]:
        """Fetch repositories for a user or organisation."""
        params = {"page": page, "per_page": per_page}
        if org:
            endpoint = f"/orgs/{org}/repos"
        elif username:
            endpoint = f"/users/{username}/repos"
        else:
            # Authenticated user's repos
            endpoint = "/user/repos"
        logger.info("Fetching repos: %s", endpoint)
        return await self._request("GET", endpoint, params=params)

    # ── Issues ───────────────────────────────────────────────────

    async def list_issues(
        self,
        owner: str,
        repo: str,
        state: str = "open",
        page: int = 1,
        per_page: int = 30,
    ) -> list[dict]:
        """List issues from a repository."""
        endpoint = f"/repos/{owner}/{repo}/issues"
        params = {"state": state, "page": page, "per_page": per_page}
        logger.info("Listing issues: %s", endpoint)
        return await self._request("GET", endpoint, params=params)

    async def create_issue(
        self,
        owner: str,
        repo: str,
        title: str,
        body: Optional[str] = None,
        labels: Optional[list[str]] = None,
        assignees: Optional[list[str]] = None,
    ) -> dict:
        """Create an issue in a repository."""
        endpoint = f"/repos/{owner}/{repo}/issues"
        payload: dict[str, Any] = {"title": title}
        if body is not None:
            payload["body"] = body
        if labels:
            payload["labels"] = labels
        if assignees:
            payload["assignees"] = assignees
        logger.info("Creating issue in %s/%s: %s", owner, repo, title)
        return await self._request("POST", endpoint, json_body=payload)

    async def get_issue_detail(
        self,
        owner: str,
        repo: str,
        number: int,
    ) -> dict:
        """Fetch full details for a single issue including body and comments."""
        endpoint = f"/repos/{owner}/{repo}/issues/{number}"
        logger.info("Fetching issue detail: %s", endpoint)
        return await self._request("GET", endpoint)

    async def get_issue_comments(
        self,
        owner: str,
        repo: str,
        number: int,
    ) -> list[dict]:
        """Fetch comments for a single issue."""
        endpoint = f"/repos/{owner}/{repo}/issues/{number}/comments"
        logger.info("Fetching issue comments: %s", endpoint)
        return await self._request("GET", endpoint)

    # ── Commits ──────────────────────────────────────────────────

    async def get_commits(
        self,
        owner: str,
        repo: str,
        sha: Optional[str] = None,
        page: int = 1,
        per_page: int = 30,
    ) -> list[dict]:
        """Fetch commits from a repository."""
        endpoint = f"/repos/{owner}/{repo}/commits"
        params: dict[str, Any] = {"page": page, "per_page": per_page}
        if sha:
            params["sha"] = sha
        logger.info("Fetching commits: %s", endpoint)
        return await self._request("GET", endpoint, params=params)

    async def get_commit_detail(
        self,
        owner: str,
        repo: str,
        sha: str,
    ) -> dict:
        """Fetch full details for a single commit (including files changed)."""
        endpoint = f"/repos/{owner}/{repo}/commits/{sha}"
        logger.info("Fetching commit detail: %s", endpoint)
        return await self._request("GET", endpoint)

    # ── Pull Requests (Bonus) ────────────────────────────────────

    async def create_pull_request(
        self,
        owner: str,
        repo: str,
        title: str,
        head: str,
        base: str,
        body: Optional[str] = None,
    ) -> dict:
        """Create a pull request in a repository."""
        endpoint = f"/repos/{owner}/{repo}/pulls"
        payload: dict[str, Any] = {
            "title": title,
            "head": head,
            "base": base,
        }
        if body is not None:
            payload["body"] = body
        logger.info("Creating PR in %s/%s: %s", owner, repo, title)
        return await self._request("POST", endpoint, json_body=payload)

    # ── Auth verification ────────────────────────────────────────

    async def get_authenticated_user(self) -> dict:
        """Return the currently authenticated user (used to verify token)."""
        logger.info("Verifying authentication")
        return await self._request("GET", "/user")
