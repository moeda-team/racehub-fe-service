"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, getAuthToken } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { eventStatusDisplay } from "@/lib/event-status";
import EventForm, { EventFormValues } from "@/components/EventForm";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import DataTable, { Column } from "@/components/ui/DataTable";
import type {
  ApiResponse,
  BibResult,
  DistanceCategory,
  DonationReport,
  Event,
  EventDashboard,
  EventDetail,
  EventStatus,
  ParticipantRow,
  RecapRow,
  TicketCategory,
} from "@/lib/types.gen";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const eventId = Number(id);

  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<EventDetail>>(`/api/v1/events/${eventId}`);
      setDetail(res.data);
    } catch {
      setLoadError("Gagal memuat event. Mungkin event tidak ditemukan atau bukan milik Anda.");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function handleUpdate(values: EventFormValues) {
    const res = await api.put<ApiResponse<Event>>(`/api/v1/events/${eventId}`, {
      name: values.name,
      description: values.description || undefined,
      location: values.location || undefined,
      event_date: values.event_date || undefined,
      is_running_event: values.is_running_event,
      master_age_threshold: values.master_age_threshold,
      refund_cutoff_date: values.refund_cutoff_date || undefined,
      registration_close_date: values.registration_close_date || undefined,
      donation_enabled: values.donation_enabled,
      total_quota: values.total_quota,
    });
    setDetail((prev) => (prev ? { ...prev, event: res.data } : prev));
    setNotice("Perubahan event tersimpan.");
  }

  if (isLoading) {
    return <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>;
  }

  if (loadError || !detail) {
    return (
      <div>
        <Link
          href="/dashboard/events"
          style={{ fontSize: 13, color: "var(--color-ink-3)", display: "inline-block", marginBottom: 12 }}
        >
          ← Kembali ke Event Saya
        </Link>
        <Alert variant="danger">{loadError ?? "Event tidak ditemukan."}</Alert>
      </div>
    );
  }

  const { event } = detail;
  const status = eventStatusDisplay(event.status);

  return (
    <div className="rh-reveal" style={{ maxWidth: 720 }}>
      <Link
        href="/dashboard/events"
        style={{ fontSize: 13, color: "var(--color-ink-3)", display: "inline-block", marginBottom: 12 }}
      >
        ← Kembali ke Event Saya
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700 }}>{event.name}</h1>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {notice && (
        <Alert variant="info" className="mb-4">
          {notice}
        </Alert>
      )}

      <StatusSection event={event} onChanged={load} onNotice={setNotice} />

      <Section title="Detail Event">
        <EventForm
          submitLabel="Simpan Perubahan"
          initial={{
            name: event.name,
            description: event.description,
            location: event.location,
            event_date: event.event_date,
            is_running_event: event.is_running_event,
            master_age_threshold: event.master_age_threshold,
            refund_cutoff_date: event.refund_cutoff_date ?? "",
            registration_close_date: event.registration_close_date ?? "",
            donation_enabled: event.donation_enabled,
            total_quota: event.total_quota,
          }}
          onSubmit={handleUpdate}
        />
      </Section>

      <Section title="Kategori Jarak">
        <DistanceManager
          eventId={eventId}
          distances={detail.distance_categories}
          onChanged={load}
        />
      </Section>

      <Section title="Kategori Tiket">
        <TicketManager
          eventId={eventId}
          distances={detail.distance_categories}
          tickets={detail.ticket_categories}
          onChanged={load}
        />
      </Section>

      <Section title="Pendapatan & Donasi">
        <DonationReportCard eventId={eventId} />
      </Section>

      <Section title="Ringkasan & Rekap Kategori">
        <DashboardCard eventId={eventId} />
        <RecapTable eventId={eventId} />
      </Section>

      <Section title="Nomor BIB">
        <BibCard eventId={eventId} hasCloseDate={!!event.registration_close_date} />
      </Section>

      <Section title="Peserta & Export">
        <ParticipantsCard eventId={eventId} />
      </Section>
    </div>
  );
}

// DashboardCard shows the server-computed event summary (FR-1101).
function DashboardCard({ eventId }: { eventId: number }) {
  const [d, setD] = useState<EventDashboard | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<EventDashboard>>(`/api/v1/events/${eventId}/dashboard`);
        if (!cancelled) setD(res.data);
      } catch {
        /* non-fatal */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (!d) return <p style={{ color: "var(--color-ink-3)" }}>Memuat ringkasan…</p>;

  const cells: { label: string; value: string }[] = [
    { label: "Peserta Berbayar", value: String(d.paid_count) },
    { label: "Pendapatan Tiket", value: formatRupiah(d.ticket_revenue) },
    { label: "Donasi (terpisah)", value: formatRupiah(d.donation_total) },
    { label: "Saldo Wallet", value: formatRupiah(d.wallet_balance) },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
      {cells.map((c) => (
        <div key={c.label}>
          <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>{c.label}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// RecapTable lists participant counts per distance × gender × age class (FR-1103).
function RecapTable({ eventId }: { eventId: number }) {
  const [rows, setRows] = useState<RecapRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<RecapRow[]>>(`/api/v1/events/${eventId}/recap`);
        if (!cancelled) setRows(res.data ?? []);
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (!rows) return <p style={{ color: "var(--color-ink-3)" }}>Memuat rekap…</p>;
  if (rows.length === 0)
    return <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>Belum ada peserta berbayar untuk direkap.</p>;

  const cols: Column<RecapRow>[] = [
    { key: "distance", header: "Jarak", render: (r) => r.distance_name },
    { key: "gender", header: "Gender", render: (r) => r.gender || "—" },
    { key: "age", header: "Kelas", render: (r) => r.age_class || "—" },
    { key: "total", header: "Jumlah", render: (r) => r.total, mono: true },
  ];
  return <DataTable columns={cols} data={rows} keyField={"distance_id" as keyof RecapRow} />;
}

// BibCard generates the BIB batch (FR-1301..1305) with regeneration confirmation.
function BibCard({ eventId, hasCloseDate }: { eventId: number; hasCloseDate: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate(regenerate: boolean) {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const res = await api.post<ApiResponse<BibResult>>(
        `/api/v1/events/${eventId}/bibs/generate${regenerate ? "?regenerate=true" : ""}`,
      );
      setMsg(`${res.data.generated} nomor BIB berhasil dibuat (0001…).`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // Distinguish "already generated" (offer confirm) from "registration open".
        if (e.message.toLowerCase().includes("already") || e.message.toLowerCase().includes("regenerat")) {
          if (window.confirm("Nomor BIB sudah pernah dibuat. Buat ulang dari awal? Nomor lama akan ditimpa.")) {
            await generate(true);
            return;
          }
          setErr("Pembuatan ulang dibatalkan.");
        } else {
          setErr(e.message);
        }
      } else {
        setErr(e instanceof ApiError ? e.message : "Gagal membuat nomor BIB.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p style={{ fontSize: 14, color: "var(--color-ink-3)", marginBottom: 12 }}>
        Nomor BIB polos satu deret menerus (0001, 0002, …) untuk semua jarak, urut waktu pendaftaran. Hanya bisa
        dibuat <b>setelah pendaftaran ditutup</b>.
        {!hasCloseDate && " Atur “Penutupan Pendaftaran” di Detail Event, atau ini memakai tanggal event."}
      </p>
      {msg && <Alert variant="info" className="mb-4">{msg}</Alert>}
      {err && <Alert variant="danger" className="mb-4">{err}</Alert>}
      <Button variant="primary" size="md" disabled={busy} onClick={() => generate(false)}>
        {busy ? "Memproses…" : "Generate Nomor BIB"}
      </Button>
    </div>
  );
}

// ParticipantsCard renders the participant table (FR-1202) + CSV export (FR-1201).
function ParticipantsCard({ eventId }: { eventId: number }) {
  const [rows, setRows] = useState<ParticipantRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<ParticipantRow[]>>(`/api/v1/events/${eventId}/participants?limit=200`);
        if (!cancelled) setRows(res.data ?? []);
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function exportCsv() {
    setErr(null);
    setExporting(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
      const token = getAuthToken();
      const res = await fetch(`${base}/api/v1/events/${eventId}/participants/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `peserta-event-${eventId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setErr("Gagal mengekspor. Coba lagi.");
    } finally {
      setExporting(false);
    }
  }

  const cols: Column<ParticipantRow>[] = [
    { key: "bib", header: "BIB", render: (r) => r.bib_number || "—", bibcol: true },
    { key: "reg", header: "No. Reg", render: (r) => r.registration_number, mono: true },
    { key: "name", header: "Nama", render: (r) => r.name },
    { key: "distance", header: "Jarak", render: (r) => r.distance_name },
    { key: "ticket", header: "Tiket", render: (r) => r.ticket_name },
    { key: "gender", header: "Gender", render: (r) => r.gender || "—" },
    { key: "age", header: "Kelas", render: (r) => r.age_class || "—" },
    {
      key: "rpc",
      header: "RPC",
      render: (r) => (r.rpc_status ? <Badge variant="ok">✓</Badge> : <span style={{ color: "var(--color-ink-3)" }}>—</span>),
    },
    {
      key: "raceday",
      header: "Hari-H",
      render: (r) =>
        r.raceday_status ? <Badge variant="ok">✓</Badge> : <span style={{ color: "var(--color-ink-3)" }}>—</span>,
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12 }}>
        <span style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
          {rows ? `${rows.length} peserta ditampilkan` : "Memuat…"}
        </span>
        <Button variant="secondary" size="sm" disabled={exporting} onClick={exportCsv}>
          {exporting ? "Mengekspor…" : "Export CSV"}
        </Button>
      </div>
      {err && <Alert variant="danger" className="mb-4">{err}</Alert>}
      {rows && rows.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>Belum ada peserta.</p>
      ) : rows ? (
        <DataTable columns={cols} data={rows} keyField="id" />
      ) : null}
    </div>
  );
}

// DonationReportCard shows the server-computed ticket-revenue vs donation split
// (FR-804/1405). Donation is reported separately and is non-refundable.
function DonationReportCard({ eventId }: { eventId: number }) {
  const [report, setReport] = useState<DonationReport | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<DonationReport>>(`/api/v1/events/${eventId}/donations`);
        if (!cancelled) setReport(res.data);
      } catch {
        if (!cancelled) setErr("Gagal memuat laporan donasi.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (err) return <p style={{ color: "var(--color-ink-3)" }}>{err}</p>;
  if (!report) return <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>Pendapatan Tiket</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700 }}>{formatRupiah(report.ticket_revenue)}</div>
      </div>
      <div>
        <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>Total Donasi (terpisah)</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--color-sprint)" }}>{formatRupiah(report.donation_total)}</div>
        <div style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 4 }}>Non-refundable, tetap disalurkan.</div>
      </div>
    </div>
  );
}

// --- Layout helpers ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginTop: 24,
        padding: 20,
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

// --- Status transitions ---

function StatusSection({
  event,
  onChanged,
  onNotice,
}: {
  event: Event;
  onChanged: () => Promise<void>;
  onNotice: (msg: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function transition(target: EventStatus, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    setBusy(true);
    try {
      await api.patch<ApiResponse<Event>>(`/api/v1/events/${event.id}/status`, { status: target });
      await onChanged();
      onNotice("Status event diperbarui.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengubah status.");
    } finally {
      setBusy(false);
    }
  }

  async function submitForReview() {
    if (!window.confirm("Ajukan event ini untuk persetujuan admin?")) return;
    setError(null);
    setBusy(true);
    try {
      await api.post<ApiResponse<Event>>(`/api/v1/events/${event.id}/submit`);
      await onChanged();
      onNotice("Event diajukan untuk persetujuan admin.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengajukan event.");
    } finally {
      setBusy(false);
    }
  }

  const isDraft = event.status === "draft";
  const isPublished = event.status === "published";
  const terminal = event.status === "cancelled" || event.status === "finished";

  return (
    <div
      style={{
        padding: 16,
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-panel)",
      }}
    >
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {event.rejection_reason && (
        <Alert variant="warn" className="mb-4">
          Ditolak admin: {event.rejection_reason}. Perbaiki lalu ajukan ulang.
        </Alert>
      )}

      {isDraft && event.submitted_for_review && (
        <p style={{ fontSize: 13, color: "var(--color-warn)", marginBottom: 12 }}>
          ⏳ Menunggu persetujuan admin. Event akan terbit otomatis setelah disetujui.
        </p>
      )}
      {isDraft && !event.submitted_for_review && (
        <p style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 12 }}>
          Event masih draft. Ajukan untuk persetujuan admin agar bisa terbit ke publik.
        </p>
      )}
      {terminal && (
        <p style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
          Tidak ada aksi status yang tersedia untuk event ini.
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {isDraft && !event.submitted_for_review && (
          <Button variant="primary" size="sm" disabled={busy} onClick={submitForReview}>
            Ajukan untuk Persetujuan
          </Button>
        )}
        {isPublished && (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => transition("finished", "Tandai event sebagai selesai?")}
          >
            Tandai Selesai
          </Button>
        )}
        {(isDraft || isPublished) && (
          <Button
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={() =>
              transition("cancelled", "Batalkan event ini? Tindakan ini tidak dapat dibatalkan.")
            }
          >
            Batalkan Event
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Distance category management ---

function DistanceManager({
  eventId,
  distances,
  onChanged,
}: {
  eventId: number;
  distances: DistanceCategory[];
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [quota, setQuota] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) {
      setError("Nama jarak wajib diisi.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await api.post(`/api/v1/events/${eventId}/distances`, {
        name: name.trim(),
        quota: Number(quota) || 0,
      });
      setName("");
      setQuota("0");
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah jarak.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(did: number) {
    if (!window.confirm("Hapus kategori jarak ini?")) return;
    setError(null);
    try {
      await api.delete(`/api/v1/events/${eventId}/distances/${did}`);
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus jarak.");
    }
  }

  return (
    <div>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {distances.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)", fontSize: 14, marginBottom: 12 }}>Belum ada kategori jarak.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {distances.map((d) => (
            <li
              key={d.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <span>{d.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-ink-3)" }}>
                  {d.quota_used}/{d.quota}
                </span>
                <button
                  type="button"
                  onClick={() => remove(d.id)}
                  style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 13 }}
                >
                  Hapus
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label className="field-label">Nama Jarak</label>
          <input
            className="field-input"
            placeholder="Mis. 5K"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field" style={{ width: 120 }}>
          <label className="field-label">Kuota</label>
          <input
            className="field-input"
            type="number"
            min={0}
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="md" disabled={busy} onClick={add}>
          Tambah
        </Button>
      </div>
    </div>
  );
}

// --- Ticket category management ---

function TicketManager({
  eventId,
  distances,
  tickets,
  onChanged,
}: {
  eventId: number;
  distances: DistanceCategory[];
  tickets: TicketCategory[];
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [quota, setQuota] = useState("0");
  const [distanceId, setDistanceId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const distanceName = (id: number) => distances.find((d) => d.id === id)?.name ?? "—";

  async function add() {
    if (!name.trim()) {
      setError("Nama tiket wajib diisi.");
      return;
    }
    if (!distanceId) {
      setError("Pilih kategori jarak untuk tiket ini.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await api.post(`/api/v1/events/${eventId}/tickets`, {
        name: name.trim(),
        price: Number(price) || 0,
        quota: Number(quota) || 0,
        distance_category_id: Number(distanceId),
      });
      setName("");
      setPrice("0");
      setQuota("0");
      setDistanceId("");
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah tiket.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(tid: number) {
    if (!window.confirm("Hapus kategori tiket ini?")) return;
    setError(null);
    try {
      await api.delete(`/api/v1/events/${eventId}/tickets/${tid}`);
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus tiket.");
    }
  }

  if (distances.length === 0) {
    return (
      <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
        Tambahkan kategori jarak terlebih dahulu sebelum membuat tiket.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {tickets.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)", fontSize: 14, marginBottom: 12 }}>Belum ada kategori tiket.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {tickets.map((t) => (
            <li
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <span>
                {t.name}
                <span style={{ color: "var(--color-ink-3)", fontSize: 13 }}> · {distanceName(t.distance_category_id)}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{formatRupiah(t.price)}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-ink-3)" }}>
                  {t.quota_used}/{t.quota}
                </span>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 13 }}
                >
                  Hapus
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 1, minWidth: 140 }}>
          <label className="field-label">Nama Tiket</label>
          <input
            className="field-input"
            placeholder="Mis. Early Bird"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field" style={{ width: 160 }}>
          <label className="field-label">Jarak</label>
          <select className="field-input" value={distanceId} onChange={(e) => setDistanceId(e.target.value)}>
            <option value="">Pilih jarak</option>
            {distances.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ width: 140 }}>
          <label className="field-label">Harga (Rp)</label>
          <input
            className="field-input"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="field" style={{ width: 110 }}>
          <label className="field-label">Kuota</label>
          <input
            className="field-input"
            type="number"
            min={0}
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="md" disabled={busy} onClick={add}>
          Tambah
        </Button>
      </div>
      <p style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 8 }}>
        Kuota tiket tidak boleh melebihi kuota jarak yang dipilih (divalidasi server).
      </p>
    </div>
  );
}
