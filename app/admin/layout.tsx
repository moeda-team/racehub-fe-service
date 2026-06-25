"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { adminApi, getAdminToken, setAdminToken } from "@/lib/admin";
import type { ApiResponse, OrganizerLoginResponse } from "@/lib/types.gen";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // null = not yet determined (avoids SSR/CSR hydration mismatch on the token).
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve(); // defer past the synchronous effect body
      if (!cancelled) setAuthed(!!getAdminToken());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (authed === null) {
    return <div style={{ minHeight: "100vh" }} />;
  }

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          backgroundColor: "var(--color-ink)",
          color: "white",
          padding: "12px clamp(12px, 4vw, 24px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
            LowkeyThings Admin
          </span>
          <nav style={{ display: "flex", gap: 16, fontSize: 14 }}>
            <Link href="/admin" style={{ color: "var(--color-ink-4)" }}>Approval</Link>
            <Link href="/admin/refunds" style={{ color: "var(--color-ink-4)" }}>Refund</Link>
            <Link href="/admin/platform" style={{ color: "var(--color-ink-4)" }}>Platform</Link>
          </nav>
        </div>
        <button
          type="button"
          onClick={() => {
            setAdminToken(null);
            setAuthed(false);
          }}
          style={{ background: "none", border: "none", color: "var(--color-ink-4)", fontSize: 14, cursor: "pointer" }}
        >
          Keluar
        </button>
      </header>
      <main style={{ padding: "clamp(16px, 4vw, 32px)" }}>{children}</main>
    </div>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await adminApi.post<ApiResponse<OrganizerLoginResponse>>("/api/v1/admin/login", {
        email,
        password,
      });
      setAdminToken(res.data.token);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal masuk.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-md)",
          padding: "32px 24px",
        }}
      >
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>
          Admin LowkeyThings
        </h1>
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" variant="primary" size="md" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Memproses…" : "Masuk"}
          </Button>
        </form>
      </div>
    </main>
  );
}
