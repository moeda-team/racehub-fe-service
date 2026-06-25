"use client";

import { ChangeEvent, FormEvent, InputHTMLAttributes, useId, useState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
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
  total_quota: number;
  refund_donation_on_cancel: boolean;
}

interface EventFormProps {
  initial?: Partial<EventFormValues>;
  submitLabel: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
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

export default function EventForm({ initial, submitLabel, onSubmit }: EventFormProps) {
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
  const [totalQuota, setTotalQuota] = useState(String(initial?.total_quota ?? 0));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Nama event wajib diisi";
    if (Number(totalQuota) < 0) next.total_quota = "Kuota tidak boleh negatif";
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
      await onSubmit({
        name: name.trim(),
        description,
        location,
        event_date: toRFC3339(eventDate),
        is_running_event: isRunningEvent,
        master_age_threshold: Number(masterAgeThreshold) || 40,
        refund_cutoff_date: toRFC3339(refundCutoff),
        registration_close_date: toRFC3339(regClose),
        donation_enabled: donationEnabled,
        total_quota: Number(totalQuota) || 0,
        refund_donation_on_cancel: refundDonationOnCancel,
      });
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
      <LabeledInput
        label="Deskripsi"
        placeholder="Deskripsi singkat event"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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
      <LabeledInput
        label="Total Kuota Event"
        type="number"
        min={0}
        value={totalQuota}
        onChange={(e) => setTotalQuota(e.target.value)}
        error={errors.total_quota}
        hint="Batas total peserta seluruh kategori"
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
        hint="Nomor BIB hanya bisa digenerate setelah waktu ini (FR-1301). Kosong → pakai tanggal event."
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
