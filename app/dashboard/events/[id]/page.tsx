"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import {
  formatRupiah,
  formatNumber,
  formatNumberInput,
  parseNumberInput,
  formatDate,
} from "@/lib/format";
import EventCard from "@/components/ui/EventCard";
import { eventStatusDisplay } from "@/lib/event-status";
import EventForm, {
  EventFormValues,
  RegistrationFieldPreview,
} from "@/components/EventForm";
import EventDetailView from "@/components/EventDetailView";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { confirm } from "@/components/ui/ConfirmDialog";
import DataTable, { Column } from "@/components/ui/DataTable";
import type {
  ApiResponse,
  BibGenerationStrategy,
  BibResult,
  ComplimentaryPerson,
  Category,
  DonationLedgerEntry,
  DonationReport,
  Event,
  EventDashboard,
  EventDetail,
  EventStatus,
  ParticipantRow,
  PublicEventDetail,
  RecapRow,
  Refund,
  TicketCategory,
} from "@/lib/types.gen";

type Tab = "detail" | "kategori" | "peserta" | "keuangan" | "refund" | "komunikasi";

const BASE_TABS: { id: Tab; label: string }[] = [
  { id: "detail", label: "Detail Event" },
  { id: "kategori", label: "Kategori" },
  { id: "peserta", label: "Peserta" },
  { id: "keuangan", label: "Keuangan" },
  { id: "komunikasi", label: "Komunikasi" },
];

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const eventId = id;

  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Live values from the edit form, feeding the marketplace-card preview.
  const [formPreview, setFormPreview] = useState<EventFormValues | null>(null);
  const [registrationFieldsPreview, setRegistrationFieldsPreview] = useState<
    RegistrationFieldPreview[]
  >([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("detail");

  const load = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<EventDetail>>(
        `/api/v1/events/${eventId}`,
      );
      setDetail(res.data);
    } catch {
      setLoadError(
        "Gagal memuat event. Mungkin event tidak ditemukan atau bukan milik Anda.",
      );
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
      event_type: values.event_type,
      master_age_threshold: values.master_age_threshold,
      refund_cutoff_date: values.refund_cutoff_date || undefined,
      registration_close_date: values.registration_close_date || undefined,
      donation_enabled: values.donation_enabled,
      refund_donation_on_cancel: values.refund_donation_on_cancel,
      color: values.color,
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
          style={{
            fontSize: 14,
            color: "var(--color-ink-3)",
            display: "inline-block",
            marginBottom: 16,
          }}
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
    <div className="rh-reveal" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 6,
        }}
      >
        <Link
          href="/dashboard/events"
          style={{ fontSize: 14, color: "var(--color-ink-3)" }}
        >
          ← Event Saya
        </Link>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 30,
            fontWeight: 700,
            margin: 0,
          }}
        >
          {event.name}
        </h1>
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
      <div
        className="event-tabs"
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--color-line)",
          marginTop: 24,
          marginBottom: 0,
        }}
      >
        {[
          ...BASE_TABS,
          ...(event.status === "cancelled"
            ? [{ id: "refund" as Tab, label: "Refund" }]
            : []),
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className="event-tab"
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "11px 26px",
              fontSize: 15,
              fontWeight: activeTab === t.id ? 600 : 400,
              color:
                activeTab === t.id
                  ? "var(--color-flame)"
                  : "var(--color-ink-2)",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === t.id
                  ? "2px solid var(--color-flame)"
                  : "2px solid transparent",
              cursor: "pointer",
              marginBottom: -1,
              transition: "color 0.15s",
            }}
          >
            {t.id === "peserta" && event.event_type === "running"
              ? "Peserta & BIB"
              : t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div style={{ paddingTop: 28 }}>
        {activeTab === "detail" && (
          <div
            style={{
              display: "flex",
              gap: 28,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 420px", maxWidth: 720 }}>
              <BannerUploader
                event={event}
                onUploaded={(ev) =>
                  setDetail((prev) => (prev ? { ...prev, event: ev } : prev))
                }
              />
              <EventForm
                eventId={eventId}
                submitLabel="Simpan Perubahan"
                initial={{
                  name: event.name,
                  description: event.description,
                  location: event.location,
                  event_date: event.event_date,
                  event_type: event.event_type,
                  master_age_threshold: event.master_age_threshold,
                  refund_cutoff_date: event.refund_cutoff_date ?? "",
                  registration_close_date: event.registration_close_date ?? "",
                  donation_enabled: event.donation_enabled,
                  refund_donation_on_cancel:
                    event.refund_donation_on_cancel ?? false,
                  color: event.color,
                }}
                onSubmit={handleUpdate}
                onChange={setFormPreview}
                onRegistrationFieldsChange={setRegistrationFieldsPreview}
              />
            </div>
            <CardPreview
              detail={detail}
              live={formPreview}
              registrationFields={registrationFieldsPreview}
            />
          </div>
        )}

        {activeTab === "kategori" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                padding: 28,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 20,
                  marginTop: 0,
                }}
              >
                {event.event_type === "running" ? "Kategori Jarak" : "Kategori"}
              </h2>
              <DistanceManager
                eventId={eventId}
                distances={detail.categories}
                onChanged={load}
              />
            </div>
            <div
              style={{
                padding: 28,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 20,
                  marginTop: 0,
                }}
              >
                Kategori Tiket
              </h2>
              <TicketManager
                eventId={eventId}
                distances={detail.categories}
                tickets={detail.ticket_categories}
                onChanged={load}
              />
            </div>
          </div>
        )}

        {activeTab === "peserta" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <RegistrationStatusCard
              event={event}
              eventId={eventId}
              onChanged={load}
            />
            {event.event_type === "running" && (
              <RPCAccessCard eventId={eventId} />
            )}
            <div
              style={{
                padding: 28,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 8,
                  marginTop: 0,
                }}
              >
                Daftar Peserta Gratis
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--color-ink-3)",
                  marginTop: 0,
                  marginBottom: 20,
                }}
              >
                Email yang terdaftar di sini akan mendapat tiket gratis (harga =
                0, fee platform = 0) saat mendaftar. Donasi dan fee Midtrans
                tetap berlaku jika peserta memilih berdonasi.
              </p>
              <ComplimentaryManager eventId={eventId} />
            </div>
            {event.event_type === "running" && <div
              style={{
                padding: 28,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 16,
                  marginTop: 0,
                }}
              >
                Nomor BIB
              </h2>
              <BibCard
                eventId={eventId}
                hasCloseDate={!!event.registration_close_date}
                categories={detail.categories}
              />
            </div>}
            <div
              style={{
                padding: 28,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 16,
                  marginTop: 0,
                }}
              >
                Daftar Peserta
              </h2>
              <ParticipantsCard
                eventId={eventId}
                isRunning={event.event_type === "running"}
              />
            </div>
          </div>
        )}

        {activeTab === "refund" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                padding: 28,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 20,
                  marginTop: 0,
                }}
              >
                Status Refund Peserta
              </h2>
              <RefundsCard eventId={eventId} />
            </div>
          </div>
        )}

        {activeTab === "komunikasi" && (
          <div style={{ padding: 28, border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginTop: 0 }}>Email peserta terjadwal</h2>
            <CampaignCard eventId={eventId} />
          </div>
        )}

        {activeTab === "keuangan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                padding: 28,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 20,
                  marginTop: 0,
                }}
              >
                Pendapatan & Donasi
              </h2>
              <DonationReportCard eventId={eventId} />
            </div>
            <div
              style={{
                padding: 28,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 20,
                  marginTop: 0,
                }}
              >
                Ringkasan
              </h2>
              <DashboardCard eventId={eventId} />
            </div>
            <div
              style={{
                padding: 28,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 20,
                  marginTop: 0,
                }}
              >
                Rekap per Kategori
              </h2>
              <RecapTable eventId={eventId} />
            </div>
            <div
              style={{
                padding: 28,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 20,
                  marginTop: 0,
                }}
              >
                Wallet Donasi
              </h2>
              <DonationLedgerCard eventId={eventId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type EmailCampaign = { id: string; subject: string; content: string; audience: "paid" | "pending_payment"; send_at: string; status: string };
function CampaignCard({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<EmailCampaign[]>([]); const [subject,setSubject]=useState(""); const [content,setContent]=useState(""); const [audience,setAudience]=useState<EmailCampaign["audience"]>("paid"); const [sendAt,setSendAt]=useState(""); const [error,setError]=useState<string|null>(null);
  const load = useCallback(async()=>{ try { const r=await api.get<ApiResponse<EmailCampaign[]>>(`/api/v1/events/${eventId}/email-campaigns`);setItems(r.data??[]);}catch(e){setError(e instanceof ApiError?e.message:"Gagal memuat kampanye.");}},[eventId]);
  useEffect(()=>{const timer=window.setTimeout(()=>{void load();},0);return()=>window.clearTimeout(timer);},[load]);
  async function create(){setError(null);try{await api.post(`/api/v1/events/${eventId}/email-campaigns`,{subject,content,audience,send_at:new Date(sendAt).toISOString()});setSubject("");setContent("");setSendAt("");await load();}catch(e){setError(e instanceof ApiError?e.message:"Kampanye gagal dijadwalkan.");}}
  async function cancel(id:string){try{await api.delete(`/api/v1/events/${eventId}/email-campaigns/${id}`);await load();}catch(e){setError(e instanceof ApiError?e.message:"Tidak dapat membatalkan kampanye.");}}
  return <div>{error&&<Alert variant="danger" className="mb-4">{error}</Alert>}<div style={{display:"grid",gap:12,maxWidth:680}}><input className="field-input" placeholder="Subjek email" value={subject} onChange={e=>setSubject(e.target.value)}/><textarea className="field-input" placeholder="Informasi untuk peserta" value={content} onChange={e=>setContent(e.target.value)} style={{minHeight:110}}/><div style={{display:"flex",gap:12,flexWrap:"wrap"}}><select className="field-input" value={audience} onChange={e=>setAudience(e.target.value as EmailCampaign["audience"])} style={{maxWidth:220}}><option value="paid">Peserta lunas</option><option value="pending_payment">Menunggu pembayaran</option></select><input className="field-input" type="datetime-local" value={sendAt} onChange={e=>setSendAt(e.target.value)} style={{maxWidth:240}}/><Button variant="primary" onClick={create} disabled={!subject||!content||!sendAt}>Jadwalkan</Button></div></div><div style={{marginTop:24,display:"grid",gap:8}}>{items.map(c=><div key={c.id} style={{padding:12,border:"1px solid var(--color-line)",borderRadius:"var(--radius-sm)",display:"flex",justifyContent:"space-between",gap:12}}><span><b>{c.subject}</b><br/><small>{c.audience==="paid"?"Peserta lunas":"Menunggu pembayaran"} · {new Date(c.send_at).toLocaleString("id-ID")} · {c.status}</small></span>{c.status==="scheduled"&&<Button variant="ghost" size="sm" onClick={()=>cancel(c.id)}>Batalkan</Button>}</div>)}</div></div>;
}

function RPCAccessCard({ eventId }: { eventId: string }) {
  const [code,setCode]=useState<string|null>(null);const [active,setActive]=useState(false);const [error,setError]=useState<string|null>(null);
  const load=useCallback(async()=>{try{const r=await api.get<ApiResponse<{active:boolean;access_code:string}>>(`/api/v1/events/${eventId}/rpc-access`);setActive(r.data.active);setCode(r.data.access_code||null)}catch(e){setError(e instanceof ApiError?e.message:"Gagal memuat kode akses.")}},[eventId]);
  useEffect(()=>{const timer=window.setTimeout(()=>{void load();},0);return()=>window.clearTimeout(timer);},[load]);
  async function rotate(){try{const r=await api.post<ApiResponse<{access_code:string}>>(`/api/v1/events/${eventId}/rpc-access/rotate`);setCode(r.data.access_code);setActive(true);setError(null)}catch(e){setError(e instanceof ApiError?e.message:"Gagal membuat kode akses.")}}
  async function revoke(){try{await api.delete(`/api/v1/events/${eventId}/rpc-access`);setCode(null);setActive(false)}catch(e){setError(e instanceof ApiError?e.message:"Gagal mencabut akses.")}}
  return <div style={{padding:20,border:"1px solid var(--color-line)",borderRadius:"var(--radius-md)",background:"var(--color-surface)"}}><h2 style={{fontFamily:"var(--font-display)",fontSize:18,margin:"0 0 8px"}}>Akses volunteer RPC</h2><p style={{fontSize:13,color:"var(--color-ink-3)",margin:"0 0 16px"}}>Satu kode aktif untuk satu event. Kode hanya berlaku di <code>/rpc/volunteer</code> dan tidak memberi akses wallet atau dashboard.</p>{error&&<Alert variant="danger" className="mb-3">{error}</Alert>}{code&&<p style={{padding:12,margin:"0 0 16px",background:"var(--color-panel)",borderRadius:8,fontFamily:"var(--font-mono)",wordBreak:"break-all"}}>Kode: <b>{code}</b></p>}{active&&!code&&<p style={{fontSize:13,color:"var(--color-ink-3)",margin:"0 0 16px"}}>Kode lama aktif tetapi tidak dapat ditampilkan kembali. Putar kode untuk membuat kode baru.</p>}<div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Button variant="secondary" onClick={rotate}>{active?"Putar kode":"Buat kode akses"}</Button>{active&&<Button variant="danger" onClick={revoke}>Cabut akses</Button>}</div></div>;
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
  const closeDateStr =
    event.registration_close_date ?? event.event_date ?? null;
  const closeDate = closeDateStr ? new Date(closeDateStr) : null;
  const isClosed = !!closeDate && closeDate <= new Date();

  async function closeNow() {
    if (
      !(await confirm({
        message:
          "Tutup pendaftaran sekarang? Peserta baru tidak dapat mendaftar setelah ini.",
        variant: "primary",
      }))
    )
      return;
    setBusy(true);
    setErr(null);
    try {
      await api.put<ApiResponse<Event>>(`/api/v1/events/${eventId}`, {
        name: event.name,
        description: event.description,
        location: event.location,
        event_date: event.event_date,
        event_type: event.event_type,
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
        {err && (
          <div
            style={{ fontSize: 13, color: "var(--color-danger)", marginTop: 4 }}
          >
            {err}
          </div>
        )}
      </div>
      {!isClosed && (
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={closeNow}
        >
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
        const res = await api.get<ApiResponse<EventDashboard>>(
          `/api/v1/events/${eventId}/dashboard`,
        );
        if (!cancelled) setD(res.data);
      } catch {
        /* non-fatal */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (!d)
    return <p style={{ color: "var(--color-ink-3)" }}>Memuat ringkasan…</p>;

  const cells: { label: string; value: string }[] = [
    { label: "Peserta Berbayar", value: String(d.paid_count) },
    { label: "Pendapatan Tiket", value: formatRupiah(d.ticket_revenue) },
    { label: "Donasi", value: formatRupiah(d.donation_total) },
    { label: "Saldo Wallet", value: formatRupiah(d.wallet_balance) },
    { label: "Racepack Sudah Diambil", value: String(d.rpc_collected) },
    { label: "Racepack Belum Diambil", value: String(d.rpc_pending) },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {cells.map((c) => (
        <div key={c.label}>
          <div
            style={{
              fontSize: 13,
              color: "var(--color-ink-3)",
              marginBottom: 4,
            }}
          >
            {c.label}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {c.value}
          </div>
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
        const res = await api.get<ApiResponse<RecapRow[]>>(
          `/api/v1/events/${eventId}/recap`,
        );
        if (!cancelled) setRows(res.data ?? []);
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (!rows)
    return <p style={{ color: "var(--color-ink-3)" }}>Memuat rekap…</p>;
  if (rows.length === 0)
    return (
      <p style={{ color: "var(--color-ink-3)", fontSize: 15 }}>
        Belum ada peserta berbayar untuk direkap.
      </p>
    );

  const cols: Column<RecapRow>[] = [
    { key: "distance", header: "Kategori", render: (r) => r.category_name },
    { key: "gender", header: "Gender", render: (r) => r.gender || "—" },
    { key: "age", header: "Kelas", render: (r) => r.age_class || "—" },
    { key: "total", header: "Jumlah", render: (r) => r.total, mono: true },
  ];
  return (
    <DataTable
      columns={cols}
      data={rows}
      keyFn={(r) => `${r.category_id}-${r.gender}-${r.age_class}`}
    />
  );
}

// BibCard generates the BIB batch (FR-1301..1305) with regeneration confirmation.
function BibCard({
  eventId,
  hasCloseDate,
  categories,
}: {
  eventId: string;
  hasCloseDate: boolean;
  categories: Category[];
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [strategy, setStrategy] = useState<BibGenerationStrategy>("all");

  const strategyCopy: Record<
    BibGenerationStrategy,
    { label: string; preview: string; description: string }
  > = {
    all: {
      label: "Semua peserta",
      preview: "0001, 0002, 0003, …",
      description: "Satu urutan untuk seluruh peserta, tanpa pemisahan.",
    },
    category: {
      label: "Kategori",
      preview: "01-0001, 02-0001, …",
      description:
        "Setiap kategori mendapat urutan sendiri. Kode 01, 02, dan seterusnya mengikuti urutan kategori dibuat.",
    },
    gender: {
      label: "Gender",
      preview: "M-0001, F-0001, O-0001, …",
      description:
        "M untuk male, F untuk female, dan O untuk nilai gender lainnya.",
    },
    category_gender: {
      label: "Kategori + Gender",
      preview: "01-M-0001, 01-F-0001, 02-M-0001, …",
      description:
        "Paling tepat untuk membedakan peserta seperti 5K Male, 5K Female, 10K Male, dan 10K Female.",
    },
  };

  async function generate(regenerate: boolean) {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const res = await api.post<ApiResponse<BibResult>>(
        `/api/v1/events/${eventId}/bibs/generate${regenerate ? "?regenerate=true" : ""}`,
        { strategy },
      );
      setMsg(
        `${res.data.generated} nomor BIB berhasil dibuat dengan pola ${strategyCopy[res.data.strategy].preview}`,
      );
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        if (
          e.message.toLowerCase().includes("already") ||
          e.message.toLowerCase().includes("sudah dibuat") ||
          e.message.toLowerCase().includes("regenerat")
        ) {
          if (
            await confirm({
              message:
                "Nomor BIB sudah pernah dibuat. Buat ulang dari awal? Nomor lama akan ditimpa.",
              variant: "danger",
            })
          ) {
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
      <p
        style={{
          fontSize: 14,
          color: "var(--color-ink-3)",
          marginTop: 0,
          marginBottom: 16,
        }}
      >
        Pilih pola nomor BIB, lalu sistem mengurutkan peserta berdasarkan waktu
        pendaftaran di dalam setiap kelompok. Hanya bisa dibuat{" "}
        <b>setelah pendaftaran ditutup</b>.
        {!hasCloseDate &&
          ' Atur "Penutupan Pendaftaran" di tab Detail, atau ini memakai tanggal event.'}
      </p>
      {msg && (
        <Alert variant="info" className="mb-4">
          {msg}
        </Alert>
      )}
      {err && (
        <Alert variant="danger" className="mb-4">
          {err}
        </Alert>
      )}
      <div
        style={{
          maxWidth: 620,
          marginBottom: 20,
          overflow: "hidden",
          border: "1px solid var(--color-line-2)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-surface)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 16,
            padding: 16,
          }}
        >
          <div style={{ flex: "1 1 220px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "inline-grid",
                  width: 25,
                  height: 25,
                  placeItems: "center",
                  borderRadius: "var(--radius-xs)",
                  background: "var(--color-flame-tint)",
                  color: "var(--color-flame-700)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                BIB
              </span>
              <label
                htmlFor="bib-strategy"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                Pola penomoran
              </label>
            </div>
            <p
              style={{
                margin: 0,
                color: "var(--color-ink-3)",
                fontSize: 13,
              }}
            >
              Tentukan pembeda peserta saat race day.
            </p>
          </div>
          <div style={{ position: "relative", flex: "1 1 250px" }}>
            <select
              id="bib-strategy"
              className="field-input"
              value={strategy}
              disabled={busy}
              onChange={(e) =>
                setStrategy(e.target.value as BibGenerationStrategy)
              }
              style={{
                appearance: "none",
                minHeight: 48,
                paddingRight: 42,
                borderColor: "var(--color-ink)",
                fontFamily: "var(--font-display)",
                fontSize: 16,
                fontWeight: 700,
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              {Object.entries(strategyCopy).map(([value, copy]) => (
                <option key={value} value={value}>
                  {copy.label}
                </option>
              ))}
            </select>
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "50%",
                right: 15,
                transform: "translateY(-58%)",
                color: "var(--color-flame)",
                fontSize: 22,
                fontWeight: 700,
                pointerEvents: "none",
              }}
            >
              ⌄
            </span>
          </div>
        </div>
        <div
          style={{
            padding: "12px 16px 14px",
            borderTop: "1px solid var(--color-line)",
            background: "var(--color-panel)",
            color: "var(--color-ink-2)",
            fontSize: 14,
          }}
        >
          <div style={{ marginBottom: 3, fontSize: 12, fontWeight: 700 }}>
            FORMAT YANG AKAN DIBUAT
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--color-ink)",
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {strategyCopy[strategy].preview}
          </div>
          <span>{strategyCopy[strategy].description}</span>
          {(strategy === "category" || strategy === "category_gender") &&
            categories.length > 0 && (
              <div style={{ marginTop: 8 }}>
                Kode kategori: {categories.map((category, index) => (
                  <span key={category.id} style={{ marginRight: 10 }}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>{" "}
                    {category.name}
                  </span>
                ))}
              </div>
            )}
        </div>
      </div>
      <Button
        variant="primary"
        size="md"
        disabled={busy}
        onClick={() => generate(false)}
      >
        {busy ? "Memproses…" : "Generate Nomor BIB"}
      </Button>
    </div>
  );
}

// ParticipantsCard renders the participant table + CSV export.
function ParticipantsCard({ eventId, isRunning }: { eventId: string; isRunning: boolean }) {
  const [rows, setRows] = useState<ParticipantRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [rpcExporting, setRPCExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<ParticipantRow[]>>(
          `/api/v1/events/${eventId}/participants?limit=200`,
        );
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
      const base = "";
      const res = await fetch(
        `${base}/api/v1/events/${eventId}/participants/export`,
        { credentials: "same-origin" },
      );
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

  async function exportRPCCsv() {
    setErr(null);
    setRPCExporting(true);
    try {
      const base = "";
      const res = await fetch(`${base}/api/v1/events/${eventId}/rpc/export`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekap-rpc-event-${eventId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setErr("Gagal mengekspor rekap RPC. Coba lagi.");
    } finally {
      setRPCExporting(false);
    }
  }

  const runningCols: Column<ParticipantRow>[] = isRunning ? [
    {
      key: "bib",
      header: "BIB",
      render: (r) => r.bib_number || "—",
      bibcol: true,
    },
    {
      key: "reg",
      header: "No. Reg",
      render: (r) => r.registration_number,
      mono: true,
    },
    { key: "name", header: "Nama", render: (r) => r.name },
    { key: "distance", header: "Kategori", render: (r) => r.category_name },
    { key: "ticket", header: "Tiket", render: (r) => r.ticket_name },
    { key: "gender", header: "Gender", render: (r) => r.gender || "—" },
    { key: "age", header: "Kelas", render: (r) => r.age_class || "—" },
    {
      key: "rpc",
      header: "RPC",
      render: (r) =>
        r.rpc_status ? (
          <Badge variant="ok">✓</Badge>
        ) : (
          <span style={{ color: "var(--color-ink-3)" }}>—</span>
        ),
    },
    {
      key: "raceday",
      header: "Hari-H",
      render: (r) =>
        r.raceday_status ? (
          <Badge variant="ok">✓</Badge>
        ) : (
          <span style={{ color: "var(--color-ink-3)" }}>—</span>
        ),
    },
  ] : [];
  const cols: Column<ParticipantRow>[] = [
    ...runningCols.slice(0, 1),
    { key: "reg", header: "No. Reg", render: (r) => r.registration_number, mono: true },
    { key: "name", header: "Nama", render: (r) => r.name },
    { key: "distance", header: "Kategori", render: (r) => r.category_name },
    { key: "ticket", header: "Tiket", render: (r) => r.ticket_name },
    ...runningCols.slice(5),
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <span style={{ fontSize: 14, color: "var(--color-ink-3)" }}>
          {rows ? `${rows.length} peserta ditampilkan` : "Memuat…"}
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isRunning && <Button
            variant="secondary"
            size="sm"
            disabled={rpcExporting}
            onClick={exportRPCCsv}
          >
            {rpcExporting ? "Mengekspor…" : "Download Rekap RPC"}
          </Button>}
          <Button
            variant="secondary"
            size="sm"
            disabled={exporting}
            onClick={exportCsv}
          >
            {exporting ? "Mengekspor…" : "Export CSV"}
          </Button>
        </div>
      </div>
      {err && (
        <Alert variant="danger" className="mb-4">
          {err}
        </Alert>
      )}
      {rows && rows.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)", fontSize: 15 }}>
          Belum ada peserta.
        </p>
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
        const res = await api.get<ApiResponse<DonationReport>>(
          `/api/v1/events/${eventId}/donations`,
        );
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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div
          style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 4 }}
        >
          Pendapatan Tiket
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          {formatRupiah(report.ticket_revenue)}
        </div>
      </div>
      <div>
        <div
          style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 4 }}
        >
          Total Donasi (terpisah)
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 26,
            fontWeight: 700,
            color: "var(--color-sprint)",
          }}
        >
          {formatRupiah(report.donation_total)}
        </div>
        <div
          style={{ fontSize: 13, color: "var(--color-ink-3)", marginTop: 6 }}
        >
          Non-refundable, tetap disalurkan.
        </div>
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
        const res = await api.get<ApiResponse<DonationLedgerEntry[]>>(
          `/api/v1/events/${eventId}/donations/ledger`,
        );
        if (!cancelled) setEntries(res.data ?? []);
      } catch {
        if (!cancelled) setErr("Gagal memuat ledger donasi.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (err) return <Alert variant="danger">{err}</Alert>;
  if (!entries) return <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>;

  const total = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <p
        style={{
          fontSize: 14,
          color: "var(--color-ink-3)",
          marginTop: 0,
          marginBottom: 16,
        }}
      >
        Donasi yang sudah settled dari peserta. Pisah dari pendapatan tiket dan
        tidak bisa di-withdraw — disalurkan ke penerima donasi.
      </p>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 4 }}
        >
          Total Donasi Settled
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 26,
            fontWeight: 700,
            color: "var(--color-sprint)",
          }}
        >
          {formatRupiah(total)}
        </div>
      </div>
      {entries.length === 0 ? (
        <p style={{ fontSize: 15, color: "var(--color-ink-3)" }}>
          Belum ada donasi yang masuk.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 560,
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid var(--color-line)",
                  textAlign: "left",
                }}
              >
                <th style={th}>Referensi</th>
                <th style={{ ...th, textAlign: "right" }}>Nominal</th>
                <th style={th}>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  style={{ borderBottom: "1px solid var(--color-line)" }}
                >
                  <td style={td}>
                    <code style={{ fontSize: 12 }}>{e.reference_id}</code>
                  </td>
                  <td
                    style={{
                      ...td,
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-sprint)",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      width: 150,
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span>+Rp</span>
                      <span>{formatNumber(e.amount)}</span>
                    </span>
                  </td>
                  <td style={{ ...td, color: "var(--color-ink-3)" }}>
                    {e.created_at
                      ? new Date(e.created_at).toLocaleString("id-ID")
                      : "—"}
                  </td>
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
        const res = await api.get<ApiResponse<Refund[]>>(
          `/api/v1/events/${eventId}/refunds`,
        );
        if (!cancelled) setRefunds(res.data ?? []);
      } catch {
        if (!cancelled) setErr("Gagal memuat data refund.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const REFUND_STATUS: Record<
    string,
    { label: string; variant: "ok" | "warn" | "danger" }
  > = {
    completed: { label: "Selesai", variant: "ok" },
    processing: { label: "Diproses", variant: "warn" },
    rejected: { label: "Ditolak", variant: "danger" },
  };

  if (err) return <Alert variant="danger">{err}</Alert>;
  if (!refunds) return <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>;
  if (refunds.length === 0)
    return (
      <p style={{ color: "var(--color-ink-3)", fontSize: 15 }}>
        Belum ada refund untuk event ini.
      </p>
    );

  const done = refunds.filter((r) => r.status === "completed").length;
  const processing = refunds.filter((r) => r.status === "processing").length;

  return (
    <div>
      <div style={{ display: "flex", gap: 32, marginBottom: 24 }}>
        <div>
          <div
            style={{
              fontSize: 13,
              color: "var(--color-ink-3)",
              marginBottom: 4,
            }}
          >
            Total Refund
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 24,
            }}
          >
            {refunds.length}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              color: "var(--color-ink-3)",
              marginBottom: 4,
            }}
          >
            Selesai
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 24,
              color: "var(--color-sprint)",
            }}
          >
            {done}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              color: "var(--color-ink-3)",
              marginBottom: 4,
            }}
          >
            Menunggu
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 24,
              color: "var(--color-warn)",
            }}
          >
            {processing}
          </div>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "2px solid var(--color-line)",
                textAlign: "left",
              }}
            >
              <th style={th}>Reg. ID</th>
              <th style={th}>Nominal</th>
              <th style={th}>Metode</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((r) => {
              const s = REFUND_STATUS[r.status] ?? {
                label: r.status,
                variant: "warn" as const,
              };
              return (
                <tr
                  key={r.id}
                  style={{ borderBottom: "1px solid var(--color-line)" }}
                >
                  <td style={td}>
                    <code style={{ fontSize: 12 }}>
                      {r.registration_id.slice(0, 8)}…
                    </code>
                  </td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)" }}>
                    {formatRupiah(r.amount)}
                  </td>
                  <td style={td}>
                    {r.method} · {r.mode === "auto" ? "Otomatis" : "Manual"}
                  </td>
                  <td style={td}>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </td>
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
      const res = await api.get<ApiResponse<ComplimentaryPerson[]>>(
        `/api/v1/events/${eventId}/complimentary`,
      );
      setPersons(res.data ?? []);
      setErr(null);
    } catch {
      setErr("Gagal memuat daftar peserta gratis.");
    }
  }, [eventId]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      load().catch(() => {});
    });
    return () => {
      cancelAnimationFrame(id);
    };
  }, [load]);

  async function add() {
    if (!name.trim()) {
      setAddErr("Nama wajib diisi.");
      return;
    }
    if (!email.trim()) {
      setAddErr("Email wajib diisi.");
      return;
    }
    setAddErr(null);
    setBusy(true);
    try {
      await api.post(`/api/v1/events/${eventId}/complimentary`, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        note: note.trim(),
      });
      setName("");
      setEmail("");
      setPhone("");
      setNote("");
      await load();
    } catch (e) {
      setAddErr(e instanceof ApiError ? e.message : "Gagal menambah.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(personId: string) {
    if (
      !(await confirm({
        message: "Hapus dari daftar peserta gratis?",
        variant: "danger",
      }))
    )
      return;
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
      {err && (
        <Alert variant="danger" className="mb-4">
          {err}
        </Alert>
      )}
      {persons && persons.length === 0 ? (
        <p
          style={{
            fontSize: 15,
            color: "var(--color-ink-3)",
            marginBottom: 16,
          }}
        >
          Belum ada peserta gratis. Tambahkan email di bawah.
        </p>
      ) : persons ? (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 16px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
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
                <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
                  {p.email}
                  {p.phone ? ` · ${p.phone}` : ""}
                </div>
                {p.note && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-ink-3)",
                      marginTop: 2,
                    }}
                  >
                    {p.note}
                  </div>
                )}
              </div>
              {p.registered ? (
                <Badge variant="ok">Sudah mendaftar</Badge>
              ) : (
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-danger)",
                    cursor: "pointer",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  Hapus
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      )}

      {addErr && (
        <Alert variant="danger" className="mb-3">
          {addErr}
        </Alert>
      )}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div className="field" style={{ flex: 1, minWidth: 100 }}>
          <label className="field-label">Nama</label>
          <input
            className="field-input"
            placeholder="Nama lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: 2, minWidth: 160 }}>
          <label className="field-label">Email</label>
          <input
            className="field-input"
            type="email"
            placeholder="peserta@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 100 }}>
          <label className="field-label">No. HP (opsional)</label>
          <input
            className="field-input"
            placeholder="08xx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: 2, minWidth: 120 }}>
          <label className="field-label">Catatan (opsional)</label>
          <input
            className="field-input"
            placeholder="Mis. Sponsor VIP"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="md" disabled={busy} onClick={add}>
          {busy ? "Menambah…" : "Tambah"}
        </Button>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "10px 14px",
  fontWeight: 600,
  color: "var(--color-ink-3)",
  fontSize: 13,
};
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

  async function transition(
    target: EventStatus,
    confirmMsg?: string,
    variant: "primary" | "danger" = "primary",
  ) {
    if (confirmMsg && !(await confirm({ message: confirmMsg, variant })))
      return;
    setError(null);
    setBusy(true);
    try {
      await api.patch<ApiResponse<Event>>(`/api/v1/events/${event.id}/status`, {
        status: target,
      });
      await onChanged();
      onNotice("Status event diperbarui.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal mengubah status.",
      );
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
    <div
      style={{
        padding: "16px 20px",
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {isDraft && (
          <span style={{ fontSize: 14, color: "var(--color-ink-3)" }}>
            Draft
          </span>
        )}
        {isDraft && (
          <Button
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() =>
              transition(
                "published",
                "Publikasikan event ini? Event akan langsung terlihat di marketplace.",
              )
            }
          >
            Publikasikan
          </Button>
        )}
        {(isDraft || isPublished) && (
          <Button
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={() =>
              transition(
                "cancelled",
                "Batalkan event ini? Tindakan ini tidak dapat dibatalkan.",
                "danger",
              )
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
  eventId: string;
  distances: Category[];
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [quota, setQuota] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuota, setEditQuota] = useState("0");

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditQuota(String(category.quota));
    setError(null);
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.put(`/api/v1/events/${eventId}/categories/${editingId}`, {
        name: editName.trim(),
        quota: Number(editQuota) || 0,
      });
      setEditingId(null);
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memperbarui kategori.");
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    if (!name.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await api.post(`/api/v1/events/${eventId}/categories`, {
        name: name.trim(),
        quota: Number(quota) || 0,
      });
      setName("");
      setQuota("0");
      await onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menambah kategori.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(did: string) {
    if (
      !(await confirm({
        message:
          "Hapus kategori ini? Kategori tiket di dalamnya juga akan ikut terhapus.",
        variant: "danger",
      }))
    )
      return;
    setError(null);
    try {
      await api.delete(`/api/v1/events/${eventId}/categories/${did}`);
      await onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menghapus kategori.",
      );
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
        <p
          style={{
            color: "var(--color-ink-3)",
            fontSize: 15,
            marginBottom: 16,
          }}
        >
          Belum ada kategori.
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {distances.map((d) => (
            <li
              key={d.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {editingId === d.id ? (
                <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
                  <input className="field-input" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ flex: "1 1 180px" }} />
                  <input className="field-input" inputMode="numeric" value={formatNumberInput(editQuota)} onChange={(e) => setEditQuota(parseNumberInput(e.target.value))} style={{ width: 100 }} aria-label="Kuota kategori" />
                  <Button variant="secondary" size="sm" disabled={busy} onClick={saveEdit}>Simpan</Button>
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => setEditingId(null)}>Batal</Button>
                </div>
              ) : <span style={{ fontSize: 15 }}>{d.name}</span>}
              {editingId !== d.id && (
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: "var(--color-ink-3)",
                  }}
                >
                  {formatNumber(d.quota_used)}/{formatNumber(d.quota)}
                </span>
                <button type="button" onClick={() => startEdit(d)} style={{ background: "none", border: "none", color: "var(--color-sprint)", cursor: "pointer", fontSize: 14 }}>Edit</button>
                <button
                  type="button"
                  onClick={() => remove(d.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-danger)",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Hapus
                </button>
              </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div className="field" style={{ flex: 1, minWidth: 100 }}>
          <label className="field-label">Nama Kategori</label>
          <input
            className="field-input"
            placeholder="Mis. 5K"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field" style={{ width: 90 }}>
          <label className="field-label">Kuota</label>
          <input
            className="field-input"
            type="text"
            inputMode="numeric"
            value={formatNumberInput(quota)}
            onChange={(e) => setQuota(parseNumberInput(e.target.value))}
          />
        </div>
        <Button variant="secondary" size="md" disabled={busy} onClick={add}>
          Tambah
        </Button>
      </div>
    </div>
  );
}

// --- Live previews (marketplace card & public detail page) ---

// CardPreview mirrors how the event will appear on the marketplace, updating
// live while the organizer edits the form (name/date/color) or uploads a banner.
// The "Halaman Detail" mode mirrors the public event-detail page layout.
function CardPreview({
  detail,
  live,
  registrationFields,
}: {
  detail: EventDetail;
  live: EventFormValues | null;
  registrationFields: RegistrationFieldPreview[];
}) {
  const [mode, setMode] = useState<"card" | "detail" | "register">("card");
  const ev = detail.event;
  const name = live?.name || ev.name || "Nama Event";
  const location =
    (live ? live.location : ev.location) || "Lokasi belum diatur";
  const eventDate = live ? live.event_date : ev.event_date;
  const isRunning = live
    ? live.event_type === "running"
    : ev.event_type === "running";
  const donationEnabled = live ? live.donation_enabled : ev.donation_enabled;
  const description = live ? live.description : ev.description;
  const color = (live ? live.color : ev.color) || undefined;

  // Display-only mirrors of the marketplace projection (server stays the
  // source of truth for real listings).
  const distances = detail.categories.map((d) => d.name);
  const prices = detail.ticket_categories
    .map((t) => t.price)
    .filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const quotaRemaining = detail.categories.reduce(
    (sum, d) => sum + Math.max(0, d.quota - d.quota_used),
    0,
  );

  // Display-only mirror of the public PublicEventDetail shape, fed with live
  // form values — rendered by the SAME EventDetailView component as
  // /events/{id}, so the preview is pixel-identical to the real page.
  const previewDetail: PublicEventDetail = {
    event: {
      id: ev.id,
      name,
      description,
      location,
      event_date: eventDate || null,
      status: "published",
      event_type: isRunning ? "running" : ev.event_type,
      master_age_threshold: ev.master_age_threshold,
      refund_cutoff_date: ev.refund_cutoff_date,
      donation_enabled: donationEnabled,
      banner_url: ev.banner_url,
      color: color ?? "",
      quota_remaining: quotaRemaining,
      min_price: minPrice,
    },
    categories: detail.categories.map((d) => ({
      id: d.id,
      name: d.name,
      quota: d.quota,
      quota_remaining: Math.max(0, d.quota - d.quota_used),
    })),
    ticket_categories: detail.ticket_categories.filter((t) => t.is_visible).map((t) => ({
      id: t.id,
      category_id: t.category_id,
      name: t.name,
      price: t.price,
      quota: t.quota,
      quota_remaining: Math.max(0, t.quota - t.quota_used),
      sale_start: t.sale_start,
      sale_end: t.sale_end,
    })),
    registration_fields: [],
  };

  const modeBtn = (active: boolean): React.CSSProperties => ({
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid var(--color-line)",
    borderRadius: 999,
    cursor: "pointer",
    backgroundColor: active ? "var(--color-ink)" : "var(--color-surface)",
    color: active ? "#fff" : "var(--color-ink-2)",
  });

  return (
    <aside
      style={
        mode === "card"
          ? { flex: "0 1 400px", minWidth: "min(340px, 100%)", position: "sticky", top: 24 }
          : { flex: "1 1 420px", minWidth: 320 }
      }
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 10,
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-ink-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Pratinjau
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
          <button
            type="button"
            style={modeBtn(mode === "card")}
            onClick={() => setMode("card")}
          >
            Kartu
          </button>
          <button
            type="button"
            style={modeBtn(mode === "detail")}
            onClick={() => setMode("detail")}
          >
            Halaman Detail
          </button>
          <button
            type="button"
            style={modeBtn(mode === "register")}
            onClick={() => setMode("register")}
          >
            Pendaftaran
          </button>
        </div>
      </div>

      {mode === "card" ? (
        <>
          <EventCard
            title={name}
            location={location}
            date={formatDate(eventDate)}
            distances={
              isRunning && distances.length === 0 ? ["Event Lari"] : distances
            }
            price={minPrice > 0 ? formatRupiah(minPrice) : "Gratis"}
            bannerUrl={ev.banner_url}
            color={color}
          />
          <p
            style={{
              fontSize: 12,
              color: "var(--color-ink-3)",
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            Ikut berubah saat Anda mengetik, memilih warna, atau mengunggah
            banner. Harga &amp; kuota mengikuti kategori/tiket yang tersimpan.
          </p>
        </>
      ) : mode === "detail" ? (
        <div
          style={{
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            backgroundColor: "var(--color-paper)",
          }}
        >
          {/* Fake browser bar so it reads as "this is the public page" */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderBottom: "1px solid var(--color-line)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <span style={{ display: "flex", gap: 4 }} aria-hidden>
              <span style={dot} />
              <span style={dot} />
              <span style={dot} />
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--color-ink-3)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              /events/{ev.id}
            </span>
          </div>
          <div className="max-w-3xl mx-auto px-4 py-8">
            <EventDetailView detail={previewDetail} interactive={false} />
          </div>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            backgroundColor: "var(--color-paper)",
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              borderBottom: "1px solid var(--color-line)",
              backgroundColor: "var(--color-surface)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--color-ink-3)",
            }}
          >
            /register/{ev.id}
          </div>
          <div className="max-w-xl mx-auto px-4 py-8">
            <p style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 12 }}>
              ← {name}
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Pendaftaran
            </h2>
            <p style={{ color: "var(--color-ink-3)", marginBottom: 20, fontSize: 14 }}>
              Langkah 2 dari 3
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <RegistrationPreviewField label="Nama Lengkap" placeholder="Nama peserta" />
              <RegistrationPreviewField label="Email" type="email" placeholder="nama@email.com" />
              <RegistrationPreviewField label="No. HP" type="tel" placeholder="08xxxxxxxxxx" />
              <RegistrationPreviewField
                label="Tanggal Lahir"
                type="date"
                hint="Wajib — menentukan kelas usia (Open/Master) otomatis"
              />
              <div className="field">
                <label className="field-label">Jenis Kelamin</label>
                <select className="field-input" disabled value="">
                  <option>Pilih</option>
                </select>
              </div>
              {registrationFields.length > 0 && (
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
                  {registrationFields.map((field, index) => (
                    <RegistrationPreviewCustomField
                      key={field.id ?? `${field.name}-${index}`}
                      field={field}
                    />
                  ))}
                </>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="ghost" size="md" disabled>
                  Kembali
                </Button>
                <Button variant="primary" size="md" style={{ flex: 1 }} disabled>
                  Lanjut
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function RegistrationPreviewField({
  label,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "date" | "number";
  hint?: string;
}) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <input className="field-input" type={type} placeholder={placeholder} readOnly />
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

function RegistrationPreviewCustomField({
  field,
}: {
  field: RegistrationFieldPreview;
}) {
  const label = `${field.label}${field.required ? " *" : ""}`;
  const options = field.options
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);

  if (field.field_type === "textarea") {
    return (
      <div className="field">
        <label className="field-label">{label}</label>
        <textarea className="field-input" placeholder={field.placeholder} readOnly />
      </div>
    );
  }

  if (field.field_type === "select") {
    return (
      <div className="field">
        <label className="field-label">{label}</label>
        <select className="field-input" disabled value="">
          <option>Pilih</option>
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.field_type === "radio") {
    return (
      <div className="field">
        <span className="field-label">{label}</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {options.map((option) => (
            <label key={option} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <input type="radio" name={`preview-${field.name}`} disabled />
              {option}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.field_type === "checkbox") {
    return (
      <label className="field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" disabled />
        <span className="field-label" style={{ margin: 0 }}>{label}</span>
      </label>
    );
  }

  const type =
    field.field_type === "email"
      ? "email"
      : field.field_type === "phone"
        ? "tel"
        : field.field_type === "date"
          ? "date"
          : field.field_type === "number"
            ? "number"
            : "text";
  return <RegistrationPreviewField label={label} placeholder={field.placeholder} type={type} />;
}

const dot: React.CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: "50%",
  backgroundColor: "var(--color-line)",
};

// --- Banner upload ---

const BANNER_MAX_BYTES = 5 * 1024 * 1024; // keep in sync with backend maxBannerBytes
const BANNER_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BANNER_MAX_WIDTH = 1600; // downscale target; banners render at ~1200px wide

// compressBanner downscales to ≤1600px wide and re-encodes as WebP (q0.82)
// before upload, so R2 stores small files. Falls back to the original when
// compression doesn't help (e.g. already-optimized WebP) or the browser can't.
async function compressBanner(f: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(f);
    const scale = Math.min(1, BANNER_MAX_WIDTH / bitmap.width);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return f;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
    if (!blob || blob.size >= f.size) return f;
    return new File([blob], f.name.replace(/\.\w+$/, "") + ".webp", {
      type: "image/webp",
    });
  } catch {
    return f;
  }
}

function formatMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// BannerUploader lets the organizer upload the event banner (stored on R2).
// Shown at the top of the Detail tab as a large click/drop zone so it can't be
// missed. When no banner is set, the marketplace card falls back to the event color.
function BannerUploader({
  event,
  onUploaded,
}: {
  event: Event;
  onUploaded: (ev: Event) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Release the local object URL of the previous preview.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function pick(f: File | null) {
    setNotice(null);
    if (!f) return;
    if (!BANNER_TYPES.includes(f.type)) {
      setError("Format tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return;
    }
    const compressed = await compressBanner(f);
    if (compressed.size > BANNER_MAX_BYTES) {
      setError(
        `Ukuran file ${formatMB(compressed.size)} (setelah kompresi) masih melebihi batas 5 MB.`,
      );
      return;
    }
    setError(null);
    setFile(compressed);
    setPreviewUrl(URL.createObjectURL(compressed));
    if (compressed !== f) {
      setNotice(
        `Gambar dikompresi otomatis: ${formatMB(f.size)} → ${formatMB(compressed.size)}.`,
      );
    }
  }

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.postForm<ApiResponse<Event>>(
        `/api/v1/events/${event.id}/banner`,
        form,
      );
      onUploaded(res.data);
      reset();
      setNotice(
        "Banner tersimpan. Kartu marketplace & halaman detail langsung memakainya.",
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal mengunggah banner.",
      );
    } finally {
      setBusy(false);
    }
  }

  // Zone background: pending local preview → current banner → color placeholder.
  const shownImage = previewUrl ?? event.banner_url;

  return (
    <div
      style={{
        marginBottom: 28,
        padding: 20,
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 17,
          fontWeight: 600,
          margin: "0 0 4px",
        }}
      >
        Banner Event
      </h2>
      <p
        style={{
          fontSize: 13,
          color: "var(--color-ink-3)",
          margin: "0 0 12px",
        }}
      >
        Gambar utama di kartu marketplace &amp; halaman detail. Tanpa banner,
        warna header kartu yang dipakai.
      </p>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      {notice && (
        <Alert variant="info" className="mb-4">
          {notice}
        </Alert>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={BANNER_TYPES.join(",")}
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
        style={{ display: "none" }}
      />

      {/* Click / drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Pilih atau seret gambar banner"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
        style={{
          position: "relative",
          height: 180,
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          cursor: "pointer",
          border: dragging
            ? "2px dashed var(--color-flame)"
            : shownImage
              ? "1px solid var(--color-line)"
              : "2px dashed var(--color-line)",
          background: shownImage
            ? `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.35)), url(${shownImage}) center/cover no-repeat`
            : event.color
              ? `linear-gradient(135deg, ${event.color}22, ${event.color}44)`
              : "var(--color-paper)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          textAlign: "center",
          padding: 16,
        }}
      >
        <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>
          🖼️
        </span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: shownImage ? "#fff" : "var(--color-ink-2)",
            textShadow: shownImage ? "0 1px 3px rgba(0,0,0,0.6)" : undefined,
          }}
        >
          {previewUrl
            ? "Pratinjau — klik “Simpan Banner” untuk menyimpan"
            : event.banner_url
              ? "Klik atau seret gambar baru ke sini untuk mengganti banner"
              : "Klik atau seret gambar ke sini untuk mengunggah banner"}
        </span>
        <span
          style={{
            fontSize: 12,
            color: shownImage ? "rgba(255,255,255,0.9)" : "var(--color-ink-3)",
            textShadow: shownImage ? "0 1px 3px rgba(0,0,0,0.6)" : undefined,
          }}
        >
          JPG / PNG / WebP · maks 5 MB · saran 1200×400 px (rasio 3:1)
        </span>
      </div>

      {previewUrl && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Button variant="primary" size="md" disabled={busy} onClick={upload}>
            {busy ? "Mengunggah…" : "Simpan Banner"}
          </Button>
          <Button variant="ghost" size="md" disabled={busy} onClick={reset}>
            Batal
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Ticket category management ---

// Convert an RFC3339 string to a value usable by <input type="datetime-local">.
function toLocalInput(rfc3339: string | null): string {
  if (!rfc3339) return "";
  const d = new Date(rfc3339);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Convert a datetime-local value to an RFC3339 string (UTC). Empty in → empty out (server treats as NULL).
function toRFC3339(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isExpired(saleEnd: string | null): boolean {
  return !!saleEnd && new Date(saleEnd).getTime() < Date.now();
}

function TicketManager({
  eventId,
  distances,
  tickets,
  onChanged,
}: {
  eventId: string;
  distances: Category[];
  tickets: TicketCategory[];
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [quota, setQuota] = useState("0");
  const [distanceId, setDistanceId] = useState("");
  const [saleEnd, setSaleEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("0");
  const [editQuota, setEditQuota] = useState("0");
  const [editDistanceId, setEditDistanceId] = useState("");
  const [editSaleStart, setEditSaleStart] = useState("");
  const [editSaleEnd, setEditSaleEnd] = useState("");

  const distanceName = (id: string) =>
    distances.find((d) => d.id === id)?.name ?? "—";

  async function add() {
    if (!name.trim()) {
      setError("Nama tiket wajib diisi.");
      return;
    }
    if (!distanceId) {
      setError("Pilih kategori untuk tiket ini.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await api.post(`/api/v1/events/${eventId}/tickets`, {
        name: name.trim(),
        price: Number(price) || 0,
        quota: Number(quota) || 0,
        category_id: distanceId,
        sale_end: toRFC3339(saleEnd),
      });
      setName("");
      setPrice("0");
      setQuota("0");
      setDistanceId("");
      setSaleEnd("");
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah tiket.");
    } finally {
      setBusy(false);
    }
  }

  function startTicketEdit(t: TicketCategory) {
    setEditingId(t.id);
    setEditName(t.name);
    setEditPrice(String(t.price));
    setEditQuota(String(t.quota));
    setEditDistanceId(t.category_id);
    setEditSaleStart(toLocalInput(t.sale_start));
    setEditSaleEnd(toLocalInput(t.sale_end));
    setError(null);
  }

  async function saveTicket(t: TicketCategory) {
    if (!editName.trim() || !editDistanceId) {
      setError("Nama tiket dan kategori wajib diisi.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await api.put(`/api/v1/events/${eventId}/tickets/${t.id}`, {
        name: editName.trim(),
        price: Number(editPrice) || 0,
        quota: Number(editQuota) || 0,
        category_id: editDistanceId,
        sale_start: toRFC3339(editSaleStart),
        sale_end: toRFC3339(editSaleEnd),
        is_visible: t.is_visible,
      });
      setEditingId(null);
      await onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal memperbarui tiket.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility(t: TicketCategory) {
    setError(null);
    setBusy(true);
    try {
      await api.put(`/api/v1/events/${eventId}/tickets/${t.id}`, {
        name: t.name,
        price: t.price,
        quota: t.quota,
        category_id: t.category_id,
        sale_start: t.sale_start ?? "",
        sale_end: t.sale_end ?? "",
        is_visible: !t.is_visible,
      });
      await onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal mengubah visibilitas tiket.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(tid: string) {
    if (
      !(await confirm({
        message: "Hapus kategori tiket ini?",
        variant: "danger",
      }))
    )
      return;
    setError(null);
    try {
      await api.delete(`/api/v1/events/${eventId}/tickets/${tid}`);
      await onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menghapus tiket.",
      );
    }
  }

  if (distances.length === 0) {
    return (
      <p style={{ color: "var(--color-ink-3)", fontSize: 15 }}>
        Tambahkan kategori terlebih dahulu.
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
        <p
          style={{
            color: "var(--color-ink-3)",
            fontSize: 15,
            marginBottom: 16,
          }}
        >
          Belum ada kategori tiket.
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {tickets.map((t) => (
            <li
              key={t.id}
              style={{
                padding: "12px 16px",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {editingId === t.id ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                  <input className="field-input" value={editName} onChange={(e) => setEditName(e.target.value)} aria-label="Nama tiket" />
                  <select className="field-input" value={editDistanceId} onChange={(e) => setEditDistanceId(e.target.value)} aria-label="Kategori tiket">{distances.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                  <input className="field-input" inputMode="numeric" value={formatNumberInput(editPrice)} onChange={(e) => setEditPrice(parseNumberInput(e.target.value))} aria-label="Harga tiket" />
                  <input className="field-input" inputMode="numeric" value={formatNumberInput(editQuota)} onChange={(e) => setEditQuota(parseNumberInput(e.target.value))} aria-label="Kuota tiket" />
                  <input className="field-input" type="datetime-local" value={editSaleStart} onChange={(e) => setEditSaleStart(e.target.value)} aria-label="Mulai penjualan" />
                  <input className="field-input" type="datetime-local" value={editSaleEnd} onChange={(e) => setEditSaleEnd(e.target.value)} aria-label="Akhir penjualan" />
                  <div style={{ display: "flex", gap: 8 }}><Button variant="secondary" size="sm" disabled={busy} onClick={() => saveTicket(t)}>Simpan</Button><Button variant="ghost" size="sm" disabled={busy} onClick={() => setEditingId(null)}>Batal</Button></div>
                </div>
              ) : <><div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 15 }}>
                  {t.name}
                  <span style={{ color: "var(--color-ink-3)", fontSize: 13 }}>
                    {" "}
                    · {distanceName(t.category_id)}
                  </span>
                  {isExpired(t.sale_end) && (
                    <Badge variant="warn" className="ml-2">
                      Berakhir
                    </Badge>
                  )}
                  {!t.is_visible && (
                    <Badge variant="neutral" className="ml-2">
                      Disembunyikan
                    </Badge>
                  )}
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <span
                    style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
                  >
                    {formatRupiah(t.price)}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      color: "var(--color-ink-3)",
                    }}
                  >
                    {formatNumber(t.quota_used)}/{formatNumber(t.quota)}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleVisibility(t)}
                    style={{
                      background: "none",
                      border: "none",
                      color: t.is_visible
                        ? "var(--color-ink-3)"
                        : "var(--color-ok)",
                      cursor: busy ? "not-allowed" : "pointer",
                      fontSize: 14,
                    }}
                  >
                    {t.is_visible ? "Sembunyikan" : "Tampilkan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startTicketEdit(t)}
                    style={{ background: "none", border: "none", color: "var(--color-sprint)", cursor: "pointer", fontSize: 14 }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-danger)",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    Hapus
                  </button>
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 6,
                  fontSize: 13,
                  color: "var(--color-ink-3)",
                }}
              >
                <>
                    <span>
                      {t.sale_end
                        ? `Berlaku s.d. ${formatDateTime(t.sale_end)}`
                        : "Tanpa batas waktu penjualan"}
                    </span>
                  </>
              </div>
              </>}
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div className="field" style={{ flex: 1, minWidth: 100 }}>
          <label className="field-label">Nama Tiket</label>
          <input
            className="field-input"
            placeholder="Mis. Early Bird"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field" style={{ width: 130 }}>
          <label className="field-label">Kategori</label>
          <select
            className="field-input"
            value={distanceId}
            onChange={(e) => setDistanceId(e.target.value)}
          >
            <option value="">Pilih kategori</option>
            {distances.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ width: 120 }}>
          <label className="field-label">Harga (Rp)</label>
          <input
            className="field-input"
            type="text"
            inputMode="numeric"
            value={formatNumberInput(price)}
            onChange={(e) => setPrice(parseNumberInput(e.target.value))}
          />
        </div>
        <div className="field" style={{ width: 90 }}>
          <label className="field-label">Kuota</label>
          <input
            className="field-input"
            type="text"
            inputMode="numeric"
            value={formatNumberInput(quota)}
            onChange={(e) => setQuota(parseNumberInput(e.target.value))}
          />
        </div>
        <div className="field" style={{ width: 210 }}>
          <label className="field-label">Berakhir (opsional)</label>
          <input
            className="field-input"
            type="datetime-local"
            value={saleEnd}
            onChange={(e) => setSaleEnd(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="md" disabled={busy} onClick={add}>
          Tambah
        </Button>
      </div>
      <p style={{ fontSize: 13, color: "var(--color-ink-3)", marginTop: 10 }}>
        Kuota tiket tidak boleh melebihi kuota kategori yang dipilih (divalidasi
        server). Setelah tanggal berakhir, tiket tidak bisa dipilih peserta.
      </p>
    </div>
  );
}
