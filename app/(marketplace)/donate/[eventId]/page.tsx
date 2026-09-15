"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { api, ApiError } from "@/lib/api";
import type { ApiResponse, PaymentMethod, PaymentMethodOption, PublicEventDetail, StandaloneDonation } from "@/lib/types.gen";
import { formatNumberInput, formatRupiah, parseNumberInput } from "@/lib/format";
import { PUBLIC_DONATIONS_ENABLED } from "@/lib/features";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

export default function DonatePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  if (!PUBLIC_DONATIONS_ENABLED) {
    return <DonationUnavailable eventId={eventId} />;
  }

  return <DonationCheckout eventId={eventId} />;
}

function DonationUnavailable({ eventId }: { eventId: string }) {
  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <Link href={`/events/${eventId}`} style={{ color: "var(--color-sprint)", fontSize: 14 }}>
        ← Kembali ke event
      </Link>
      <Alert variant="info" className="mt-4">
        Donasi saat ini tidak tersedia.
      </Alert>
    </main>
  );
}

// Retained behind PUBLIC_DONATIONS_ENABLED for a future reactivation.
function DonationCheckout({ eventId }: { eventId: string }) {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("");
  const [methodOptions, setMethodOptions] = useState<PaymentMethodOption[]>([]);
  const [result, setResult] = useState<StandaloneDonation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [eventDetail, setEventDetail] = useState<PublicEventDetail | null>(null);
  const [checkingEvent, setCheckingEvent] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<PublicEventDetail>>(
          `/api/v1/events/${eventId}`,
          { auth: false },
        );
        if (!cancelled) setEventDetail(res.data);
      } catch {
        if (!cancelled) setEventDetail(null);
      } finally {
        if (!cancelled) setCheckingEvent(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);
  useEffect(() => {
    api.get<ApiResponse<PaymentMethodOption[]>>("/api/v1/payments/methods", { auth: false })
      .then((res) => { setMethodOptions(res.data ?? []); if (res.data?.[0]) setMethod(res.data[0].id); })
      .catch(() => setError("Metode pembayaran sedang tidak tersedia."));
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount.replace(/\D/g, ""));
    if (!Number.isSafeInteger(value) || value <= 0) {
      setError("Masukkan nominal donasi yang valid.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<ApiResponse<StandaloneDonation>>(
        "/api/v1/donations/charge",
        { event_id: eventId, amount: value, donor_name: name, donor_email: email, donor_phone: phone, payment_method: method },
        { auth: false },
      );
      setResult(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Donasi belum dapat diproses.");
    } finally {
      setLoading(false);
    }
  }
  async function checkStatus() {
    if (!result?.id) return;
    setChecking(true);
    try {
      const res = await api.get<ApiResponse<StandaloneDonation>>(`/api/v1/donations/${result.id}`, { auth: false });
      setResult(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Status donasi belum dapat diperiksa.");
    } finally {
      setChecking(false);
    }
  }
  useEffect(() => {
    if (!result || result.status !== "pending") return;
    const donationID = result.id;
    const interval = window.setInterval(async () => {
      try {
        const res = await api.get<ApiResponse<StandaloneDonation>>(`/api/v1/donations/${donationID}`, { auth: false });
        setResult(res.data);
      } catch {
        /* Keep polling: a transient network failure must not change payment status. */
      }
    }, 4000);
    return () => window.clearInterval(interval);
  }, [result]);

  if (!result && checkingEvent) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      </main>
    );
  }

  if (
    !result &&
    (!eventDetail ||
      eventDetail.event.status === "coming_soon" ||
      !eventDetail.event.donation_enabled)
  ) {
    return (
      <main className="max-w-xl mx-auto px-4 py-10">
        <Link href={`/events/${eventId}`} style={{ color: "var(--color-sprint)", fontSize: 14 }}>
          ← Kembali ke event
        </Link>
        <Alert variant="info" className="mt-4">
          {eventDetail?.event.status === "coming_soon"
            ? "Event ini segera hadir. Donasi belum dibuka."
            : "Donasi tidak tersedia untuk event ini."}
        </Alert>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <Link href={`/events/${eventId}`} style={{ color: "var(--color-sprint)", fontSize: 14 }}>
        ← Kembali ke event
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, margin: "16px 0 6px" }}>Donasi untuk event</h1>
      <p style={{ color: "var(--color-ink-3)", marginBottom: 24 }}>
        Donasi tidak membuat pendaftaran atau e-tiket. Seluruh nominal diteruskan ke wallet donasi event.
      </p>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      {result ? (
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>
            {result.status === "paid"
              ? "Donasi berhasil"
              : result.status === "expired"
                ? "Pembayaran kedaluwarsa"
                : result.status === "cancelled"
                  ? "Pembayaran dibatalkan"
                  : "Menunggu pembayaran"}
          </h2>
          <dl style={summary}>
            <SummaryRow label="Nominal donasi" value={formatRupiah(result.amount)} />
            <SummaryRow label="Metode pembayaran" value={result.method} />
            {result.donor_name && <SummaryRow label="Nama donatur" value={result.donor_name} />}
            {result.donor_email && <SummaryRow label="Email konfirmasi" value={result.donor_email} />}
            <SummaryRow label="ID transaksi" value={result.transaction_id} mono />
          </dl>
          {result.status === "paid" ? (
            <Alert variant="success">Pembayaran telah dikonfirmasi. Terima kasih atas donasi Anda.</Alert>
          ) : (
            <>
              {result.va_number && (
                <p>
                  Virtual Account: <code>{result.va_number}</code>
                </p>
              )}
              {result.biller_code && (
                <p>
                  Kode biller: <code>{result.biller_code}</code> · Kunci bayar: <code>{result.bill_key}</code>
                </p>
              )}
			  {result.qr_string && <DonationQrDisplay value={result.qr_string} />}
			  {result.deeplink_url && (
				<a href={result.deeplink_url} target="_blank" rel="noreferrer">
				  <Button type="button" variant="primary">Lanjutkan ke iPaymu</Button>
				</a>
			  )}
              {result.expires_at && (
                <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
                  Selesaikan sebelum {new Date(result.expires_at).toLocaleString("id-ID")}.
                </p>
              )}
              {result.status === "pending" && (
                <>
                  <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
                    Status diperbarui otomatis setelah pembayaran dikonfirmasi.
                  </p>
                  <Button type="button" variant="secondary" onClick={checkStatus} disabled={checking}>
                    {checking ? "Memeriksa…" : "Periksa status pembayaran"}
                  </Button>
                </>
              )}
            </>
          )}
        </section>
      ) : (
        <form onSubmit={submit} style={card}>
          <label style={label}>
            Nominal donasi (Rp)
            <input
              inputMode="numeric"
              value={formatNumberInput(amount)}
              onChange={(e) => setAmount(parseNumberInput(e.target.value))}
              required
              style={input}
              placeholder="Contoh: 50.000"
            />
          </label>
          <label style={label}>
            Nama (opsional)
            <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
          </label>
          <label style={label}>
            Email untuk konfirmasi (opsional)
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
          </label>
		  <label style={label}>
			Nomor telepon
			<input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required style={input} />
		  </label>
          <label style={label}>
            Metode pembayaran
            <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} style={input}>
              {methodOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Menyiapkan pembayaran…" : "Lanjutkan Donasi"}
          </Button>
        </form>
      )}
    </main>
  );
}
const card: React.CSSProperties = {
  marginTop: 20,
  padding: 20,
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface)",
};
const label: React.CSSProperties = { display: "block", fontSize: 14, fontWeight: 600, marginBottom: 16 };
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: 6,
  padding: "10px 12px",
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius-sm)",
  background: "var(--color-paper)",
};
const summary: React.CSSProperties = { margin: "16px 0", display: "grid", gap: 8 };

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 14 }}>
      <dt style={{ color: "var(--color-ink-3)" }}>{label}</dt>
      <dd style={{ margin: 0, textAlign: "right", fontWeight: 600, ...(mono ? { fontFamily: "var(--font-mono)" } : {}) }}>
        {value}
      </dd>
    </div>
  );
}

function DonationQrDisplay({ value }: { value: string }) {
  const isImageURL = /^https?:\/\//i.test(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, margin: "16px 0" }}>
      <span style={{ alignSelf: "flex-start", color: "var(--color-ink-3)", fontSize: 14 }}>
        Kode QR — pindai untuk membayar
      </span>
      <div style={{ background: "#fff", padding: 12, borderRadius: "var(--radius-md)" }}>
        {isImageURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Kode QR pembayaran" width={280} height={280} style={{ display: "block", maxWidth: "100%", height: "auto" }} />
        ) : (
          <QRCodeSVG value={value} size={280} level="M" style={{ display: "block", maxWidth: "100%", height: "auto" }} />
        )}
      </div>
    </div>
  );
}
