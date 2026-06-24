"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatRupiah, normalizeNumberInput } from "@/lib/format";
import type {
  ApiResponse,
  CreateRegistrationRequest,
  PublicEventDetail,
  Registration,
} from "@/lib/types.gen";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";

export default function RegisterPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  const [detail, setDetail] = useState<PublicEventDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Wizard state.
  const [step, setStep] = useState(1);
  const [distanceId, setDistanceId] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [donation, setDonation] = useState("0");

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<Registration | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<PublicEventDetail>>(`/api/v1/events/${eventId}`);
        if (!cancelled) setDetail(res.data);
      } catch {
        if (!cancelled) setLoadError("Event tidak ditemukan atau belum dipublikasikan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const ticketsForDistance = useMemo(
    () => (detail && distanceId ? detail.ticket_categories.filter((t) => t.distance_category_id === distanceId) : []),
    [detail, distanceId],
  );
  const selectedTicket = useMemo(
    () => detail?.ticket_categories.find((t) => t.id === ticketId) ?? null,
    [detail, ticketId],
  );
  const selectedDistance = useMemo(
    () => detail?.distance_categories.find((d) => d.id === distanceId) ?? null,
    [detail, distanceId],
  );

  async function handleSubmit() {
    if (!detail || !ticketId || !distanceId) return;
    setServerError(null);
    setSubmitting(true);
    try {
      const body: CreateRegistrationRequest = {
        event_id: detail.event.id,
        ticket_category_id: ticketId,
        distance_category_id: distanceId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        birth_date: birthDate,
        gender,
        donation: Number(donation) || 0,
      };
      const res = await api.post<ApiResponse<Registration>>("/api/v1/registrations", body);
      setResult(res.data);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Pendaftaran gagal. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="max-w-xl mx-auto px-4 py-12"><p style={{ color: "var(--color-ink-3)" }}>Memuat…</p></main>;
  }
  if (loadError || !detail) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <Link href="/" style={back}>← Kembali ke marketplace</Link>
        <Alert variant="danger">{loadError ?? "Event tidak ditemukan."}</Alert>
      </main>
    );
  }

  // Success screen.
  if (result) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <Alert variant="info" className="mb-4">Pendaftaran berhasil! Simpan nomor registrasi Anda.</Alert>
        <div style={card}>
          <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>Nomor Registrasi</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            {result.registration_number}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <Badge variant="warn">Menunggu Pembayaran</Badge>
            {result.age_class && <Badge variant="sprint">Kelas {result.age_class}</Badge>}
          </div>
          <p style={{ fontSize: 14, color: "var(--color-ink-3)" }}>
            Langkah berikutnya: pembayaran. Rincian biaya (Fee Platform, Fee Midtrans, Sub Total)
            dihitung server setelah Anda memilih metode.
          </p>
        </div>
        <Link href={`/pay/${result.registration_number}`} style={{ display: "block", marginTop: 16 }}>
          <Button variant="primary" size="md" style={{ width: "100%" }}>Lanjut ke Pembayaran</Button>
        </Link>
        <Link href="/" style={{ display: "block", marginTop: 8 }}>
          <Button variant="secondary" size="md" style={{ width: "100%" }}>Kembali ke Marketplace</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <Link href={`/events/${detail.event.id}`} style={back}>← {detail.event.name}</Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
        Pendaftaran
      </h1>
      <p style={{ color: "var(--color-ink-3)", marginBottom: 20, fontSize: 14 }}>Langkah {step} dari 3</p>

      {serverError && <Alert variant="danger" className="mb-4">{serverError}</Alert>}

      {/* Step 1: distance + ticket */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field">
            <label className="field-label">Kategori Jarak</label>
            <select
              className="field-input"
              value={distanceId ?? ""}
              onChange={(e) => {
                setDistanceId(e.target.value || null);
                setTicketId(null);
              }}
            >
              <option value="">Pilih jarak</option>
              {detail.distance_categories.map((d) => (
                <option key={d.id} value={d.id} disabled={d.quota_remaining <= 0}>
                  {d.name} {d.quota_remaining <= 0 ? "(habis)" : `(${d.quota_remaining} sisa)`}
                </option>
              ))}
            </select>
          </div>

          {distanceId && (
            <div className="field">
              <label className="field-label">Tiket</label>
              <select className="field-input" value={ticketId ?? ""} onChange={(e) => setTicketId(e.target.value || null)}>
                <option value="">Pilih tiket</option>
                {ticketsForDistance.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.quota_remaining <= 0}>
                    {t.name} — {formatRupiah(t.price)} {t.quota_remaining <= 0 ? "(habis)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button variant="primary" size="md" disabled={!ticketId} onClick={() => setStep(2)}>
            Lanjut
          </Button>
        </div>
      )}

      {/* Step 2: participant data */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <LabeledInput label="Nama Lengkap" value={name} onChange={setName} required />
          <LabeledInput label="Email" type="email" value={email} onChange={setEmail} required />
          <LabeledInput label="No. HP" type="tel" value={phone} onChange={setPhone} required />
          <LabeledInput
            label="Tanggal Lahir"
            type="date"
            value={birthDate}
            onChange={setBirthDate}
            required
            hint="Wajib — menentukan kelas usia (Open/Master) otomatis"
          />
          <div className="field">
            <label className="field-label">Jenis Kelamin</label>
            <select className="field-input" value={gender} onChange={(e) => setGender(e.target.value)} required>
              <option value="">Pilih</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" size="md" onClick={() => setStep(1)}>Kembali</Button>
            <Button
              variant="primary"
              size="md"
              style={{ flex: 1 }}
              disabled={!name || !email || !phone || !birthDate || !gender}
              onClick={() => setStep(3)}
            >
              Lanjut
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: donation + review */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <LabeledInput
            label="Donasi (opsional)"
            type="number"
            min={0}
            value={donation}
            onChange={setDonation}
            hint="Bebas biaya admin & tidak dapat dikembalikan (non-refundable)"
          />

          <div style={card}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Ringkasan</div>
            <Row label="Event" value={detail.event.name} />
            <Row label="Jarak" value={selectedDistance?.name ?? "-"} />
            <Row label="Tiket" value={selectedTicket?.name ?? "-"} />
            <Row label="Harga tiket" value={selectedTicket ? formatRupiah(selectedTicket.price) : "-"} mono />
            <Row label="Donasi" value={formatRupiah(Number(donation) || 0)} mono />
            <p style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 8 }}>
              Total &amp; biaya akan dihitung server pada tahap pembayaran.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" size="md" onClick={() => setStep(2)}>Kembali</Button>
            <Button variant="primary" size="md" style={{ flex: 1 }} disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Mendaftar…" : "Daftar Sekarang"}
            </Button>
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}>
      <span style={{ color: "var(--color-ink-3)" }}>{label}</span>
      <span style={mono ? { fontFamily: "var(--font-mono)" } : undefined}>{value}</span>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  hint,
  required,
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
  required?: boolean;
  min?: number;
}) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <input
        className="field-input"
        type={type}
        value={value}
        min={min}
        required={required}
        onChange={(e) =>
          onChange(type === "number" ? normalizeNumberInput(e.target.value) : e.target.value)
        }
      />
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
