"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/adminAuth";
import { ApiError } from "@/lib/admin";
import { translateApiError } from "@/lib/error-messages";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/admin/overview");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password, keepSignedIn);
      router.push("/admin/overview");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? translateApiError(err.message)
          : "Terjadi kesalahan. Silakan coba lagi.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rh-reveal">
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Masuk
      </h1>
      <p
        style={{
          color: "var(--color-ink-3)",
          fontSize: 14,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        Masuk ke akun admin LowkeyThings — RaceHub
      </p>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <Field
          label="Email"
          type="email"
          placeholder="admin@racehub.id"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Password"
          type="password"
          placeholder="Masukkan password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            color: "var(--color-ink-2)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={keepSignedIn}
            onChange={(e) => setKeepSignedIn(e.target.checked)}
            style={{
              width: 16,
              height: 16,
              accentColor: "var(--color-flame)",
              cursor: "pointer",
            }}
          />
          Tetap masuk
        </label>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isSubmitting}
          style={{ width: "100%" }}
        >
          {isSubmitting ? "Memproses..." : "Masuk"}
        </Button>
      </form>

      <p
        style={{
          marginTop: 20,
          textAlign: "center",
          fontSize: 13,
          color: "var(--color-ink-3)",
        }}
      >
        <a
          href="/login"
          style={{ color: "var(--color-sprint)", textDecoration: "none" }}
        >
          Masuk sebagai Penyelenggara
        </a>
      </p>
    </div>
  );
}
