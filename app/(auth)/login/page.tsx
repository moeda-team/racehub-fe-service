"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
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
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
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
        Masuk ke akun organizer RaceHub Anda
      </p>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field
          label="Email"
          type="email"
          placeholder="nama@email.com"
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
            style={{ width: 16, height: 16, accentColor: "var(--color-flame)", cursor: "pointer" }}
          />
          Tetap masuk
        </label>
        <Button type="submit" variant="primary" size="md" disabled={isSubmitting} style={{ width: "100%" }}>
          {isSubmitting ? "Memproses..." : "Masuk"}
        </Button>
      </form>

      <p
        style={{
          fontSize: 14,
          color: "var(--color-ink-3)",
          textAlign: "center",
          marginTop: 16,
        }}
      >
        Belum punya akun?{" "}
        <Link href="/register" style={{ color: "var(--color-flame)", fontWeight: 500 }}>
          Daftar
        </Link>
      </p>
    </div>
  );
}
