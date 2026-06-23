"use client";

import { Suspense, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";

export default function RegisterPage() {
  // useSearchParams requires a Suspense boundary for static prerender.
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("success");
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Nama wajib diisi";
    }

    if (!email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!password) {
      newErrors.password = "Password wajib diisi";
    } else if (password.length < 8) {
      newErrors.password = "Password minimal 8 karakter";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Password tidak cocok";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await register({ email, password, name, phone: phone || undefined });
      router.push("/login?success=" + encodeURIComponent("Pendaftaran berhasil! Silakan masuk."));
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Terjadi kesalahan. Silakan coba lagi.");
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
        Daftar Organizer
      </h1>
      <p
        style={{
          color: "var(--color-ink-3)",
          fontSize: 14,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        Buat akun untuk mengelola event lari Anda
      </p>

      {successMessage && (
        <Alert variant="info" className="mb-4">
          {successMessage}
        </Alert>
      )}

      {serverError && (
        <Alert variant="danger" className="mb-4">
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field
          label="Nama Lengkap"
          placeholder="Nama Anda"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />
        <Field
          label="Email"
          type="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <Field
          label="No. Telepon"
          type="tel"
          placeholder="08xxxxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          hint="Opsional"
        />
        <Field
          label="Password"
          type="password"
          placeholder="Minimal 8 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />
        <Field
          label="Konfirmasi Password"
          type="password"
          placeholder="Ulangi password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          required
        />
        <Button type="submit" variant="primary" size="md" disabled={isSubmitting} style={{ width: "100%" }}>
          {isSubmitting ? "Memproses..." : "Daftar"}
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
        Sudah punya akun?{" "}
        <Link href="/login" style={{ color: "var(--color-flame)", fontWeight: 500 }}>
          Masuk
        </Link>
      </p>
    </div>
  );
}
