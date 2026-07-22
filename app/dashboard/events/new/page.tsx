"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import EventForm, { EventFormValues } from "@/components/EventForm";
import EventCard from "@/components/ui/EventCard";
import type { ApiResponse, Event } from "@/lib/types.gen";

export default function NewEventPage() {
  const router = useRouter();
  const [preview, setPreview] = useState<EventFormValues | null>(null);

  async function handleSubmit(values: EventFormValues) {
    const res = await api.post<ApiResponse<Event>>("/api/v1/events", {
      name: values.name,
      description: values.description || undefined,
      location: values.location || undefined,
      event_date: values.event_date || undefined,
      event_type: values.event_type,
      master_age_threshold: values.master_age_threshold,
      refund_cutoff_date: values.refund_cutoff_date || undefined,
      registration_close_date: values.registration_close_date || undefined,
      donation_enabled: values.donation_enabled,
      color: values.color,
    });
    router.push(`/dashboard/events/${res.data.id}`);
  }

  return (
    <div className="rh-reveal">
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
        Event dibuat sebagai draft. Tambahkan kategori & tiket, lalu ajukan untuk persetujuan admin.
      </p>
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 420px", maxWidth: 720 }}>
          <EventForm submitLabel="Buat Event" onSubmit={handleSubmit} onChange={setPreview} />
        </div>
        <aside style={{ flex: "0 1 320px", minWidth: 260, position: "sticky", top: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Pratinjau Kartu Marketplace
          </div>
          <EventCard
            title={preview?.name || "Nama Event"}
            location={preview?.location || "Lokasi belum diatur"}
            date={formatDate(preview?.event_date)}
            distances={preview?.event_type === "running" ? ["Event Lari"] : []}
            price="—"
            color={preview?.color || undefined}
          />
          <p style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 10, lineHeight: 1.5 }}>
            Ikut berubah saat Anda mengetik &amp; memilih warna. Banner, harga, dan kuota bisa diatur setelah event dibuat.
          </p>
        </aside>
      </div>
    </div>
  );
}
