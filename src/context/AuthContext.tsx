import React, { createContext, useContext, useState, useEffect } from "react";

const AUTH_KEY = "g1-admin-token";
const API_URL  = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (token === "authenticated") {
      setIsAuthenticated(true);
    }
  }, []);

  /**
   * Envia as credenciais ao backend — a verificação acontece no servidor,
   * onde ADMIN_USER e ADMIN_PASS vivem no .env sem o prefixo VITE_.
   * Nenhuma senha chega ao bundle JavaScript do navegador.
   */
  const login = async (user: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pass }),
      });
      if (res.ok) {
        localStorage.setItem(AUTH_KEY, "authenticated");
        setIsAuthenticated(true);
        return true;
      }
    } catch {
      // sem conexão com o servidor
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
