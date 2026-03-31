import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import ErrorBanner from "../components/ErrorBanner";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { loginWithOAuth } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const exchanged = useRef(false); // prevent StrictMode double-exchange

  useEffect(() => {
    if (exchanged.current) return; // already running / completed
    exchanged.current = true;

    const code = searchParams.get("code");
    if (!code) {
      setError("No authorization code received from GitHub.");
      return;
    }

    (async () => {
      const success = await loginWithOAuth(code);
      if (success) {
        navigate("/", { replace: true });
      } else {
        setError("Failed to authenticate with GitHub. Please try again.");
      }
    })();
  }, [searchParams, loginWithOAuth, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md text-center space-y-4">
        {error ? (
          <>
            <ErrorBanner message={error} />
            <a
              href="/login"
              className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Back to Login
            </a>
          </>
        ) : (
          <>
            <Spinner className="!text-accent mx-auto" />
            <p className="text-sm text-muted">Completing GitHub authentication...</p>
          </>
        )}
      </div>
    </div>
  );
}
