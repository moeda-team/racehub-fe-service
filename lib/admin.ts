/**
 * Admin API client — separate token storage from organizer auth so the two
 * roles never clash. Mirrors lib/api but with the admin Bearer token.
 */
import { ApiError } from "./api";
import { translateApiError } from "./error-messages";

const BASE_URL = "";

function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((v) => v.startsWith("racehub_csrf="))?.split("=")[1];
}

async function adminRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const csrf = csrfToken();
  if (csrf && !["GET", "HEAD"].includes(method)) headers["X-CSRF-Token"] = csrf;

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
    throw new ApiError(
      res.status,
      errBody.error ?? "UNKNOWN_ERROR",
      translateApiError(errBody.error ?? `HTTP ${res.status}`),
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const adminApi = {
  get: <T>(path: string) => adminRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) =>
    adminRequest<T>("POST", path, body),
};

export { ApiError } from "./api";
export { translateApiError } from "./error-messages";
