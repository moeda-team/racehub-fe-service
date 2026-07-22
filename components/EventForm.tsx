"use client";

import {
  ChangeEvent,
  FormEvent,
  InputHTMLAttributes,
  useEffect,
  useId,
  useState,
} from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import RichTextEditor from "@/components/RichTextEditor";
import { normalizeNumberInput } from "@/lib/format";
import { api } from "@/lib/api";
import type {
  RegistrationField,
  UpsertRegistrationFieldRequest,
} from "@/lib/types.gen";

export interface EventFormValues {
  name: string;
  description: string;
  location: string;
  event_date: string; // RFC3339 or ""
  event_type: string;
  master_age_threshold: number;
  refund_cutoff_date: string; // RFC3339 or ""
  registration_close_date: string; // RFC3339 or ""
  donation_enabled: boolean;
  refund_donation_on_cancel: boolean;
  color: string; // "#rrggbb" — card header color when no banner image
}

interface EventFormProps {
  eventId?: string; // set when editing an existing event
  initial?: Partial<EventFormValues>;
  submitLabel: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
  // Emits current values on every change — used for the live card preview.
  onChange?: (values: EventFormValues) => void;
}

const EVENT_TYPE_OPTIONS = [
  { value: "running", label: "Lari (running)" },
  { value: "cycling", label: "Gowes (cycling)" },
  { value: "seminar", label: "Seminar / Talkshow" },
  { value: "workshop", label: "Workshop" },
  { value: "concert", label: "Konser" },
  { value: "custom", label: "Custom / Lainnya" },
];

const FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Teks pendek" },
  { value: "textarea", label: "Teks panjang" },
  { value: "number", label: "Angka" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Nomor HP" },
  { value: "date", label: "Tanggal" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Pilihan (radio)" },
  { value: "checkbox", label: "Centang (checkbox)" },
];

// LabeledInput reuses the design-system .field classes and forwards any input
// attribute (type, min, etc.) — Field only forwards a fixed prop subset.
interface LabeledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

function LabeledInput({ label, hint, error, ...rest }: LabeledInputProps) {
  const id = useId();
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
      <input
        id={id}
        className="field-input"
        aria-invalid={!!error || undefined}
        {...rest}
        onChange={onChange}
      />
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

// --- Registration Field Builder types ---
interface FieldDraft {
  id?: string; // empty = new field
  name: string;
  label: string;
  field_type: string;
  options: string; // comma-separated for select/radio
  placeholder: string;
  required: boolean;
  sort_order: number;
}

function emptyDraft(sortOrder: number): FieldDraft {
  return {
    name: "",
    label: "",
    field_type: "text",
    options: "",
    placeholder: "",
    required: false,
    sort_order: sortOrder,
  };
}

// --- Registration Field Builder sub-component ---
interface FieldBuilderProps {
  eventId: string;
  fields: FieldDraft[];
  onChange: (fields: FieldDraft[]) => void;
  saving: boolean;
}

function FieldBuilder({
  eventId,
  fields,
  onChange,
  saving,
}: FieldBuilderProps) {
  const [expanded, setExpanded] = useState(false);

  function updateField(index: number, patch: Partial<FieldDraft>) {
    const updated = fields.map((f, i) =>
      i === index ? { ...f, ...patch } : f,
    );
    onChange(updated);
  }

  function addField() {
    onChange([...fields, emptyDraft(fields.length)]);
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  async function saveField(index: number) {
    const f = fields[index];
    if (!f.name.trim() || !f.label.trim()) return;
    const payload: UpsertRegistrationFieldRequest = {
      id: f.id,
      name: f.name.trim(),
      label: f.label.trim(),
      field_type: f.field_type,
      options: f.options,
      placeholder: f.placeholder,
      required: f.required,
      sort_order: f.sort_order,
    };
    const res = await api.post<{ data: RegistrationField }>(
      `/api/v1/events/${eventId}/registration-fields`,
      payload,
    );
    // Update with server-assigned id
    onChange(
      fields.map((prev, i) =>
        i === index ? { ...prev, id: res.data.id } : prev,
      ),
    );
  }

  async function deleteField(index: number) {
    const f = fields[index];
    if (!f.id) {
      removeField(index);
      return;
    }
    await api.delete(`/api/v1/events/${eventId}/registration-fields/${f.id}`);
    removeField(index);
  }

  return (
    <div
      style={{
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "12px 16px",
          background: "var(--color-surface-2)",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-ink)",
        }}
      >
        <span>Form Pendaftaran ({fields.length} kolom)</span>
        <span
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {fields.length === 0 && (
            <p style={{ color: "var(--color-ink-2)", fontSize: 13 }}>
              Belum ada kolom tambahan. Klik &ldquo;Tambah Kolom&rdquo; di
              bawah.
            </p>
          )}
          {fields.map((f, i) => (
            <div
              key={i}
              style={{
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-sm)",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                background: "var(--color-surface)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <div className="field">
                  <label className="field-label">Nama kolom (slug)</label>
                  <input
                    className="field-input"
                    value={f.name}
                    onChange={(e) => updateField(i, { name: e.target.value })}
                    placeholder="Contoh: jersey_size"
                  />
                  <span className="field-hint">
                    Huruf kecil, strip sebagai pemisah
                  </span>
                </div>
                <div className="field">
                  <label className="field-label">Label tampilan</label>
                  <input
                    className="field-input"
                    value={f.label}
                    onChange={(e) => updateField(i, { label: e.target.value })}
                    placeholder="Contoh: Ukuran Jersey"
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <div className="field">
                  <label className="field-label">Tipe input</label>
                  <select
                    className="field-input"
                    value={f.field_type}
                    onChange={(e) =>
                      updateField(i, { field_type: e.target.value })
                    }
                  >
                    {FIELD_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Placeholder</label>
                  <input
                    className="field-input"
                    value={f.placeholder}
                    onChange={(e) =>
                      updateField(i, { placeholder: e.target.value })
                    }
                    placeholder="Contoh: Pilih ukuran"
                  />
                </div>
              </div>
              {(f.field_type === "select" || f.field_type === "radio") && (
                <div className="field">
                  <label className="field-label">
                    Opsi (pisah dengan koma)
                  </label>
                  <input
                    className="field-input"
                    value={f.options}
                    onChange={(e) =>
                      updateField(i, { options: e.target.value })
                    }
                    placeholder="Contoh: S, M, L, XL"
                  />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={f.required}
                    onChange={(e) =>
                      updateField(i, { required: e.target.checked })
                    }
                  />
                  Wajib diisi
                </label>
              </div>
              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => deleteField(i)}
                  disabled={saving}
                >
                  Hapus
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => saveField(i)}
                  disabled={saving || !f.name.trim() || !f.label.trim()}
                >
                  Simpan
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addField}
          >
            + Tambah Kolom
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Main EventForm ---
export default function EventForm({
  eventId,
  initial,
  submitLabel,
  onSubmit,
  onChange,
}: EventFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [eventDate, setEventDate] = useState(
    toLocalInput(initial?.event_date ?? ""),
  );
  const [eventType, setEventType] = useState(initial?.event_type ?? "running");
  const [masterAgeThreshold, setMasterAgeThreshold] = useState(
    String(initial?.master_age_threshold ?? 40),
  );
  const [refundCutoff, setRefundCutoff] = useState(
    toLocalInput(initial?.refund_cutoff_date ?? ""),
  );
  const [regClose, setRegClose] = useState(
    toLocalInput(initial?.registration_close_date ?? ""),
  );
  const [donationEnabled, setDonationEnabled] = useState(
    initial?.donation_enabled ?? false,
  );
  const [refundDonationOnCancel, setRefundDonationOnCancel] = useState(
    initial?.refund_donation_on_cancel ?? false,
  );
  const [color, setColor] = useState(initial?.color || "#F5471D");

  // Registration field builder state
  const [regFields, setRegFields] = useState<FieldDraft[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(!!eventId);
  const [fieldsSaving, setFieldsSaving] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing registration fields when editing
  useEffect(() => {
    if (!eventId) return;
    api
      .get<{ data: RegistrationField[] }>(
        `/api/v1/events/${eventId}/registration-fields`,
      )
      .then((res) => {
        setRegFields(
          res.data.map((f) => ({
            id: f.id,
            name: f.name,
            label: f.label,
            field_type: f.field_type,
            options: f.options,
            placeholder: f.placeholder,
            required: f.required,
            sort_order: f.sort_order,
          })),
        );
      })
      .catch(() => {})
      .finally(() => setFieldsLoading(false));
  }, [eventId]);

  function buildValues(): EventFormValues {
    return {
      name: name.trim(),
      description,
      location,
      event_date: toRFC3339(eventDate),
      event_type: eventType,
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
    notifyChange?.(buildValues());
  }, [
    notifyChange,
    name,
    description,
    location,
    eventDate,
    eventType,
    masterAgeThreshold,
    refundCutoff,
    regClose,
    donationEnabled,
    refundDonationOnCancel,
    color,
  ]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Nama event wajib diisi";
    if (eventType === "running" && Number(masterAgeThreshold) <= 0) {
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
      setServerError(
        err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 560,
      }}
    >
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

      <div className="field">
        <label htmlFor="event_type" className="field-label">
          Jenis Event
        </label>
        <select
          id="event_type"
          className="field-input"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        >
          {EVENT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="field-hint">
          &ldquo;Lari&rdquo; mengaktifkan kelas usia Open/Master
        </span>
      </div>

      {eventType === "running" && (
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
            style={{
              width: 48,
              height: 36,
              padding: 2,
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-xs)",
              cursor: "pointer",
              backgroundColor: "var(--color-surface)",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--color-ink-2)",
            }}
          >
            {color.toUpperCase()}
          </span>
        </div>
        <span className="field-hint">
          Dipakai sebagai warna header kartu event bila banner belum diunggah
        </span>
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

      {/* Registration Field Builder — only available after event is saved */}
      {eventId ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label className="field-label">Form Pendaftaran</label>
          {fieldsLoading ? (
            <p style={{ color: "var(--color-ink-2)", fontSize: 13 }}>
              Memuat kolom…
            </p>
          ) : (
            <FieldBuilder
              eventId={eventId}
              fields={regFields}
              onChange={setRegFields}
              saving={fieldsSaving}
            />
          )}
          <span className="field-hint">
            Konfigurasi kolom formulir yang muncul saat pendaftar mengisi data
            diri
          </span>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--color-ink-2)", margin: 0 }}>
            Form pendaftaran bisa dikonfigurasi setelah event disimpan.
          </p>
        </div>
      )}

      <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
        {isSubmitting ? "Menyimpan…" : submitLabel}
      </Button>
    </form>
  );
}
