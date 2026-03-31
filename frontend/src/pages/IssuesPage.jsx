import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { listIssues, createIssue, fetchIssueDetail } from "../api";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import Pagination from "../components/Pagination";
import EmptyState from "../components/EmptyState";
import {
  CircleDot,
  ExternalLink,
  Plus,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  User,
  Tag,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Heart,
  Rocket,
  Eye,
} from "lucide-react";

function IssueRow({ issue, owner, repo }) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stateColors = {
    open: "text-success",
    closed: "text-danger",
  };

  async function toggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (detail) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchIssueDetail(token, owner, repo, issue.number);
      setDetail(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-canvas hover:border-accent/30 transition-colors">
      <button
        onClick={toggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        {expanded ? (
          <ChevronDown size={16} className="mt-0.5 shrink-0 text-accent" />
        ) : (
          <ChevronRight size={16} className="mt-0.5 shrink-0 text-muted" />
        )}
        <CircleDot
          size={18}
          className={`mt-0.5 shrink-0 ${stateColors[issue.state] || "text-muted"}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-primary">
              {issue.title}
            </span>
            {issue.labels.map((label) => (
              <span
                key={label}
                className="rounded-full bg-surface border border-border px-2 py-0.5 text-xs text-muted"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            #{issue.number} opened on{" "}
            {new Date(issue.created_at).toLocaleDateString()} by {issue.user}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {loading && (
            <div className="flex justify-center py-4">
              <Spinner className="!text-accent" />
            </div>
          )}

          {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

          {detail && (
            <>
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted">
                  <MessageSquare size={14} />
                  {detail.comments_count} comment{detail.comments_count !== 1 ? "s" : ""}
                </span>
                {detail.assignees.length > 0 && (
                  <span className="flex items-center gap-1 text-muted">
                    <User size={14} />
                    {detail.assignees.join(", ")}
                  </span>
                )}
                {detail.milestone && (
                  <span className="flex items-center gap-1 text-muted">
                    <Tag size={14} />
                    {detail.milestone}
                  </span>
                )}
                {detail.closed_at && (
                  <span className="flex items-center gap-1 text-muted">
                    <Calendar size={14} />
                    Closed {new Date(detail.closed_at).toLocaleDateString()}
                  </span>
                )}
                <a
                  href={detail.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  View on GitHub <ExternalLink size={12} />
                </a>
              </div>

              {/* Reactions */}
              {detail.reactions.total > 0 && (
                <div className="flex flex-wrap gap-2 text-sm">
                  {detail.reactions["+1"] > 0 && <span className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-xs border border-border"><ThumbsUp size={12} /> {detail.reactions["+1"]}</span>}
                  {detail.reactions["-1"] > 0 && <span className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-xs border border-border"><ThumbsDown size={12} /> {detail.reactions["-1"]}</span>}
                  {detail.reactions.laugh > 0 && <span className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-xs border border-border"><Smile size={12} /> {detail.reactions.laugh}</span>}
                  {detail.reactions.heart > 0 && <span className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-xs border border-border"><Heart size={12} /> {detail.reactions.heart}</span>}
                  {detail.reactions.rocket > 0 && <span className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-xs border border-border"><Rocket size={12} /> {detail.reactions.rocket}</span>}
                  {detail.reactions.eyes > 0 && <span className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-xs border border-border"><Eye size={12} /> {detail.reactions.eyes}</span>}
                </div>
              )}

              {/* Issue body */}
              {detail.body && (
                <pre className="whitespace-pre-wrap rounded-md bg-surface p-3 text-sm text-primary font-mono border border-border max-h-64 overflow-y-auto">
                  {detail.body}
                </pre>
              )}

              {/* Comments */}
              {detail.comments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-primary">Comments</h4>
                  {detail.comments.map((c) => (
                    <div key={c.id} className="rounded-md border border-border p-3 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="font-semibold text-primary">{c.user}</span>
                        <span>commented on {new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <pre className="whitespace-pre-wrap text-sm text-primary font-mono max-h-40 overflow-y-auto">
                        {c.body}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function IssuesPage() {
  const { token } = useAuth();

  // List issues state
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [state, setState] = useState("open");
  const [issues, setIssues] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Create issue modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ owner: "", repo: "", title: "", body: "", labels: "", assignees: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const load = useCallback(
    async (p = 1) => {
      if (!owner.trim() || !repo.trim()) return;
      setLoading(true);
      setError("");
      try {
        const data = await listIssues(token, owner.trim(), repo.trim(), {
          state,
          page: p,
          perPage,
        });
        setIssues(data);
        setPage(p);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [token, owner, repo, state, perPage]
  );

  function handleSearch(e) {
    e.preventDefault();
    load(1);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const payload = {
        owner: createForm.owner,
        repo: createForm.repo,
        title: createForm.title,
        body: createForm.body || undefined,
        labels: createForm.labels ? createForm.labels.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        assignees: createForm.assignees ? createForm.assignees.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      };
      await createIssue(token, payload);
      // Close modal and refresh the list if viewing the same repo
      setShowCreate(false);
      if (createForm.owner === owner && createForm.repo === repo) {
        load(1);
      }
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function openCreateModal() {
    setCreateForm({ owner: owner || "", repo: repo || "", title: "", body: "", labels: "", assignees: "" });
    setCreateError("");
    setShowCreate(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-primary">Issues</h1>
          <p className="mt-1 text-sm text-muted">
            List and create issues in any repository you have access to.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 transition-colors"
        >
          <Plus size={16} /> New Issue
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-44">
          <label className="block text-sm font-medium text-primary mb-1">Owner</label>
          <input
            type="text"
            required
            placeholder="username or org"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="w-full sm:w-44">
          <label className="block text-sm font-medium text-primary mb-1">Repository</label>
          <input
            type="text"
            required
            placeholder="repo-name"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="w-full sm:w-32">
          <label className="block text-sm font-medium text-primary mb-1">State</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {loading ? <Spinner className="text-white" /> : <Search size={16} />}
          Search
        </button>
      </form>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {/* Results */}
      {loading && !issues && (
        <div className="flex justify-center py-12">
          <Spinner className="!text-accent" />
        </div>
      )}

      {issues && issues.issues.length === 0 && (
        <EmptyState icon={CircleDot} title="No issues found" description="Try a different repository or state filter." />
      )}

      {issues && issues.issues.length > 0 && (
        <div className="space-y-2">
          {issues.issues.map((issue) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              owner={owner.trim()}
              repo={repo.trim()}
            />
          ))}

          <Pagination page={page} count={issues.count} perPage={perPage} onPageChange={(p) => load(p)} loading={loading} />
        </div>
      )}

      {/* Create Issue Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 sm:px-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-canvas shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-4">
              <h2 className="text-lg font-semibold text-primary">Create New Issue</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted hover:text-primary transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCreate} className="space-y-4 px-4 sm:px-6 py-5">
              <ErrorBanner message={createError} onDismiss={() => setCreateError("")} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Owner *</label>
                  <input
                    required
                    value={createForm.owner}
                    onChange={(e) => setCreateForm({ ...createForm, owner: e.target.value })}
                    placeholder="username or org"
                    className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Repository *</label>
                  <input
                    required
                    value={createForm.repo}
                    onChange={(e) => setCreateForm({ ...createForm, repo: e.target.value })}
                    placeholder="repo-name"
                    className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Title *</label>
                <input
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="Short summary of the issue"
                  className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Description</label>
                <textarea
                  rows={4}
                  value={createForm.body}
                  onChange={(e) => setCreateForm({ ...createForm, body: e.target.value })}
                  placeholder="Markdown description..."
                  className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Labels</label>
                  <input
                    value={createForm.labels}
                    onChange={(e) => setCreateForm({ ...createForm, labels: e.target.value })}
                    placeholder="bug, help wanted"
                    className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Assignees</label>
                  <input
                    value={createForm.assignees}
                    onChange={(e) => setCreateForm({ ...createForm, assignees: e.target.value })}
                    placeholder="user1, user2"
                    className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-primary hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50 transition-colors"
                >
                  {creating ? <Spinner className="text-white" /> : <Plus size={16} />}
                  {creating ? "Creating..." : "Create Issue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
