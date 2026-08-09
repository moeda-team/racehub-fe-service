"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import type { ApiResponse, Refund } from "@/lib/types.gen";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const STATUS_MAP: Record<
  string,
  { label: string; desc: string; variant: "ok" | "warn" | "danger" }
> = {
	requested: {
		label: "Menunggu Persetujuan",
		desc: "Pengajuan refund telah dikirim dan sedang ditinjau penyelenggara.",
		variant: "warn",
	},
  completed: {
    label: "Selesai",
    desc: "Dana refund telah dikembalikan ke metode pembayaran asal Anda.",
    variant: "ok",
  },
  processing: {
    label: "Sedang Diproses",
    desc: "Refund sedang dalam proses. Untuk pembayaran via VA/transfer bank, tim kami akan menghubungi Anda.",
    variant: "warn",
  },
  rejected: {
    label: "Ditolak",
    desc: "Permintaan refund tidak dapat diproses. Hubungi penyelenggara event untuk informasi lebih lanjut.",
    variant: "danger",
  },
};

const MODE_LABEL: Record<string, string> = {
  auto: "Otomatis (kartu / e-wallet)",
  manual: "Manual (transfer bank)",
};

export default function RefundStatusPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = use(params);

  const [refund, setRefund] = useState<Refund | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [refundDonation, setRefundDonation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function requestRefund(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setError(null);
    try { const res = await api.post<ApiResponse<Refund>>(`/api/v1/registrations/${number}/refund`, { reason, bank_account: bankAccount || undefined, refund_donation: refundDonation }, { auth: false }); setRefund(res.data); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Pengajuan refund gagal."); }
    finally { setSubmitting(false); }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<Refund>>(
          `/api/v1/registrations/${number}/refund`,
        );
        if (!cancelled) setRefund(res.data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setError(
            "Refund tidak ditemukan untuk nomor registrasi ini. Pastikan nomor benar atau hubungi penyelenggara.",
          );
        } else {
          setError("Gagal memuat status refund. Coba lagi nanti.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [number]);

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "48px 20px" }}>
      <Link
        href={`/ticket/${number}`}
        style={{
          fontSize: 13,
          color: "var(--color-ink-3)",
          display: "inline-block",
          marginBottom: 20,
        }}
      >
        ← Kembali ke tiket
      </Link>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 4,
          marginTop: 0,
        }}
      >
        Status Refund
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "var(--color-ink-3)",
          marginTop: 0,
          marginBottom: 24,
        }}
      >
        No. Registrasi:{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>{number}</code>
      </p>

      {loading && <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !refund && (
        <form onSubmit={requestRefund} style={{ border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", padding: 20, background: "var(--color-surface)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginTop: 0 }}>Ajukan refund personal</h2>
          <p style={{ fontSize: 13, color: "var(--color-ink-3)" }}>Jika disetujui organizer, refund personal bernilai 75% dari pembayaran selain donasi; pilih opsi di bawah bila donasi juga ingin direfund.</p>
          <label className="field-label">Alasan</label>
          <textarea className="field-input" value={reason} onChange={(e) => setReason(e.target.value)} required style={{ minHeight: 88, marginBottom: 12 }} />
          <label className="field-label">Nomor rekening (wajib untuk pembayaran VA)</label>
          <input className="field-input" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} style={{ marginBottom: 12 }} />
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, marginBottom: 16 }}><input type="checkbox" checked={refundDonation} onChange={(e) => setRefundDonation(e.target.checked)} /> Sertakan donasi dalam basis refund (tetap dikenai potongan 25%)</label>
          <Button type="submit" variant="primary" disabled={submitting} style={{ width: "100%" }}>{submitting ? "Mengirim…" : "Kirim Pengajuan Refund"}</Button>
        </form>
      )}

      {refund &&
        (() => {
          const s = STATUS_MAP[refund.status] ?? {
            label: refund.status,
            desc: "",
            variant: "warn" as const,
          };
          return (
            <div
              style={{
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}
            >
              {/* Status header */}
              <div
                style={{
                  padding: "20px 24px",
                  background: "var(--color-panel)",
                  borderBottom: "1px solid var(--color-line)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Badge variant={s.variant}>{s.label}</Badge>
                <span style={{ fontSize: 13, color: "var(--color-ink-2)" }}>
                  {s.desc}
                </span>
              </div>

              {/* Refund details */}
              <div
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <Row label="Jumlah Refund">
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: 20,
                    }}
                  >
                    {formatRupiah(refund.amount)}
                  </span>
                </Row>

                <Row label="Metode Pembayaran">
                  {refund.method.toUpperCase()}
                </Row>

                <Row label="Mode Refund">
                  {MODE_LABEL[refund.mode] ?? refund.mode}
                </Row>

                {refund.bank_account && (
                  <Row label="Rekening Tujuan">
                    <code
                      style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
                    >
                      {refund.bank_account === "PENDING-MANUAL"
                        ? "Menunggu konfirmasi rekening"
                        : refund.bank_account}
                    </code>
                  </Row>
                )}

                {refund.donation_still_given && (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "var(--color-panel)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 13,
                      color: "var(--color-ink-3)",
                      border: "1px solid var(--color-line)",
                    }}
                  >
                    Donasi Anda tetap disalurkan ke penerima yang ditentukan
                    penyelenggara.
                  </div>
                )}

                {refund.reason && <Row label="Alasan">{refund.reason}</Row>}
              </div>
            </div>
          );
        })()}
    </main>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
      }}
    >
      <span
        style={{ fontSize: 13, color: "var(--color-ink-3)", flexShrink: 0 }}
      >
        {label}
      </span>
      <span style={{ fontSize: 14, textAlign: "right" }}>{children}</span>
    </div>
  );
}
