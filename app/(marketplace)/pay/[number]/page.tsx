"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { api, ApiError } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { normalizePaymentMethodLabel } from "@/lib/paymentMethods";
import type {
  ApiResponse,
  PaymentChargeResponse,
  PaymentMethod,
  PaymentQuoteResponse,
  PaymentMethodOption,
  Registration,
} from "@/lib/types.gen";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Field from "@/components/ui/Field";
import PaymentBreakdown from "@/components/ui/PaymentBreakdown";

type StatusVariant = "warn" | "ok" | "danger" | "neutral";

function statusBadge(status: string): {
  label: string;
  variant: StatusVariant;
} {
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
  const [methodOptions, setMethodOptions] = useState<PaymentMethodOption[]>([]);
  const [quote, setQuote] = useState<PaymentQuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [charge, setCharge] = useState<PaymentChargeResponse | null>(null);
  const [resumedPayment, setResumedPayment] = useState(false);
  const [charging, setCharging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Voucher: the backend validates the code and returns the discount inside
  // the quote; the page never computes the discounted amount itself.
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const loadRegistration = useCallback(async () => {
    const res = await api.get<ApiResponse<Registration>>(`/api/v1/registrations/${number}`);
    return res.data;
  }, [number]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadRegistration();
        if (!cancelled) {
          setReg(data);
          if (data.status === "pending_payment" && data.pending_payment?.status === "pending") {
            setCharge(data.pending_payment);
            setResumedPayment(true);
          }
        }
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

  useEffect(() => {
    api
      .get<ApiResponse<PaymentMethodOption[]>>("/api/v1/payments/methods")
      .then((res) => setMethodOptions(res.data ?? []))
      .catch(() => setError("Metode pembayaran sedang tidak tersedia."));
  }, []);

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

  function requestQuote(registrationId: string, paymentMethod: string, voucherCode: string | null) {
    return api.post<ApiResponse<PaymentQuoteResponse>>("/api/v1/payments/quote", {
      registration_id: registrationId,
      payment_method: paymentMethod,
      ...(voucherCode ? { voucher_code: voucherCode } : {}),
    });
  }

  async function handleMethodChange(value: string) {
    const m = value as PaymentMethod | "";
    setMethod(m);
    setQuote(null);
    setError(null);
    if (!m || !reg) return;
    setQuoting(true);
    try {
      const res = await requestQuote(reg.id, m, appliedVoucher);
      setQuote(res.data);
    } catch (err) {
      if (appliedVoucher && isVoucherError(err)) {
        // The voucher stopped being usable (e.g. quota ran out): drop it and
        // show the regular price so the participant can still pay.
        setAppliedVoucher(null);
        setVoucherError(err.message);
        try {
          const res = await requestQuote(reg.id, m, null);
          setQuote(res.data);
        } catch (retryErr) {
          setError(retryErr instanceof ApiError ? retryErr.message : "Gagal mengambil rincian biaya.");
        }
      } else {
        setError(err instanceof ApiError ? err.message : "Gagal mengambil rincian biaya.");
      }
    } finally {
      setQuoting(false);
    }
  }

  async function handleApplyVoucher() {
    if (!reg) return;
    const code = voucherInput.trim().toUpperCase();
    setVoucherError(null);
    if (!code) {
      setVoucherError("Masukkan kode voucher.");
      return;
    }
    if (!method) {
      setVoucherError("Pilih metode pembayaran terlebih dulu, lalu pakai voucher.");
      return;
    }
    setApplyingVoucher(true);
    try {
      const res = await requestQuote(reg.id, method, code);
      setQuote(res.data);
      setAppliedVoucher(res.data.voucher_code ?? code);
      setVoucherInput("");
    } catch (err) {
      setVoucherError(err instanceof ApiError ? err.message : "Voucher tidak dapat digunakan.");
    } finally {
      setApplyingVoucher(false);
    }
  }

  async function handleRemoveVoucher() {
    setAppliedVoucher(null);
    setVoucherError(null);
    if (!reg || !method) return;
    setQuoting(true);
    try {
      const res = await requestQuote(reg.id, method, null);
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
        ...(appliedVoucher ? { voucher_code: appliedVoucher } : {}),
      });
      if (res.data.status === "settlement") {
        // Fully covered by the voucher: the backend already marked the
        // registration paid and issued the e-ticket.
        setReg(await loadRegistration());
        return;
      }
      setCharge(res.data);
      setResumedPayment(false);
    } catch (err) {
      if (appliedVoucher && isVoucherError(err)) {
        setAppliedVoucher(null);
        setVoucherError(`${err.message}. Voucher dilepas, silakan periksa ulang rincian biaya.`);
        try {
          const res = await requestQuote(reg.id, method, null);
          setQuote(res.data);
        } catch {
          setQuote(null);
        }
      } else {
        setError(err instanceof ApiError ? err.message : "Gagal memulai pembayaran.");
      }
    } finally {
      setCharging(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      </main>
    );
  }
  if (loadError || !reg) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <Link href="/jelajahi-event" style={back}>
          ← Kembali ke marketplace
        </Link>
        <Alert variant="danger">{loadError ?? "Pendaftaran tidak ditemukan."}</Alert>
      </main>
    );
  }

  const badge = statusBadge(reg.status);

  const paymentDeadline = reg.reservation_expires_at ?? reg.payment_expires_at ?? charge?.expires_at;

  // Already paid → straight to the e-ticket.
  if (reg.status === "paid") {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <Alert variant="info" className="mb-4">
          {reg.is_complimentary
            ? "Tiket gratis (Complimentary). E-tiket Anda sudah aktif."
            : "Pembayaran lunas. E-tiket Anda sudah terbit."}
        </Alert>
        <div style={card}>
          <Row label="Nomor Registrasi" value={reg.registration_number} mono />
          {reg.payment_paid_at && <Row label="Waktu Pembayaran" value={formatPaymentDate(reg.payment_paid_at)} />}
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge variant="ok">Lunas</Badge>
            {reg.is_complimentary && <Badge variant="sprint">Complimentary</Badge>}
          </div>
        </div>
        <Link
          href={`/ticket/${reg.registration_number}${reg.qr_token ? `?token=${reg.qr_token}` : ""}`}
          style={{ display: "block", marginTop: 16 }}
        >
          <Button variant="primary" size="md" style={{ width: "100%" }}>
            Lihat E-tiket
          </Button>
        </Link>
      </main>
    );
  }

  if (reg.status === "expired") {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <Link href="/jelajahi-event" style={back}>
          ← Kembali ke marketplace
        </Link>
        <Alert variant="danger">Batas waktu pembayaran telah berakhir. Pendaftaran ini tidak dapat dibayar lagi.</Alert>
        <div style={card}>
          <Row label="Nomor Registrasi" value={reg.registration_number} mono />
          {paymentDeadline && <Row label="Batas Pembayaran" value={formatPaymentDate(paymentDeadline)} />}
          <div style={{ marginTop: 8 }}>
            <Badge variant="danger">Kedaluwarsa</Badge>
          </div>
        </div>
      </main>
    );
  }

  // Build the breakdown lines (display only, from /quote).
  const coveredByVoucher = !!quote && !!appliedVoucher && quote.sub_total === 0;
  const lines = quote
    ? [
        {
          label: "Harga Event",
          value: formatRupiah(quote.ticket_price ?? quote.price),
          original: quote.original_price != null ? formatRupiah(quote.original_price) : undefined,
        },
        ...(quote.addons ?? []).map((addon) => ({
          label: `${addon.title}: ${addon.name}`,
          value: formatRupiah(addon.price),
        })),
        ...((quote.discount ?? 0) > 0
          ? [
              {
                label: quote.voucher_code ? `Diskon Voucher (${quote.voucher_code})` : "Diskon Voucher",
                value: `-${formatRupiah(quote.discount)}`,
              },
            ]
          : []),
        ...(quote.donation > 0 ? [{ label: "Donasi", value: formatRupiah(quote.donation) }] : []),
        {
          label: "Platform",
          value: formatRupiah(quote.fee_platform),
          original: quote.original_fee_platform != null ? formatRupiah(quote.original_fee_platform) : undefined,
        },
        ...(quote.fee_midtrans_charged_to_buyer
          ? [
              {
                label: "Biaya Transaksi",
                value: formatRupiah(quote.fee_midtrans),
              },
            ]
          : []),
      ]
    : [];

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <Link href={`/`} style={back}>
        ← Marketplace
      </Link>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          Pembayaran
        </h1>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <p style={{ color: "var(--color-ink-3)", marginBottom: 20, fontSize: 14 }}>
        No. Registrasi <span style={{ fontFamily: "var(--font-mono)" }}>{reg.registration_number}</span>
      </p>

      {reg.is_complimentary && (
        <div
          style={{
            padding: "12px 16px",
            border: "1px solid var(--color-sprint)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "color-mix(in srgb, var(--color-sprint) 8%, transparent)",
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          <strong>Anda diundang - Tiket Gratis</strong> - harga tiket dan fee platform dibebaskan.
          {reg.donation > 0
            ? " Anda hanya perlu membayar donasi dan fee transaksi."
            : " Tidak ada biaya yang perlu dibayar."}
        </div>
      )}

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {!charge && paymentDeadline && reg.status === "pending_payment" && (
        <PaymentCountdown expiresAt={paymentDeadline} />
      )}

      {!charge ? (
        <>
          <PaymentBreakdown
            method={method}
            methodOptions={methodOptions.map((item) => ({
              value: item.id,
              label: normalizePaymentMethodLabel(item.id, item.label),
            }))}
            onMethodChange={handleMethodChange}
            lines={lines}
            total={quote ? formatRupiah(quote.sub_total) : "—"}
          />
          <p
            style={{
              fontSize: 12,
              color: "var(--color-ink-3)",
              margin: "10px 0 16px",
            }}
          >
            ⛁ Pilih metode dulu untuk melihat estimasi biaya transaksi. Nominal final mengikuti konfirmasi provider
            setelah pembayaran dibuat.
          </p>
          {!reg.is_complimentary && (
            <VoucherBox
              input={voucherInput}
              onInputChange={setVoucherInput}
              applied={appliedVoucher}
              error={voucherError}
              busy={applyingVoucher || quoting || charging}
              onApply={handleApplyVoucher}
              onRemove={handleRemoveVoucher}
            />
          )}
          {coveredByVoucher && (
            <Alert variant="info" className="mb-3">
              Total pembayaran Rp 0 karena voucher. E-tiket langsung terbit setelah Anda konfirmasi.
            </Alert>
          )}
          <Button
            variant="primary"
            size="md"
            style={{ width: "100%" }}
            disabled={!quote || quoting || charging || applyingVoucher}
            onClick={handleCharge}
          >
            {quoting
              ? "Menghitung…"
              : charging
                ? "Memproses…"
                : coveredByVoucher
                  ? "Konfirmasi & Terbitkan E-tiket"
                  : "Bayar Sekarang"}
          </Button>
        </>
      ) : (
        <div style={card}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Instruksi Pembayaran</div>
          <Alert variant="info" className="mb-3">
            Rincian biaya dan total di bawah adalah nominal final dari provider pembayaran.
          </Alert>
          {resumedPayment && (
            <Alert variant="info" className="mb-3">
              Instruksi pembayaran sebelumnya dipulihkan. Gunakan transaksi ini untuk menyelesaikan pembayaran.
            </Alert>
          )}
          <Row
            label="Metode"
            value={normalizePaymentMethodLabel(charge.quote.payment_method, charge.quote.payment_method_label)}
          />
          {charge.expires_at && <Row label="Batas Pembayaran" value={formatPaymentDate(charge.expires_at)} />}
          {charge.va_number && <Row label="Nomor Virtual Account" value={charge.va_number} mono />}
          {charge.biller_code && <Row label="Kode Biller (Mandiri)" value={charge.biller_code} mono />}
          {charge.bill_key && <Row label="Nomor Tagihan (Mandiri)" value={charge.bill_key} mono />}
          {charge.qr_string && <QrDisplay value={charge.qr_string} deeplinkUrl={charge.deeplink_url} />}
          {(charge.payment_url ?? charge.deeplink_url) && (
            <a
              href={charge.payment_url ?? charge.deeplink_url}
              target="_blank"
              rel="noreferrer"
              style={{ display: "block", marginTop: 12 }}
            >
              <Button variant="primary" size="md" style={{ width: "100%" }}>
                Lanjutkan ke iPaymu
              </Button>
            </a>
          )}
          {charge.expires_at && reg.status === "pending_payment" && <PaymentCountdown expiresAt={charge.expires_at} />}
          <hr
            style={{
              border: 0,
              borderTop: "1px solid var(--color-line)",
              margin: "12px 0",
            }}
          />
          <Row
            label="Harga Event"
            value={formatRupiah(charge.quote.ticket_price ?? charge.quote.price)}
            original={charge.quote.original_price != null ? formatRupiah(charge.quote.original_price) : undefined}
            mono
          />
          {(charge.quote.addons ?? reg.addons ?? []).map((addon) => (
            <Row key={addon.id} label={`${addon.title}: ${addon.name}`} value={formatRupiah(addon.price)} mono />
          ))}
          {(charge.quote.discount ?? 0) > 0 && (
            <Row
              label={charge.quote.voucher_code ? `Diskon Voucher (${charge.quote.voucher_code})` : "Diskon Voucher"}
              value={`-${formatRupiah(charge.quote.discount)}`}
              mono
            />
          )}
          {charge.quote.donation > 0 && <Row label="Donasi" value={formatRupiah(charge.quote.donation)} mono />}
          <Row
            label="Platform"
            value={formatRupiah(charge.quote.fee_platform)}
            original={
              charge.quote.original_fee_platform != null ? formatRupiah(charge.quote.original_fee_platform) : undefined
            }
            mono
          />
          {charge.quote.fee_midtrans_charged_to_buyer && (
            <Row label="Biaya Transaksi" value={formatRupiah(charge.quote.fee_midtrans)} mono />
          )}
          <hr
            style={{
              border: 0,
              borderTop: "1px solid var(--color-line)",
              margin: "12px 0",
            }}
          />
          <Row label="Sub Total" value={formatRupiah(charge.quote.sub_total)} mono />
          <hr
            style={{
              border: 0,
              borderTop: "1px solid var(--color-line)",
              margin: "12px 0",
            }}
          />
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

function isVoucherError(err: unknown): err is ApiError {
  return err instanceof ApiError && !!err.reason?.startsWith("voucher_");
}

interface VoucherBoxProps {
  input: string;
  onInputChange: (value: string) => void;
  applied: string | null;
  error: string | null;
  busy: boolean;
  onApply: () => void;
  onRemove: () => void;
}

function VoucherBox({ input, onInputChange, applied, error, busy, onApply, onRemove }: VoucherBoxProps) {
  if (applied) {
    return (
      <div style={{ ...card, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "var(--color-ink-3)" }}>Voucher dipakai</div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{applied}</div>
        </div>
        <Button variant="ghost" size="sm" type="button" disabled={busy} onClick={onRemove}>
          Hapus
        </Button>
      </div>
    );
  }
  return (
    <form
      style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
    >
      <Field
        label="Kode Voucher (opsional)"
        className="flex-1"
        value={input}
        maxLength={32}
        autoComplete="off"
        autoCapitalize="characters"
        placeholder="Contoh: HEMAT10"
        error={error ?? undefined}
        onChange={(e) => onInputChange(e.target.value.toUpperCase())}
      />
      <Button variant="secondary" size="md" type="submit" disabled={busy} style={{ marginTop: 24 }}>
        Pakai
      </Button>
    </form>
  );
}

const back: React.CSSProperties = {
  fontSize: 13,
  color: "var(--color-ink-3)",
  display: "inline-block",
  marginBottom: 12,
};
const card: React.CSSProperties = {
  padding: 16,
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius-md)",
  backgroundColor: "var(--color-surface)",
};

function PaymentCountdown({ expiresAt }: { expiresAt: string }) {
  const deadline = new Date(expiresAt).getTime();
  const [now, setNow] = useState(() => Date.now());
  const validDeadline = Number.isFinite(deadline);
  const remaining = validDeadline ? Math.max(0, deadline - now) : 0;

  useEffect(() => {
    if (!validDeadline) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [validDeadline]);

  if (!validDeadline) return null;
  if (remaining === 0) {
    return (
      <Alert variant="danger" className="my-3">
        Waktu pembayaran telah habis. Transaksi ini akan ditandai kedaluwarsa otomatis oleh sistem.
      </Alert>
    );
  }

  return (
    <div
      aria-live="polite"
      style={{
        margin: "14px 0",
        padding: "12px 14px",
        border: "1px solid #ead4a4",
        borderRadius: "var(--radius-sm)",
        backgroundColor: "var(--color-warn-tint)",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--color-ink-3)" }}>Selesaikan pembayaran dalam</div>
      <div
        style={{
          marginTop: 2,
          color: "var(--color-warn)",
          fontFamily: "var(--font-mono)",
          fontSize: 24,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatCountdown(remaining)}
      </div>
    </div>
  );
}

function formatCountdown(milliseconds: number): string {
  const seconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs].map((part) => String(part).padStart(2, "0")).join(":");
}

function formatPaymentDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

// QR rendering for QRIS. iPaymu may return either a raw payload
// (encode it client-side) or a ready-made QR image URL (e.g. GoPay
// generate-qr-code). A URL must be shown as <img>, never re-encoded - its
// pixels already are the payment QR.
function QrDisplay({ value, deeplinkUrl }: { value: string; deeplinkUrl?: string }) {
  const isUrl = /^https?:\/\//i.test(value);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "12px 0",
      }}
    >
      <span
        style={{
          alignSelf: "flex-start",
          color: "var(--color-ink-3)",
          fontSize: 14,
        }}
      >
        Kode QR - pindai untuk membayar
      </span>
      <div
        style={{
          background: "#fff",
          padding: 12,
          borderRadius: "var(--radius-md)",
        }}
      >
        {isUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Kode QR pembayaran"
            width={280}
            height={280}
            style={{
              display: "block",
              width: "100%",
              maxWidth: 280,
              height: "auto",
            }}
          />
        ) : (
          <QRCodeSVG value={value} size={280} level="M" style={{ width: "100%", maxWidth: 280, height: "auto" }} />
        )}
      </div>
      {(isUrl || deeplinkUrl) && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 4,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {isUrl && (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 20px",
                borderRadius: "var(--radius-pill)",
                border: "1.5px solid var(--color-line-2)",
                background: "var(--color-surface)",
                color: "var(--color-ink)",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Buka QR di tab baru
            </a>
          )}
          {deeplinkUrl && (
            <a
              href={deeplinkUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 20px",
                borderRadius: "var(--radius-pill)",
                background: "var(--color-gold)",
                color: "var(--color-navy-deep)",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                boxShadow: "none",
              }}
            >
              Buka di GoPay
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, original, mono }: { label: string; value: string; original?: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        fontSize: 14,
        gap: 12,
      }}
    >
      <span style={{ color: "var(--color-ink-3)" }}>{label}</span>
      <span
        style={{
          textAlign: "right",
          display: "flex",
          gap: 6,
          alignItems: "baseline",
          justifyContent: "flex-end",
          ...(mono ? { fontFamily: "var(--font-mono)" } : {}),
        }}
      >
        {original && (
          <span
            style={{
              textDecoration: "line-through",
              opacity: 0.45,
              fontSize: "0.9em",
            }}
          >
            {original}
          </span>
        )}
        {value}
      </span>
    </div>
  );
}
