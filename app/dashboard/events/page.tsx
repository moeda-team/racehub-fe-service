"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { eventStatusDisplay } from "@/lib/event-status";
import type { ApiResponse, Event } from "@/lib/types.gen";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function EventListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<Event[]>>("/api/v1/events");
        if (!cancelled) setEvents(res.data ?? []);
      } catch {
        if (!cancelled) setError("Gagal memuat daftar event.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700 }}>
          Event Saya
        </h1>
        <Link href="/dashboard/events/new">
          <Button variant="primary" size="md">
            + Buat Event
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      ) : events.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)" }}>
          Belum ada event.{" "}
          <Link href="/dashboard/events/new" style={{ color: "var(--color-flame)", fontWeight: 500 }}>
            Buat event pertama Anda
          </Link>
          .
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {events.map((ev) => {
            const status = eventStatusDisplay(ev.status);
            return (
              <Link
                key={ev.id}
                href={`/dashboard/events/${ev.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  border: "1px solid var(--color-line)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "var(--color-ink)" }}>{ev.name}</div>
                  <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
                    {ev.location || "Lokasi belum diatur"}
                    {ev.is_running_event ? " · Event lari" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span
                    className="mono"
                    style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-ink-3)" }}
                  >
                    {ev.total_quota_used}/{ev.total_quota}
                  </span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
