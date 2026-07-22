"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { adminApi, setAdminToken, getAdminToken } from "./admin";
import type { ApiResponse } from "./types.gen";

interface AdminProfile {
  id: string;
  email: string;
}

interface AdminLoginResponse {
  token: string;
  expires_at: string;
}

interface AdminAuthState {
  token: string | null;
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
  const [token, setToken] = useState<string | null>(() => getAdminToken());
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  // Only spinner while validating a stored token; immediately false when no token
  const [isLoading, setIsLoading] = useState<boolean>(!!getAdminToken());

  useEffect(() => {
    if (!token) {
      // No stored token — nothing to validate, proceed immediately.
      const id = requestAnimationFrame(() => setIsLoading(false));
      return () => cancelAnimationFrame(id);
    }
    let cancelled = false;
    const raf = requestAnimationFrame(() => setIsLoading(true));
    (async () => {
      try {
        // Admin has no /me endpoint — verify by hitting a lightweight admin endpoint.
        await adminApi.get<ApiResponse<unknown[]>>(
          "/api/v1/admin/events?page_size=1",
        );
        if (!cancelled) {
          const id = requestAnimationFrame(() => {
            setProfile({ id: "", email: "" });
            setIsLoading(false);
          });
          id;
        }
      } catch {
        if (!cancelled) {
          const id = requestAnimationFrame(() => {
            setAdminToken(null);
            setToken(null);
            setProfile(null);
            setIsLoading(false);
          });
          id;
        }
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [token]);

  const isAuthenticated = !!token;

  const login = useCallback(
    async (email: string, password: string, keepSignedIn = false) => {
      const res = await adminApi.post<ApiResponse<AdminLoginResponse>>(
        "/api/v1/admin/login",
        { email, password, keep_signed_in: keepSignedIn },
      );
      const newToken = res.data.token;
      setAdminToken(newToken);
      setToken(newToken);
      setProfile({ id: "", email });
    },
    [],
  );

  const logout = useCallback(() => {
    setAdminToken(null);
    setToken(null);
    setProfile(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        token,
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
