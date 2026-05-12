import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("gco_token");
      const storedUser = localStorage.getItem("gco_user");
      if (stored && storedUser) {
        setToken(stored);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      /* ignore parse errors */
    }
    setReady(true);
  }, []);

  const login = (tokenVal, userVal) => {
    localStorage.setItem("gco_token", tokenVal);
    localStorage.setItem("gco_user", JSON.stringify(userVal));
    setToken(tokenVal);
    setUser(userVal);
  };

  const logout = () => {
    localStorage.removeItem("gco_token");
    localStorage.removeItem("gco_user");
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, ready, authHeader }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
