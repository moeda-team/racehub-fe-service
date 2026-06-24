"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { api, ApiError } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import type {
  ApiResponse,
  PaymentChargeResponse,
  PaymentMethod,
  PaymentQuoteResponse,
  Registration,
} from "@/lib/types.gen";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import PaymentBreakdown from "@/components/ui/PaymentBreakdown";

// Methods offered. Order/label only — fees come from the server (FR-508).
const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "va", label: "Virtual Account" },
  { value: "gopay", label: "GoPay" },
  { value: "qris", label: "QRIS" },
  { value: "card", label: "Kartu Kredit/Debit" },
];

type StatusVariant = "warn" | "ok" | "danger" | "neutral";

function statusBadge(status: string): { label: string; variant: StatusVariant } {
  switch (status) {
    case "paid":
      return { label: "Lunas", variant: "ok" };
    case "pending_payment":
      return { label: "Menunggu Pembayaran", variant: "warn" };
    case "cancelled":
      return { label: "Dibatalkan", variant: "danger" };
    case "expired":
      return { label: "Kedaluwarsa", variant: "danger" };
    default:
      return { label: status, variant: "neutral" };
  }
}

export default function PayPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = use(params);

  const [reg, setReg] = useState<Registration | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [quote, setQuote] = useState<PaymentQuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [charge, setCharge] = useState<PaymentChargeResponse | null>(null);
  const [charging, setCharging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRegistration = useCallback(async () => {
    const res = await api.get<ApiResponse<Registration>>(`/api/v1/registrations/${number}`);
    return res.data;
  }, [number]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadRegistration();
        if (!cancelled) setReg(data);
      } catch {
        if (!cancelled) setLoadError("Pendaftaran tidak ditemukan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadRegistration]);

  // Poll for settlement once a charge is created (webhook updates status).
  useEffect(() => {
    if (!charge || reg?.status === "paid") return;
    const id = setInterval(async () => {
      try {
        const data = await loadRegistration();
        setReg(data);
      } catch {
        /* keep polling */
      }
    }, 4000);
    return () => clearInterval(id);
  }, [charge, reg?.status, loadRegistration]);

  async function handleMethodChange(value: string) {
    const m = value as PaymentMethod | "";
    setMethod(m);
    setQuote(null);
    setError(null);
    if (!m || !reg) return;
    setQuoting(true);
    try {
      const res = await api.post<ApiResponse<PaymentQuoteResponse>>("/api/v1/payments/quote", {
        registration_id: reg.id,
        payment_method: m,
      });
      setQuote(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengambil rincian biaya.");
    } finally {
      setQuoting(false);
    }
  }

  async function handleCharge() {
    if (!reg || !method) return;
    setCharging(true);
    setError(null);
    try {
      const res = await api.post<ApiResponse<PaymentChargeResponse>>("/api/v1/payments/charge", {
        registration_id: reg.id,
        payment_method: method,
      });
      setCharge(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memulai pembayaran.");
    } finally {
      setCharging(false);
    }
  }

  if (loading) {
    return <main className="max-w-xl mx-auto px-4 py-12"><p style={{ color: "var(--color-ink-3)" }}>Memuat…</p></main>;
  }
  if (loadError || !reg) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <Link href="/" style={back}>← Kembali ke marketplace</Link>
        <Alert variant="danger">{loadError ?? "Pendaftaran tidak ditemukan."}</Alert>
      </main>
    );
  }

  const badge = statusBadge(reg.status);

  // Already paid → straight to the e-ticket.
  if (reg.status === "paid") {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <Alert variant="info" className="mb-4">Pembayaran lunas. E-tiket Anda sudah terbit.</Alert>
        <div style={card}>
          <Row label="Nomor Registrasi" value={reg.registration_number} mono />
          <div style={{ marginTop: 8 }}><Badge variant="ok">Lunas</Badge></div>
        </div>
        <Link href={`/ticket/${reg.registration_number}`} style={{ display: "block", marginTop: 16 }}>
          <Button variant="primary" size="md" style={{ width: "100%" }}>Lihat E-tiket</Button>
        </Link>
      </main>
    );
  }

  // Build the FR-502-ordered breakdown lines (display only, from /quote).
  const lines = quote
    ? [
        { label: "Harga Tiket", value: formatRupiah(quote.price) },
        { label: "Donasi", value: formatRupiah(quote.donation) },
        { label: "Fee Platform", value: formatRupiah(quote.fee_platform) },
        { label: `Fee Midtrans · ${quote.payment_method_label}`, value: formatRupiah(quote.fee_midtrans) },
      ]
    : [];

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <Link href={`/`} style={back}>← Marketplace</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700 }}>Pembayaran</h1>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <p style={{ color: "var(--color-ink-3)", marginBottom: 20, fontSize: 14 }}>
        No. Registrasi <span style={{ fontFamily: "var(--font-mono)" }}>{reg.registration_number}</span>
      </p>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {!charge ? (
        <>
          <PaymentBreakdown
            method={method}
            methodOptions={METHOD_OPTIONS}
            onMethodChange={handleMethodChange}
            lines={lines}
            total={quote ? formatRupiah(quote.sub_total) : "—"}
          />
          <p style={{ fontSize: 12, color: "var(--color-ink-3)", margin: "10px 0 16px" }}>
            ⛁ Pilih metode dulu agar Fee Midtrans dihitung tepat sesuai tarif (FR-508). Donasi bebas
            biaya admin &amp; tidak dapat dikembalikan.
          </p>
          <Button
            variant="primary"
            size="md"
            style={{ width: "100%" }}
            disabled={!quote || quoting || charging}
            onClick={handleCharge}
          >
            {quoting ? "Menghitung…" : charging ? "Memproses…" : "Bayar Sekarang"}
          </Button>
        </>
      ) : (
        <div style={card}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Instruksi Pembayaran</div>
          <Row label="Metode" value={charge.quote.payment_method_label} />
          {charge.va_number && <Row label="Nomor Virtual Account" value={charge.va_number} mono />}
          {charge.qr_string && <QrDisplay value={charge.qr_string} />}
          <hr style={{ border: 0, borderTop: "1px solid var(--color-line)", margin: "12px 0" }} />
          <Row label="Harga Tiket" value={formatRupiah(charge.quote.price)} mono />
          <Row label="Donasi" value={formatRupiah(charge.quote.donation)} mono />
          <Row label="Fee Platform" value={formatRupiah(charge.quote.fee_platform)} mono />
          <Row label={`Fee Admin · ${charge.quote.payment_method_label}`} value={formatRupiah(charge.quote.fee_midtrans)} mono />
          <hr style={{ border: 0, borderTop: "1px solid var(--color-line)", margin: "12px 0" }} />
          <Row label="Sub Total" value={formatRupiah(charge.quote.sub_total)} mono />
          <hr style={{ border: 0, borderTop: "1px solid var(--color-line)", margin: "12px 0" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="warn">Menunggu Pembayaran</Badge>
            <span style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
              Status diperbarui otomatis setelah pembayaran dikonfirmasi.
            </span>
          </div>
        </div>
      )}
    </main>
  );
}

const back: React.CSSProperties = { fontSize: 13, color: "var(--color-ink-3)", display: "inline-block", marginBottom: 12 };
const card: React.CSSProperties = {
  padding: 16,
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius-md)",
  backgroundColor: "var(--color-surface)",
};

// QR rendering for QRIS/GoPay. Midtrans returns either a raw QRIS payload
// (encode it client-side) or a ready-made QR image URL (e.g. GoPay
// generate-qr-code). A URL must be shown as <img>, never re-encoded — its
// pixels already are the payment QR.
function QrDisplay({ value }: { value: string }) {
  const isUrl = /^https?:\/\//i.test(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 0" }}>
      <span style={{ alignSelf: "flex-start", color: "var(--color-ink-3)", fontSize: 14 }}>
        Kode QR — pindai untuk membayar
      </span>
      <div style={{ background: "#fff", padding: 12, borderRadius: "var(--radius-md)" }}>
        {isUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Kode QR pembayaran" width={280} height={280} style={{ display: "block", width: "100%", maxWidth: 280, height: "auto" }} />
        ) : (
          <QRCodeSVG value={value} size={280} level="M" style={{ width: "100%", maxWidth: 280, height: "auto" }} />
        )}
      </div>
      {isUrl && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, color: "var(--color-flame)" }}
        >
          Buka kode QR di tab baru
        </a>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14, gap: 12 }}>
      <span style={{ color: "var(--color-ink-3)" }}>{label}</span>
      <span style={{ textAlign: "right", ...(mono ? { fontFamily: "var(--font-mono)" } : {}) }}>{value}</span>
    </div>
  );
}
