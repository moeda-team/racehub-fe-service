/**
 * API Client for RaceHub Backend.
 *
 * PENTING: Frontend TIDAK PERNAH menghitung fee/total/refund.
 * Semua angka uang diterima dari backend apa adanya.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const TOKEN_KEY = "racehub_token";

let authToken: string | null = null;

// Hydrate from localStorage on the client so auth survives reloads.
if (typeof window !== "undefined") {
  authToken = window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorBody: {
      error?: string;
      message?: string;
    } = {};
    try {
      errorBody = await res.json();
    } catch {
      // Ignore JSON parse errors
    }
    throw new ApiError(
      res.status,
      errorBody.error ?? "UNKNOWN_ERROR",
      errorBody.error ?? errorBody.message ?? `HTTP ${res.status}`,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),

  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),

  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),

  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),

  delete: <T>(path: string) => request<T>("DELETE", path),
};
