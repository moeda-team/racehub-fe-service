"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import EventForm, { EventFormValues } from "@/components/EventForm";
import EventCard from "@/components/ui/EventCard";
import EventDetailView from "@/components/EventDetailView";
import Button from "@/components/ui/Button";
import type {
  ApiResponse,
  Event,
  PublicEventDetail,
} from "@/lib/types.gen";

export default function NewEventPage() {
  const router = useRouter();
  const [preview, setPreview] = useState<EventFormValues | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("card");

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
        style={{
          fontSize: 13,
          color: "var(--color-ink-3)",
          display: "inline-block",
          marginBottom: 12,
        }}
      >
        ← Kembali ke Event Saya
      </Link>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Buat Event Baru
      </h1>
      <p style={{ color: "var(--color-ink-3)", marginBottom: 24 }}>
        Event dibuat sebagai draft. Tambahkan kategori & tiket, lalu ajukan
        untuk persetujuan admin.
      </p>
      <div
        style={{
          display: "flex",
          gap: 28,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 420px", maxWidth: 720 }}>
          <EventForm
            submitLabel="Buat Event"
            onSubmit={handleSubmit}
            onChange={setPreview}
          />
        </div>
        <NewEventPreview
          values={preview}
          mode={previewMode}
          onModeChange={setPreviewMode}
        />
      </div>
    </div>
  );
}

type PreviewMode = "card" | "detail" | "register";

function NewEventPreview({
  values,
  mode,
  onModeChange,
}: {
  values: EventFormValues | null;
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
}) {
  const name = values?.name || "Nama Event";
  const location = values?.location || "Lokasi belum diatur";
  const isRunning = (values?.event_type ?? "running") === "running";
  const color = values?.color || "#16303A";
  const previewDetail: PublicEventDetail = {
    event: {
      // This is a local-only preview; the server assigns the real ID on save.
      id: "pratinjau-event-baru",
      name,
      description: values?.description || "",
      location,
      event_date: values?.event_date || null,
      status: "published",
      event_type: values?.event_type ?? "running",
      master_age_threshold: values?.master_age_threshold ?? 40,
      refund_cutoff_date: values?.refund_cutoff_date || null,
      donation_enabled: values?.donation_enabled ?? false,
      banner_url: null,
      color,
      quota_remaining: 1,
      min_price: 0,
    },
    categories: [],
    ticket_categories: [],
    registration_fields: [],
  };

  const modeButton = (active: boolean): React.CSSProperties => ({
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 600,
    border: active ? "1px solid var(--color-gold-deep)" : "1px solid var(--color-line)",
    borderRadius: 999,
    cursor: "pointer",
    backgroundColor: active ? "var(--color-navy)" : "var(--color-surface)",
    color: active ? "var(--color-gold-soft)" : "var(--color-ink-2)",
  });

  return (
    <aside
      style={
        mode === "card"
          ? { flex: "0 1 400px", minWidth: "min(340px, 100%)", position: "sticky", top: 24 }
          : { flex: "1 1 420px", minWidth: 320 }
      }
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-ink-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Pratinjau
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
          <button type="button" style={modeButton(mode === "card")} aria-pressed={mode === "card"} onClick={() => onModeChange("card")}>
            Kartu
          </button>
          <button type="button" style={modeButton(mode === "detail")} aria-pressed={mode === "detail"} onClick={() => onModeChange("detail")}>
            Halaman Detail
          </button>
          <button type="button" style={modeButton(mode === "register")} aria-pressed={mode === "register"} onClick={() => onModeChange("register")}>
            Pendaftaran
          </button>
        </div>
      </div>

      {mode === "card" ? (
        <>
          <EventCard
            title={name}
            location={location}
            date={formatDate(values?.event_date)}
            distances={isRunning ? ["Event Lari"] : []}
            price="—"
            color={color}
          />
          <p style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 10, lineHeight: 1.5 }}>
            Ikut berubah saat Anda mengetik &amp; memilih warna. Banner, harga,
            dan kuota bisa diatur setelah event dibuat.
          </p>
        </>
      ) : mode === "detail" ? (
        <div
          style={{
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            backgroundColor: "var(--color-paper)",
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              borderBottom: "1px solid var(--color-line)",
              backgroundColor: "var(--color-surface)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--color-ink-3)",
            }}
          >
            /events/pratinjau-event-baru
          </div>
          <div className="max-w-3xl mx-auto px-4 py-8">
            <EventDetailView detail={previewDetail} interactive={false} />
          </div>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            backgroundColor: "var(--color-paper)",
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              borderBottom: "1px solid var(--color-line)",
              backgroundColor: "var(--color-surface)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--color-ink-3)",
            }}
          >
            /register/pratinjau-event-baru
          </div>
          <div className="max-w-xl mx-auto px-4 py-8">
            <p style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 12 }}>
              ← {name}
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Pendaftaran
            </h2>
            <p style={{ color: "var(--color-ink-3)", marginBottom: 20, fontSize: 14 }}>
              Langkah 2 dari 3
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="field">
                <label className="field-label">Nama Lengkap</label>
                <input className="field-input" placeholder="Nama peserta" readOnly />
              </div>
              <div className="field">
                <label className="field-label">Email</label>
                <input className="field-input" type="email" placeholder="nama@email.com" readOnly />
              </div>
              <div className="field">
                <label className="field-label">No. HP</label>
                <input className="field-input" type="tel" placeholder="08xxxxxxxxxx" readOnly />
              </div>
              <div className="field">
                <label className="field-label">Tanggal Lahir</label>
                <input className="field-input" type="date" readOnly />
                <span className="field-hint">
                  Wajib — menentukan kelas usia (Open/Master) otomatis
                </span>
              </div>
              <div className="field">
                <label className="field-label">Jenis Kelamin</label>
                <select className="field-input" disabled value="">
                  <option>Pilih</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="ghost" size="md" disabled>
                  Kembali
                </Button>
                <Button variant="primary" size="md" style={{ flex: 1 }} disabled>
                  Lanjut
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
