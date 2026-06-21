"use client";

import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ApiResponse, OrganizerProfile } from "@/lib/types.gen";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function ProfilePage() {
  const { profile } = useAuth();

  if (!profile) {
    return <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>;
  }

  // Keyed by id: remounts with fresh initial state once the profile loads.
  return <ProfileForm key={profile.id} profile={profile} />;
}

function ProfileForm({ profile }: { profile: OrganizerProfile }) {
  const { getProfile } = useAuth();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name.trim()) {
      setError("Nama wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.put<ApiResponse<OrganizerProfile>>("/api/v1/organizers/me", {
        name: name.trim(),
        phone: phone || undefined,
      });
      await getProfile();
      setSuccess("Profil berhasil diperbarui.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memperbarui profil.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
        Profil Organizer
      </h1>

      {success && (
        <Alert variant="info" className="mb-4">
          {success}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Email" value={profile.email} disabled hint="Email tidak dapat diubah" readOnly />
        <Field
          label="Nama"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Field
          label="No. Telepon"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xxxxxxxxxx"
        />
        <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan…" : "Simpan Profil"}
        </Button>
      </form>
    </div>
  );
}
