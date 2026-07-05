"use client";

import { ChangeEvent, FormEvent, InputHTMLAttributes, useEffect, useId, useState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import RichTextEditor from "@/components/RichTextEditor";
import { normalizeNumberInput } from "@/lib/format";

export interface EventFormValues {
  name: string;
  description: string;
  location: string;
  event_date: string; // RFC3339 or ""
  is_running_event: boolean;
  master_age_threshold: number;
  refund_cutoff_date: string; // RFC3339 or ""
  registration_close_date: string; // RFC3339 or ""
  donation_enabled: boolean;
  refund_donation_on_cancel: boolean;
  color: string; // "#rrggbb" — card header color when no banner image
}

interface EventFormProps {
  initial?: Partial<EventFormValues>;
  submitLabel: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
  // Emits current values on every change — used for the live card preview.
  onChange?: (values: EventFormValues) => void;
}

// LabeledInput reuses the design-system .field classes and forwards any input
// attribute (type, min, etc.) — Field only forwards a fixed prop subset.
interface LabeledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

function LabeledInput({ label, hint, error, ...rest }: LabeledInputProps) {
  const id = useId();
  // Number inputs: strip leading zeros so a field starting at "0" doesn't keep
  // it (e.g. "09000" -> "9000").
  const onChange =
    rest.type === "number" && rest.onChange
      ? (e: ChangeEvent<HTMLInputElement>) => {
          const normalized = normalizeNumberInput(e.target.value);
          if (normalized !== e.target.value) e.target.value = normalized;
          rest.onChange!(e);
        }
      : rest.onChange;
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input id={id} className="field-input" aria-invalid={!!error || undefined} {...rest} onChange={onChange} />
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </div>
  );
}

// Convert an RFC3339 string to a value usable by <input type="datetime-local">.
function toLocalInput(rfc3339: string): string {
  if (!rfc3339) return "";
  const d = new Date(rfc3339);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Convert a datetime-local value to an RFC3339 string (UTC).
function toRFC3339(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

const toggleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 0",
};

export default function EventForm({ initial, submitLabel, onSubmit, onChange }: EventFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [eventDate, setEventDate] = useState(toLocalInput(initial?.event_date ?? ""));
  const [isRunningEvent, setIsRunningEvent] = useState(initial?.is_running_event ?? false);
  const [masterAgeThreshold, setMasterAgeThreshold] = useState(
    String(initial?.master_age_threshold ?? 40),
  );
  const [refundCutoff, setRefundCutoff] = useState(toLocalInput(initial?.refund_cutoff_date ?? ""));
  const [regClose, setRegClose] = useState(toLocalInput(initial?.registration_close_date ?? ""));
  const [donationEnabled, setDonationEnabled] = useState(initial?.donation_enabled ?? false);
  const [refundDonationOnCancel, setRefundDonationOnCancel] = useState(initial?.refund_donation_on_cancel ?? false);
  const [color, setColor] = useState(initial?.color || "#F5471D");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function buildValues(): EventFormValues {
    return {
      name: name.trim(),
      description,
      location,
      event_date: toRFC3339(eventDate),
      is_running_event: isRunningEvent,
      master_age_threshold: Number(masterAgeThreshold) || 40,
      refund_cutoff_date: toRFC3339(refundCutoff),
      registration_close_date: toRFC3339(regClose),
      donation_enabled: donationEnabled,
      refund_donation_on_cancel: refundDonationOnCancel,
      color,
    };
  }

  // Notify the parent (live preview) whenever any field changes.
  const notifyChange = onChange;
  useEffect(() => {
    notifyChange?.({
      name: name.trim(),
      description,
      location,
      event_date: toRFC3339(eventDate),
      is_running_event: isRunningEvent,
      master_age_threshold: Number(masterAgeThreshold) || 40,
      refund_cutoff_date: toRFC3339(refundCutoff),
      registration_close_date: toRFC3339(regClose),
      donation_enabled: donationEnabled,
      refund_donation_on_cancel: refundDonationOnCancel,
      color,
    });
  }, [notifyChange, name, description, location, eventDate, isRunningEvent, masterAgeThreshold, refundCutoff, regClose, donationEnabled, refundDonationOnCancel, color]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Nama event wajib diisi";
    if (isRunningEvent && Number(masterAgeThreshold) <= 0) {
      next.master_age_threshold = "Ambang Master harus lebih dari 0";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(buildValues());
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <LabeledInput
        label="Nama Event"
        placeholder="Mis. RaceHub Run 2026"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        required
      />
      <RichTextEditor
        label="Deskripsi"
        value={description}
        onChange={setDescription}
        hint="Gunakan toolbar untuk format teks (tebal, judul, daftar). Tampil di halaman detail event."
      />
      <LabeledInput
        label="Lokasi"
        placeholder="Mis. Jakarta"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <LabeledInput
        label="Tanggal Event"
        type="datetime-local"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
      />
      <div style={toggleRow}>
        <input
          id="is_running_event"
          type="checkbox"
          checked={isRunningEvent}
          onChange={(e) => setIsRunningEvent(e.target.checked)}
        />
        <label htmlFor="is_running_event" style={{ fontSize: 14 }}>
          Event lari (mengaktifkan kelas usia Open/Master)
        </label>
      </div>

      {isRunningEvent && (
        <LabeledInput
          label="Ambang Usia Master"
          type="number"
          min={1}
          value={masterAgeThreshold}
          onChange={(e) => setMasterAgeThreshold(e.target.value)}
          error={errors.master_age_threshold}
          hint="Default 40 — peserta ≥ ambang masuk kelas Master"
        />
      )}

      <div className="field">
        <label htmlFor="event_color" className="field-label">
          Warna Header Kartu
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            id="event_color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: 48, height: 36, padding: 2, border: "1px solid var(--color-line)", borderRadius: "var(--radius-xs)", cursor: "pointer", backgroundColor: "var(--color-surface)" }}
          />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-ink-2)" }}>{color.toUpperCase()}</span>
        </div>
        <span className="field-hint">Dipakai sebagai warna header kartu event bila banner belum diunggah</span>
      </div>

      <LabeledInput
        label="Batas Akhir Refund"
        type="datetime-local"
        value={refundCutoff}
        onChange={(e) => setRefundCutoff(e.target.value)}
        hint="Refund ditolak setelah tanggal ini"
      />

      <LabeledInput
        label="Penutupan Pendaftaran"
        type="datetime-local"
        value={regClose}
        onChange={(e) => setRegClose(e.target.value)}
        hint="Nomor BIB hanya bisa digenerate setelah waktu ini. Kosong → pakai tanggal event."
      />

      <div style={toggleRow}>
        <input
          id="donation_enabled"
          type="checkbox"
          checked={donationEnabled}
          onChange={(e) => setDonationEnabled(e.target.checked)}
        />
        <label htmlFor="donation_enabled" style={{ fontSize: 14 }}>
          Aktifkan donasi (bebas fee, non-refundable)
        </label>
      </div>

      {donationEnabled && (
        <div style={toggleRow}>
          <input
            id="refund_donation_on_cancel"
            type="checkbox"
            checked={refundDonationOnCancel}
            onChange={(e) => setRefundDonationOnCancel(e.target.checked)}
          />
          <label htmlFor="refund_donation_on_cancel" style={{ fontSize: 14 }}>
            Kembalikan donasi jika event dibatalkan
          </label>
        </div>
      )}

      <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
        {isSubmitting ? "Menyimpan…" : submitLabel}
      </Button>
    </form>
  );
}
