"use client";

import { useEffect, useState } from "react";
import { adminApi, ApiError } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { ApiResponse, Event, RegistrationSummary } from "@/lib/types.gen";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
  finished: "Finished",
};

const STATUS_BADGE: Record<string, "neutral" | "ok" | "danger" | "warn"> = {
  draft: "neutral",
  published: "ok",
  cancelled: "danger",
  finished: "neutral",
};

const REG_STATUS: Record<string, string> = {
  pending_payment: "Pending",
  paid: "Lunas",
  confirmed: "Confirmed",
  checked_in: "Check-in",
  cancelled: "Cancelled",
  refunded: "Refunded",
  expired: "Expired",
};

export default function AdminApprovalPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationSummary[]>([]);
  const [regsLoading, setRegsLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.get<ApiResponse<Event[]>>("/api/v1/admin/events/pending");
        if (!cancelled) setEvents(res.data ?? []);
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function selectEvent(id: string) {
    setSelectedId(id);
    setRegsLoading(true);
    try {
      const res = await adminApi.get<ApiResponse<RegistrationSummary[]>>(
        `/api/v1/admin/events/${id}/registrations?page_size=200`
      );
      setRegistrations(res.data ?? []);
    } catch {
      setRegistrations([]);
    } finally {
      setRegsLoading(false);
    }
  }

  async function approve(id: string) {
    setBusy(id);
    setNotice(null);
    try {
      await adminApi.post(`/api/v1/admin/events/${id}/approve`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setSelectedId(null);
      setNotice({ type: "success", msg: "Event berhasil dipublikasikan." });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menyetujui.";
      setNotice({ type: "error", msg });
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    const reason = window.prompt("Alasan penolakan (wajib):");
    if (!reason?.trim()) return;
    setBusy(id);
    setNotice(null);
    try {
      await adminApi.post(`/api/v1/admin/events/${id}/reject`, { reason: reason.trim() });
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setSelectedId(null);
      setNotice({ type: "success", msg: "Event ditolak." });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menolak.";
      setNotice({ type: "error", msg });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rh-reveal">
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: 28,
        fontWeight: 700,
        marginBottom: 4,
      }}>
        Approval
      </h1>
      <p style={{ color: "var(--color-ink-3)", fontSize: 14, marginBottom: 28 }}>
        Event yang menunggu persetujuan untuk dipublikasikan
      </p>

      {notice && (
        <Alert variant={notice.type === "success" ? "info" : "danger"} className="mb-4">
          {notice.msg}
        </Alert>
      )}

      {loading ? (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      ) : events.length === 0 ? (
        <div style={{
          padding: "48px 24px",
          textAlign: "center",
          border: "1px dashed var(--color-line)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-ink-3)",
        }}>
          Tidak ada event yang menunggu approval.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {events.map((ev) => (
            <div
              key={ev.id}
              style={{
                backgroundColor: "var(--color-surface)",
                border: selectedId === ev.id ? "2px solid var(--color-flame)" : "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                padding: 20,
                cursor: selectedId !== ev.id ? "pointer" : "default",
                transition: "border-color 0.15s",
              }}
              onClick={() => selectEvent(ev.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, margin: "0 0 6px" }}>
                    {ev.name}
                  </h3>
                  <div style={{ fontSize: 13, color: "var(--color-ink-3)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span>📅 {ev.event_date ? formatDate(ev.event_date) : "—"}</span>
                    <span>📍 {ev.location || "—"}</span>
                    <span>📍 {ev.location || "—"}</span>
                  </div>
                  {ev.description && (
                    <p style={{ fontSize: 13, color: "var(--color-ink-2)", marginTop: 8, lineHeight: 1.5 }}>
                      {ev.description.slice(0, 200)}{ev.description.length > 200 ? "…" : ""}
                    </p>
                  )}
                </div>

                {selectedId === ev.id ? (
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={busy === ev.id}
                      onClick={(e) => { e.stopPropagation(); approve(ev.id); }}
                    >
                      {busy === ev.id ? "…" : "✓ Approve"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busy === ev.id}
                      onClick={(e) => { e.stopPropagation(); reject(ev.id); }}
                    >
                      {busy === ev.id ? "…" : "✕ Tolak"}
                    </Button>
                  </div>
                ) : (
                  <Badge variant="warn">Menunggu</Badge>
                )}
              </div>

              {selectedId === ev.id && regsLoading && (
                <p style={{ fontSize: 13, color: "var(--color-ink-3)", marginTop: 12 }}>Memuat pendaftar…</p>
              )}

              {selectedId === ev.id && !regsLoading && registrations.length > 0 && (
                <div style={{ marginTop: 16, overflowX: "auto" }}>
                  <div style={{ fontSize: 12, color: "var(--color-ink-3)", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
                    {registrations.length} pendaftar
                  </div>
                  <table className="dtable">
                    <thead>
                      <tr>
                        <th>No. Reg</th>
                        <th>Nama</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.slice(0, 10).map((r) => (
                        <tr key={r.id}>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.registration_number}</td>
                          <td>{r.name}</td>
                          <td>
                            <Badge variant={r.status === "pending_payment" ? "warn" : r.status === "paid" ? "ok" : "neutral"}>
                              {REG_STATUS[r.status] ?? r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {registrations.length > 10 && (
                    <p style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 8 }}>
                      +{registrations.length - 10} pendaftar lainnya
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
