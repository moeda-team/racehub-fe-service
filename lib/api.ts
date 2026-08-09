/**
 * API Client for RaceHub Backend.
 *
 * PENTING: Frontend TIDAK PERNAH menghitung fee/total/refund.
 * Semua angka uang diterima dari backend apa adanya.
 */

import { translateApiError } from "./error-messages";

// Browser requests are same-origin and terminate at the Next.js BFF. The
// opaque HttpOnly session never enters JavaScript or localStorage.
const BASE_URL = "";

function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((v) => v.startsWith("racehub_csrf="))?.split("=")[1];
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

export interface RequestOptions {
  // Set false for public endpoints that must NOT carry the organizer token.
  // The marketplace listing (/events) is dual-purpose on the backend: with a
  // token it returns the organizer's own events (unfiltered); anonymous it
  // returns the filtered public catalogue. Public pages must opt out of auth.
  auth?: boolean;
  // Idempotency-Key untuk operasi uang/registrasi: retry dengan key yang sama
  // tidak menghasilkan efek kedua di server (lihat OpenAPI).
  idempotencyKey?: string;
  headers?: Record<string, string>;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts?: RequestOptions,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (opts?.auth === false) delete headers.Authorization;
  const csrf = csrfToken();
  if (csrf && !["GET", "HEAD"].includes(method)) headers["X-CSRF-Token"] = csrf;
  if (opts?.idempotencyKey) {
    headers["Idempotency-Key"] = opts.idempotencyKey;
  }
  Object.assign(headers, opts?.headers);

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
      translateApiError(
        errorBody.error ?? errorBody.message ?? `HTTP ${res.status}`,
      ),
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// requestForm sends multipart/form-data (file upload). The browser sets the
// Content-Type header itself (with boundary), so it must NOT be set manually.
async function requestForm<T>(
  method: string,
  path: string,
  form: FormData,
): Promise<T> {
  const headers: Record<string, string> = {};
  const csrf = csrfToken();
  if (csrf) headers["X-CSRF-Token"] = csrf;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: form,
  });

  if (!res.ok) {
    let errorBody: { error?: string; message?: string } = {};
    try {
      errorBody = await res.json();
    } catch {
      // Ignore JSON parse errors
    }
    throw new ApiError(
      res.status,
      errorBody.error ?? "UNKNOWN_ERROR",
      translateApiError(
        errorBody.error ?? errorBody.message ?? `HTTP ${res.status}`,
      ),
    );
  }

  return res.json();
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>("GET", path, undefined, opts),

  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, body, opts),

  postForm: <T>(path: string, form: FormData) =>
    requestForm<T>("POST", path, form),

  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),

  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),

  delete: <T>(path: string) => request<T>("DELETE", path),
};
