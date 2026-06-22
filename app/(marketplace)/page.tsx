"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ApiResponse, Event } from "@/lib/types.gen";
import EventCard from "@/components/ui/EventCard";
import Alert from "@/components/ui/Alert";

export default function MarketplacePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter inputs (FR-1002).
  const [location, setLocation] = useState("");
  const [runningOnly, setRunningOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");

  const load = useCallback(async (loc: string, running: boolean, from: string) => {
    try {
      const params = new URLSearchParams();
      if (loc.trim()) params.set("location", loc.trim());
      if (running) params.set("is_running_event", "true");
      if (from) params.set("date_from", new Date(from).toISOString());
      const qs = params.toString();
      // Public catalogue: force anonymous so the backend returns the filtered
      // published list, not a logged-in organizer's own (unfiltered) events.
      const res = await api.get<ApiResponse<Event[]>>(`/api/v1/events${qs ? `?${qs}` : ""}`, {
        auth: false,
      });
      setEvents(res.data ?? []);
      setError(null);
    } catch {
      setError("Gagal memuat event. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Live filtering (FR-1002): re-query as the user types/toggles, debounced so
  // typing in "Lokasi" doesn't fire a request per keystroke. No Enter / button.
  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(true);
      load(location, runningOnly, dateFrom);
    }, 300);
    return () => clearTimeout(t);
  }, [location, runningOnly, dateFrom, load]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
        Temukan Event Lari
      </h1>
      <p style={{ color: "var(--color-ink-3)", marginBottom: 24 }}>
        Daftar langsung tanpa ribet. Semua event telah disetujui penyelenggara &amp; admin.
      </p>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-end",
          marginBottom: 24,
          padding: "16px 20px",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--color-surface)",
          boxShadow: "var(--shadow-sh-1)",
        }}
      >
        <div className="field" style={{ flex: 1, minWidth: 220 }}>
          <label className="field-label">Lokasi</label>
          <div style={{ position: "relative" }}>
            <span style={inputIcon}>
              <PinIcon />
            </span>
            <input
              className="field-input"
              style={inputWithIcon}
              placeholder="Cari kota / lokasi"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
        <div className="field" style={{ width: 200 }}>
          <label className="field-label">Mulai tanggal</label>
          <div style={{ position: "relative" }}>
            <span style={inputIcon}>
              <CalendarIcon />
            </span>
            <input
              className="field-input"
              style={inputWithIcon}
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setRunningOnly((v) => !v)}
          aria-pressed={runningOnly}
          style={pillButton(runningOnly)}
        >
          {runningOnly ? <CheckCircleIcon /> : <RunIcon />}
          Event lari saja
        </button>
        <button
          type="button"
          onClick={() => {
            setLocation("");
            setDateFrom("");
            setRunningOnly(false);
          }}
          style={pillButton(false)}
        >
          <ResetIcon />
          Reset
        </button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      ) : events.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)" }}>Belum ada event yang cocok dengan pencarian Anda.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              href={`/events/${ev.id}`}
              title={ev.name}
              location={ev.location || "Lokasi belum diatur"}
              date={formatDate(ev.event_date)}
              distances={ev.is_running_event ? ["Event Lari"] : []}
              price=""
              quotaUsed={ev.total_quota_used}
              quotaTotal={ev.total_quota}
            />
          ))}
        </div>
      )}
    </main>
  );
}

// --- Filter bar styles & icons ---

const inputIcon: React.CSSProperties = {
  position: "absolute",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
  color: "var(--color-ink-3)",
  pointerEvents: "none",
};

const inputWithIcon: React.CSSProperties = {
  paddingLeft: 38,
  borderRadius: "var(--radius-md)",
  width: "100%",
};

// pillButton renders a fully-rounded pill: green/filled when active, outlined
// otherwise (matches the "Event lari saja" toggle and "Reset" in the design).
function pillButton(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 46,
    padding: "0 20px",
    borderRadius: "var(--radius-pill)",
    border: active ? "1px solid transparent" : "1px solid var(--color-line)",
    backgroundColor: active ? "#159b56" : "var(--color-surface)",
    color: active ? "#ffffff" : "var(--color-ink-2)",
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function RunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16v-2.4C4 11.5 3 10.5 3 8c0-2.7 1.5-6 4.5-6C9.4 2 10 3.8 10 5.5c0 3.1-2 5.7-2 8.7V16a2 2 0 1 1-4 0Z" />
      <path d="M20 20v-2.4c0-2.1 1-3.1 1-5.6 0-2.7-1.5-6-4.5-6C14.6 6 14 7.8 14 9.5c0 3.1 2 5.7 2 8.7V20a2 2 0 1 0 4 0Z" />
      <path d="M16 17h4M4 13h4" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}
