import { createContext, useContext, useState, useEffect } from "react";

const API = import.meta.env.VITE_AUTH_API || "http://localhost:5000/api/auth";

const AuthContext = createContext(undefined);

async function apiCall(endpoint, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) {
      fetch(`${API}/me`, { headers: { Authorization: `Bearer ${savedToken}` } })
        .then((r) => r.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            setToken(savedToken);
          } else localStorage.removeItem("auth_token");
        })
        .catch(() => localStorage.removeItem("auth_token"))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const persist = (u, t) => {
    setUser(u);
    setToken(t);
    localStorage.setItem("auth_token", t);
  };

  const login = async (email, password) => {
    try {
      const { ok, data } = await apiCall("/login", { email, password });
      if (ok) {
        persist(data.user, data.token);
        return { success: true };
      }
      return {
        success: false,
        error: data.error,
        needsVerification: data.needsVerification,
      };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const { ok, data } = await apiCall("/signup", { name, email, password });
      if (ok) {
        persist(data.user, data.token);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const googleLogin = async (profile) => {
    try {
      const { ok, data } = await apiCall("/google", profile);
      if (ok) {
        persist(data.user, data.token);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const { ok, data } = await apiCall("/verify-otp", { email, otp });
      if (ok) {
        persist(data.user, data.token);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const resendOtp = async (email) => {
    try {
      const { ok, data } = await apiCall("/resend-otp", { email });
      if (ok) return { success: true };
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const { ok, data } = await apiCall("/forgot-password", { email });
      if (ok) return { success: true, message: data.message };
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const { ok, data } = await apiCall("/reset-password", {
        email,
        otp,
        newPassword,
      });
      if (ok) {
        persist(data.user, data.token);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        googleLogin,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
