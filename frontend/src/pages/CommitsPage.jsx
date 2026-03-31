import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchCommits, fetchCommitDetail } from "../api";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import Pagination from "../components/Pagination";
import EmptyState from "../components/EmptyState";
import {
  GitCommitHorizontal,
  Search,
  ChevronDown,
  ChevronRight,
  FileDiff,
  Plus,
  Minus,
  ExternalLink,
} from "lucide-react";

function FileStatusBadge({ status }) {
  const map = {
    added: "bg-green-100 text-green-700",
    removed: "bg-red-100 text-red-700",
    modified: "bg-yellow-100 text-yellow-700",
    renamed: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${map[status] || "bg-surface text-muted"}`}>
      {status}
    </span>
  );
}

function CommitRow({ commit, owner, repo }) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (detail) return; // already loaded
    setLoading(true);
    setError("");
    try {
      const data = await fetchCommitDetail(token, owner, repo, commit.sha);
      setDetail(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const firstLine = commit.message.split("\n")[0];
  const restLines = commit.message.split("\n").slice(1).join("\n").trim();

  return (
    <div className="rounded-lg border border-border bg-canvas hover:border-accent/30 transition-colors">
      {/* Commit header row */}
      <button
        onClick={toggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        {expanded ? (
          <ChevronDown size={16} className="mt-0.5 shrink-0 text-accent" />
        ) : (
          <ChevronRight size={16} className="mt-0.5 shrink-0 text-muted" />
        )}
        <GitCommitHorizontal size={18} className="mt-0.5 shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary line-clamp-1">{firstLine}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>{commit.author}</span>
            <span>committed on {new Date(commit.date).toLocaleDateString()}</span>
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">
              {commit.sha.substring(0, 7)}
            </code>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
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
              {/* Full commit message */}
              {restLines && (
                <pre className="whitespace-pre-wrap rounded-md bg-surface p-3 text-sm text-primary font-mono border border-border">
                  {restLines}
                </pre>
              )}

              {/* Stats summary */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted">
                  <FileDiff size={14} />
                  {detail.files.length} file{detail.files.length !== 1 ? "s" : ""} changed
                </span>
                {detail.stats.additions != null && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Plus size={14} />
                    {detail.stats.additions} addition{detail.stats.additions !== 1 ? "s" : ""}
                  </span>
                )}
                {detail.stats.deletions != null && (
                  <span className="flex items-center gap-1 text-red-600">
                    <Minus size={14} />
                    {detail.stats.deletions} deletion{detail.stats.deletions !== 1 ? "s" : ""}
                  </span>
                )}
                <a
                  href={detail.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:ml-auto inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  View on GitHub <ExternalLink size={12} />
                </a>
              </div>

              {/* Files list */}
              <div className="space-y-2">
                {detail.files.map((f) => (
                  <details key={f.filename} className="group rounded-md border border-border">
                    <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-surface transition-colors">
                      <FileStatusBadge status={f.status} />
                      <span className="font-mono text-xs text-primary truncate flex-1">{f.filename}</span>
                      <span className="shrink-0 text-xs text-green-600">+{f.additions}</span>
                      <span className="shrink-0 text-xs text-red-600">-{f.deletions}</span>
                    </summary>
                    {f.patch && (
                      <pre className="overflow-x-auto border-t border-border bg-[#fafbfc] px-3 py-2 text-xs font-mono leading-5">
                        {f.patch.split("\n").map((line, i) => {
                          let cls = "text-primary";
                          if (line.startsWith("+")) cls = "text-green-700 bg-green-50";
                          else if (line.startsWith("-")) cls = "text-red-700 bg-red-50";
                          else if (line.startsWith("@@")) cls = "text-blue-600 bg-blue-50";
                          return (
                            <div key={i} className={`${cls} px-1 -mx-1`}>
                              {line}
                            </div>
                          );
                        })}
                      </pre>
                    )}
                  </details>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommitsPage() {
  const { token } = useAuth();
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [sha, setSha] = useState("");
  const [commits, setCommits] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (p = 1) => {
      if (!owner.trim() || !repo.trim()) return;
      setLoading(true);
      setError("");
      try {
        const data = await fetchCommits(token, owner.trim(), repo.trim(), {
          sha: sha.trim() || undefined,
          page: p,
          perPage,
        });
        setCommits(data);
        setPage(p);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [token, owner, repo, sha, perPage]
  );

  function handleSubmit(e) {
    e.preventDefault();
    load(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">Commits</h1>
        <p className="mt-1 text-sm text-muted">
          View the commit history of any repository and branch.
        </p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-44">
          <label className="block text-sm font-medium text-primary mb-1">Owner *</label>
          <input
            required
            type="text"
            placeholder="username or org"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="w-full sm:w-44">
          <label className="block text-sm font-medium text-primary mb-1">Repository *</label>
          <input
            required
            type="text"
            placeholder="repo-name"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="w-full sm:w-44">
          <label className="block text-sm font-medium text-primary mb-1">Branch / SHA</label>
          <input
            type="text"
            placeholder="main"
            value={sha}
            onChange={(e) => setSha(e.target.value)}
            className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {loading ? <Spinner className="text-white" /> : <Search size={16} />}
          Fetch
        </button>
      </form>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {/* Results */}
      {loading && !commits && (
        <div className="flex justify-center py-12">
          <Spinner className="!text-accent" />
        </div>
      )}

      {commits && commits.commits.length === 0 && (
        <EmptyState
          icon={GitCommitHorizontal}
          title="No commits found"
          description="Try a different repository or branch."
        />
      )}

      {commits && commits.commits.length > 0 && (
        <div className="space-y-2">
          {commits.commits.map((c, i) => (
            <CommitRow
              key={`${c.sha}-${i}`}
              commit={c}
              owner={owner.trim()}
              repo={repo.trim()}
            />
          ))}

          <Pagination
            page={page}
            count={commits.count}
            perPage={perPage}
            onPageChange={(p) => load(p)}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
