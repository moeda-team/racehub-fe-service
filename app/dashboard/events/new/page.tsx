"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import EventForm, { EventFormValues } from "@/components/EventForm";
import type { ApiResponse, Event } from "@/lib/types.gen";

export default function NewEventPage() {
  const router = useRouter();

  async function handleSubmit(values: EventFormValues) {
    const res = await api.post<ApiResponse<Event>>("/api/v1/events", {
      name: values.name,
      description: values.description || undefined,
      location: values.location || undefined,
      event_date: values.event_date || undefined,
      is_running_event: values.is_running_event,
      master_age_threshold: values.master_age_threshold,
      refund_cutoff_date: values.refund_cutoff_date || undefined,
      registration_close_date: values.registration_close_date || undefined,
      donation_enabled: values.donation_enabled,
      total_quota: values.total_quota,
    });
    router.push(`/dashboard/events/${res.data.id}`);
  }

  return (
    <div>
      <Link
        href="/dashboard/events"
        style={{ fontSize: 13, color: "var(--color-ink-3)", display: "inline-block", marginBottom: 12 }}
      >
        ← Kembali ke Event Saya
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Buat Event Baru
      </h1>
      <p style={{ color: "var(--color-ink-3)", marginBottom: 24 }}>
        Event dibuat sebagai draft. Tambahkan kategori jarak & tiket, lalu ajukan untuk persetujuan admin.
      </p>
      <EventForm submitLabel="Buat Event" onSubmit={handleSubmit} />
    </div>
  );
}
