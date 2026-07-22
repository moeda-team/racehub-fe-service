"use client";

import { useEffect, useState } from "react";
import { adminApi, ApiError } from "@/lib/admin";
import { formatRupiah } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { confirm } from "@/components/ui/ConfirmDialog";
import type { ApiResponse, Refund } from "@/lib/types.gen";
import type { Event, AdminEventPage } from "@/lib/types.gen";

const REFUND_STATUS: Record<string, { label: string; variant: "ok" | "warn" | "danger" }> = {
  completed: { label: "Selesai", variant: "ok" },
  processing: { label: "Diproses", variant: "warn" },
  rejected: { label: "Ditolak", variant: "danger" },
};

const METHOD_LABEL: Record<string, string> = {
  va_bca: "VA BCA",
  va_bni: "VA BNI",
  va_bri: "VA BRI",
  va_mandiri: "VA Mandiri",
  va_permata: "VA Permata",
  gopay: "GoPay",
  card: "Kartu",
  qris: "QRIS",
};

export default function AdminRefundsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.get<AdminEventPage>("/api/v1/admin/events?page_size=200");
        if (!cancelled) {
          setEvents(res.data ?? []);
        }
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function loadRefunds() {
    if (!selectedEventId) return;
    setLoadErr(null);
    setLoadingRefunds(true);
    try {
      const res = await adminApi.get<ApiResponse<Refund[]>>(
        `/api/v1/admin/events/${selectedEventId}/refunds`
      );
      setRefunds(res.data ?? []);
    } catch (e) {
      setLoadErr(e instanceof ApiError ? e.message : "Gagal memuat refund.");
    } finally {
      setLoadingRefunds(false);
    }
  }

  function selectEvent(id: string) {
    setSelectedEventId(id);
    setRefunds([]);
    setLoadErr(null);
    setNotice(null);
    setErr(null);
  }

  async function completeRefund(id: string) {
    const target = refunds.find((r) => r.id === id);
    if (!(await confirm({
      message: `Tandai refund ${target ? formatRupiah(target.amount) : id} sebagai SELESAI?\n\nTindakan ini akan menandakan dana sudah dikembalikan ke peserta dan tidak dapat dibatalkan.`,
      variant: "danger",
    }))) return;

    setBusyId(id);
    setErr(null);
    try {
      await adminApi.post(`/api/v1/admin/refunds/${id}/complete`);
      setRefunds((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: "completed" } : r)
      );
      setNotice("Refund ditandai selesai.");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Gagal menandai selesai.");
    } finally {
      setBusyId(null);
    }
  }

  const completed = refunds.filter((r) => r.status === "completed").length;
  const processing = refunds.filter((r) => r.status === "processing").length;
  const rejected = refunds.filter((r) => r.status === "rejected").length;

  return (
    <div className="rh-reveal">
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: 28,
        fontWeight: 700,
        marginBottom: 4,
      }}>
        Refund
      </h1>
      <p style={{ color: "var(--color-ink-3)", fontSize: 14, marginBottom: 28 }}>
        Kelola refund peserta per event
      </p>

      {/* Event selector */}
      <div style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-md)",
        padding: 20,
        marginBottom: 24,
      }}>
        <div className="field" style={{ maxWidth: 400 }}>
          <label className="field-label">Pilih Event</label>
          <select
            className="field-input"
            value={selectedEventId}
            onChange={(e) => selectEvent(e.target.value)}
            disabled={loadingEvents}
          >
            <option value="">— Pilih event —</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>

        {selectedEventId && (
          <div style={{ marginTop: 12 }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={loadingRefunds}
              onClick={loadRefunds}
            >
              {loadingRefunds ? "Memuat…" : "Tampilkan Refund"}
            </Button>
          </div>
        )}
      </div>

      {/* Summary counts */}
      {refunds.length > 0 && (
        <div style={{ display: "flex", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
          <div className="stat">
            <div className="stat-lab">Total Refund</div>
            <div className="stat-val">{refunds.length}</div>
          </div>
          <div className="stat">
            <div className="stat-lab">Selesai</div>
            <div className="stat-val" style={{ color: "var(--color-ok)" }}>{completed}</div>
          </div>
          <div className="stat">
            <div className="stat-lab">Diproses</div>
            <div className="stat-val" style={{ color: "var(--color-warn)" }}>{processing}</div>
          </div>
          <div className="stat">
            <div className="stat-lab">Ditolak</div>
            <div className="stat-val" style={{ color: "var(--color-danger)" }}>{rejected}</div>
          </div>
        </div>
      )}

      {loadErr && <Alert variant="danger" className="mb-4">{loadErr}</Alert>}
      {notice && <Alert variant="info" className="mb-4">{notice}</Alert>}
      {err && <Alert variant="danger" className="mb-4">{err}</Alert>}

      {!selectedEventId && (
        <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
          Pilih event di atas untuk melihat data refund.
        </p>
      )}

      {selectedEventId && !loadingRefunds && refunds.length === 0 && (
        <div style={{
          padding: "48px 24px",
          textAlign: "center",
          border: "1px dashed var(--color-line)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-ink-3)",
        }}>
          Tidak ada data refund untuk event ini.
        </div>
      )}

      {refunds.length > 0 && (
        <div style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Reg. ID</th>
                  <th>Nominal</th>
                  <th>Fee Midtrans</th>
                  <th>Donasi</th>
                  <th>Metode</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r) => {
                  const s = REFUND_STATUS[r.status] ?? { label: r.status, variant: "warn" as const };
                  return (
                    <tr key={r.id}>
                      <td>
                        <code style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>
                          {r.registration_id.slice(0, 8)}…
                        </code>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                        {formatRupiah(r.amount)}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--color-danger)" }}>
                        -{formatRupiah(r.fee_midtrans)}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--color-warn)" }}>
                        {formatRupiah(r.donation)}
                      </td>
                      <td>{METHOD_LABEL[r.method] ?? r.method}</td>
                      <td>
                        <span style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
                          {r.mode === "auto" ? "Otomatis" : "Manual"}
                        </span>
                      </td>
                      <td>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </td>
                      <td>
                        {r.mode === "manual" && r.status !== "completed" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busyId === r.id}
                            onClick={() => completeRefund(r.id)}
                          >
                            {busyId === r.id ? "…" : "✓ Selesai"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
