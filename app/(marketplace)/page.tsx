"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ApiResponse, Event } from "@/lib/types.gen";
import EventCard from "@/components/ui/EventCard";
import Button from "@/components/ui/Button";
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
      const res = await api.get<ApiResponse<Event[]>>(`/api/v1/events${qs ? `?${qs}` : ""}`);
      setEvents(res.data ?? []);
      setError(null);
    } catch {
      setError("Gagal memuat event. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load("", false, "");
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  function handleFilter(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    load(location, runningOnly, dateFrom);
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
        Temukan Event Lari
      </h1>
      <p style={{ color: "var(--color-ink-3)", marginBottom: 24 }}>
        Daftar langsung tanpa ribet. Semua event telah disetujui penyelenggara &amp; admin.
      </p>

      <form
        onSubmit={handleFilter}
        style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 24 }}
      >
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label className="field-label">Lokasi</label>
          <input
            className="field-input"
            placeholder="Cari kota / lokasi"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="field" style={{ width: 180 }}>
          <label className="field-label">Mulai tanggal</label>
          <input
            className="field-input"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, padding: "10px 0" }}>
          <input type="checkbox" checked={runningOnly} onChange={(e) => setRunningOnly(e.target.checked)} />
          Event lari saja
        </label>
        <Button type="submit" variant="secondary" size="md">
          Filter
        </Button>
      </form>

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
