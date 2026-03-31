from typing import Optional
from pydantic import BaseModel, Field

# ── Request schemas ──────────────────────────────────────────────

class CreateIssueRequest(BaseModel):
    owner: str = Field(..., description="Repository owner (user or org)")
    repo: str = Field(..., description="Repository name")
    title: str = Field(..., description="Issue title")
    body: Optional[str] = Field(None, description="Issue body (markdown)")
    labels: Optional[list[str]] = Field(None, description="Labels to attach")
    assignees: Optional[list[str]] = Field(None, description="Users to assign")

class CreatePullRequestRequest(BaseModel):
    owner: str = Field(..., description="Repository owner")
    repo: str = Field(..., description="Repository name")
    title: str = Field(..., description="PR title")
    head: str = Field(..., description="Branch containing changes")
    base: str = Field(..., description="Branch to merge into")
    body: Optional[str] = Field(None, description="PR description")
