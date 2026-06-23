"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { adminApi } from "@/lib/admin";
import { formatRupiah } from "@/lib/format";
import type {
  ApiResponse,
  AdminRegistrationPage,
  MassRefundResult,
  Refund,
  RegistrationSummary,
} from "@/lib/types.gen";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";

const REFUND_STATUS: Record<string, { label: string; variant: "ok" | "warn" | "danger" }> = {
  completed: { label: "Selesai", variant: "ok" },
  processing: { label: "Diproses", variant: "warn" },
  rejected: { label: "Ditolak", variant: "danger" },
};

const REG_STATUS_LABEL: Record<string, string> = {
  paid: "Lunas",
  confirmed: "Terkonfirmasi",
  checked_in: "Check-in",
  pending_payment: "Menunggu Bayar",
  cancelled: "Dibatalkan",
  refunded: "Direfund",
  expired: "Kedaluwarsa",
};

export default function AdminRefundsPage() {
  // --- Event lookup state ---
  const [lookupEventId, setLookupEventId] = useState("");
  const [registrations, setRegistrations] = useState<RegistrationSummary[] | null>(null);
  const [pendingRefunds, setPendingRefunds] = useState<Refund[] | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupErr, setLookupErr] = useState<string | null>(null);

  // --- Single refund state ---
  const [selectedReg, setSelectedReg] = useState<RegistrationSummary | null>(null);
  const [reason, setReason] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [refund, setRefund] = useState<Refund | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // --- Mass refund state ---
  const [massEventId, setMassEventId] = useState("");
  const [massReason, setMassReason] = useState("");
  const [mass, setMass] = useState<MassRefundResult | null>(null);
  const [massErr, setMassErr] = useState<string | null>(null);
  const [massBusy, setMassBusy] = useState(false);

  async function loadEventData() {
    setLookupErr(null);
    setRegistrations(null);
    setPendingRefunds(null);
    setSelectedReg(null);
    setRefund(null);
    const id = lookupEventId.trim();
    if (!id) {
      setLookupErr("Masukkan ID event yang valid.");
      return;
    }
    setLookupBusy(true);
    try {
      const [regRes, refRes] = await Promise.all([
        adminApi.get<ApiResponse<AdminRegistrationPage>>(`/api/v1/admin/events/${id}/registrations`),
        adminApi.get<ApiResponse<Refund[]>>(`/api/v1/admin/events/${id}/refunds`),
      ]);
      setRegistrations(regRes.data.registrations ?? []);
      setPendingRefunds(refRes.data ?? []);
    } catch (e) {
      setLookupErr(e instanceof ApiError ? e.message : "Gagal memuat data event.");
    } finally {
      setLookupBusy(false);
    }
  }

  function selectReg(reg: RegistrationSummary) {
    setSelectedReg(reg);
    setRefund(null);
    setErr(null);
    setReason("");
    setBankAccount("");
  }

  async function submitRefund() {
    setErr(null);
    setRefund(null);
    if (!selectedReg) {
      setErr("Pilih pendaftar dari daftar di atas.");
      return;
    }
    setBusy(true);
    try {
      const res = await adminApi.post<ApiResponse<Refund>>(
        `/api/v1/admin/registrations/${selectedReg.id}/refund`,
        { reason, bank_account: bankAccount || undefined },
      );
      setRefund(res.data);
      await loadEventData();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Refund gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function completeManual(refundId: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await adminApi.post<ApiResponse<Refund>>(`/api/v1/admin/refunds/${refundId}/complete`);
      setRefund(res.data);
      await loadEventData();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Gagal menandai selesai.");
    } finally {
      setBusy(false);
    }
  }

  async function submitMass() {
    setMassErr(null);
    setMass(null);
    const id = massEventId.trim();
    if (!id) {
      setMassErr("Masukkan ID event yang valid.");
      return;
    }
    if (!window.confirm("Refund SEMUA pendaftar berbayar untuk event ini? Tindakan ini tidak dapat dibatalkan.")) return;
    setMassBusy(true);
    try {
      const res = await adminApi.post<ApiResponse<MassRefundResult>>(`/api/v1/admin/events/${id}/refund-all`, {
        reason: massReason,
      });
      setMass(res.data);
    } catch (e) {
      setMassErr(e instanceof ApiError ? e.message : "Refund massal gagal.");
    } finally {
      setMassBusy(false);
    }
  }

  const processingRefunds = pendingRefunds?.filter((r) => r.status === "processing") ?? [];

  return (
    <div className="rh-reveal" style={{ maxWidth: 760 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Refund</h1>
      <p style={{ color: "var(--color-ink-3)", fontSize: 14, marginBottom: 24 }}>
        Nominal refund dihitung server: <code>total − fee Midtrans − donasi</code>. Donasi tidak dikembalikan dan
        tetap disalurkan (FR-909).
      </p>

      {/* Event lookup */}
      <section style={card}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Cari Pendaftar per Event</div>
        {lookupErr && <Alert variant="danger" className="mb-4">{lookupErr}</Alert>}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ flex: 1, minWidth: 240 }}>
            <label className="field-label">ID Event</label>
            <input
              className="field-input"
              type="text"
              value={lookupEventId}
              onChange={(e) => setLookupEventId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadEventData()}
              placeholder="UUID event"
            />
          </div>
          <Button variant="primary" size="md" disabled={lookupBusy} onClick={loadEventData}>
            {lookupBusy ? "Memuat…" : "Muat"}
          </Button>
        </div>

        {registrations !== null && (
          <div style={{ marginTop: 16 }}>
            {registrations.length === 0 ? (
              <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>Tidak ada pendaftar untuk event ini.</p>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 8 }}>
                  {registrations.length} pendaftar — klik baris untuk memilih
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-line)", textAlign: "left" }}>
                        <th style={th}>No. Reg</th>
                        <th style={th}>Nama</th>
                        <th style={th}>Status</th>
                        <th style={th}>Donasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((reg) => (
                        <tr
                          key={reg.id}
                          onClick={() => selectReg(reg)}
                          style={{
                            cursor: "pointer",
                            backgroundColor: selectedReg?.id === reg.id ? "color-mix(in srgb, var(--color-primary, #2456E6) 10%, transparent)" : undefined,
                            borderBottom: "1px solid var(--color-line)",
                          }}
                        >
                          <td style={td}><code>{reg.registration_number}</code></td>
                          <td style={td}>{reg.name}</td>
                          <td style={td}>{REG_STATUS_LABEL[reg.status] ?? reg.status}</td>
                          <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{formatRupiah(reg.donation)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Pending manual refunds */}
      {processingRefunds.length > 0 && (
        <section style={{ ...card, marginTop: 16, borderColor: "var(--color-warn)" }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Refund Manual Menunggu Konfirmasi ({processingRefunds.length})
          </div>
          {err && <Alert variant="danger" className="mb-4">{err}</Alert>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {processingRefunds.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  border: "1px solid var(--color-line)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    Refund <code style={{ fontSize: 12 }}>{r.id.slice(0, 8)}…</code>
                  </div>
                  {r.bank_account && (
                    <div style={{ fontSize: 12, color: "var(--color-ink-3)" }}>Rekening: {r.bank_account}</div>
                  )}
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{formatRupiah(r.amount)}</div>
                </div>
                <Button variant="primary" size="sm" disabled={busy} onClick={() => completeManual(r.id)}>
                  Tandai Selesai
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Single refund form */}
      <section style={{ ...card, marginTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Proses Refund Satu Pendaftar</div>
        {err && processingRefunds.length === 0 && <Alert variant="danger" className="mb-4">{err}</Alert>}

        {selectedReg ? (
          <div
            style={{
              padding: "8px 12px",
              marginBottom: 12,
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
            }}
          >
            <span style={{ fontWeight: 500 }}>{selectedReg.name}</span>
            {" · "}
            <code>{selectedReg.registration_number}</code>
            {" · "}
            {REG_STATUS_LABEL[selectedReg.status] ?? selectedReg.status}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 12 }}>
            Pilih pendaftar dari tabel di atas.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Labeled label="Alasan" value={reason} onChange={setReason} />
          <Labeled
            label="No. Rekening (wajib untuk metode VA / transfer manual)"
            value={bankAccount}
            onChange={setBankAccount}
          />
          <Button variant="danger" size="md" disabled={busy || !selectedReg} onClick={submitRefund}>
            {busy ? "Memproses…" : "Proses Refund"}
          </Button>
        </div>

        {refund && (
          <div style={{ ...card, marginTop: 16, backgroundColor: "var(--color-paper)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>Refund #{refund.id.slice(0, 8)}…</span>
              <Badge variant={REFUND_STATUS[refund.status]?.variant ?? "warn"}>
                {REFUND_STATUS[refund.status]?.label ?? refund.status}
              </Badge>
            </div>
            <Row label="Nominal Refund" value={formatRupiah(refund.amount)} mono />
            <Row label="Donasi (tidak dikembalikan)" value={formatRupiah(refund.donation)} mono />
            <Row label="Metode / Mode" value={`${refund.method} · ${refund.mode}`} />
            {refund.bank_account && <Row label="No. Rekening" value={refund.bank_account} mono />}
            <Alert variant="info" className="mb-0">
              Donasi tetap disalurkan ke penyelenggara/penerima manfaat (FR-909/1406).
            </Alert>
          </div>
        )}
      </section>

      {/* Mass refund */}
      <section style={{ ...card, marginTop: 24, borderColor: "var(--color-danger)" }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Refund Massal (Event Dibatalkan)</div>
        <p style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 12 }}>
          Hanya untuk event berstatus <b>cancelled</b>. Merefund seluruh pendaftar berbayar.
        </p>
        {massErr && <Alert variant="danger" className="mb-4">{massErr}</Alert>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Labeled label="ID Event" value={massEventId} onChange={setMassEventId} />
          <Labeled label="Alasan" value={massReason} onChange={setMassReason} />
          <Button variant="danger" size="md" disabled={massBusy} onClick={submitMass}>
            {massBusy ? "Memproses…" : "Refund Semua Pendaftar"}
          </Button>
        </div>
        {mass && (
          <div style={{ ...card, marginTop: 16, backgroundColor: "var(--color-paper)" }}>
            <Row label="Berhasil di-refund" value={String(mass.refunded)} />
            <Row label="Gagal" value={String(mass.failed)} />
            {mass.errors && mass.errors.length > 0 && (
              <ul style={{ fontSize: 12, color: "var(--color-danger)", marginTop: 8, paddingLeft: 18 }}>
                {mass.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const card: React.CSSProperties = {
  padding: 20,
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius-md)",
  backgroundColor: "var(--color-surface)",
};

const th: React.CSSProperties = {
  padding: "6px 8px",
  fontWeight: 600,
  color: "var(--color-ink-3)",
  fontSize: 12,
};

const td: React.CSSProperties = {
  padding: "8px 8px",
};

function Labeled({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <input className="field-input" type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14, gap: 12 }}>
      <span style={{ color: "var(--color-ink-3)" }}>{label}</span>
      <span style={mono ? { fontFamily: "var(--font-mono)" } : undefined}>{value}</span>
    </div>
  );
}
