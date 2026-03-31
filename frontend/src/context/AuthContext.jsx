import { createContext, useContext, useState, useCallback } from "react";
import { verifyToken, exchangeOAuthCode } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => sessionStorage.getItem("gh_token") || "");
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("gh_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useCallback(async (pat) => {
    setLoading(true);
    setError("");
    try {
      const data = await verifyToken(pat);
      setTokenState(pat);
      setUser(data.user);
      sessionStorage.setItem("gh_token", pat);
      sessionStorage.setItem("gh_user", JSON.stringify(data.user));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithOAuth = useCallback(async (code) => {
    setLoading(true);
    setError("");
    try {
      const data = await exchangeOAuthCode(code);
      setTokenState(data.access_token);
      setUser(data.user);
      sessionStorage.setItem("gh_token", data.access_token);
      sessionStorage.setItem("gh_user", JSON.stringify(data.user));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setTokenState("");
    setUser(null);
    sessionStorage.removeItem("gh_token");
    sessionStorage.removeItem("gh_user");
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, error, login, loginWithOAuth, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
