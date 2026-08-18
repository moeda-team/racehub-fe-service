"use client";

import { use, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useIdempotencyKey } from "@/lib/idempotency";
import { formatRupiah, formatNumberInput, normalizeNumberInput, parseNumberInput } from "@/lib/format";
import type {
  ApiResponse,
  CreateRegistrationRequest,
  PublicEventDetail,
  Registration,
  RegistrationField,
} from "@/lib/types.gen";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";

export default function RegisterPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  const [detail, setDetail] = useState<PublicEventDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Snapshot waktu saat halaman dibuka — server tetap memvalidasi ulang periode penjualan saat submit.
  const [now] = useState(() => Date.now());

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
  const [extraData, setExtraData] = useState<Record<string, string>>({});
  const [extraErrors, setExtraErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<Registration | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<PublicEventDetail>>(`/api/v1/events/${eventId}`, { auth: false });
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
    () => (detail && distanceId ? detail.ticket_categories.filter((t) => t.category_id === distanceId) : []),
    [detail, distanceId],
  );
  const selectedTicket = useMemo(
    () => detail?.ticket_categories.find((t) => t.id === ticketId) ?? null,
    [detail, ticketId],
  );
  const selectedDistance = useMemo(
    () => detail?.categories.find((d) => d.id === distanceId) ?? null,
    [detail, distanceId],
  );

  // Retry submit (double-click / gagal jaringan) dengan data sama tidak boleh
  // membuat registrasi kedua; edit data → key baru (lihat lib/idempotency).
  const regIdem = useIdempotencyKey();

  function validateExtraFields(): boolean {
    if (!detail) return true;
    const errors: Record<string, string> = {};
    for (const field of detail.registration_fields) {
      const value = extraData[field.id] ?? "";
      const valid = field.field_type === "checkbox" ? value === "true" : value.trim() !== "";
      if (field.required && !valid) errors[field.id] = "Kolom ini wajib diisi.";
    }
    setExtraErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function showRegistrationError(err: unknown) {
    if (!(err instanceof ApiError)) {
      setServerError("Pendaftaran gagal. Coba lagi.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const invalidAnswer = err.code.match(/^register: invalid (.+) answer: invalid input$/);
    const requiredAnswer = err.code.match(/^register: (.+) is required: invalid input$/);
    const fieldLabel = invalidAnswer?.[1] ?? requiredAnswer?.[1];
    const field = fieldLabel
      ? detail?.registration_fields.find((candidate) => candidate.label === fieldLabel)
      : undefined;

    if (field) {
      setExtraErrors((previous) => ({
        ...previous,
        [field.id]: invalidAnswer
          ? `Format ${field.label} tidak valid. Periksa kembali data yang Anda masukkan.`
          : "Kolom ini wajib diisi.",
      }));
      setServerError(`Periksa kembali bagian Data Tambahan: ${field.label}.`);
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setServerError(err.message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!detail || !ticketId || !distanceId) return;
    setServerError(null);
    setSubmitting(true);
    try {
      const body: CreateRegistrationRequest = {
        event_id: detail.event.id,
        ticket_category_id: ticketId,
        category_id: distanceId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        birth_date: birthDate,
        gender,
        donation: Number(donation) || 0,
        extra_data: extraData,
      };
      const res = await api.post<ApiResponse<Registration>>("/api/v1/registrations", body, {
        idempotencyKey: regIdem.keyFor(body),
      });
      regIdem.reset();
      setResult(res.data);
    } catch (err) {
      showRegistrationError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      </main>
    );
  }
  if (loadError || !detail) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <Link href="/" style={back}>
          ← Kembali ke marketplace
        </Link>
        <Alert variant="danger">{loadError ?? "Event tidak ditemukan."}</Alert>
      </main>
    );
  }

  // Success screen.
  if (result) {
    const isPaid = result.status === "paid";
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <Alert variant="info" className="mb-4">
          {isPaid
            ? "Tiket gratis berhasil didaftarkan! E-tiket Anda sudah aktif."
            : "Pendaftaran berhasil! Simpan nomor registrasi Anda."}
        </Alert>
        <div style={card}>
          <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>Nomor Registrasi</div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            {result.registration_number}
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            {isPaid ? <Badge variant="ok">E-Tiket Aktif</Badge> : <Badge variant="warn">Menunggu Pembayaran</Badge>}
            {result.is_complimentary && <Badge variant="sprint">Complimentary</Badge>}
            {result.age_class && <Badge variant="sprint">Kelas {result.age_class}</Badge>}
          </div>
          <p style={{ fontSize: 14, color: "var(--color-ink-3)" }}>
            {isPaid
              ? "E-tiket Anda sudah aktif dan siap dipakai. Gunakan nomor registrasi di atas untuk check-in."
              : "Langkah berikutnya: pembayaran. Rincian biaya (Platform, Fee Midtrans, Sub Total) dihitung server setelah Anda memilih metode."}
          </p>
        </div>
        {isPaid ? (
          <Link href={`/ticket/${result.registration_number}`} style={{ display: "block", marginTop: 16 }}>
            <Button variant="primary" size="md" style={{ width: "100%" }}>
              Lihat E-Tiket
            </Button>
          </Link>
        ) : (
          <Link href={`/pay/${result.registration_number}`} style={{ display: "block", marginTop: 16 }}>
            <Button variant="primary" size="md" style={{ width: "100%" }}>
              Lanjut ke Pembayaran
            </Button>
          </Link>
        )}
        <Link href="/" style={{ display: "block", marginTop: 8 }}>
          <Button variant="secondary" size="md" style={{ width: "100%" }}>
            Kembali ke Marketplace
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <Link href={`/events/${detail.event.id}`} style={back}>
        ← {detail.event.name}
      </Link>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        Pendaftaran
      </h1>
      <p style={{ color: "var(--color-ink-3)", marginBottom: 20, fontSize: 14 }}>Langkah {step} dari 3</p>

      {serverError && (
        <Alert variant="danger" className="mb-4">
          {serverError}
        </Alert>
      )}

      {/* Step 1: distance + ticket */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field">
            <label className="field-label">
              {detail.event.event_type === "running" ? "Kategori Jarak" : "Kategori"}
            </label>
            <select
              className="field-input"
              value={distanceId ?? ""}
              onChange={(e) => {
                setDistanceId(e.target.value || null);
                setTicketId(null);
              }}
            >
              <option value="">{detail.event.event_type === "running" ? "Pilih jarak" : "Pilih kategori"}</option>
              {detail.categories.map((d) => (
                <option key={d.id} value={d.id} disabled={d.quota_remaining <= 0}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {distanceId && (
            <div className="field">
              <label className="field-label">Tiket</label>
              <select
                className="field-input"
                value={ticketId ?? ""}
                onChange={(e) => setTicketId(e.target.value || null)}
              >
                <option value="">Pilih tiket</option>
                {ticketsForDistance.map((t) => {
                  const expired = !!t.sale_end && new Date(t.sale_end).getTime() < now;
                  const notStarted = !!t.sale_start && new Date(t.sale_start).getTime() > now;
                  const soldOut = t.quota_remaining <= 0;
                  const note = expired ? "(berakhir)" : notStarted ? "(belum dibuka)" : "";
                  return (
                    <option key={t.id} value={t.id} disabled={soldOut || expired || notStarted}>
                      {t.name} — {formatRupiah(t.price)} {note}
                    </option>
                  );
                })}
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

          {detail.registration_fields && detail.registration_fields.length > 0 && (
            <>
              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid var(--color-line)",
                  margin: "4px 0",
                }}
              />
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-ink-2)",
                }}
              >
                Data Tambahan
              </p>
              {detail.registration_fields.map((f) => (
                <DynamicField
                  key={f.id}
                  field={f}
                  value={extraData[f.id] ?? ""}
                  error={extraErrors[f.id]}
                  onChange={(v) => {
                    setExtraData((prev) => ({ ...prev, [f.id]: v }));
                    setExtraErrors((prev) => ({ ...prev, [f.id]: "" }));
                  }}
                />
              ))}
            </>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setStep(1);
                setExtraData({});
              }}
            >
              Kembali
            </Button>
            <Button
              variant="primary"
              size="md"
              style={{ flex: 1 }}
              disabled={!name || !email || !phone || !birthDate || !gender}
              onClick={() => {
                if (validateExtraFields()) setStep(3);
              }}
            >
              Lanjut
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: donation + review */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field">
            <label className="field-label">Donasi (opsional)</label>
            <input
              className="field-input"
              type="text"
              inputMode="numeric"
              value={formatNumberInput(donation)}
              onChange={(e) => setDonation(parseNumberInput(e.target.value))}
            />
            <span className="field-hint">Bebas biaya admin &amp; tidak dapat dikembalikan (non-refundable)</span>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Ringkasan</div>
            <Row label="Event" value={detail.event.name} />
            <Row
              label={detail.event.event_type === "running" ? "Jarak" : "Kategori"}
              value={selectedDistance?.name ?? "-"}
            />
            <Row label="Tiket" value={selectedTicket?.name ?? "-"} />
            <Row label="Harga tiket" value={selectedTicket ? formatRupiah(selectedTicket.price) : "-"} mono />
            <Row label="Donasi" value={formatRupiah(Number(donation) || 0)} mono />
            <p
              style={{
                fontSize: 12,
                color: "var(--color-ink-3)",
                marginTop: 8,
              }}
            >
              Total &amp; biaya akan dihitung server pada tahap pembayaran.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" size="md" onClick={() => setStep(2)}>
              Kembali
            </Button>
            <Button variant="primary" size="md" style={{ flex: 1 }} disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Mendaftar…" : "Daftar Sekarang"}
            </Button>
          </div>
        </div>
      )}
    </main>
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        fontSize: 14,
      }}
    >
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
        onChange={(e) => onChange(type === "number" ? normalizeNumberInput(e.target.value) : e.target.value)}
      />
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

function DynamicField({
  field,
  value,
  error,
  onChange,
}: {
  field: RegistrationField;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const fid = useId();
  const options = field.options
    ? field.options
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  if (field.field_type === "textarea") {
    return (
      <div className="field">
        <label htmlFor={fid} className="field-label">
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <textarea
          id={fid}
          className="field-input"
          value={value}
          placeholder={field.placeholder}
          required={field.required}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
        />
        {error && <span className="field-error">{error}</span>}
      </div>
    );
  }
  if (field.field_type === "select") {
    return (
      <div className="field">
        <label htmlFor={fid} className="field-label">
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <select
          id={fid}
          className="field-input"
          value={value}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{field.placeholder || "Pilih…"}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {error && <span className="field-error">{error}</span>}
      </div>
    );
  }
  if (field.field_type === "radio") {
    return (
      <div className="field">
        <span className="field-label">
          {field.label}
          {field.required ? " *" : ""}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {options.map((o) => (
            <label
              key={o}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name={field.id}
                value={o}
                checked={value === o}
                required={field.required}
                onChange={() => onChange(o)}
              />
              {o}
            </label>
          ))}
        </div>
        {error && <span className="field-error">{error}</span>}
      </div>
    );
  }
  if (field.field_type === "checkbox") {
    return (
      <div className="field">
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <input type="checkbox" checked={value === "true"} onChange={(e) => onChange(String(e.target.checked))} />
          <span className="field-label" style={{ marginBottom: 0 }}>
            {field.label}
            {field.required ? " *" : ""}
          </span>
        </label>
        {error && <span className="field-error">{error}</span>}
      </div>
    );
  }
  return (
    <div className="field">
      <label htmlFor={fid} className="field-label">
        {field.label}
        {field.required ? " *" : ""}
      </label>
      <input
        id={fid}
        className="field-input"
        type={field.field_type === "number" ? "text" : field.field_type}
        inputMode={field.field_type === "number" ? "numeric" : undefined}
        value={value}
        placeholder={field.placeholder}
        required={field.required}
        onChange={(e) =>
          onChange(field.field_type === "number" ? normalizeNumberInput(e.target.value) : e.target.value)
        }
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
