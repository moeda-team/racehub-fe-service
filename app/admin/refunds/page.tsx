"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { adminApi } from "@/lib/admin";
import { formatRupiah } from "@/lib/format";
import type { ApiResponse, MassRefundResult, Refund } from "@/lib/types.gen";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";

const REFUND_STATUS: Record<string, { label: string; variant: "ok" | "warn" | "danger" }> = {
  completed: { label: "Selesai", variant: "ok" },
  processing: { label: "Diproses", variant: "warn" },
  rejected: { label: "Ditolak", variant: "danger" },
};

export default function AdminRefundsPage() {
  // --- Single refund state ---
  const [regId, setRegId] = useState("");
  const [reason, setReason] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [refund, setRefund] = useState<Refund | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // --- Mass refund state ---
  const [eventId, setEventId] = useState("");
  const [massReason, setMassReason] = useState("");
  const [mass, setMass] = useState<MassRefundResult | null>(null);
  const [massErr, setMassErr] = useState<string | null>(null);
  const [massBusy, setMassBusy] = useState(false);

  async function submitRefund() {
    setErr(null);
    setRefund(null);
    const id = Number(regId);
    if (!id) {
      setErr("Masukkan ID registrasi yang valid.");
      return;
    }
    setBusy(true);
    try {
      const res = await adminApi.post<ApiResponse<Refund>>(`/api/v1/admin/registrations/${id}/refund`, {
        reason,
        bank_account: bankAccount || undefined,
      });
      setRefund(res.data);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Refund gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function completeManual() {
    if (!refund) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await adminApi.post<ApiResponse<Refund>>(`/api/v1/admin/refunds/${refund.id}/complete`);
      setRefund(res.data);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Gagal menandai selesai.");
    } finally {
      setBusy(false);
    }
  }

  async function submitMass() {
    setMassErr(null);
    setMass(null);
    const id = Number(eventId);
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

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Refund</h1>
      <p style={{ color: "var(--color-ink-3)", fontSize: 14, marginBottom: 24 }}>
        Nominal refund dihitung server: <code>total − fee Midtrans − donasi</code>. Donasi tidak dikembalikan dan
        tetap disalurkan (FR-909).
      </p>

      {/* Single refund */}
      <section style={card}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Refund Satu Pendaftar</div>
        {err && <Alert variant="danger" className="mb-4">{err}</Alert>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Labeled label="ID Registrasi" value={regId} onChange={setRegId} type="number" />
          <Labeled label="Alasan" value={reason} onChange={setReason} />
          <Labeled
            label="No. Rekening (wajib untuk metode VA / transfer manual)"
            value={bankAccount}
            onChange={setBankAccount}
          />
          <Button variant="danger" size="md" disabled={busy} onClick={submitRefund}>
            {busy ? "Memproses…" : "Proses Refund"}
          </Button>
        </div>

        {refund && (
          <div style={{ ...card, marginTop: 16, backgroundColor: "var(--color-paper)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>Refund #{refund.id}</span>
              <Badge variant={REFUND_STATUS[refund.status]?.variant ?? "warn"}>
                {REFUND_STATUS[refund.status]?.label ?? refund.status}
              </Badge>
            </div>
            <Row label="Nominal Refund" value={formatRupiah(refund.amount)} mono />
            <Row label="Donasi (tidak dikembalikan)" value={formatRupiah(refund.donation)} mono />
            <Row label="Metode / Mode" value={`${refund.method} · ${refund.mode}`} />
            {refund.bank_account && <Row label="No. Rekening" value={refund.bank_account} mono />}
            <Alert variant="info" className="mb-0" >
              Donasi tetap disalurkan ke penyelenggara/penerima manfaat (FR-909/1406).
            </Alert>
            {refund.mode === "manual" && refund.status === "processing" && (
              <Button variant="primary" size="sm" disabled={busy} onClick={completeManual} style={{ marginTop: 12 }}>
                Tandai Transfer Selesai
              </Button>
            )}
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
          <Labeled label="ID Event" value={eventId} onChange={setEventId} type="number" />
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

function Labeled({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <input className="field-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
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
