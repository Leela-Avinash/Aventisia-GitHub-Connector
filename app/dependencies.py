"""Dependency that extracts the GitHub PAT from the Authorization header."""

from fastapi import Header, HTTPException


def get_token(
    authorization: str = Header(
        ..., description="GitHub PAT – send as 'token <PAT>' or 'Bearer <PAT>'"
    ),
) -> str:
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() in ("token", "bearer"):
        return parts[1]
    if len(parts) == 1:
        return parts[0]
    raise HTTPException(
        status_code=401,
        detail="Invalid Authorization header format. Use 'token <PAT>' or 'Bearer <PAT>'.",
    )
