import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getOAuthUrl } from "../api";
import { KeyRound, LogIn } from "lucide-react";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [pat, setPat] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pat.trim()) return;
    await login(pat.trim());
  }

  function handleOAuth() {
    window.location.href = getOAuthUrl();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
            <KeyRound size={28} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-primary">GitHub Cloud Connector</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in with your GitHub account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-canvas p-6 shadow-sm space-y-5">
          <ErrorBanner message={error} />

          {/* OAuth Button */}
          <button
            type="button"
            onClick={handleOAuth}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-[#32383f] transition-colors"
          >
            <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            Sign in with GitHub
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-canvas px-2 text-muted">or use a Personal Access Token</span>
            </div>
          </div>

          {/* PAT Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="pat" className="block text-sm font-medium text-primary">
                Personal Access Token
              </label>
              <input
                id="pat"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                autoFocus
                required
                className="mt-1.5 block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-primary placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
              />
              <p className="mt-2 text-xs text-muted">
                GitHub &rarr; Settings &rarr; Developer settings &rarr; Personal access tokens &rarr;
                Generate new token. Grant at least <code className="rounded bg-surface px-1 py-0.5 text-xs">repo</code> scope.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !pat.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Spinner className="text-white" /> : <LogIn size={16} />}
              {loading ? "Verifying..." : "Connect with PAT"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
