import React, { createContext, useContext, useState, useEffect } from "react";
import { Role } from "@/lib/mock-data";

interface AuthState {
  currentRole: Role | null;
  factoryName: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (role: Role, factoryName: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const role = localStorage.getItem("gf_role") as Role | null;
    const factory = localStorage.getItem("gf_factory");
    return {
      currentRole: role,
      factoryName: factory,
      isAuthenticated: !!(role && factory),
    };
  });

  const login = (role: Role, factoryName: string) => {
    localStorage.setItem("gf_role", role);
    localStorage.setItem("gf_factory", factoryName);
    setState({ currentRole: role, factoryName, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem("gf_role");
    localStorage.removeItem("gf_factory");
    setState({ currentRole: null, factoryName: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
