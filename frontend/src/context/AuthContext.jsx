import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";

const AuthContext = createContext(null);

const TOKEN_KEY = "scam_defender_token";
const USER_KEY = "scam_defender_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }, [token, user]);

  async function login(email, password) {
    setLoading(true);
    try {
      const payload = await apiRequest("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(payload.access_token);
      setUser(payload.user);
      return payload.user;
    } finally {
      setLoading(false);
    }
  }

  async function register(formData) {
    setLoading(true);
    try {
      const payload = await apiRequest("/auth/register", {
        method: "POST",
        body: formData,
      });
      setToken(payload.access_token);
      setUser(payload.user);
      return payload.user;
    } finally {
      setLoading(false);
    }
  }

  async function refreshUser() {
    if (!token) {
      setUser(null);
      return null;
    }

    const payload = await apiRequest("/auth/me", { token });
    setUser(payload.user);
    return payload.user;
  }

  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      refreshUser,
      logout,
      setUser,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
