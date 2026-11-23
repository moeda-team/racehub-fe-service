"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { formatNumberInput, formatRupiah, parseNumberInput } from "@/lib/format";
import type {
  ApiResponse,
  EventVoucher,
  EventVoucherRequest,
  TicketCategory,
  VoucherDiscountType,
} from "@/lib/types.gen";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { confirm } from "@/components/ui/ConfirmDialog";

interface EventVoucherManagerProps {
  eventId: string;
  tickets: TicketCategory[];
  /** Finished/cancelled events are read-only on the backend. */
  locked: boolean;
}

interface VoucherFormState {
  code: string;
  description: string;
  discountType: VoucherDiscountType;
  discountValue: string; // digits only
  maxDiscount: string; // digits only
  quota: string; // digits only
  oncePerEmail: boolean;
  ticketCategoryIds: string[];
  startsAt: string; // datetime-local
  endsAt: string; // datetime-local
  isActive: boolean;
}

const EMPTY_FORM: VoucherFormState = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  maxDiscount: "",
  quota: "",
  oncePerEmail: true,
  ticketCategoryIds: [],
  startsAt: "",
  endsAt: "",
  isActive: true,
};

export default function EventVoucherManager({ eventId, tickets, locked }: EventVoucherManagerProps) {
  const [vouchers, setVouchers] = useState<EventVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // null = form closed, "" = creating, otherwise the id being edited.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VoucherFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const basePath = `/api/v1/events/${eventId}/vouchers`;

  const fetchVouchers = useCallback(
    () => api.get<ApiResponse<EventVoucher[]>>(basePath).then((res) => res.data ?? []),
    [basePath],
  );

  const load = useCallback(async () => {
    try {
      setVouchers(await fetchVouchers());
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat voucher.");
    }
  }, [fetchVouchers]);

  useEffect(() => {
    let cancelled = false;
    fetchVouchers()
      .then((data) => {
        if (!cancelled) setVouchers(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Gagal memuat voucher.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchVouchers]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditingId("");
  }

  function openEdit(voucher: EventVoucher) {
    setForm(formFromVoucher(voucher));
    setFormError(null);
    setEditingId(voucher.id);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validation = validateForm(form);
    if (validation) {
      setFormError(validation);
      return;
    }
    setSaving(true);
    setFormError(null);
    setNotice(null);
    try {
      const body = requestFromForm(form);
      if (editingId) {
        await api.put<ApiResponse<EventVoucher>>(`${basePath}/${editingId}`, body);
        setNotice(`Voucher ${body.code} diperbarui.`);
      } else {
        await api.post<ApiResponse<EventVoucher>>(basePath, body);
        setNotice(`Voucher ${body.code} dibuat.`);
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Gagal menyimpan voucher.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(voucher: EventVoucher) {
    setBusyId(voucher.id);
    setError(null);
    setNotice(null);
    try {
      await api.put<ApiResponse<EventVoucher>>(`${basePath}/${voucher.id}`, {
        ...requestFromForm(formFromVoucher(voucher)),
        is_active: !voucher.is_active,
      });
      setNotice(`Voucher ${voucher.code} ${voucher.is_active ? "dinonaktifkan" : "diaktifkan"}.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengubah status voucher.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(voucher: EventVoucher) {
    const ok = await confirm({
      title: "Hapus voucher?",
      message: `Voucher ${voucher.code} akan dihapus permanen. Voucher yang sudah pernah dipakai tidak bisa dihapus; nonaktifkan saja.`,
      confirmLabel: "Hapus",
      variant: "danger",
    });
    if (!ok) return;
    setBusyId(voucher.id);
    setError(null);
    setNotice(null);
    try {
      await api.delete<void>(`${basePath}/${voucher.id}`);
      setNotice(`Voucher ${voucher.code} dihapus.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus voucher.");
    } finally {
      setBusyId(null);
    }
  }

  const ticketName = (ticketId: string) => tickets.find((t) => t.id === ticketId)?.name ?? "Tiket dihapus";

  return (
    <div style={panel}>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}
      >
        <div>
          <h2 style={heading}>Voucher Diskon</h2>
          <p style={{ fontSize: 14, color: "var(--color-ink-3)", margin: "4px 0 0", maxWidth: 620 }}>
            Diskon memotong harga tiket + add-on dan ditanggung penyelenggara. Fee platform dan biaya transaksi tetap
            dihitung dari harga setelah diskon. Peserta memasukkan kode di halaman pembayaran.
          </p>
        </div>
        {!locked && editingId === null && (
          <Button variant="primary" size="sm" type="button" onClick={openCreate}>
            + Buat Voucher
          </Button>
        )}
      </div>

      {locked && (
        <Alert variant="info" className="mt-4">
          Event sudah selesai atau dibatalkan, voucher hanya dapat dilihat.
        </Alert>
      )}
      {notice && (
        <Alert variant="info" className="mt-4">
          {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="mt-4">
          {error}
        </Alert>
      )}

      {editingId !== null && (
        <VoucherForm
          form={form}
          onChange={setForm}
          tickets={tickets}
          isEdit={editingId !== ""}
          error={formError}
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={() => setEditingId(null)}
        />
      )}

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {loading && <p style={{ color: "var(--color-ink-3)" }}>Memuat voucher…</p>}
        {!loading && vouchers.length === 0 && (
          <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>Belum ada voucher untuk event ini.</p>
        )}
        {vouchers.map((voucher) => {
          const state = voucherState(voucher);
          const busy = busyId === voucher.id;
          return (
            <div key={voucher.id} style={item}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16 }}>{voucher.code}</span>
                    <Badge variant={state.variant}>{state.label}</Badge>
                  </div>
                  {voucher.description && (
                    <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginTop: 2 }}>{voucher.description}</div>
                  )}
                </div>
                {!locked && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Button variant="ghost" size="sm" type="button" disabled={busy} onClick={() => openEdit(voucher)}>
                      Edit
                    </Button>
                    <Button variant="secondary" size="sm" type="button" disabled={busy} onClick={() => toggleActive(voucher)}>
                      {voucher.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                    <Button variant="danger" size="sm" type="button" disabled={busy} onClick={() => handleDelete(voucher)}>
                      Hapus
                    </Button>
                  </div>
                )}
              </div>
              <dl style={meta}>
                <MetaItem label="Diskon" value={describeDiscount(voucher)} mono />
                <MetaItem
                  label="Pemakaian"
                  value={`${voucher.used_count}${voucher.quota > 0 ? ` / ${voucher.quota}` : " (tanpa batas)"} · lunas ${voucher.redeemed_count}`}
                  mono
                />
                <MetaItem label="Periode" value={describeWindow(voucher)} />
                <MetaItem
                  label="Tiket"
                  value={
                    voucher.ticket_category_ids.length === 0
                      ? "Semua tiket"
                      : voucher.ticket_category_ids.map(ticketName).join(", ")
                  }
                />
                <MetaItem label="Per email" value={voucher.once_per_email ? "Sekali per email" : "Tanpa batas"} />
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface VoucherFormProps {
  form: VoucherFormState;
  onChange: (form: VoucherFormState) => void;
  tickets: TicketCategory[];
  isEdit: boolean;
  error: string | null;
  saving: boolean;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

function VoucherForm({ form, onChange, tickets, isEdit, error, saving, onSubmit, onCancel }: VoucherFormProps) {
  const set = <K extends keyof VoucherFormState>(key: K, value: VoucherFormState[K]) =>
    onChange({ ...form, [key]: value });
  const isPercent = form.discountType === "percent";

  function toggleTicket(ticketId: string, checked: boolean) {
    const next = checked
      ? [...form.ticketCategoryIds, ticketId]
      : form.ticketCategoryIds.filter((value) => value !== ticketId);
    set("ticketCategoryIds", next);
  }

  return (
    <form onSubmit={onSubmit} style={{ ...item, marginTop: 20, backgroundColor: "var(--color-paper)" }}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>{isEdit ? "Edit Voucher" : "Voucher Baru"}</div>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}
      <div style={grid}>
        <Field
          label="Kode Voucher"
          hint="3–32 karakter: huruf, angka, - atau _"
          value={form.code}
          maxLength={32}
          required
          onChange={(e) => set("code", e.target.value.toUpperCase())}
        />
        <Field
          label="Keterangan (opsional)"
          value={form.description}
          maxLength={255}
          onChange={(e) => set("description", e.target.value)}
        />
        <Field
          type="select"
          label="Jenis Diskon"
          value={form.discountType}
          onChange={(e) =>
            onChange({ ...form, discountType: e.target.value as VoucherDiscountType, discountValue: "", maxDiscount: "" })
          }
        >
          <option value="percent">Persen (%)</option>
          <option value="fixed">Nominal (Rp)</option>
        </Field>
        <Field
          label={isPercent ? "Besar Diskon (%)" : "Besar Diskon (Rp)"}
          inputMode="numeric"
          required
          value={isPercent ? form.discountValue : formatNumberInput(form.discountValue)}
          onChange={(e) => set("discountValue", parseNumberInput(e.target.value))}
        />
        {isPercent && (
          <Field
            label="Maksimal Diskon (Rp, opsional)"
            hint="Kosongkan bila tanpa batas"
            inputMode="numeric"
            value={formatNumberInput(form.maxDiscount)}
            onChange={(e) => set("maxDiscount", parseNumberInput(e.target.value))}
          />
        )}
        <Field
          label="Kuota Pemakaian (opsional)"
          hint="Kosongkan bila tanpa batas"
          inputMode="numeric"
          value={formatNumberInput(form.quota)}
          onChange={(e) => set("quota", parseNumberInput(e.target.value))}
        />
        <Field
          type="datetime-local"
          label="Berlaku Mulai (opsional)"
          value={form.startsAt}
          onChange={(e) => set("startsAt", e.target.value)}
        />
        <Field
          type="datetime-local"
          label="Berlaku Sampai (opsional)"
          value={form.endsAt}
          onChange={(e) => set("endsAt", e.target.value)}
        />
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
        <legend style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Berlaku untuk tiket</legend>
        <p style={{ fontSize: 12, color: "var(--color-ink-3)", margin: "0 0 8px" }}>
          Tidak memilih apa pun berarti voucher berlaku untuk semua tiket.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
          {tickets.map((ticket) => (
            <label key={ticket.id} style={checkLabel}>
              <input
                type="checkbox"
                checked={form.ticketCategoryIds.includes(ticket.id)}
                onChange={(e) => toggleTicket(ticket.id, e.target.checked)}
              />
              {ticket.name}
            </label>
          ))}
          {tickets.length === 0 && <span style={{ fontSize: 13, color: "var(--color-ink-3)" }}>Belum ada tiket.</span>}
        </div>
      </fieldset>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
        <label style={checkLabel}>
          <input type="checkbox" checked={form.oncePerEmail} onChange={(e) => set("oncePerEmail", e.target.checked)} />
          Satu email hanya boleh memakai voucher ini sekali
        </label>
        <label style={checkLabel}>
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          Voucher aktif
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <Button variant="primary" size="sm" type="submit" disabled={saving}>
          {saving ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Buat Voucher"}
        </Button>
        <Button variant="ghost" size="sm" type="button" disabled={saving} onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
  );
}

function MetaItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt style={{ fontSize: 12, color: "var(--color-ink-3)" }}>{label}</dt>
      <dd
        style={{
          margin: 0,
          fontSize: 14,
          ...(mono ? { fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" } : {}),
        }}
      >
        {value}
      </dd>
    </div>
  );
}

// Client-side checks only mirror the backend rules for faster feedback; the
// backend remains the authority and re-validates everything.
function validateForm(form: VoucherFormState): string | null {
  if (!/^[A-Za-z0-9_-]{3,32}$/.test(form.code.trim())) {
    return "Kode voucher harus 3–32 karakter berupa huruf, angka, - atau _.";
  }
  const value = Number(form.discountValue);
  if (!form.discountValue || !Number.isInteger(value) || value < 1) return "Besar diskon wajib diisi.";
  if (form.discountType === "percent" && value > 100) return "Diskon persen maksimal 100%.";
  if (form.startsAt && form.endsAt && new Date(form.startsAt) >= new Date(form.endsAt)) {
    return "Tanggal berakhir harus setelah tanggal mulai.";
  }
  return null;
}

function requestFromForm(form: VoucherFormState): EventVoucherRequest {
  const isPercent = form.discountType === "percent";
  return {
    code: form.code.trim().toUpperCase(),
    description: form.description.trim(),
    discount_type: form.discountType,
    discount_value: Number(form.discountValue),
    max_discount: isPercent && form.maxDiscount ? Number(form.maxDiscount) : 0,
    quota: form.quota ? Number(form.quota) : 0,
    once_per_email: form.oncePerEmail,
    ticket_category_ids: form.ticketCategoryIds,
    starts_at: toRFC3339(form.startsAt),
    ends_at: toRFC3339(form.endsAt),
    is_active: form.isActive,
  };
}

function formFromVoucher(voucher: EventVoucher): VoucherFormState {
  return {
    code: voucher.code,
    description: voucher.description,
    discountType: voucher.discount_type,
    discountValue: String(voucher.discount_value),
    maxDiscount: voucher.max_discount > 0 ? String(voucher.max_discount) : "",
    quota: voucher.quota > 0 ? String(voucher.quota) : "",
    oncePerEmail: voucher.once_per_email,
    ticketCategoryIds: voucher.ticket_category_ids,
    startsAt: toLocalInput(voucher.starts_at),
    endsAt: toLocalInput(voucher.ends_at),
    isActive: voucher.is_active,
  };
}

// Displays the configured rule; it never computes a participant's discount.
function describeDiscount(voucher: EventVoucher): string {
  if (voucher.discount_type === "fixed") return formatRupiah(voucher.discount_value);
  const cap = voucher.max_discount > 0 ? ` (maks. ${formatRupiah(voucher.max_discount)})` : "";
  return `${voucher.discount_value}%${cap}`;
}

function describeWindow(voucher: EventVoucher): string {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  if (voucher.starts_at && voucher.ends_at) return `${fmt(voucher.starts_at)} – ${fmt(voucher.ends_at)}`;
  if (voucher.starts_at) return `Mulai ${fmt(voucher.starts_at)}`;
  if (voucher.ends_at) return `Sampai ${fmt(voucher.ends_at)}`;
  return "Tanpa batas waktu";
}

function voucherState(voucher: EventVoucher): { label: string; variant: "ok" | "warn" | "danger" | "neutral" } {
  const now = Date.now();
  if (!voucher.is_active) return { label: "Nonaktif", variant: "neutral" };
  if (voucher.ends_at && new Date(voucher.ends_at).getTime() <= now) return { label: "Kedaluwarsa", variant: "danger" };
  if (voucher.starts_at && new Date(voucher.starts_at).getTime() > now) return { label: "Terjadwal", variant: "warn" };
  if (voucher.quota > 0 && voucher.used_count >= voucher.quota) return { label: "Kuota habis", variant: "warn" };
  return { label: "Aktif", variant: "ok" };
}

function toLocalInput(rfc3339: string | null): string {
  if (!rfc3339) return "";
  const d = new Date(rfc3339);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toRFC3339(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const panel: React.CSSProperties = {
  padding: 28,
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius-md)",
  backgroundColor: "var(--color-surface)",
  maxWidth: 960,
};
const heading: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 18,
  fontWeight: 700,
  margin: 0,
};
const item: React.CSSProperties = {
  padding: 16,
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius-md)",
  backgroundColor: "var(--color-surface)",
};
const meta: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "10px 16px",
  margin: "12px 0 0",
};
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "4px 16px",
};
const checkLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  cursor: "pointer",
};
