"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, getAuthToken } from "@/lib/api";
import { formatRupiah, formatNumber, formatNumberInput, parseNumberInput } from "@/lib/format";
import { eventStatusDisplay } from "@/lib/event-status";
import EventForm, { EventFormValues } from "@/components/EventForm";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import DataTable, { Column } from "@/components/ui/DataTable";
import type {
  ApiResponse,
  BibResult,
  ComplimentaryPerson,
  DistanceCategory,
  DonationLedgerEntry,
  DonationReport,
  Event,
  EventDashboard,
  EventDetail,
  EventStatus,
  ParticipantRow,
  RecapRow,
  Refund,
  TicketCategory,
} from "@/lib/types.gen";

type Tab = "detail" | "kategori" | "peserta" | "keuangan" | "refund";

const BASE_TABS: { id: Tab; label: string }[] = [
  { id: "detail", label: "Detail Event" },
  { id: "kategori", label: "Kategori" },
  { id: "peserta", label: "Peserta & BIB" },
  { id: "keuangan", label: "Keuangan" },
];

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const eventId = id;

  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("detail");

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
    return () => { cancelled = true; };
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
      refund_donation_on_cancel: values.refund_donation_on_cancel,
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
        <Link href="/dashboard/events" style={{ fontSize: 14, color: "var(--color-ink-3)", display: "inline-block", marginBottom: 16 }}>
          ← Kembali ke Event Saya
        </Link>
        <Alert variant="danger">{loadError ?? "Event tidak ditemukan."}</Alert>
      </div>
    );
  }

  const { event } = detail;
  const status = eventStatusDisplay(event.status);

  return (
    <div className="rh-reveal" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <Link href="/dashboard/events" style={{ fontSize: 14, color: "var(--color-ink-3)" }}>
          ← Event Saya
        </Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, margin: 0 }}>{event.name}</h1>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {notice && (
        <Alert variant="info" className="mb-4">
          {notice}
        </Alert>
      )}

      {/* Status bar — always visible */}
      <StatusSection event={event} onChanged={load} onNotice={setNotice} />

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--color-line)", marginTop: 24, marginBottom: 0 }}>
        {[...BASE_TABS, ...(event.status === "cancelled" ? [{ id: "refund" as Tab, label: "Refund" }] : [])].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "11px 26px",
              fontSize: 15,
              fontWeight: activeTab === t.id ? 600 : 400,
              color: activeTab === t.id ? "var(--color-flame)" : "var(--color-ink-2)",
              background: "none",
              border: "none",
              borderBottom: activeTab === t.id ? "2px solid var(--color-flame)" : "2px solid transparent",
              cursor: "pointer",
              marginBottom: -1,
              transition: "color 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div style={{ paddingTop: 28 }}>
        {activeTab === "detail" && (
          <div style={{ maxWidth: 720 }}>
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
                refund_donation_on_cancel: event.refund_donation_on_cancel ?? false,
              }}
              onSubmit={handleUpdate}
            />
          </div>
        )}

        {activeTab === "kategori" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ padding: 28, border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>Kategori Jarak</h2>
              <DistanceManager eventId={eventId} distances={detail.distance_categories} onChanged={load} />
            </div>
            <div style={{ padding: 28, border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>Kategori Tiket</h2>
              <TicketManager
                eventId={eventId}
                distances={detail.distance_categories}
                tickets={detail.ticket_categories}
                onChanged={load}
              />
            </div>
          </div>
        )}

        {activeTab === "peserta" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <RegistrationStatusCard event={event} eventId={eventId} onChanged={load} />
            <div style={{ padding: 28, border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 8, marginTop: 0 }}>Daftar Peserta Gratis</h2>
              <p style={{ fontSize: 14, color: "var(--color-ink-3)", marginTop: 0, marginBottom: 20 }}>
                Email yang terdaftar di sini akan mendapat tiket gratis (harga = 0, fee platform = 0) saat mendaftar. Donasi dan fee Midtrans tetap berlaku jika peserta memilih berdonasi.
              </p>
              <ComplimentaryManager eventId={eventId} />
            </div>
            <div style={{ padding: 28, border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 16, marginTop: 0 }}>Nomor BIB</h2>
              <BibCard eventId={eventId} hasCloseDate={!!event.registration_close_date} />
            </div>
            <div style={{ padding: 28, border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 16, marginTop: 0 }}>Daftar Peserta</h2>
              <ParticipantsCard eventId={eventId} />
            </div>
          </div>
        )}

        {activeTab === "refund" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ padding: 28, border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>Status Refund Peserta</h2>
              <RefundsCard eventId={eventId} />
            </div>
          </div>
        )}

        {activeTab === "keuangan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ padding: 28, border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>Pendapatan & Donasi</h2>
              <DonationReportCard eventId={eventId} />
            </div>
            <div style={{ padding: 28, border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>Ringkasan</h2>
              <DashboardCard eventId={eventId} />
            </div>
            <div style={{ padding: 28, border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>Rekap per Kategori</h2>
              <RecapTable eventId={eventId} />
            </div>
            <div style={{ padding: 28, border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>Wallet Donasi</h2>
              <DonationLedgerCard eventId={eventId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// RegistrationStatusCard shows whether registration is open or closed and lets
// the organizer close it immediately with one click (prerequisite for BIB generation).
function RegistrationStatusCard({
  event,
  eventId,
  onChanged,
}: {
  event: Event;
  eventId: string;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Mirror backend resolveRegistrationClose: prefer explicit close date, fall back to event date.
  const closeDateStr = event.registration_close_date ?? event.event_date ?? null;
  const closeDate = closeDateStr ? new Date(closeDateStr) : null;
  const isClosed = !!closeDate && closeDate <= new Date();

  async function closeNow() {
    if (!window.confirm("Tutup pendaftaran sekarang? Peserta baru tidak dapat mendaftar setelah ini.")) return;
    setBusy(true);
    setErr(null);
    try {
      await api.put<ApiResponse<Event>>(`/api/v1/events/${eventId}`, {
        name: event.name,
        description: event.description,
        location: event.location,
        event_date: event.event_date,
        is_running_event: event.is_running_event,
        master_age_threshold: event.master_age_threshold,
        refund_cutoff_date: event.refund_cutoff_date ?? "",
        registration_close_date: new Date().toISOString(),
        donation_enabled: event.donation_enabled,
      });
      await onChanged();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Gagal menutup pendaftaran.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        padding: "18px 22px",
        border: `1px solid ${isClosed ? "var(--color-sprint)" : "var(--color-warn)"}`,
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-panel)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
          {isClosed ? "✓ Pendaftaran ditutup" : "⚠ Pendaftaran masih terbuka"}
        </div>
        <div style={{ fontSize: 14, color: "var(--color-ink-3)" }}>
          {isClosed && closeDate
            ? `Ditutup sejak ${closeDate.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}`
            : closeDate
            ? `Akan tutup otomatis ${closeDate.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}`
            : "Belum ada tanggal penutupan — atur di tab Detail atau tutup manual di sini."}
        </div>
        {err && <div style={{ fontSize: 13, color: "var(--color-danger)", marginTop: 4 }}>{err}</div>}
      </div>
      {!isClosed && (
        <Button variant="secondary" size="sm" disabled={busy} onClick={closeNow}>
          {busy ? "Menutup…" : "Tutup Pendaftaran Sekarang"}
        </Button>
      )}
    </div>
  );
}

// DashboardCard shows the server-computed event summary.
function DashboardCard({ eventId }: { eventId: string }) {
  const [d, setD] = useState<EventDashboard | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<EventDashboard>>(`/api/v1/events/${eventId}/dashboard`);
        if (!cancelled) setD(res.data);
      } catch { /* non-fatal */ }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  if (!d) return <p style={{ color: "var(--color-ink-3)" }}>Memuat ringkasan…</p>;

  const cells: { label: string; value: string }[] = [
    { label: "Peserta Berbayar", value: String(d.paid_count) },
    { label: "Pendapatan Tiket", value: formatRupiah(d.ticket_revenue) },
    { label: "Donasi", value: formatRupiah(d.donation_total) },
    { label: "Saldo Wallet", value: formatRupiah(d.wallet_balance) },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {cells.map((c) => (
        <div key={c.label}>
          <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 4 }}>{c.label}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// RecapTable lists participant counts per distance × gender × age class.
function RecapTable({ eventId }: { eventId: string }) {
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
    return () => { cancelled = true; };
  }, [eventId]);

  if (!rows) return <p style={{ color: "var(--color-ink-3)" }}>Memuat rekap…</p>;
  if (rows.length === 0)
    return <p style={{ color: "var(--color-ink-3)", fontSize: 15 }}>Belum ada peserta berbayar untuk direkap.</p>;

  const cols: Column<RecapRow>[] = [
    { key: "distance", header: "Jarak", render: (r) => r.distance_name },
    { key: "gender", header: "Gender", render: (r) => r.gender || "—" },
    { key: "age", header: "Kelas", render: (r) => r.age_class || "—" },
    { key: "total", header: "Jumlah", render: (r) => r.total, mono: true },
  ];
  return <DataTable columns={cols} data={rows} keyFn={(r) => `${r.distance_id}-${r.gender}-${r.age_class}`} />;
}

// BibCard generates the BIB batch (FR-1301..1305) with regeneration confirmation.
function BibCard({ eventId, hasCloseDate }: { eventId: string; hasCloseDate: boolean }) {
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
      <p style={{ fontSize: 14, color: "var(--color-ink-3)", marginTop: 0, marginBottom: 16 }}>
        Nomor polos satu deret menerus (0001, 0002, …) untuk semua jarak, urut waktu pendaftaran. Hanya bisa dibuat{" "}
        <b>setelah pendaftaran ditutup</b>.
        {!hasCloseDate && ' Atur "Penutupan Pendaftaran" di tab Detail, atau ini memakai tanggal event.'}
      </p>
      {msg && <Alert variant="info" className="mb-4">{msg}</Alert>}
      {err && <Alert variant="danger" className="mb-4">{err}</Alert>}
      <Button variant="primary" size="md" disabled={busy} onClick={() => generate(false)}>
        {busy ? "Memproses…" : "Generate Nomor BIB"}
      </Button>
    </div>
  );
}

// ParticipantsCard renders the participant table + CSV export.
function ParticipantsCard({ eventId }: { eventId: string }) {
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
    return () => { cancelled = true; };
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <span style={{ fontSize: 14, color: "var(--color-ink-3)" }}>
          {rows ? `${rows.length} peserta ditampilkan` : "Memuat…"}
        </span>
        <Button variant="secondary" size="sm" disabled={exporting} onClick={exportCsv}>
          {exporting ? "Mengekspor…" : "Export CSV"}
        </Button>
      </div>
      {err && <Alert variant="danger" className="mb-4">{err}</Alert>}
      {rows && rows.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)", fontSize: 15 }}>Belum ada peserta.</p>
      ) : rows ? (
        <DataTable columns={cols} data={rows} keyField="id" />
      ) : null}
    </div>
  );
}

// DonationReportCard shows the server-computed ticket-revenue vs donation split.
function DonationReportCard({ eventId }: { eventId: string }) {
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
    return () => { cancelled = true; };
  }, [eventId]);

  if (err) return <p style={{ color: "var(--color-ink-3)" }}>{err}</p>;
  if (!report) return <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 4 }}>Pendapatan Tiket</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700 }}>{formatRupiah(report.ticket_revenue)}</div>
      </div>
      <div>
        <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 4 }}>Total Donasi (terpisah)</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700, color: "var(--color-sprint)" }}>{formatRupiah(report.donation_total)}</div>
        <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginTop: 6 }}>Non-refundable, tetap disalurkan.</div>
      </div>
    </div>
  );
}

// DonationLedgerCard lists settled donation entries for an event (wallet donasi).
function DonationLedgerCard({ eventId }: { eventId: string }) {
  const [entries, setEntries] = useState<DonationLedgerEntry[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<DonationLedgerEntry[]>>(`/api/v1/events/${eventId}/donations/ledger`);
        if (!cancelled) setEntries(res.data ?? []);
      } catch {
        if (!cancelled) setErr("Gagal memuat ledger donasi.");
      }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  if (err) return <Alert variant="danger">{err}</Alert>;
  if (!entries) return <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>;

  const total = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <p style={{ fontSize: 14, color: "var(--color-ink-3)", marginTop: 0, marginBottom: 16 }}>
        Donasi yang sudah settled dari peserta. Pisah dari pendapatan tiket dan tidak bisa di-withdraw — disalurkan ke penerima donasi.
      </p>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 4 }}>Total Donasi Settled</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700, color: "var(--color-sprint)" }}>
          {formatRupiah(total)}
        </div>
      </div>
      {entries.length === 0 ? (
        <p style={{ fontSize: 15, color: "var(--color-ink-3)" }}>Belum ada donasi yang masuk.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-line)", textAlign: "left" }}>
                <th style={th}>Referensi</th>
                <th style={th}>Nominal</th>
                <th style={th}>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                  <td style={td}><code style={{ fontSize: 12 }}>{e.reference_id}</code></td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", color: "var(--color-sprint)" }}>+{formatRupiah(e.amount)}</td>
                  <td style={{ ...td, color: "var(--color-ink-3)" }}>{e.created_at ? new Date(e.created_at).toLocaleString("id-ID") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// RefundsCard shows the refund list for a cancelled event (organizer view).
function RefundsCard({ eventId }: { eventId: string }) {
  const [refunds, setRefunds] = useState<Refund[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<Refund[]>>(`/api/v1/events/${eventId}/refunds`);
        if (!cancelled) setRefunds(res.data ?? []);
      } catch {
        if (!cancelled) setErr("Gagal memuat data refund.");
      }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  const REFUND_STATUS: Record<string, { label: string; variant: "ok" | "warn" | "danger" }> = {
    completed: { label: "Selesai", variant: "ok" },
    processing: { label: "Diproses", variant: "warn" },
    rejected: { label: "Ditolak", variant: "danger" },
  };

  if (err) return <Alert variant="danger">{err}</Alert>;
  if (!refunds) return <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>;
  if (refunds.length === 0)
    return <p style={{ color: "var(--color-ink-3)", fontSize: 15 }}>Belum ada refund untuk event ini.</p>;

  const done = refunds.filter((r) => r.status === "completed").length;
  const processing = refunds.filter((r) => r.status === "processing").length;

  return (
    <div>
      <div style={{ display: "flex", gap: 32, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 4 }}>Total Refund</div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 24 }}>{refunds.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 4 }}>Selesai</div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 24, color: "var(--color-sprint)" }}>{done}</div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 4 }}>Menunggu</div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 24, color: "var(--color-warn)" }}>{processing}</div>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-line)", textAlign: "left" }}>
              <th style={th}>Reg. ID</th>
              <th style={th}>Nominal</th>
              <th style={th}>Metode</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((r) => {
              const s = REFUND_STATUS[r.status] ?? { label: r.status, variant: "warn" as const };
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                  <td style={td}><code style={{ fontSize: 12 }}>{r.registration_id.slice(0, 8)}…</code></td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{formatRupiah(r.amount)}</td>
                  <td style={td}>{r.method} · {r.mode === "auto" ? "Otomatis" : "Manual"}</td>
                  <td style={td}><Badge variant={s.variant}>{s.label}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ComplimentaryManager lets organizers manage the free-ticket whitelist for an event.
function ComplimentaryManager({ eventId }: { eventId: string }) {
  const [persons, setPersons] = useState<ComplimentaryPerson[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [addErr, setAddErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ComplimentaryPerson[]>>(`/api/v1/events/${eventId}/complimentary`);
      setPersons(res.data ?? []);
      setErr(null);
    } catch {
      setErr("Gagal memuat daftar peserta gratis.");
    }
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;
    load().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [load]);

  async function add() {
    if (!name.trim()) { setAddErr("Nama wajib diisi."); return; }
    if (!email.trim()) { setAddErr("Email wajib diisi."); return; }
    setAddErr(null);
    setBusy(true);
    try {
      await api.post(`/api/v1/events/${eventId}/complimentary`, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        note: note.trim(),
      });
      setName(""); setEmail(""); setPhone(""); setNote("");
      await load();
    } catch (e) {
      setAddErr(e instanceof ApiError ? e.message : "Gagal menambah.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(personId: string) {
    if (!window.confirm("Hapus dari daftar peserta gratis?")) return;
    try {
      await api.delete(`/api/v1/events/${eventId}/complimentary/${personId}`);
      await load();
    } catch {
      setErr("Gagal menghapus.");
    }
  }

  if (err && !persons) return <Alert variant="danger">{err}</Alert>;

  return (
    <div>
      {err && <Alert variant="danger" className="mb-4">{err}</Alert>}
      {persons && persons.length === 0 ? (
        <p style={{ fontSize: 15, color: "var(--color-ink-3)", marginBottom: 16 }}>
          Belum ada peserta gratis. Tambahkan email di bawah.
        </p>
      ) : persons ? (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {persons.map((p) => (
            <li
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-sm)",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>{p.email}{p.phone ? ` · ${p.phone}` : ""}</div>
                {p.note && <div style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 2 }}>{p.note}</div>}
              </div>
              <button
                type="button"
                onClick={() => remove(p.id)}
                style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 14, flexShrink: 0 }}
              >
                Hapus
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      )}

      {addErr && <Alert variant="danger" className="mb-3">{addErr}</Alert>}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 1, minWidth: 100 }}>
          <label className="field-label">Nama</label>
          <input className="field-input" placeholder="Nama lengkap" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 2, minWidth: 160 }}>
          <label className="field-label">Email</label>
          <input className="field-input" type="email" placeholder="peserta@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 100 }}>
          <label className="field-label">No. HP (opsional)</label>
          <input className="field-input" placeholder="08xx" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 2, minWidth: 120 }}>
          <label className="field-label">Catatan (opsional)</label>
          <input className="field-input" placeholder="Mis. Sponsor VIP" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Button variant="secondary" size="md" disabled={busy} onClick={add}>
          {busy ? "Menambah…" : "Tambah"}
        </Button>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "10px 14px", fontWeight: 600, color: "var(--color-ink-3)", fontSize: 13 };
const td: React.CSSProperties = { padding: "12px 14px" };

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

  const isDraft = event.status === "draft";
  const isPublished = event.status === "published";
  const terminal = event.status === "cancelled" || event.status === "finished";

  if (terminal && !error) {
    return (
      <p style={{ fontSize: 14, color: "var(--color-ink-3)", marginBottom: 0 }}>
        Tidak ada aksi status yang tersedia untuk event ini.
      </p>
    );
  }

  return (
    <div style={{ padding: "16px 20px", border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-panel)" }}>
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {isDraft && (
          <span style={{ fontSize: 14, color: "var(--color-ink-3)" }}>Draft</span>
        )}
        {isDraft && (
          <Button variant="primary" size="sm" disabled={busy} onClick={() => transition("published", "Publikasikan event ini? Event akan langsung terlihat di marketplace.")}>
            Publikasikan
          </Button>
        )}
        {(isDraft || isPublished) && (
          <Button variant="danger" size="sm" disabled={busy} onClick={() => transition("cancelled", "Batalkan event ini? Tindakan ini tidak dapat dibatalkan.")}>
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
  eventId: string;
  distances: DistanceCategory[];
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [quota, setQuota] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) { setError("Nama jarak wajib diisi."); return; }
    setError(null);
    setBusy(true);
    try {
      await api.post(`/api/v1/events/${eventId}/distances`, { name: name.trim(), quota: Number(quota) || 0 });
      setName("");
      setQuota("0");
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah jarak.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(did: string) {
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
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {distances.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)", fontSize: 15, marginBottom: 16 }}>Belum ada kategori jarak.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {distances.map((d) => (
            <li key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "1px solid var(--color-line)", borderRadius: "var(--radius-sm)" }}>
              <span style={{ fontSize: 15 }}>{d.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-ink-3)" }}>{formatNumber(d.quota_used)}/{formatNumber(d.quota)}</span>
                <button type="button" onClick={() => remove(d.id)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 14 }}>Hapus</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 1, minWidth: 100 }}>
          <label className="field-label">Nama Jarak</label>
          <input className="field-input" placeholder="Mis. 5K" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field" style={{ width: 90 }}>
          <label className="field-label">Kuota</label>
          <input className="field-input" type="text" inputMode="numeric" value={formatNumberInput(quota)} onChange={(e) => setQuota(parseNumberInput(e.target.value))} />
        </div>
        <Button variant="secondary" size="md" disabled={busy} onClick={add}>Tambah</Button>
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
  eventId: string;
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

  const distanceName = (id: string) => distances.find((d) => d.id === id)?.name ?? "—";

  async function add() {
    if (!name.trim()) { setError("Nama tiket wajib diisi."); return; }
    if (!distanceId) { setError("Pilih kategori jarak untuk tiket ini."); return; }
    setError(null);
    setBusy(true);
    try {
      await api.post(`/api/v1/events/${eventId}/tickets`, {
        name: name.trim(),
        price: Number(price) || 0,
        quota: Number(quota) || 0,
        distance_category_id: distanceId,
      });
      setName(""); setPrice("0"); setQuota("0"); setDistanceId("");
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah tiket.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(tid: string) {
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
    return <p style={{ color: "var(--color-ink-3)", fontSize: 15 }}>Tambahkan kategori jarak terlebih dahulu.</p>;
  }

  return (
    <div>
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {tickets.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)", fontSize: 15, marginBottom: 16 }}>Belum ada kategori tiket.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {tickets.map((t) => (
            <li key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "1px solid var(--color-line)", borderRadius: "var(--radius-sm)" }}>
              <span style={{ fontSize: 15 }}>
                {t.name}
                <span style={{ color: "var(--color-ink-3)", fontSize: 13 }}> · {distanceName(t.distance_category_id)}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{formatRupiah(t.price)}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-ink-3)" }}>{formatNumber(t.quota_used)}/{formatNumber(t.quota)}</span>
                <button type="button" onClick={() => remove(t.id)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 14 }}>Hapus</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 1, minWidth: 100 }}>
          <label className="field-label">Nama Tiket</label>
          <input className="field-input" placeholder="Mis. Early Bird" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field" style={{ width: 130 }}>
          <label className="field-label">Jarak</label>
          <select className="field-input" value={distanceId} onChange={(e) => setDistanceId(e.target.value)}>
            <option value="">Pilih jarak</option>
            {distances.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="field" style={{ width: 120 }}>
          <label className="field-label">Harga (Rp)</label>
          <input className="field-input" type="text" inputMode="numeric" value={formatNumberInput(price)} onChange={(e) => setPrice(parseNumberInput(e.target.value))} />
        </div>
        <div className="field" style={{ width: 90 }}>
          <label className="field-label">Kuota</label>
          <input className="field-input" type="text" inputMode="numeric" value={formatNumberInput(quota)} onChange={(e) => setQuota(parseNumberInput(e.target.value))} />
        </div>
        <Button variant="secondary" size="md" disabled={busy} onClick={add}>Tambah</Button>
      </div>
      <p style={{ fontSize: 13, color: "var(--color-ink-3)", marginTop: 10 }}>
        Kuota tiket tidak boleh melebihi kuota jarak yang dipilih (divalidasi server).
      </p>
    </div>
  );
}
