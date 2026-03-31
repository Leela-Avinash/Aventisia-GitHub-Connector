import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchRepos } from "../api";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import Pagination from "../components/Pagination";
import EmptyState from "../components/EmptyState";
import {
  BookMarked,
  ExternalLink,
  Lock,
  Star,
  GitFork,
  Search,
} from "lucide-react";

export default function ReposPage() {
  const { token } = useAuth();
  const [username, setUsername] = useState("");
  const [org, setOrg] = useState("");
  const [repos, setRepos] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchRepos(token, {
          username: username.trim() || undefined,
          org: org.trim() || undefined,
          page: p,
          perPage,
        });
        setRepos(data);
        setPage(p);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [token, username, org, perPage]
  );

  function handleSubmit(e) {
    e.preventDefault();
    load(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">Repositories</h1>
        <p className="mt-1 text-sm text-muted">
          Fetch repositories for a user, organisation, or your own account.
        </p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-primary mb-1">Username</label>
          <input
            type="text"
            placeholder="github username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-primary mb-1">Organisation</label>
          <input
            type="text"
            placeholder="e.g. facebook"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
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
      {loading && !repos && (
        <div className="flex justify-center py-12">
          <Spinner className="!text-accent" />
        </div>
      )}

      {repos && repos.repos.length === 0 && (
        <EmptyState
          icon={BookMarked}
          title="No repositories found"
          description="Try a different username or organisation."
        />
      )}

      {repos && repos.repos.length > 0 && (
        <div className="space-y-3">
          {repos.repos.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-border bg-canvas p-4 hover:border-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={r.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-accent hover:underline truncate"
                    >
                      {r.full_name}
                    </a>
                    {r.private && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                        <Lock size={10} /> Private
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p className="mt-1 text-sm text-muted line-clamp-2">{r.description}</p>
                  )}
                </div>
                <a
                  href={r.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-muted hover:text-accent transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
                {r.language && (
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                    {r.language}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Star size={12} /> {r.stargazers_count.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1">
                  <GitFork size={12} /> {r.forks_count.toLocaleString()}
                </span>
                <span>Updated {new Date(r.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}

          <Pagination
            page={page}
            count={repos.count}
            perPage={perPage}
            onPageChange={(p) => load(p)}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
