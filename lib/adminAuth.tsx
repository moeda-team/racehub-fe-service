"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { adminApi } from "./admin";
import type { ApiResponse } from "./types.gen";

interface AdminProfile {
  id: string;
  email: string;
}

interface AdminAuthState {
  profile: AdminProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AdminAuthContextValue extends AdminAuthState {
  login: (
    email: string,
    password: string,
    keepSignedIn?: boolean,
  ) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  // Only spinner while validating a stored token; immediately false when no token
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Admin has no /me endpoint — verify by hitting a lightweight admin endpoint.
        await adminApi.get<ApiResponse<unknown[]>>(
          "/api/v1/admin/events?page_size=1",
        );
        if (!cancelled) {
	          requestAnimationFrame(() => {
            setProfile({ id: "", email: "" });
	            setIsAuthenticated(true);
            setIsLoading(false);
          });
        }
      } catch {
        if (!cancelled) {
	          requestAnimationFrame(() => {
	            setIsAuthenticated(false);
            setProfile(null);
            setIsLoading(false);
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string, keepSignedIn = false) => {
      await adminApi.post(
        "/api/v1/admin/login",
        { email, password, keep_signed_in: keepSignedIn },
      );
	      setIsAuthenticated(true);
      setProfile({ id: "", email });
    },
    [],
  );

  const logout = useCallback(() => {
    void adminApi.post("/api/v1/organizers/logout").catch(() => undefined);
	    setIsAuthenticated(false);
    setProfile(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        profile,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
