"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api, setAuthToken, getAuthToken } from "./api";
import type {
  ApiResponse,
  OrganizerProfile,
  OrganizerLoginResponse,
  WalletResponse,
} from "./types.gen";

interface AuthState {
  token: string | null;
  profile: OrganizerProfile | null;
  wallet: WalletResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  getProfile: () => Promise<void>;
  getWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy init from the persisted token (localStorage, via lib/api).
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !!getAuthToken());

  // If we booted with a token, validate it by loading the profile.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<OrganizerProfile>>(
          "/api/v1/organizers/me"
        );
        if (!cancelled) setProfile(res.data);
      } catch {
        if (!cancelled) {
          setAuthToken(null);
          setToken(null);
          setProfile(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Run once on mount; token changes from login() set profile directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAuthenticated = !!token;

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<ApiResponse<OrganizerLoginResponse>>(
      "/api/v1/organizers/login",
      { email, password }
    );
    const newToken = res.data.token;
    setAuthToken(newToken);
    setToken(newToken);

    // Fetch profile after login
    const profileRes = await api.get<ApiResponse<OrganizerProfile>>(
      "/api/v1/organizers/me"
    );
    setProfile(profileRes.data);
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      phone?: string;
    }) => {
      await api.post("/api/v1/organizers/register", data);
    },
    []
  );

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setProfile(null);
    setWallet(null);
  }, []);

  const getProfile = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<OrganizerProfile>>(
        "/api/v1/organizers/me"
      );
      setProfile(res.data);
    } catch {
      // If unauthorized, clear auth
      setAuthToken(null);
      setToken(null);
      setProfile(null);
    }
  }, []);

  const getWallet = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<WalletResponse>>(
        "/api/v1/organizers/me/wallet"
      );
      setWallet(res.data);
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        profile,
        wallet,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        getProfile,
        getWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
