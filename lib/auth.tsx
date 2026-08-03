"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api } from "./api";
import type {
  ApiResponse,
  OrganizerProfile,
  WalletResponse,
} from "./types.gen";

interface AuthState {
  profile: OrganizerProfile | null;
  wallet: WalletResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (
    email: string,
    password: string,
    keepSignedIn?: boolean,
  ) => Promise<void>;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate the HttpOnly session cookie on every fresh browser boot.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<OrganizerProfile>>(
          "/api/v1/organizers/me",
        );
        if (!cancelled) setProfile(res.data);
      } catch {
        if (!cancelled) {
	          setProfile(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string, keepSignedIn = false) => {
      await api.post(
        "/api/v1/organizers/login",
        { email, password, keep_signed_in: keepSignedIn },
      );
      // Fetch profile after login
      const profileRes = await api.get<ApiResponse<OrganizerProfile>>(
        "/api/v1/organizers/me",
      );
      setProfile(profileRes.data);
	      setIsAuthenticated(true);
    },
    [],
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      phone?: string;
    }) => {
      await api.post("/api/v1/organizers/register", data);
    },
    [],
  );

  const logout = useCallback(() => {
    void api.post("/api/v1/organizers/logout").catch(() => undefined);
	    setIsAuthenticated(false);
    setProfile(null);
    setWallet(null);
  }, []);

  const getProfile = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<OrganizerProfile>>(
        "/api/v1/organizers/me",
      );
      setProfile(res.data);
    } catch {
      setIsAuthenticated(false);
      setProfile(null);
    }
  }, []);

  const getWallet = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<WalletResponse>>(
        "/api/v1/organizers/me/wallet",
      );
      setWallet(res.data);
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
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
