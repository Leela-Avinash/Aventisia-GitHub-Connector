# GitHub Cloud Connector

FastAPI + React app that wraps the GitHub API. Authenticate with a PAT or OAuth, then browse repos, issues, commits, and open pull requests from a single dashboard.

## What it does

- **Auth** -- PAT or GitHub OAuth (token lives in `sessionStorage`, gone when you close the tab)
- **Repos** -- fetch for any user / org / yourself, paginated
- **Issues** -- list with state filter, expandable detail (body, reactions, comments), create new ones
- **Commits** -- history per repo/branch, inline diff viewer with colour-coded patches
- **Pull Requests** -- create PRs between branches (cross-repo too via `owner:branch`)

## Getting started

You need Python 3.10+ and Node 18+.

```bash
git clone <repo-url>

# frontend
cd frontend
npm install

# backend
python -m venv venv
venv\Scripts\activate        # or source venv/bin/activate on mac/linux
pip install -r requirements.txt
```

Drop a `.env` in the project root if you want OAuth:

```
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

To set that up: GitHub > Settings > Developer settings > OAuth Apps > New OAuth App.
Callback URL: `http://localhost:5173/auth/callback`. If you skip this, PAT login still works fine.

```bash
# start the api
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload

# in another terminal
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`. Vite proxies `/api/*` to the backend so you don't have to deal with CORS.

## API

Every endpoint except `/`, `/auth/github`, and `/auth/github/callback` needs an `Authorization` header:
```
Authorization: token <your-github-pat-or-oauth-token>
```

---

### `GET /`

Health check. No auth needed.

**Response:**
```json
{ "status": "ok", "message": "GitHub Cloud Connector is running." }
```

---

### `GET /auth/verify`

Validates the token in the `Authorization` header and returns the authenticated user's profile.

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "login": "your-username",
    "id": 12345678,
    "avatar_url": "https://avatars.githubusercontent.com/u/12345678",
    "name": "Your Name"
  }
}
```

---

### `GET /auth/github`

Redirects the browser to GitHub's OAuth authorization page. No auth header needed. Only works if `GITHUB_CLIENT_ID` is set in `.env`.

---

### `GET /auth/github/callback?code=<authorization-code>`

Exchanges the OAuth authorization code (returned by GitHub after the user approves) for an access token, then fetches the user profile.

| Query Param | Required | Description |
|-------------|----------|-------------|
| `code` | yes | The authorization code from GitHub's redirect |

**Response:**
```json
{
  "access_token": "gho_xxxxxxxxxxxx",
  "user": {
    "login": "your-username",
    "id": 12345678,
    "avatar_url": "https://avatars.githubusercontent.com/u/12345678",
    "name": "Your Name"
  }
}
```

---

### `GET /repos`

Fetches repositories. You can target a specific user, an organisation, or leave both blank to get your own repos.

| Query Param | Required | Description |
|-------------|----------|-------------|
| `username` | no | A GitHub username -- returns their public repos |
| `org` | no | An organisation name -- returns the org's repos |
| `page` | no | Page number (default `1`) |
| `per_page` | no | Results per page, 1-100 (default `30`) |

If both `username` and `org` are omitted, returns the authenticated user's repos (including private ones).

**Response:**
```json
{
  "count": 2,
  "page": 1,
  "per_page": 30,
  "repos": [
    {
      "id": 100000,
      "name": "my-project",
      "full_name": "your-username/my-project",
      "private": false,
      "html_url": "https://github.com/your-username/my-project",
      "description": "A short description of the repo",
      "language": "Python",
      "stargazers_count": 42,
      "forks_count": 5,
      "updated_at": "2026-03-15T10:30:00Z"
    }
  ]
}
```

---

### `GET /issues/{owner}/{repo}`

Lists issues from a repository. Pass the repo owner and repo name as path params.

| Path Param | Description |
|------------|-------------|
| `owner` | The GitHub username or org that owns the repo |
| `repo` | The repository name |

| Query Param | Required | Description |
|-------------|----------|-------------|
| `state` | no | `open`, `closed`, or `all` (default `open`) |
| `page` | no | Page number (default `1`) |
| `per_page` | no | Results per page, 1-100 (default `30`) |

**Response:**
```json
{
  "count": 1,
  "page": 1,
  "per_page": 30,
  "issues": [
    {
      "id": 500000,
      "number": 42,
      "title": "Login page crashes on Safari",
      "state": "open",
      "html_url": "https://github.com/your-username/my-project/issues/42",
      "user": "reporter-username",
      "labels": ["bug", "high-priority"],
      "created_at": "2026-03-20T08:00:00Z",
      "updated_at": "2026-03-21T14:00:00Z"
    }
  ]
}
```

---

### `GET /issues/detail/{owner}/{repo}/{number}`

Returns full detail for a single issue, including the body, reactions, assignees, milestone, and all comments.

| Path Param | Description |
|------------|-------------|
| `owner` | Repo owner |
| `repo` | Repo name |
| `number` | The issue number (e.g. `42`) |

**Response:**
```json
{
  "id": 500000,
  "number": 42,
  "title": "Login page crashes on Safari",
  "state": "open",
  "html_url": "https://github.com/your-username/my-project/issues/42",
  "body": "Full markdown body of the issue...",
  "user": "reporter-username",
  "labels": ["bug"],
  "assignees": ["dev-username"],
  "milestone": "v2.0",
  "created_at": "2026-03-20T08:00:00Z",
  "updated_at": "2026-03-21T14:00:00Z",
  "closed_at": null,
  "comments_count": 3,
  "reactions": {
    "total": 5,
    "+1": 3,
    "-1": 0,
    "laugh": 0,
    "heart": 1,
    "rocket": 1,
    "eyes": 0
  },
  "comments": [
    {
      "id": 900000,
      "user": "commenter-username",
      "body": "I can reproduce this on Safari 17.",
      "created_at": "2026-03-20T12:00:00Z"
    }
  ]
}
```

---

### `POST /issues/create`

Creates a new issue. Send a JSON body.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `owner` | string | yes | Repo owner (username or org) |
| `repo` | string | yes | Repo name |
| `title` | string | yes | Issue title |
| `body` | string | no | Markdown description |
| `labels` | string[] | no | Label names to attach |
| `assignees` | string[] | no | GitHub usernames to assign |

**Request:**
```json
{
  "owner": "your-username",
  "repo": "my-project",
  "title": "API returns 500 on empty input",
  "body": "Steps to reproduce:\n1. Leave the field blank\n2. Click submit",
  "labels": ["bug"],
  "assignees": ["your-username"]
}
```

**Response:**
```json
{
  "id": 500001,
  "number": 43,
  "title": "API returns 500 on empty input",
  "html_url": "https://github.com/your-username/my-project/issues/43",
  "state": "open",
  "created_at": "2026-03-31T09:00:00Z"
}
```

---

### `GET /commits/{owner}/{repo}`

Fetches commit history for a repository. Optionally filter by branch name or starting SHA.

| Path Param | Description |
|------------|-------------|
| `owner` | Repo owner |
| `repo` | Repo name |

| Query Param | Required | Description |
|-------------|----------|-------------|
| `sha` | no | Branch name (e.g. `main`, `develop`) or a commit SHA to start listing from |
| `page` | no | Page number (default `1`) |
| `per_page` | no | Results per page, 1-100 (default `30`) |

**Response:**
```json
{
  "count": 2,
  "page": 1,
  "per_page": 30,
  "commits": [
    {
      "sha": "abc123def456...",
      "message": "fix: handle null response in auth flow",
      "author": "Your Name",
      "date": "2026-03-30T18:00:00Z",
      "html_url": "https://github.com/your-username/my-project/commit/abc123def456"
    }
  ]
}
```

---

### `GET /commits/detail/{owner}/{repo}/{sha}`

Returns full detail for a single commit -- stats, list of changed files, and unified diff patches.

| Path Param | Description |
|------------|-------------|
| `owner` | Repo owner |
| `repo` | Repo name |
| `sha` | The full or abbreviated commit SHA |

**Response:**
```json
{
  "sha": "abc123def456...",
  "message": "fix: handle null response in auth flow",
  "author": "Your Name",
  "author_login": "your-username",
  "author_avatar": "https://avatars.githubusercontent.com/u/12345678",
  "date": "2026-03-30T18:00:00Z",
  "html_url": "https://github.com/your-username/my-project/commit/abc123def456",
  "stats": {
    "total": 10,
    "additions": 7,
    "deletions": 3
  },
  "files": [
    {
      "filename": "src/auth.js",
      "status": "modified",
      "additions": 5,
      "deletions": 2,
      "changes": 7,
      "patch": "@@ -12,6 +12,9 @@ function verify(token) {\n+  if (!response) return null;\n ..."
    }
  ]
}
```

---

### `POST /pulls/create`

Creates a pull request. Send a JSON body.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `owner` | string | yes | Repo owner |
| `repo` | string | yes | Repo name |
| `title` | string | yes | PR title |
| `head` | string | yes | The branch with your changes. For cross-repo PRs use `theiruser:branch-name` |
| `base` | string | yes | The branch you want to merge into (e.g. `main`) |
| `body` | string | no | Markdown description of the changes |

**Request:**
```json
{
  "owner": "your-username",
  "repo": "my-project",
  "title": "Add input validation to login form",
  "head": "fix/login-validation",
  "base": "main",
  "body": "Adds client-side validation before calling the API."
}
```

**Response:**
```json
{
  "id": 700000,
  "number": 15,
  "title": "Add input validation to login form",
  "html_url": "https://github.com/your-username/my-project/pull/15",
  "state": "open",
  "created_at": "2026-03-31T09:30:00Z"
}
```

## Quick test

```bash
TOKEN=ghp_xxxxxxxxxxxx
BASE=http://127.0.0.1:8001

curl -H "Authorization: token $TOKEN" $BASE/auth/verify
curl -H "Authorization: token $TOKEN" "$BASE/repos?username=torvalds"
curl -H "Authorization: token $TOKEN" "$BASE/issues/facebook/react?state=open"
curl -H "Authorization: token $TOKEN" "$BASE/commits/facebook/react?sha=main"
```
#   A v e n t i s i a - G i t H u b - C o n n e c t o r  
 