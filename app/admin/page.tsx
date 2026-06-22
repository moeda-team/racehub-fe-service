"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { adminApi } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import type { ApiResponse, Event } from "@/lib/types.gen";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function AdminApprovalsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await adminApi.get<ApiResponse<Event[]>>("/api/v1/admin/events/pending");
      setEvents(res.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat antrian.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function approve(ev: Event) {
    if (!window.confirm(`Setujui & publikasikan "${ev.name}"?`)) return;
    setBusyId(ev.id);
    setError(null);
    try {
      await adminApi.post(`/api/v1/admin/events/${ev.id}/approve`);
      setNotice(`"${ev.name}" disetujui dan dipublikasikan.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyetujui event.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(ev: Event) {
    const reason = window.prompt(`Alasan menolak "${ev.name}"? (akan dikirim ke organizer)`);
    if (reason === null) return;
    if (!reason.trim()) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    setBusyId(ev.id);
    setError(null);
    try {
      await adminApi.post(`/api/v1/admin/events/${ev.id}/reject`, { reason: reason.trim() });
      setNotice(`"${ev.name}" ditolak.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menolak event.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, marginBottom: 16 }}>
        Antrian Persetujuan
      </h1>

      {notice && (
        <Alert variant="info" className="mb-4">
          {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      ) : events.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)" }}>Tidak ada event yang menunggu persetujuan.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map((ev) => (
            <div
              key={ev.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: 16,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{ev.name}</div>
                <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
                  {ev.location || "Lokasi belum diatur"} · {formatDate(ev.event_date)}
                  {ev.is_running_event ? " · Event lari" : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Button variant="primary" size="sm" disabled={busyId === ev.id} onClick={() => approve(ev)}>
                  Setujui
                </Button>
                <Button variant="danger" size="sm" disabled={busyId === ev.id} onClick={() => reject(ev)}>
                  Tolak
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
