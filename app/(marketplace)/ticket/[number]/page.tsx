"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatRupiah, formatDate } from "@/lib/format";
import type { ApiResponse, ETicket, Refund } from "@/lib/types.gen";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Ticket from "@/components/ui/Ticket";

const REFUND_STATUS: Record<string, { label: string; variant: "ok" | "warn" | "danger" }> = {
  completed: { label: "Selesai", variant: "ok" },
  processing: { label: "Diproses", variant: "warn" },
  rejected: { label: "Ditolak", variant: "danger" },
};

export default function TicketPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = use(params);

  const [ticket, setTicket] = useState<ETicket | null>(null);
  const [refund, setRefund] = useState<Refund | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notReady, setNotReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<ETicket>>(`/api/v1/registrations/${number}/ticket`);
        if (cancelled) return;
        const t = res.data;
        setTicket(t);
        // When the event was cancelled and refund was initiated, also load refund details.
        if (t.registration_status === "refunded") {
          try {
            const rr = await api.get<ApiResponse<Refund>>(`/api/v1/registrations/${number}/refund`);
            if (!cancelled) setRefund(rr.data);
          } catch { /* refund may still be in-flight — show ticket without it */ }
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setNotReady(true);
        else setError("Gagal memuat e-tiket.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [number]);

  if (loading) {
    return <main className="max-w-xl mx-auto px-4 py-12"><p style={{ color: "var(--color-ink-3)" }}>Memuat…</p></main>;
  }

  if (notReady) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <Alert variant="warn" className="mb-4">
          E-tiket belum terbit. Selesaikan pembayaran terlebih dahulu.
        </Alert>
        <Link href={`/pay/${number}`}>
          <Button variant="primary" size="md" style={{ width: "100%" }}>Ke Halaman Pembayaran</Button>
        </Link>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <Link href="/" style={back}>← Kembali ke marketplace</Link>
        <Alert variant="danger">{error ?? "E-tiket tidak ditemukan."}</Alert>
      </main>
    );
  }

  const isRefunded = ticket.registration_status === "refunded";
  const inv = ticket.invoice;

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <Link href="/" style={back}>← Marketplace</Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
        {isRefunded ? "Pendaftaran Dibatalkan" : "E-tiket"}
      </h1>
      <p style={{ color: "var(--color-ink-3)", marginBottom: 20, fontSize: 14 }}>
        {isRefunded
          ? `${ticket.event_name} · ${ticket.distance_name}`
          : "Tunjukkan QR ini saat check-in di lokasi acara."}
      </p>

      {isRefunded ? (
        <div style={{ ...card, borderColor: refund?.status === "completed" ? "var(--color-sprint)" : "var(--color-warn)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>Status Refund</span>
            {refund && (
              <Badge variant={REFUND_STATUS[refund.status]?.variant ?? "warn"}>
                {REFUND_STATUS[refund.status]?.label ?? refund.status}
              </Badge>
            )}
          </div>
          {refund ? (
            <>
              <Row label="Nominal Refund" value={formatRupiah(refund.amount)} mono />
              <Row label="Metode" value={`${refund.method} · ${refund.mode === "auto" ? "Otomatis" : "Manual"}`} />
              {refund.mode === "manual" && refund.status === "processing" && (
                <div style={{ marginTop: 12 }}>
                  <Alert variant="warn" className="mb-0">
                    Refund diproses secara manual. Tim kami akan menghubungi Anda untuk konfirmasi transfer.
                  </Alert>
                </div>
              )}
              {refund.status === "completed" && (
                <div style={{ marginTop: 12 }}>
                  <Alert variant="info" className="mb-0">
                    Dana telah dikembalikan. Donasi tidak dikembalikan dan tetap disalurkan.
                  </Alert>
                </div>
              )}
              <div style={{ marginTop: 14 }}>
                <Link href={`/refund/${number}`} style={{ fontSize: 13, color: "var(--color-flame)" }}>
                  Lihat detail refund →
                </Link>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 14, color: "var(--color-ink-3)", margin: 0 }}>
              Refund sedang disiapkan. Cek kembali dalam beberapa saat.
            </p>
          )}
        </div>
      ) : (
        <Ticket
          registrationNumber={ticket.registration_number}
          name={ticket.participant_name}
          event={ticket.event_name}
          distance={ticket.distance_name}
          ageClass={ticket.age_class || undefined}
          gender={ticket.gender || undefined}
          date={ticket.issued_at ? formatDate(ticket.issued_at) : undefined}
          qrToken={ticket.qr_token}
        />
      )}

      {inv && (
        <div style={card}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Rincian Pembayaran</div>
          <Row label="Harga Tiket" value={formatRupiah(inv.price)} mono />
          <Row label="Donasi" value={formatRupiah(inv.donation)} mono />
          <Row label="Fee Platform" value={formatRupiah(inv.fee_platform)} mono />
          <Row label={`Fee Admin · ${inv.payment_method_label}`} value={formatRupiah(inv.fee_midtrans)} mono />
          <hr style={{ border: 0, borderTop: "1px solid var(--color-line)", margin: "8px 0" }} />
          <Row label="Sub Total" value={formatRupiah(inv.sub_total)} mono bold />
        </div>
      )}
    </main>
  );
}

const back: React.CSSProperties = { fontSize: 13, color: "var(--color-ink-3)", display: "inline-block", marginBottom: 12 };
const card: React.CSSProperties = {
  padding: 16,
  marginTop: 16,
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius-md)",
  backgroundColor: "var(--color-surface)",
};

function Row({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14, gap: 12 }}>
      <span style={{ color: "var(--color-ink-3)" }}>{label}</span>
      <span style={{ textAlign: "right", fontWeight: bold ? 700 : 400, ...(mono ? { fontFamily: "var(--font-mono)" } : {}) }}>
        {value}
      </span>
    </div>
  );
}
