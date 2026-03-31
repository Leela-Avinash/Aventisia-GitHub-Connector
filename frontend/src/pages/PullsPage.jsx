import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createPullRequest } from "../api";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";
import { GitPullRequest, CheckCircle2, ExternalLink } from "lucide-react";

export default function PullsPage() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    owner: "",
    repo: "",
    title: "",
    head: "",
    base: "main",
    body: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(null);
    try {
      const payload = {
        owner: form.owner.trim(),
        repo: form.repo.trim(),
        title: form.title.trim(),
        head: form.head.trim(),
        base: form.base.trim(),
        body: form.body.trim() || undefined,
      };
      const result = await createPullRequest(token, payload);
      setSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">Create Pull Request</h1>
        <p className="mt-1 text-sm text-muted">
          Propose changes from one branch to another in any repository you have push access to.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl rounded-xl border border-border bg-canvas p-4 sm:p-6 shadow-sm space-y-5"
      >
        <ErrorBanner message={error} onDismiss={() => setError("")} />

        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-success">
            <CheckCircle2 size={16} />
            <span>
              Pull request{" "}
              <a
                href={success.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium underline"
              >
                #{success.number} <ExternalLink size={12} />
              </a>{" "}
              created successfully.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Owner *</label>
            <input
              required
              value={form.owner}
              onChange={(e) => update("owner", e.target.value)}
              placeholder="username or org"
              className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Repository *</label>
            <input
              required
              value={form.repo}
              onChange={(e) => update("repo", e.target.value)}
              placeholder="repo-name"
              className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-1">Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Add new feature"
            className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Head branch *</label>
            <input
              required
              value={form.head}
              onChange={(e) => update("head", e.target.value)}
              placeholder="feature-branch"
              className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <p className="mt-1 text-xs text-muted">Branch containing your changes. For cross-repo PRs use <code className="bg-surface px-1 rounded">username:branch</code></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Base branch *</label>
            <input
              required
              value={form.base}
              onChange={(e) => update("base", e.target.value)}
              placeholder="main"
              className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <p className="mt-1 text-xs text-muted">Branch to merge into</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-1">Description</label>
          <textarea
            rows={5}
            value={form.body}
            onChange={(e) => update("body", e.target.value)}
            placeholder="Describe the changes in this pull request..."
            className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-y"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-[#8250df] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#7040c0] disabled:opacity-50 transition-colors"
          >
            {loading ? <Spinner className="text-white" /> : <GitPullRequest size={16} />}
            {loading ? "Creating..." : "Create Pull Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
