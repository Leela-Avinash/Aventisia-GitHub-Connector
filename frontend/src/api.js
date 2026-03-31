const API_BASE = "/api";

function authHeaders(token) {
  return {
    Authorization: `token ${token}`,
    "Content-Type": "application/json",
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        // FastAPI validation errors
        message = data.detail.map((e) => `${e.loc?.join(" → ") || "field"}: ${e.msg}`).join("; ");
      } else if (data.message) {
        message = data.message;
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(message);
  }
  return res.json();
}

export async function verifyToken(token) {
  const res = await fetch(`${API_BASE}/auth/verify`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function fetchRepos(token, { username, org, page = 1, perPage = 30 } = {}) {
  const params = new URLSearchParams();
  if (username) params.set("username", username);
  if (org) params.set("org", org);
  params.set("page", page);
  params.set("per_page", perPage);
  const res = await fetch(`${API_BASE}/repos?${params}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function listIssues(token, owner, repo, { state = "open", page = 1, perPage = 30 } = {}) {
  const params = new URLSearchParams({ state, page, per_page: perPage });
  const res = await fetch(`${API_BASE}/issues/${owner}/${repo}?${params}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function createIssue(token, payload) {
  const res = await fetch(`${API_BASE}/issues/create`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function fetchIssueDetail(token, owner, repo, number) {
  const res = await fetch(`${API_BASE}/issues/detail/${owner}/${repo}/${number}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function fetchCommits(token, owner, repo, { sha, page = 1, perPage = 30 } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  if (sha) params.set("sha", sha);
  const res = await fetch(`${API_BASE}/commits/${owner}/${repo}?${params}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function fetchCommitDetail(token, owner, repo, sha) {
  const res = await fetch(`${API_BASE}/commits/detail/${owner}/${repo}/${sha}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function createPullRequest(token, payload) {
  const res = await fetch(`${API_BASE}/pulls/create`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function exchangeOAuthCode(code) {
  const res = await fetch(`${API_BASE}/auth/github/callback?code=${encodeURIComponent(code)}`);
  return handleResponse(res);
}

export function getOAuthUrl() {
  return `${API_BASE}/auth/github`;
}
