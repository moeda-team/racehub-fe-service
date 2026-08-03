import { NextRequest } from "next/server";

const backendBase = (process.env.BACKEND_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
const csrfExempt = new Set(["organizers/login", "organizers/register", "admin/login", "payments/notification"]);

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const route = path.join("/");
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  const session = request.cookies.get("racehub_session")?.value;
  if (unsafe && session && !csrfExempt.has(route)) {
    const csrfCookie = request.cookies.get("racehub_csrf")?.value;
    if (!csrfCookie || request.headers.get("x-csrf-token") !== csrfCookie) {
      return Response.json({ error: "csrf validation failed" }, { status: 403 });
    }
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return Response.json({ error: "cross-origin request rejected" }, { status: 403 });
    }
  }

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  headers.set("x-racehub-bff", "1");
  const target = new URL(`/api/v1/${route}`, backendBase);
  target.search = request.nextUrl.search;
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    // Required when forwarding a ReadableStream request body in Node.
    duplex: "half",
    cache: "no-store",
  } as RequestInit);
  return new Response(response.body, { status: response.status, headers: response.headers });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
