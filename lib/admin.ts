/**
 * Admin API client — separate token storage from organizer auth so the two
 * roles never clash. Mirrors lib/api but with the admin Bearer token.
 */
import { ApiError } from "./api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const ADMIN_TOKEN_KEY = "racehub_admin_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function adminRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAdminToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errBody: { error?: string } = {};
    try {
      errBody = await res.json();
    } catch {
      // ignore
    }
    throw new ApiError(res.status, errBody.error ?? "UNKNOWN_ERROR", errBody.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const adminApi = {
  get: <T>(path: string) => adminRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) => adminRequest<T>("POST", path, body),
};
