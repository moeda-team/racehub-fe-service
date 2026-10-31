"use client";

import { use, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { api, ApiError } from "@/lib/api";
import {
  formatAgeClass,
  formatRupiah,
  formatNumber,
  formatNumberInput,
  parseNumberInput,
  formatDate,
} from "@/lib/format";
import { isValidEmail } from "@/lib/validation";
import EventCard from "@/components/ui/EventCard";
import { eventStatusDisplay } from "@/lib/event-status";
import EventForm, {
  EventFormValues,
  RegistrationFieldPreview,
  RegistrationAddonsForm,
  RegistrationFieldsForm,
} from "@/components/EventForm";
import EventDetailView from "@/components/EventDetailView";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { confirm } from "@/components/ui/ConfirmDialog";
import { compressEventImage, EVENT_IMAGE_MAX_BYTES, EVENT_IMAGE_TYPES, formatImageSize } from "@/lib/image-upload";
import DataTable, { Column } from "@/components/ui/DataTable";
import { CircleCheck, Image as ImageIcon, TriangleAlert } from "lucide-react";
import ExcelJS from "exceljs";
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
  ParticipantEditableData,
  ParticipantUpdateResult,
  ParticipantRow,
  PaymentChargeResponse,
  PublicEventDetail,
  RegistrationField,
  RegistrationAddonGroup,
  RecapRow,
  Refund,
  RefundSummary,
  TicketCategory,
  AddonRecapRow,
} from "@/lib/types.gen";

type Tab = "detail" | "pendaftaran" | "kolektif" | "kategori" | "peserta" | "keuangan" | "refund" | "komunikasi";
type PreviewMode = "card" | "detail" | "register";
const RECAP_COLUMNS = ["category", "gender", "class", "total", "addons"] as const;
type RecapColumn = (typeof RECAP_COLUMNS)[number];

const BASE_TABS: { id: Tab; label: string }[] = [
  { id: "detail", label: "Detail Event" },
  { id: "pendaftaran", label: "Form Pendaftaran" },
  { id: "kolektif", label: "Pendaftaran Kolektif" },
  { id: "kategori", label: "Kategori" },
  { id: "peserta", label: "Peserta" },
  { id: "keuangan", label: "Keuangan" },
  { id: "komunikasi", label: "Komunikasi" },
];

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const eventId = id;

  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Live values from the edit form, feeding the marketplace-card preview.
  const [formPreview, setFormPreview] = useState<EventFormValues | null>(null);
  const [registrationFieldsPreview, setRegistrationFieldsPreview] = useState<RegistrationFieldPreview[]>([]);
  const [registrationAddonsPreview, setRegistrationAddonsPreview] = useState<RegistrationAddonGroup[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("detail");
  const [collectiveRefreshKey, setCollectiveRefreshKey] = useState(0);

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
      event_type: values.event_type,
      master_age_threshold: values.master_age_threshold,
      refund_cutoff_date: values.refund_cutoff_date || undefined,
      registration_close_date: values.registration_close_date || undefined,
      donation_enabled: values.donation_enabled,
      refund_donation_on_cancel: values.refund_donation_on_cancel,
      platform_fee: values.platform_fee,
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
    <div className="rh-reveal" style={{ maxWidth: 1200, width: "100%", minWidth: 0 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 6,
        }}
      >
        <Link href="/dashboard/events" style={{ fontSize: 14, color: "var(--color-ink-3)" }}>
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

      {/* Status bar - always visible */}
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
        {[...BASE_TABS, ...(event.status === "cancelled" ? [{ id: "refund" as Tab, label: "Refund" }] : [])].map(
          (t) => (
            <button
              key={t.id}
              type="button"
              className="event-tab"
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
              {t.id === "peserta" && event.event_type === "running" ? "Peserta & BIB" : t.label}
            </button>
          ),
        )}
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
                onUploaded={(ev) => setDetail((prev) => (prev ? { ...prev, event: ev } : prev))}
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
                  refund_donation_on_cancel: event.refund_donation_on_cancel ?? false,
                  platform_fee: event.platform_fee,
                  color: event.color,
                }}
                onSubmit={handleUpdate}
                onChange={setFormPreview}
              />
            </div>
            <CardPreview
              detail={detail}
              live={formPreview}
              registrationFields={registrationFieldsPreview}
              addonGroups={registrationAddonsPreview}
              availableModes={["card", "detail"]}
            />
          </div>
        )}

        {activeTab === "pendaftaran" && (
          <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div
              style={{
                padding: 28,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
                flex: "1 1 420px",
                maxWidth: 720,
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                Form Pendaftaran
              </h2>
              <p style={{ fontSize: 14, color: "var(--color-ink-3)", marginTop: 0, marginBottom: 20 }}>
                Atur kolom tambahan yang harus diisi peserta saat mendaftar.
              </p>
              <RegistrationFieldsForm eventId={eventId} onChange={setRegistrationFieldsPreview} />
              <RegistrationAddonsForm eventId={eventId} onChange={setRegistrationAddonsPreview} />
            </div>
            <CardPreview
              detail={detail}
              live={formPreview}
              registrationFields={registrationFieldsPreview}
              addonGroups={registrationAddonsPreview}
              availableModes={["register"]}
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
              <DistanceManager eventId={eventId} distances={detail.categories} onChanged={load} />
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

        {activeTab === "kolektif" && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 24, width: "100%", minWidth: 0 }}>
            <CollectiveRegistrationCard
              eventId={eventId}
              categories={detail.categories}
              tickets={detail.ticket_categories}
              onCreated={() => setCollectiveRefreshKey((value) => value + 1)}
            />
            <section
              style={{
                padding: 24,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface)",
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
              }}
            >
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 16px" }}>
                Peserta Belum Lunas dan Aksi Massal
              </h2>
              <ParticipantsCard
                eventId={eventId}
                isRunning={event.event_type === "running"}
                showBulkActions
                statusFilter="pending_payment"
                refreshKey={collectiveRefreshKey}
                onChanged={() => setCollectiveRefreshKey((value) => value + 1)}
              />
            </section>
            <section
              style={{
                padding: 24,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface)",
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
              }}
            >
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 6px" }}>
                Peserta Kedaluwarsa
              </h2>
              <p style={{ fontSize: 14, color: "var(--color-ink-3)", margin: "0 0 16px" }}>
                Pilih peserta untuk mengaktifkan kembali pendaftaran. Payment dibuat terpisah dari tabel peserta belum
                lunas jika periode penjualan dan kuota masih tersedia.
              </p>
              <ParticipantsCard
                eventId={eventId}
                isRunning={event.event_type === "running"}
                showBulkActions
                statusFilter="expired"
                refreshKey={collectiveRefreshKey}
                onChanged={() => setCollectiveRefreshKey((value) => value + 1)}
              />
            </section>
          </div>
        )}

        {activeTab === "peserta" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <RegistrationStatusCard event={event} eventId={eventId} onChanged={load} />
            <RPCAccessCard eventId={eventId} />
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
                Email yang terdaftar di sini mendapat tiket gratis: harga tiket dan fee platform Rp0. Tanpa donasi,
                peserta langsung menerima e-tiket tanpa melalui payment gateway. Jika memilih donasi, peserta hanya
                membayar donasi dan biaya transaksi; harga tiket serta fee platform tetap Rp0.
              </p>
              <ComplimentaryManager eventId={eventId} />
            </div>
            {event.event_type === "running" && (
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
                  Nomor BIB
                </h2>
                <BibCard
                  eventId={eventId}
                  hasCloseDate={!!event.registration_close_date}
                  categories={detail.categories}
                />
              </div>
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
                  marginBottom: 16,
                  marginTop: 0,
                }}
              >
                Daftar Peserta Lunas
              </h2>
              <ParticipantsCard eventId={eventId} isRunning={event.event_type === "running"} showBulkActions={false} />
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
          <div
            style={{
              padding: 28,
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-surface)",
            }}
          >
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
              <RefundSummaryCard eventId={eventId} />
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
              <RecapTable eventId={eventId} isRunning={event.event_type === "running"} />
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
            <div
              style={{
                padding: 28,
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginTop: 0, marginBottom: 20 }}>
                Riwayat Refund
              </h2>
              <RefundsCard eventId={eventId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type EmailCampaign = {
  id: string;
  subject: string;
  content: string;
  audience: "paid" | "pending_payment";
  send_at: string;
  status: string;
};
function CampaignCard({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<EmailCampaign[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<EmailCampaign["audience"]>("paid");
  const [sendAt, setSendAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await api.get<ApiResponse<EmailCampaign[]>>(`/api/v1/events/${eventId}/email-campaigns`);
      setItems(r.data ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat kampanye.");
    }
  }, [eventId]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function create() {
    setError(null);
    try {
      await api.post(`/api/v1/events/${eventId}/email-campaigns`, {
        subject,
        content,
        audience,
        send_at: new Date(sendAt).toISOString(),
      });
      setSubject("");
      setContent("");
      setSendAt("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kampanye gagal dijadwalkan.");
    }
  }
  async function cancel(id: string) {
    try {
      await api.delete(`/api/v1/events/${eventId}/email-campaigns/${id}`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Tidak dapat membatalkan kampanye.");
    }
  }
  return (
    <div>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <div style={{ display: "grid", gap: 12, maxWidth: 680 }}>
        <input
          className="field-input"
          placeholder="Subjek email"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          className="field-input"
          placeholder="Informasi untuk peserta"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ minHeight: 110 }}
        />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            className="field-input"
            value={audience}
            onChange={(e) => setAudience(e.target.value as EmailCampaign["audience"])}
            style={{ maxWidth: 220 }}
          >
            <option value="paid">Peserta lunas</option>
            <option value="pending_payment">Menunggu pembayaran</option>
          </select>
          <input
            className="field-input"
            type="datetime-local"
            value={sendAt}
            onChange={(e) => setSendAt(e.target.value)}
            style={{ maxWidth: 240 }}
          />
          <Button variant="primary" onClick={create} disabled={!subject || !content || !sendAt}>
            Jadwalkan
          </Button>
        </div>
      </div>
      <div style={{ marginTop: 24, display: "grid", gap: 8 }}>
        {items.map((c) => (
          <div
            key={c.id}
            style={{
              padding: 12,
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span>
              <b>{c.subject}</b>
              <br />
              <small>
                {c.audience === "paid" ? "Peserta lunas" : "Menunggu pembayaran"} ·{" "}
                {new Date(c.send_at).toLocaleString("id-ID")} · {c.status}
              </small>
            </span>
            {c.status === "scheduled" && (
              <Button variant="ghost" size="sm" onClick={() => cancel(c.id)}>
                Batalkan
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RPCAccessCard({ eventId }: { eventId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await api.get<ApiResponse<{ active: boolean; access_code: string }>>(
        `/api/v1/events/${eventId}/rpc-access`,
      );
      setActive(r.data.active);
      setCode(r.data.access_code || null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat kode akses.");
    }
  }, [eventId]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function rotate() {
    try {
      const r = await api.post<ApiResponse<{ access_code: string }>>(`/api/v1/events/${eventId}/rpc-access/rotate`);
      setCode(r.data.access_code);
      setActive(true);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal membuat kode akses.");
    }
  }
  async function revoke() {
    try {
      await api.delete(`/api/v1/events/${eventId}/rpc-access`);
      setCode(null);
      setActive(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal mencabut akses.");
    }
  }
  return (
    <div
      style={{
        padding: 20,
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface)",
      }}
    >
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, margin: "0 0 8px" }}>
        Akses volunteer pengambilan perlengkapan
      </h2>
      <p style={{ fontSize: 13, color: "var(--color-ink-3)", margin: "0 0 16px" }}>
        Satu kode aktif untuk satu event. Volunteer dapat memverifikasi peserta dan menandai pengambilan perlengkapan,
        tanpa akses ke wallet atau dashboard.
      </p>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}
      {code && (
        <p
          style={{
            padding: 12,
            margin: "0 0 16px",
            background: "var(--color-panel)",
            borderRadius: 8,
            fontFamily: "var(--font-mono)",
            wordBreak: "break-all",
          }}
        >
          Kode: <b>{code}</b>
        </p>
      )}
      {active && !code && (
        <p style={{ fontSize: 13, color: "var(--color-ink-3)", margin: "0 0 16px" }}>
          Kode lama aktif tetapi tidak dapat ditampilkan kembali. Putar kode untuk membuat kode baru.
        </p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button variant="secondary" onClick={rotate}>
          {active ? "Putar kode" : "Buat kode akses"}
        </Button>
        {active && (
          <Button variant="danger" onClick={revoke}>
            Cabut akses
          </Button>
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
    if (
      !(await confirm({
        message: "Tutup pendaftaran sekarang? Peserta baru tidak dapat mendaftar setelah ini.",
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
          {isClosed ? (
            <>
              <CircleCheck size={16} aria-hidden /> Pendaftaran ditutup
            </>
          ) : (
            <>
              <TriangleAlert size={16} aria-hidden /> Pendaftaran masih terbuka
            </>
          )}
        </div>
        <div style={{ fontSize: 14, color: "var(--color-ink-3)" }}>
          {isClosed && closeDate
            ? `Ditutup sejak ${closeDate.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}`
            : closeDate
              ? `Akan tutup otomatis ${closeDate.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}`
              : "Belum ada tanggal penutupan - atur di tab Detail atau tutup manual di sini."}
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
  const [refundSummary, setRefundSummary] = useState<RefundSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [dashboardResult, refundResult] = await Promise.allSettled([
        api.get<ApiResponse<EventDashboard>>(`/api/v1/events/${eventId}/dashboard`),
        api.get<ApiResponse<RefundSummary>>(`/api/v1/events/${eventId}/refunds/summary`),
      ]);
      if (cancelled) return;
      if (dashboardResult.status === "fulfilled") setD(dashboardResult.value.data);
      if (refundResult.status === "fulfilled") setRefundSummary(refundResult.value.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (!d) return <p style={{ color: "var(--color-ink-3)" }}>Memuat ringkasan…</p>;

  const cells: { label: string; value: string }[] = [
    { label: "Total Pembeli", value: String(d.paid_count) },
    {
      label: "Total Pendaftar (termasuk refund)",
      value: refundSummary ? String(d.paid_count + refundSummary.total_count) : "—",
    },
    { label: "Total Refund", value: refundSummary ? String(refundSummary.total_count) : "—" },
    { label: "Pendapatan Tiket", value: formatRupiah(d.ticket_revenue) },
    { label: "Donasi", value: formatRupiah(d.donation_total) },
    { label: "Saldo Wallet", value: formatRupiah(d.wallet_balance) },
    { label: "Perlengkapan Sudah Diambil", value: String(d.rpc_collected) },
    { label: "Perlengkapan Belum Diambil", value: String(d.rpc_pending) },
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

// RecapTable lists running participants by category × gender × age class, and
// non-running sales by category × ticket class.
function RecapTable({ eventId, isRunning }: { eventId: string; isRunning: boolean }) {
  const [rows, setRows] = useState<RecapRow[] | null>(null);
  const [addonRows, setAddonRows] = useState<AddonRecapRow[] | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<RecapColumn[]>([...RECAP_COLUMNS]);
  const [preferencesLoadedFor, setPreferencesLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    const storageKey = `event-recap-columns:${eventId}`;
    let savedColumns: RecapColumn[] | null = null;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((column): column is RecapColumn =>
            RECAP_COLUMNS.includes(column as RecapColumn),
          );
          if (valid.length > 0) savedColumns = valid;
        }
      }
    } catch {
      // Ignore unavailable or malformed browser storage and use defaults.
    }
    const frame = window.requestAnimationFrame(() => {
      if (savedColumns) setVisibleColumns(savedColumns);
      setPreferencesLoadedFor(eventId);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [eventId]);

  useEffect(() => {
    if (preferencesLoadedFor !== eventId) return;
    try {
      window.localStorage.setItem(`event-recap-columns:${eventId}`, JSON.stringify(visibleColumns));
    } catch {
      // The table remains usable when browser storage is unavailable.
    }
  }, [eventId, preferencesLoadedFor, visibleColumns]);

  function toggleColumn(column: RecapColumn) {
    setVisibleColumns((current) => {
      if (current.includes(column)) {
        const remaining = current.filter((item) => item !== column);
        const remainingBaseColumns = remaining.filter((item) => item !== "addons");
        return column !== "addons" && remainingBaseColumns.length === 0 ? current : remaining;
      }
      return [...current, column];
    });
  }

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<AddonRecapRow[]>>(`/api/v1/events/${eventId}/recap/addons`);
        if (!cancelled) setAddonRows(res.data ?? []);
      } catch {
        if (!cancelled) setAddonRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (!rows) return <p style={{ color: "var(--color-ink-3)" }}>Memuat rekap…</p>;
  if (rows.length === 0)
    return <p style={{ color: "var(--color-ink-3)", fontSize: 15 }}>Belum ada kategori tiket untuk direkap.</p>;

  const allCols: Column<RecapRow>[] = [
    {
      key: "category",
      header: "Kategori",
      render: (r) => (r.category_id === "total" ? <strong>{r.category_name}</strong> : r.category_name),
    },
    { key: "gender", header: "Gender", render: (r) => (r.category_id === "total" ? "" : r.gender || "—") },
    {
      key: "class",
      header: "Kelas",
      render: (r) =>
        r.category_id === "total"
          ? ""
          : (isRunning ? formatAgeClass(r.age_class, r.category_name) : r.ticket_name) || "—",
    },
    {
      key: "total",
      header: isRunning ? "Jumlah" : "Jumlah Terjual",
      render: (r) => (r.category_id === "total" ? <strong>{r.total}</strong> : r.total),
      mono: true,
    },
  ];
  const cols = allCols.filter((column) => visibleColumns.includes(column.key as RecapColumn));
  const totalRow: RecapRow = {
    category_id: "total",
    category_name: "Total",
    gender: "",
    age_class: "",
    ticket_name: "",
    total: rows.reduce((sum, row) => sum + row.total, 0),
  };
  return (
    <>
      <fieldset
        style={{ border: 0, margin: "0 0 16px", padding: 0 }}
        aria-label="Pilih kolom rekap"
      >
        <legend style={{ color: "var(--color-ink-3)", fontSize: 13, marginBottom: 8 }}>
          Kolom yang ditampilkan
        </legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
          {([
            ["category", "Kategori"],
            ["gender", "Gender"],
            ["class", "Kelas"],
            ["total", isRunning ? "Jumlah" : "Jumlah Terjual"],
            ["addons", "Add-ons"],
          ] as [RecapColumn, string][]).map(([column, label]) => (
            <label key={column} style={{ alignItems: "center", display: "inline-flex", gap: 6, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={visibleColumns.includes(column)}
                disabled={
                  column !== "addons" &&
                  visibleColumns.includes(column) &&
                  visibleColumns.filter((item) => item !== "addons").length === 1
                }
                onChange={() => toggleColumn(column)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <DataTable
        columns={cols}
        data={[...rows, totalRow]}
        keyFn={(r) => `${r.category_id}-${r.gender}-${r.age_class}-${r.ticket_name}`}
      />
      {visibleColumns.includes("addons") && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>Rekap Add-ons Terjual</h3>
          {addonRows === null ? (
            <p style={{ color: "var(--color-ink-3)" }}>Memuat rekap add-ons…</p>
          ) : addonRows.length === 0 ? (
            <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>Belum ada add-ons terjual.</p>
          ) : (
            <DataTable
              columns={[
                { key: "title", header: "Grup Add-on", render: (row) => row.title },
                { key: "name", header: "Pilihan", render: (row) => row.name },
                { key: "total", header: "Jumlah Terjual", render: (row) => row.total, mono: true },
              ]}
              data={addonRows}
              keyFn={(row) => row.id || `${row.title}-${row.name}`}
            />
          )}
        </div>
      )}
    </>
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

  const strategyCopy: Record<BibGenerationStrategy, { label: string; preview: string; description: string }> = {
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
      description: "M untuk male, F untuk female, dan O untuk nilai gender lainnya.",
    },
    category_gender: {
      label: "Kategori + Gender",
      preview: "01-M-0001, 01-F-0001, 02-M-0001, …",
      description: "Paling tepat untuk membedakan peserta seperti 5K Male, 5K Female, 10K Male, dan 10K Female.",
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
      setMsg(`${res.data.generated} nomor BIB berhasil dibuat dengan pola ${strategyCopy[res.data.strategy].preview}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        if (
          e.message.toLowerCase().includes("already") ||
          e.message.toLowerCase().includes("sudah dibuat") ||
          e.message.toLowerCase().includes("regenerat")
        ) {
          if (
            await confirm({
              message: "Nomor BIB sudah pernah dibuat. Buat ulang dari awal? Nomor lama akan ditimpa.",
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
        Pilih pola nomor BIB, lalu sistem mengurutkan peserta berdasarkan waktu pendaftaran di dalam setiap kelompok.
        Hanya bisa dibuat <b>setelah pendaftaran ditutup</b>.
        {!hasCloseDate && ' Atur "Penutupan Pendaftaran" di tab Detail, atau ini memakai tanggal event.'}
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
              onChange={(e) => setStrategy(e.target.value as BibGenerationStrategy)}
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
          <div style={{ marginBottom: 3, fontSize: 12, fontWeight: 700 }}>FORMAT YANG AKAN DIBUAT</div>
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
          {(strategy === "category" || strategy === "category_gender") && categories.length > 0 && (
            <div style={{ marginTop: 8 }}>
              Kode kategori:{" "}
              {categories.map((category, index) => (
                <span key={category.id} style={{ marginRight: 10 }}>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{String(index + 1).padStart(2, "0")}</span>{" "}
                  {category.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <Button variant="primary" size="md" disabled={busy} onClick={() => generate(false)}>
        {busy ? "Memproses…" : "Generate Nomor BIB"}
      </Button>
    </div>
  );
}

// ParticipantsCard renders the participant table + CSV export.
type CollectiveDraft = {
  idempotency_key: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  category_id: string;
  ticket_category_id: string;
  donation: string;
  extra_data: Record<string, string>;
};
const emptyCollectiveDraft = (): CollectiveDraft => ({
  idempotency_key: crypto.randomUUID(),
  name: "",
  email: "",
  phone: "",
  birth_date: "",
  gender: "",
  category_id: "",
  ticket_category_id: "",
  donation: "0",
  extra_data: {},
});
function excelCellText(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  return String(value ?? "").trim();
}
function excelBirthDate(value: unknown): string {
  if (typeof value === "number") {
    // Excel's 1900 date system counts from 1899-12-30 (including its leap-year bug).
    const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86_400_000);
    if (!Number.isNaN(date.getTime()))
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }
  const raw = excelCellText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  return raw;
}

function CollectiveRegistrationCard({
  eventId,
  categories,
  tickets,
  onCreated,
}: {
  eventId: string;
  categories: Category[];
  tickets: TicketCategory[];
  onCreated?: () => void;
}) {
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [drafts, setDrafts] = useState<CollectiveDraft[]>([emptyCollectiveDraft()]);
  const [fileRows, setFileRows] = useState<CollectiveDraft[] | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ApiResponse<RegistrationField[]>>(`/api/v1/events/${eventId}/registration-fields`)
      .then((res) => {
        if (!cancelled) setFields(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Gagal memuat kolom form pendaftaran event.");
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const templateHeaders = [
    "name",
    "email",
    "phone",
    "birth_date",
    "gender",
    "category_id",
    "ticket_category_id",
    "donation",
    ...fields.map((field) => `${field.label}${field.required ? " *" : ""}`),
  ];
  const categoryOption = (category: Category) => `${category.name} [${category.id}]`;
  const ticketOption = (ticket: TicketCategory) =>
    `${categories.find((category) => category.id === ticket.category_id)?.name ?? "Kategori"} - ${ticket.name} [${ticket.id}]`;
  function resolveOption(value: unknown, options: Array<{ id: string; label: string }>) {
    const text = excelCellText(value).trim();
    return options.find((option) => option.id === text || option.label === text)?.id ?? text;
  }
  async function downloadTemplate() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Pendaftaran");
    const initialCategory =
      categories.find((category) => tickets.some((ticket) => ticket.category_id === category.id)) ?? categories[0];
    const initialTicket = tickets.find((ticket) => ticket.category_id === initialCategory?.id);
    sheet.addRow(templateHeaders);
    sheet.addRow([
      "Nama peserta",
      "email@example.com",
      "08xxxxxxxxxx",
      "1990-01-31",
      "Laki-laki",
      initialCategory ? categoryOption(initialCategory) : "",
      initialTicket ? ticketOption(initialTicket) : "",
      0,
      ...fields.map(() => ""),
    ]);
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    const choices = workbook.addWorksheet("Pilihan");
    choices.addRow(["category_id", "Pilihan kategori", "ticket_category_id", "Pilihan tiket"]);
    const rowCount = Math.max(categories.length, tickets.length);
    for (let index = 0; index < rowCount; index++) {
      const category = categories[index];
      const ticket = tickets[index];
      choices.addRow([
        category?.id ?? "",
        category ? categoryOption(category) : "",
        ticket?.id ?? "",
        ticket ? ticketOption(ticket) : "",
      ]);
    }
    choices.getRow(1).font = { bold: true };
    choices.columns = [
      { width: 38 },
      { width: 36 },
      { width: 38 },
      { width: 55 },
      ...categories.map(() => ({ width: 55 })),
    ];
    categories.forEach((category, index) => {
      const column = index + 5;
      const matchingTickets = tickets.filter((ticket) => ticket.category_id === category.id);
      choices.getCell(1, column).value = `Pilihan tiket ${category.name}`;
      (matchingTickets.length
        ? matchingTickets
        : [{ id: "", name: "", category_id: category.id } as TicketCategory]
      ).forEach((ticket, ticketIndex) => {
        choices.getCell(ticketIndex + 2, column).value = ticket.id ? ticketOption(ticket) : "";
      });
      const namedRange = `TicketOptions_${index + 1}`;
      workbook.definedNames.add(
        `'Pilihan'!$${String.fromCharCode(65 + column - 1)}$2:$${String.fromCharCode(65 + column - 1)}$${Math.max(matchingTickets.length, 1) + 1}`,
        namedRange,
      );
    });
    choices.state = "hidden";
    if (categories.length) workbook.definedNames.add(`'Pilihan'!$B$2:$B$${categories.length + 1}`, "CategoryOptions");
    if (tickets.length) workbook.definedNames.add(`'Pilihan'!$D$2:$D$${tickets.length + 1}`, "TicketOptions");
    for (let row = 2; row <= 501; row++) {
      sheet.getCell(row, 5).dataValidation = {
        type: "list",
        formulae: ['"Laki-laki,Perempuan"'],
        allowBlank: false,
        showErrorMessage: true,
        errorTitle: "Jenis kelamin tidak valid",
        error: "Pilih Laki-laki atau Perempuan.",
      };
      if (categories.length)
        sheet.getCell(row, 6).dataValidation = {
          type: "list",
          formulae: ["CategoryOptions"],
          allowBlank: false,
          showErrorMessage: true,
          errorTitle: "Kategori tidak valid",
          error: "Pilih kategori dari daftar.",
        };
      if (tickets.length)
        sheet.getCell(row, 7).dataValidation = {
          type: "list",
          formulae: ['INDIRECT("TicketOptions_"&MATCH(F' + row + ",CategoryOptions,0))"],
          allowBlank: false,
          showErrorMessage: true,
          errorTitle: "Tiket tidak valid",
          error: "Pilih tiket yang sesuai dengan kategori.",
        };
    }
    const help = workbook.addWorksheet("Petunjuk");
    help.addRows([
      ["Kolom", "Keterangan"],
      ...templateHeaders.map((key, index) => [
        key,
        fields[index - 8]?.label
          ? `Isi ${fields[index - 8].label}${fields[index - 8].required ? " (wajib)" : ""}.`
          : key,
      ]),
      ["category_id", "Pilih kategori dari dropdown; kolom menyimpan label dan ID."],
      ["ticket_category_id", "Pilih tiket dari dropdown; kolom menyimpan label dan ID."],
    ]);
    help.getRow(1).font = { bold: true };
    help.state = "hidden";
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `template-pendaftaran-${eventId.slice(0, 8)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function readWorkbook(file: File) {
    setError(null);
    setNotice(null);
    setRowErrors({});
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran file maksimal 5 MiB.");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const sheet = workbook.getWorksheet("Pendaftaran") ?? workbook.worksheets[0];
      if (!sheet) throw new Error("Sheet Pendaftaran tidak ditemukan.");
      const records: unknown[][] = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          records.push(Array.from({ length: Math.max(8 + fields.length, row.cellCount) }, (_, index) => {
            const value = row.getCell(index + 1).value;
            if (value && typeof value === "object" && "result" in value) return value.result ?? "";
            if (value && typeof value === "object" && "text" in value) return value.text ?? "";
            return value ?? "";
          }));
        }
      });
      if (records.length < 1 || records.length > 100) throw new Error("File harus berisi 1–100 baris peserta.");
      const parsed = records.map((record) => {
        const extra_data: Record<string, string> = {};
        fields.forEach((field, index) => {
          extra_data[field.id] = excelCellText(record[index + 8]);
        });
        const ticket_category_id = resolveOption(
          record[6],
          tickets.map((ticket) => ({ id: ticket.id, label: ticketOption(ticket) })),
        );
        const selectedCategoryId = resolveOption(
          record[5],
          categories.map((category) => ({ id: category.id, label: categoryOption(category) })),
        );
        const selectedTicket = tickets.find((ticket) => ticket.id === ticket_category_id);
        const genderValue = excelCellText(record[4]).trim().toLocaleLowerCase();
        const gender =
          genderValue === "laki-laki" || genderValue === "male"
            ? "male"
            : genderValue === "perempuan" || genderValue === "female"
              ? "female"
              : excelCellText(record[4]);
        return {
          idempotency_key: crypto.randomUUID(),
          name: excelCellText(record[0]),
          email: excelCellText(record[1]),
          phone: excelCellText(record[2]),
          birth_date: excelBirthDate(record[3]),
          gender,
          category_id: selectedTicket?.category_id ?? selectedCategoryId,
          ticket_category_id,
          donation: excelCellText(record[7] ?? "0") || "0",
          extra_data,
        };
      });
      setFileRows(parsed);
    } catch (e) {
      setFileRows(null);
      setError(e instanceof Error ? e.message : "File Excel tidak dapat dibaca.");
    }
  }

  function validateRows(rows: CollectiveDraft[]) {
    const errors: Record<number, string[]> = {};
    rows.forEach((row, index) => {
      const issues: string[] = [];
      if (
        !row.name ||
        !row.email ||
        !row.phone ||
        !row.birth_date ||
        !row.gender ||
        !row.category_id ||
        !row.ticket_category_id
      )
        issues.push("Lengkapi data dasar, kategori, dan tiket.");
      if (!isValidEmail(row.email)) issues.push("Email tidak valid.");
      if (!Number.isSafeInteger(Number(row.donation)) || Number(row.donation) < 0)
        issues.push("Donasi harus berupa bilangan bulat rupiah nol atau lebih.");
      if (!categories.some((category) => category.id === row.category_id)) issues.push("Kategori tidak dikenal.");
      if (!tickets.some((ticket) => ticket.id === row.ticket_category_id && ticket.category_id === row.category_id))
        issues.push("Tiket tidak cocok dengan kategori.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(row.birth_date)) issues.push("Tanggal lahir harus YYYY-MM-DD.");
      for (const field of fields)
        if (field.required && !row.extra_data[field.id]?.trim()) issues.push(`${field.label} wajib diisi.`);
      errors[index] = [...new Set(issues)];
    });
    return errors;
  }

  async function submitRows(rows: CollectiveDraft[]) {
    const errors = validateRows(rows);
    setRowErrors(errors);
    const valid = rows.filter((_, index) => errors[index].length === 0);
    if (!valid.length) {
      setError("Belum ada baris valid untuk disimpan.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.post<
        ApiResponse<{
          created: number;
          failed: number;
          results: Array<{ row: number; registration?: { registration_number: string }; error?: string }>;
        }>
      >(`/api/v1/events/${eventId}/registrations/bulk`, {
        participants: valid.map((row) => ({
          idempotency_key: row.idempotency_key,
          event_id: eventId,
          ticket_category_id: row.ticket_category_id,
          category_id: row.category_id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          birth_date: row.birth_date,
          gender: row.gender,
          donation: Number(row.donation) || 0,
          extra_data: row.extra_data,
        })),
      });
      setNotice(
        `${result.data.created} pendaftaran tersimpan tanpa payment/email${result.data.failed ? `; ${result.data.failed} gagal` : ""}.`,
      );
      if (result.data.created > 0) onCreated?.();
      const backendErrors: Record<number, string[]> = {};
      result.data.results.forEach((item, index) => {
        if (item.error) backendErrors[index] = [item.error];
      });
      if (fileRows) {
        const localInvalid = rows
          .map((row, index) => ({ row, issues: errors[index] }))
          .filter(({ issues }) => issues.length > 0);
        const backendFailed = Object.entries(backendErrors)
          .map(([index, issues]) => ({ row: valid[Number(index)], issues }))
          .filter((item): item is { row: CollectiveDraft; issues: string[] } => Boolean(item.row));
        const remaining = [...localInvalid, ...backendFailed];
        setFileRows(remaining.length ? remaining.map((item) => item.row) : null);
        setRowErrors(Object.fromEntries(remaining.map((item, index) => [index, item.issues])));
      } else if (Object.keys(backendErrors).length) {
        setRowErrors(backendErrors);
      }
      setDrafts([emptyCollectiveDraft()]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Pendaftaran kolektif gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  const rows = fileRows ?? drafts;
  const setRow = (index: number, patch: Partial<CollectiveDraft>) => {
    if (fileRows) setFileRows(fileRows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    else setDrafts(drafts.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  return (
    <section
      className="collective-registration-card"
      style={{
        padding: 24,
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface)",
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 6px" }}>Pendaftaran Kolektif</h2>
      <p style={{ fontSize: 14, color: "var(--color-ink-3)", margin: "0 0 18px" }}>
        Peserta dibuat dengan status belum dibayar. Tidak ada payment atau email yang dibuat otomatis.
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
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        <Button variant="secondary" size="sm" onClick={() => void downloadTemplate()}>
          Unduh template Excel
        </Button>
        <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
          Import Excel (.xlsx)
          <input
            type="file"
            accept=".xlsx"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void readWorkbook(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        {fileRows && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFileRows(null);
              setRowErrors({});
            }}
          >
            Kembali ke input manual
          </Button>
        )}
      </div>
      <p style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: -8, marginBottom: 16 }}>
        File Excel (.xlsx) maksimal 5 MiB dan 100 peserta per pengiriman.
      </p>
      {rows.map((row, index) => (
        <div
          key={index}
          style={{
            padding: 16,
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-sm)",
            marginBottom: 12,
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <strong>Peserta {index + 1}</strong>
            {!fileRows && drafts.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => setDrafts(drafts.filter((_, i) => i !== index))}>
                Hapus
              </Button>
            )}
          </div>
          <div
            className="collective-draft-fields"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 220px),1fr))",
              gap: 10,
              minWidth: 0,
            }}
          >
            {(["name", "email", "phone", "birth_date", "gender"] as const).map((key) => (
              <label key={key} style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
                {
                  (
                    {
                      name: "Nama",
                      email: "Email",
                      phone: "Telepon",
                      birth_date: "Tanggal lahir",
                      gender: "Gender",
                    } as const
                  )[key]
                }
                {key === "gender" ? (
                  <select
                    className="field-input"
                    value={row.gender}
                    onChange={(e) => setRow(index, { gender: e.target.value })}
                    style={{ width: "100%" }}
                  >
                    <option value="">Pilih gender</option>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                ) : (
                  <input
                    className="field-input"
                    type={key === "birth_date" ? "date" : key === "email" ? "email" : "text"}
                    value={row[key]}
                    onChange={(e) => setRow(index, { [key]: e.target.value })}
                    style={{ width: "100%" }}
                  />
                )}
              </label>
            ))}
            <label style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
              Kategori
              <select
                className="field-input"
                value={row.category_id}
                onChange={(e) => {
                  const ticketsForCategory = tickets.filter((t) => t.category_id === e.target.value);
                  setRow(index, { category_id: e.target.value, ticket_category_id: ticketsForCategory[0]?.id ?? "" });
                }}
                style={{ width: "100%" }}
              >
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
              Jenis tiket
              <select
                className="field-input"
                value={row.ticket_category_id}
                onChange={(e) => setRow(index, { ticket_category_id: e.target.value })}
                style={{ width: "100%" }}
              >
                <option value="">Pilih tiket</option>
                {tickets
                  .filter((t) => t.category_id === row.category_id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </label>
            <label style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
              Donasi (opsional)
              <input
                className="field-input"
                type="number"
                min="0"
                step="1"
                value={row.donation}
                onChange={(e) => setRow(index, { donation: e.target.value })}
                style={{ width: "100%" }}
              />
            </label>
            {fields.map((field) => (
              <label key={field.id} style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
                {field.label}
                {field.required ? " *" : ""}
                {field.field_type === "select" || field.field_type === "radio" ? (
                  <select
                    className="field-input"
                    value={row.extra_data[field.id] ?? ""}
                    onChange={(e) => setRow(index, { extra_data: { ...row.extra_data, [field.id]: e.target.value } })}
                    style={{ width: "100%" }}
                  >
                    <option value="">Pilih</option>
                    {field.options
                      .split(",")
                      .map((option) => option.trim())
                      .filter(Boolean)
                      .map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                  </select>
                ) : field.field_type === "checkbox" ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 38 }}>
                    <input
                      type="checkbox"
                      checked={row.extra_data[field.id] === "true"}
                      onChange={(e) =>
                        setRow(index, { extra_data: { ...row.extra_data, [field.id]: String(e.target.checked) } })
                      }
                    />
                    Setuju
                  </span>
                ) : (
                  <input
                    className="field-input"
                    type={
                      field.field_type === "date"
                        ? "date"
                        : field.field_type === "email"
                          ? "email"
                          : field.field_type === "number"
                            ? "number"
                            : "text"
                    }
                    value={row.extra_data[field.id] ?? ""}
                    onChange={(e) => setRow(index, { extra_data: { ...row.extra_data, [field.id]: e.target.value } })}
                    style={{ width: "100%" }}
                  />
                )}
              </label>
            ))}
          </div>
          {rowErrors[index]?.length > 0 && (
            <p style={{ color: "var(--color-danger)", fontSize: 12, marginBottom: 0 }}>{rowErrors[index].join(" ")}</p>
          )}
        </div>
      ))}
      {!fileRows && drafts.length < 100 && (
        <Button variant="secondary" size="sm" onClick={() => setDrafts([...drafts, emptyCollectiveDraft()])}>
          Tambah peserta
        </Button>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
        <Button variant="primary" disabled={busy || rows.length === 0} onClick={() => void submitRows(rows)}>
          {busy ? "Menyimpan…" : `Simpan ${rows.length} peserta valid`}
        </Button>
      </div>
    </section>
  );
}

function ParticipantsCard({
  eventId,
  isRunning,
  showBulkActions = true,
  statusFilter,
  refreshKey,
  onChanged,
}: {
  eventId: string;
  isRunning: boolean;
  showBulkActions?: boolean;
  statusFilter?: string;
  refreshKey?: number;
  onChanged?: () => void;
}) {
  const [rows, setRows] = useState<ParticipantRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [pageSize, setPageSize] = useState(8);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [rpcExporting, setRPCExporting] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<ParticipantRow | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundBankAccount, setRefundBankAccount] = useState("");
  const [refundEntries, setRefundEntries] = useState<Refund[]>([]);
  const [completingRefundId, setCompletingRefundId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<ParticipantRow | null>(null);
  const [editDraft, setEditDraft] = useState<ParticipantEditableData | null>(null);
  const [editAddonGroups, setEditAddonGroups] = useState<RegistrationAddonGroup[]>([]);
  const [editAddonOptionIds, setEditAddonOptionIds] = useState<string[]>([]);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editNotice, setEditNotice] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [emailTarget, setEmailTarget] = useState<ParticipantRow | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; label: string }>>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false);
  const [manualPaymentTarget, setManualPaymentTarget] = useState<ParticipantRow | null>(null);
  const [manualPaymentDrafts, setManualPaymentDrafts] = useState<Record<string, { method: string; paid_at: string; reference: string }>>({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [paymentOutcomes, setPaymentOutcomes] = useState<
    Array<{ name: string; registrationNumber: string; payment: PaymentChargeResponse }>
  >([]);
  const [bulkOutcomes, setBulkOutcomes] = useState<Array<{ name: string; success: boolean; message: string }>>([]);

  useEffect(() => {
    if (!editNotice) return;
    const timeout = window.setTimeout(() => setEditNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [editNotice]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const query = `&q=${encodeURIComponent(search.trim())}${statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : ""}`;
        let data: ParticipantRow[] = [];
        if (pageSize === 0) {
          let offset = 0;
          while (!cancelled) {
            const res = await api.get<ApiResponse<ParticipantRow[]>>(
              `/api/v1/events/${eventId}/participants?limit=200&offset=${offset}${query}`,
            );
            const batch = res.data ?? [];
            data = data.concat(batch);
            if (batch.length < 200) break;
            offset += batch.length;
          }
        } else {
          const res = await api.get<ApiResponse<ParticipantRow[]>>(
            `/api/v1/events/${eventId}/participants?limit=${pageSize}&offset=${(page - 1) * pageSize}${query}`,
          );
          data = res.data ?? [];
        }
        if (!cancelled) {
          setRows(data);
          setHasNextPage(pageSize !== 0 && data.length === pageSize);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setRows([]);
          setHasNextPage(false);
          setErr("Gagal memuat daftar peserta.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, page, pageSize, search, statusFilter, reloadTick, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ApiResponse<Array<{ id: string; label: string }>>>("/api/v1/payments/methods")
      .then((res) => {
        if (!cancelled) {
          setPaymentMethods(res.data ?? []);
          setPaymentMethod(res.data?.[0]?.id ?? "");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingPaymentMethods(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void api
      .get<ApiResponse<Refund[]>>(`/api/v1/events/${eventId}/refunds`)
      .then((res) => {
        if (!cancelled) setRefundEntries(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setRefundEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function exportCsv() {
    setErr(null);
    setExporting(true);
    try {
      const base = "";
      const res = await fetch(`${base}/api/v1/events/${eventId}/participants/export`, { credentials: "same-origin" });
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

  async function refundParticipant() {
    if (!refundTarget) return;
    if (
      !(await confirm({
        title: "Refund peserta?",
        message: `Refund tiket ${refundTarget.registration_number} akan diproses melalui sistem pembayaran. Tindakan ini tidak dapat dibatalkan.`,
        confirmLabel: "Proses refund",
        variant: "danger",
      }))
    )
      return;

    setErr(null);
    setRefundingId(refundTarget.id);
    try {
      const res = await api.post<ApiResponse<Refund>>(
        `/api/v1/events/${eventId}/registrations/${refundTarget.id}/refund`,
        { reason: refundReason.trim(), bank_account: refundBankAccount.trim() },
      );
      setRefundEntries((current) => [
        ...current.filter((item) => item.registration_id !== refundTarget.id),
        { ...res.data, registration_id: refundTarget.id, registration_number: refundTarget.registration_number },
      ]);
      setRows(
        (current) =>
          current?.map((item) =>
            item.id === refundTarget.id ? { ...item, status: "refunded", qr_token: undefined } : item,
          ) ?? null,
      );
      setRefundTarget(null);
      setRefundReason("");
      setRefundBankAccount("");
    } catch (error) {
      setErr(error instanceof ApiError ? error.message : "Refund gagal diproses.");
    } finally {
      setRefundingId(null);
    }
  }

  async function completeManualRefund(row: ParticipantRow, refund: Refund) {
    if (
      !(await confirm({
        title: "Tandai refund selesai?",
        message: `Pastikan transfer refund untuk ${row.registration_number} sudah benar-benar dilakukan sebelum menandai selesai.`,
        confirmLabel: "Tandai Selesai",
        variant: "primary",
      }))
    )
      return;

    setErr(null);
    setCompletingRefundId(refund.id);
    try {
      await api.post<ApiResponse<Refund>>(`/api/v1/organizer/refunds/${refund.id}/complete`);
      setRefundEntries((current) =>
        current.map((item) => (item.id === refund.id ? { ...item, status: "completed" } : item)),
      );
    } catch (error) {
      setErr(error instanceof ApiError ? error.message : "Gagal menandai refund selesai.");
    } finally {
      setCompletingRefundId(null);
    }
  }

  async function openParticipantEditor(row: ParticipantRow) {
    setEditTarget(row);
    setEditDraft(null);
    setEditAddonGroups([]);
    setEditAddonOptionIds([]);
    setEditError(null);
    setEditNotice(null);
    setLoadingEditId(row.id);
    try {
      const [participantRes, addonRes] = await Promise.all([
        api.get<ApiResponse<ParticipantEditableData>>(`/api/v1/events/${eventId}/participants/${row.id}/data`),
        api.get<ApiResponse<{ groups: RegistrationAddonGroup[] }>>(`/api/v1/events/${eventId}/addons`),
      ]);
      const addonGroups = addonRes.data.groups ?? [];
      setEditDraft(participantRes.data);
      setEditAddonGroups(addonGroups);
      const availableAddonIds = new Set(addonGroups.flatMap((group) => group.options.map((option) => option.id)));
      setEditAddonOptionIds(
        participantRes.data.addons?.map((addon) => addon.id).filter((id) => availableAddonIds.has(id)) ?? [],
      );
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Gagal memuat data peserta.";
      setEditError(message);
      setEditNotice({ type: "danger", message });
    } finally {
      setLoadingEditId(null);
    }
  }

  async function saveParticipantEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editDraft) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      const res = await api.patch<ApiResponse<ParticipantUpdateResult>>(
        `/api/v1/events/${eventId}/participants/${editDraft.id}/data`,
        {
          name: editDraft.name,
          email: editDraft.email,
          phone: editDraft.phone,
          birth_date: editDraft.birth_date,
          gender: editDraft.gender,
          extra_data: editDraft.extra_data,
          ...(editAddonGroups.length > 0 ? { addon_option_ids: editAddonOptionIds } : {}),
        },
      );
      const updated = res.data;
      setEditAddonOptionIds(updated.addons.map((addon) => addon.id));
      setRows(
        (current) =>
          current?.map((row) =>
            row.id === updated.id
              ? { ...row, name: updated.name, gender: updated.gender, age_class: updated.age_class }
              : row,
          ) ?? null,
      );
      setLoading(true);
      setReloadTick((value) => value + 1);
      setEditNotice({
        type: "success",
        message:
          editTarget?.status === "paid" && updated.addon_price_delta !== 0
            ? `Koreksi berhasil. Selisih add-on ${formatRupiah(Math.abs(updated.addon_price_delta))} perlu ${updated.addon_price_delta > 0 ? "ditagih" : "dikembalikan"} secara terpisah.`
            : updated.changed
              ? "Koreksi data peserta berhasil disimpan."
              : "Tidak ada perubahan pada data peserta.",
      });
      setEditTarget(null);
      setEditDraft(null);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Gagal menyimpan koreksi peserta.";
      setEditError(message);
      setEditNotice({ type: "danger", message });
    } finally {
      setSavingEdit(false);
    }
  }

  async function resendParticipantEmail() {
    if (!emailTarget) return;
    setResendingEmail(true);
    try {
      await api.post<ApiResponse<{ status: string }>>(
        `/api/v1/events/${eventId}/participants/${emailTarget.id}/emails/resend`,
        {},
      );
      setEditNotice({ type: "success", message: `Email e-ticket untuk ${emailTarget.name} masuk antrean pengiriman.` });
      setEmailTarget(null);
    } catch (error) {
      setEditNotice({
        type: "danger",
        message: error instanceof ApiError ? error.message : "Gagal mengantrekan email. Coba lagi.",
      });
    } finally {
      setResendingEmail(false);
    }
  }

  const selectedRows = (rows ?? []).filter((row) => selectedIds.includes(row.id));
  const isExpiredTable = statusFilter === "expired";
  const visibleParticipantIds = (rows ?? [])
    .filter((row) => (isExpiredTable ? row.status === "expired" : !showBulkActions || row.status === "pending_payment"))
    .map((row) => row.id);
  const allVisibleSelected =
    visibleParticipantIds.length > 0 && visibleParticipantIds.every((id) => selectedIds.includes(id));
  const toggleVisibleSelection = (checked: boolean) =>
    setSelectedIds((current) =>
      checked
        ? [...new Set([...current, ...visibleParticipantIds])]
        : current.filter((id) => !visibleParticipantIds.includes(id)),
    );
  const toggleRow = (participantId: string) =>
    setSelectedIds((current) =>
      current.includes(participantId) ? current.filter((id) => id !== participantId) : [...current, participantId],
    );
  const runSelected = async () => {
    const targets = selectedRows.filter((row) => row.status === "pending_payment" || row.status === "expired");
    if (!targets.length) return;
    if (!paymentMethod) {
      setErr("Metode payment belum tersedia.");
      return;
    }
    if (
      !(await confirm({
        title: "Buat tagihan payment?",
        message: `Aksi akan diproses untuk ${targets.length} peserta yang memenuhi syarat.`,
        confirmLabel: "Lanjutkan",
        variant: "primary",
      }))
    )
      return;
    setBulkBusy(true);
    setErr(null);
    setPaymentOutcomes([]);
    setBulkOutcomes([]);
    try {
      const response = await api.post<ApiResponse<PaymentChargeResponse>>(
        `/api/v1/events/${eventId}/participants/payments/charge`,
        { registration_ids: targets.map((row) => row.id), payment_method: paymentMethod },
      );
      if (response.data.status === "settlement") {
        const message = `${response.data.settled_count ?? targets.length} peserta cocok dengan Daftar Peserta Gratis dan langsung lunas tanpa payment.`;
        setBulkOutcomes([{ name: "Peserta gratis", success: true, message }]);
        setEditNotice({ type: "success", message });
      } else {
        const chargedCount = targets.length - (response.data.settled_count ?? 0);
        setPaymentOutcomes([
          { name: `Tagihan gabungan untuk ${chargedCount} peserta`, registrationNumber: "", payment: response.data },
        ]);
        const freeMessage = response.data.settled_count
          ? ` ${response.data.settled_count} peserta dari Daftar Peserta Gratis langsung lunas tanpa payment.`
          : "";
        setBulkOutcomes([
          {
            name: "Pembayaran gabungan",
            success: true,
            message: `Payment dibuat untuk peserta yang masih perlu membayar.${freeMessage}`,
          },
        ]);
        setEditNotice({ type: "success", message: `Payment gabungan dibuat.${freeMessage}` });
      }
      setSelectedIds([]);
      setLoading(true);
      setReloadTick((value) => value + 1);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Gagal membuat tagihan payment.";
      setBulkOutcomes([{ name: "Pembayaran gabungan", success: false, message }]);
      setEditNotice({ type: "danger", message });
      setSelectedIds([]);
      setLoading(true);
      setReloadTick((value) => value + 1);
      onChanged?.();
      if (error instanceof ApiError && error.code === "registration status does not allow payment") {
        const refreshedMessage =
          "Status peserta berubah sebelum payment dibuat. Daftar telah diperbarui; pilih peserta yang masih memenuhi syarat.";
        setBulkOutcomes([{ name: "Pembayaran gabungan", success: false, message: refreshedMessage }]);
        setSelectedIds([]);
        setLoading(true);
        setReloadTick((value) => value + 1);
        setEditNotice({ type: "danger", message: refreshedMessage });
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const markSelectedPaid = async () => {
    const targets = manualPaymentTarget ? [manualPaymentTarget] : [];
    if (!targets.length || targets.some((row) => !manualPaymentDrafts[row.id]?.method.trim() || !manualPaymentDrafts[row.id]?.paid_at || !manualPaymentDrafts[row.id]?.reference.trim())) {
      setErr("Lengkapi metode, waktu, dan referensi untuk setiap peserta."); return;
    }
    setBulkBusy(true); setErr(null); setBulkOutcomes([]);
    const outcomes = await Promise.all(targets.map(async (row) => {
      const draft = manualPaymentDrafts[row.id];
      try {
        await api.post(`/api/v1/events/${eventId}/participants/${row.id}/payments/manual`, { ...draft, paid_at: new Date(draft.paid_at).toISOString() });
        return { name: row.name, success: true, message: "Berhasil ditandai lunas." };
      } catch (error) {
        return { name: row.name, success: false, message: error instanceof ApiError ? error.message : "Gagal menandai lunas." };
      }
    }));
    setBulkOutcomes(outcomes); setSelectedIds([]); setManualPaymentOpen(false); setBulkBusy(false);
    setLoading(true); setReloadTick((value) => value + 1); onChanged?.();
  };
  const reactivateSelected = async () => {
    const targets = selectedRows.filter((row) => row.status === "expired");
    if (!targets.length) return;
    if (
      !(await confirm({
        title: "Aktifkan kembali pendaftaran?",
        message: `${targets.length} peserta akan diaktifkan kembali dan kuotanya dipesan selama satu jam. Payment tidak dibuat otomatis.`,
        confirmLabel: "Aktifkan kembali",
        variant: "primary",
      }))
    )
      return;
    setReactivating(true);
    setErr(null);
    setBulkOutcomes([]);
    try {
      await api.post(`/api/v1/events/${eventId}/participants/reactivate`, {
        registration_ids: targets.map((row) => row.id),
      });
      setSelectedIds([]);
      setBulkOutcomes([
        {
          name: "Aktifkan kembali",
          success: true,
          message: `${targets.length} pendaftaran aktif kembali. Pilih peserta di tabel belum lunas untuk membuat payment.`,
        },
      ]);
      setEditNotice({ type: "success", message: `${targets.length} pendaftaran aktif kembali.` });
      onChanged?.();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Gagal mengaktifkan kembali pendaftaran.";
      setBulkOutcomes([{ name: "Aktifkan kembali", success: false, message }]);
    } finally {
      setReactivating(false);
    }
  };
  const reactivateOne = async (row: ParticipantRow) => {
    if (
      !(await confirm({
        title: "Aktifkan kembali pendaftaran?",
        message: `Pendaftaran ${row.name} akan aktif kembali dan kuotanya dipesan selama satu jam. Payment tidak dibuat otomatis.`,
        confirmLabel: "Aktifkan kembali",
        variant: "primary",
      }))
    )
      return;
    setReactivatingId(row.id);
    setErr(null);
    try {
      await api.post(`/api/v1/events/${eventId}/participants/reactivate`, { registration_ids: [row.id] });
      setSelectedIds((current) => current.filter((id) => id !== row.id));
      setBulkOutcomes([
        {
          name: row.name,
          success: true,
          message: "Pendaftaran aktif kembali. Peserta dapat dipilih di tabel belum lunas untuk dibuatkan payment.",
        },
      ]);
      setEditNotice({ type: "success", message: `Pendaftaran ${row.name} aktif kembali.` });
      onChanged?.();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Gagal mengaktifkan kembali pendaftaran.";
      setBulkOutcomes([{ name: row.name, success: false, message }]);
    } finally {
      setReactivatingId(null);
    }
  };

  const runningCols: Column<ParticipantRow>[] = isRunning
    ? [
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
        { key: "age", header: "Kelas", render: (r) => formatAgeClass(r.age_class, r.category_name) || "—" },
        {
          key: "rpc",
          header: "RPC",
          render: (r) =>
            r.rpc_status ? <Badge variant="ok">✓</Badge> : <span style={{ color: "var(--color-ink-3)" }}>—</span>,
        },
        {
          key: "raceday",
          header: "Hari-H",
          render: (r) =>
            r.raceday_status ? <Badge variant="ok">✓</Badge> : <span style={{ color: "var(--color-ink-3)" }}>—</span>,
        },
      ]
    : [];
  const showRaceOperations = statusFilter !== "expired" && statusFilter !== "pending_payment";
  const cols: Column<ParticipantRow>[] = [
    ...(showBulkActions
      ? [
          {
            key: "select",
            header: (
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <input
                  type="checkbox"
                  aria-label="Pilih semua peserta di tabel"
                  checked={allVisibleSelected}
                  disabled={loading || visibleParticipantIds.length === 0}
                  onChange={(event) => toggleVisibleSelection(event.target.checked)}
                />{" "}
                Semua
              </label>
            ),
            render: (row: ParticipantRow) => (
              <input
                type="checkbox"
                aria-label={`Pilih ${row.name}`}
                disabled={isExpiredTable ? row.status !== "expired" : row.status !== "pending_payment"}
                checked={selectedIds.includes(row.id)}
                onChange={() => toggleRow(row.id)}
              />
            ),
          } as Column<ParticipantRow>,
        ]
      : []),
    ...(showRaceOperations ? runningCols.slice(0, 1) : []),
    { key: "reg", header: "No. Reg", render: (r) => r.registration_number, mono: true },
    { key: "name", header: "Nama", render: (r) => r.name },
    { key: "distance", header: "Kategori", render: (r) => r.category_name },
    { key: "ticket", header: "Tiket", render: (r) => r.ticket_name },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.status === "paid" ? "ok" : r.status === "pending_payment" ? "warn" : "neutral"}>
          {r.status === "paid"
            ? "Lunas"
            : r.status === "pending_payment"
              ? "Belum dibayar"
              : r.status === "expired"
                ? "Kedaluwarsa"
                : r.status}
        </Badge>
      ),
    },
    ...(showRaceOperations ? runningCols.slice(5) : runningCols.slice(5, 7)),
    {
      key: "actions",
      header: "Aksi",
      render: (r) => {
        const refund =
          r.status === "refunded" ? refundEntries.find((item) => item.registration_id === r.id) : undefined;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minWidth: 210 }}>
            {r.status === "pending_payment" && showBulkActions && (
              <Button variant="secondary" size="sm" disabled={bulkBusy} onClick={() => { setManualPaymentTarget(r); setManualPaymentOpen(true); }}>
                Tandai lunas
              </Button>
            )}
            {(r.status === "paid" || r.status === "pending_payment") && (
              <Button
                variant="secondary"
                size="sm"
                disabled={loadingEditId !== null}
                onClick={() => void openParticipantEditor(r)}
              >
                {loadingEditId === r.id ? "Memuat…" : "Edit"}
              </Button>
            )}
            {r.status === "paid" && (
              <>
                {r.qr_token && (
                  <Link
                    href={`/ticket/${encodeURIComponent(r.registration_number)}?token=${encodeURIComponent(r.qr_token)}`}
                    className="btn btn-secondary btn-sm"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Lihat E-Ticket
                  </Link>
                )}
                <Button
                  variant="secondary"
                  className="btn-email"
                  size="sm"
                  disabled={resendingEmail}
                  onClick={() => setEmailTarget(r)}
                >
                  Kirim Email
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={refundingId !== null}
                  onClick={() => {
                    setRefundTarget(r);
                    setRefundReason("");
                    setRefundBankAccount("");
                  }}
                >
                  {refundingId === r.id ? "Memproses…" : "Refund"}
                </Button>
              </>
            )}
            {refund?.status === "processing" && refund.mode === "manual" && (
              <Button
                variant="primary"
                size="sm"
                disabled={completingRefundId !== null}
                onClick={() => void completeManualRefund(r, refund)}
              >
                {completingRefundId === refund.id ? "Memproses…" : "Tandai Selesai"}
              </Button>
            )}
            {refund?.status === "completed" && <Badge variant="ok">Refund selesai</Badge>}
            {refund?.status === "processing" && refund.mode !== "manual" && (
              <Badge variant="warn">Refund diproses</Badge>
            )}
            {r.status === "refunded" && refund?.status !== "completed" && refund?.status !== "processing" && (
              <Badge variant="danger">Refunded</Badge>
            )}
            {isExpiredTable && r.status === "expired" && (
              <Button
                variant="secondary"
                size="sm"
                disabled={reactivatingId !== null || reactivating}
                onClick={() => void reactivateOne(r)}
              >
                {reactivatingId === r.id ? "Mengaktifkan…" : "Aktifkan kembali"}
              </Button>
            )}
            {r.status !== "paid" &&
              r.status !== "pending_payment" &&
              r.status !== "refunded" &&
              !(isExpiredTable && r.status === "expired") &&
              "—"}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {editNotice &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{ position: "fixed", top: 20, right: 20, zIndex: 11000, width: "min(420px, calc(100vw - 32px))" }}
          >
            <Alert variant={editNotice.type}>
              <span aria-live="polite">{editNotice.message}</span>
            </Alert>
          </div>,
          document.body,
        )}
      {emailTarget &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resend-email-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !resendingEmail) setEmailTarget(null);
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              display: "grid",
              placeItems: "center",
              padding: 16,
              background: "rgba(20,24,31,.78)",
            }}
          >
            <section
              style={{
                width: "min(100%, 480px)",
                padding: 24,
                borderRadius: "var(--radius-lg)",
                background: "var(--color-panel)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-line)",
                boxShadow: "var(--shadow-sh-3)",
              }}
            >
              <h2
                id="resend-email-title"
                style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontSize: 22 }}
              >
                Kirim ulang email
              </h2>
              <p style={{ margin: "0 0 16px", color: "var(--color-ink-2)", fontSize: 14 }}>
                {emailTarget.name} · {emailTarget.registration_number}
              </p>
              <div style={{ border: "1px solid var(--color-line)", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <strong>E-ticket</strong>
                <p style={{ margin: "6px 0 0", color: "var(--color-ink-2)", fontSize: 13 }}>
                  Email berisi tautan e-ticket dan QR peserta, dikirim ke alamat email yang saat ini tersimpan.
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button variant="secondary" size="sm" disabled={resendingEmail} onClick={() => setEmailTarget(null)}>
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={resendingEmail}
                  onClick={() => void resendParticipantEmail()}
                >
                  {resendingEmail ? "Mengantrekan…" : "Kirim e-ticket"}
                </Button>
              </div>
            </section>
          </div>,
          document.body,
        )}
      {editTarget &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="participant-edit-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !savingEdit) {
                setEditTarget(null);
                setEditDraft(null);
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflowY: "auto",
              boxSizing: "border-box",
              padding: "24px 16px",
              background: "rgba(20,24,31,.78)",
            }}
          >
            <section
              style={{
                width: "min(100%, 640px)",
                maxHeight: "calc(100dvh - 48px)",
                overflowY: "auto",
                padding: 24,
                borderRadius: "var(--radius-lg)",
                background: "var(--color-panel)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-line)",
                boxShadow: "var(--shadow-sh-3)",
                boxSizing: "border-box",
              }}
            >
              <h2
                id="participant-edit-title"
                style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontSize: 22 }}
              >
                Koreksi data peserta
              </h2>
              <p style={{ margin: "0 0 20px", color: "var(--color-ink-2)", fontSize: 14 }}>
                {editTarget.name} · {editTarget.registration_number}
              </p>
              {editError && (
                <Alert variant="danger" className="mb-4">
                  {editError}
                </Alert>
              )}
              {loadingEditId === editTarget.id && !editDraft ? (
                <p style={{ color: "var(--color-ink-3)" }}>Memuat data peserta…</p>
              ) : editDraft ? (
                <form onSubmit={(event) => void saveParticipantEdit(event)}>
                  <div
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}
                  >
                    <div>
                      <label className="field-label" htmlFor="participant-edit-name">
                        Nama peserta
                      </label>
                      <input
                        id="participant-edit-name"
                        className="field-input"
                        required
                        maxLength={200}
                        value={editDraft.name}
                        onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="participant-edit-email">
                        Email
                      </label>
                      <input
                        id="participant-edit-email"
                        className="field-input"
                        type="email"
                        required
                        value={editDraft.email}
                        onChange={(event) => setEditDraft({ ...editDraft, email: event.target.value })}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="participant-edit-phone">
                        Nomor HP
                      </label>
                      <input
                        id="participant-edit-phone"
                        className="field-input"
                        type="tel"
                        required
                        value={editDraft.phone}
                        onChange={(event) => setEditDraft({ ...editDraft, phone: event.target.value })}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="participant-edit-birth-date">
                        Tanggal lahir
                      </label>
                      <input
                        id="participant-edit-birth-date"
                        className="field-input"
                        type="date"
                        required
                        max={new Date().toISOString().slice(0, 10)}
                        value={editDraft.birth_date}
                        onChange={(event) => setEditDraft({ ...editDraft, birth_date: event.target.value })}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="participant-edit-gender">
                        Jenis kelamin
                      </label>
                      <select
                        id="participant-edit-gender"
                        className="field-input"
                        required
                        value={editDraft.gender}
                        onChange={(event) => setEditDraft({ ...editDraft, gender: event.target.value })}
                        style={{ width: "100%" }}
                      >
                        <option value="male">Laki-laki</option>
                        <option value="female">Perempuan</option>
                        {editDraft.gender !== "male" && editDraft.gender !== "female" && (
                          <option value={editDraft.gender}>{editDraft.gender}</option>
                        )}
                      </select>
                    </div>
                    {editAddonGroups.length > 0 && (
                      <fieldset
                        style={{ border: "1px solid var(--color-line)", borderRadius: "var(--radius-sm)", gridColumn: "1 / -1", margin: 0, padding: 14 }}
                      >
                        <legend style={{ fontSize: 14, fontWeight: 600, padding: "0 6px" }}>Add-ons peserta</legend>
                        {editAddonGroups.map((group) => (
                          <div key={group.id} style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{group.title}</div>
                            <div style={{ display: "grid", gap: 6 }}>
                              {group.options.map((option) => (
                                <label key={option.id} style={{ alignItems: "center", display: "flex", gap: 8, fontSize: 14 }}>
                                  <input
                                    type="radio"
                                    name={`participant-addon-${group.id}`}
                                    required
                                    checked={editAddonOptionIds.includes(option.id)}
                                    onChange={() =>
                                      setEditAddonOptionIds((current) => [
                                        ...current.filter((id) => !group.options.some((item) => item.id === id)),
                                        option.id,
                                      ])
                                    }
                                  />
                                  <span>{option.name}</span>
                                  <span style={{ color: "var(--color-ink-3)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>
                                    {formatRupiah(option.price)}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                        {editTarget.status === "paid" && (
                          <p style={{ color: "var(--color-ink-3)", fontSize: 12, margin: "4px 0 0" }}>
                            Perubahan add-on tidak mengubah pembayaran yang sudah tercatat. Selisih harga, jika ada,
                            ditagih atau dikembalikan secara terpisah sesuai hasil koreksi.
                          </p>
                        )}
                      </fieldset>
                    )}
                    {editDraft.fields.map((field) => {
                      const value = editDraft.extra_data[field.id] ?? "";
                      const setValue = (next: string) =>
                        setEditDraft({
                          ...editDraft,
                          extra_data: { ...editDraft.extra_data, [field.id]: next },
                        });
                      return (
                        <div
                          key={field.id}
                          style={field.field_type === "textarea" ? { gridColumn: "1 / -1" } : undefined}
                        >
                          <label className="field-label" htmlFor={`participant-extra-${field.id}`}>
                            {field.label}
                            {field.required ? " *" : ""}
                          </label>
                          {field.field_type === "textarea" ? (
                            <textarea
                              id={`participant-extra-${field.id}`}
                              className="field-input"
                              required={field.required}
                              value={value}
                              onChange={(event) => setValue(event.target.value)}
                              rows={3}
                              style={{ width: "100%", resize: "vertical" }}
                            />
                          ) : field.field_type === "select" || field.field_type === "radio" ? (
                            <select
                              id={`participant-extra-${field.id}`}
                              className="field-input"
                              required={field.required}
                              value={value}
                              onChange={(event) => setValue(event.target.value)}
                              style={{ width: "100%" }}
                            >
                              <option value="">Pilih…</option>
                              {field.options
                                .split(",")
                                .map((option) => option.trim())
                                .filter(Boolean)
                                .map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                            </select>
                          ) : field.field_type === "checkbox" ? (
                            <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 42 }}>
                              <input
                                id={`participant-extra-${field.id}`}
                                type="checkbox"
                                required={field.required}
                                checked={value === "true"}
                                onChange={(event) => setValue(event.target.checked ? "true" : "false")}
                              />
                              <span>{field.placeholder || field.label}</span>
                            </label>
                          ) : (
                            <input
                              id={`participant-extra-${field.id}`}
                              className="field-input"
                              type={
                                field.field_type === "date"
                                  ? "date"
                                  : field.field_type === "email"
                                    ? "email"
                                    : field.field_type === "number"
                                      ? "number"
                                      : "text"
                              }
                              required={field.required}
                              value={value}
                              onChange={(event) => setValue(event.target.value)}
                              style={{ width: "100%" }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ margin: "16px 0", color: "var(--color-ink-3)", fontSize: 12 }}>
                    Koreksi tidak mengubah pembayaran yang sudah tercatat, tiket, BIB, refund, atau status check-in.
                    Perubahan add-on dan data peserta dicatat di audit log.
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={savingEdit}
                      onClick={() => {
                        setEditTarget(null);
                        setEditDraft(null);
                      }}
                    >
                      Batal
                    </Button>
                    <Button type="submit" variant="primary" size="sm" disabled={savingEdit}>
                      {savingEdit ? "Menyimpan…" : "Simpan koreksi"}
                    </Button>
                  </div>
                </form>
              ) : null}
            </section>
          </div>,
          document.body,
        )}
      {refundTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="participant-refund-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && refundingId === null) setRefundTarget(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            padding: 16,
            background: "rgba(20,24,31,.78)",
          }}
        >
          <section
            style={{
              width: "min(100%, 480px)",
              maxHeight: "calc(100vh - 32px)",
              overflowY: "auto",
              padding: 24,
              borderRadius: "var(--radius-lg)",
              background: "var(--color-surface)",
              color: "var(--color-ink)",
              border: "1px solid var(--color-line)",
              boxShadow: "var(--shadow-sh-3)",
            }}
          >
            <h2
              id="participant-refund-title"
              style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: 22 }}
            >
              Refund peserta
            </h2>
            <p style={{ margin: "0 0 20px", color: "var(--color-ink-2)", fontSize: 14 }}>
              {refundTarget.name} · {refundTarget.registration_number}
            </p>
            <label className="field-label" htmlFor="refund-reason">
              Alasan refund
            </label>
            <textarea
              id="refund-reason"
              className="field-input"
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Opsional"
              style={{ width: "100%", resize: "vertical", marginBottom: 16 }}
            />
            <label className="field-label" htmlFor="refund-bank-account">
              Nomor rekening tujuan
            </label>
            <input
              id="refund-bank-account"
              className="field-input"
              value={refundBankAccount}
              onChange={(event) => setRefundBankAccount(event.target.value)}
              autoComplete="off"
              placeholder="Wajib untuk refund manual"
              style={{ width: "100%", marginBottom: 8 }}
            />
            <p style={{ margin: "0 0 20px", color: "var(--color-ink-3)", fontSize: 12 }}>
              Refund manual memerlukan nomor rekening. Nilai refund dan metode pemrosesan ditentukan backend.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={refundingId !== null}
                onClick={() => setRefundTarget(null)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={refundingId !== null}
                onClick={() => void refundParticipant()}
              >
                {refundingId === refundTarget.id ? "Memproses…" : "Lanjutkan refund"}
              </Button>
            </div>
          </section>
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input
            type="search"
            className="field-input"
            placeholder="Cari peserta…"
            aria-label="Cari peserta berdasarkan nama, nomor registrasi, BIB, atau kategori"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
              setSelectedIds([]);
              setLoading(true);
              setErr(null);
            }}
            style={{ width: "min(260px, 40vw)" }}
          />
          <label htmlFor="participants-page-size" style={{ fontSize: 14, color: "var(--color-ink-3)" }}>
            Baris per halaman
          </label>
          <select
            id="participants-page-size"
            className="field-input"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
              setSelectedIds([]);
              setLoading(true);
              setErr(null);
            }}
            style={{ width: 90, padding: "6px 8px" }}
          >
            {[8, 16, 24].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
            {statusFilter === "pending_payment" && <option value={0}>Semua</option>}
          </select>
          <span style={{ fontSize: 14, color: "var(--color-ink-3)" }} aria-live="polite">
            {loading
              ? "Memuat peserta…"
              : pageSize === 0
                ? `${rows?.length ?? 0} peserta ditampilkan`
                : `${rows?.length ?? 0} peserta di halaman ini`}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isRunning && statusFilter !== "pending_payment" && statusFilter !== "expired" && (
            <Button variant="secondary" size="sm" disabled={rpcExporting} onClick={exportRPCCsv}>
              {rpcExporting ? "Mengekspor…" : "Download Rekap RPC"}
            </Button>
          )}
          {statusFilter !== "pending_payment" && statusFilter !== "expired" && (
            <Button variant="secondary" size="sm" disabled={exporting} onClick={exportCsv}>
              {exporting ? "Mengekspor…" : "Export CSV"}
            </Button>
          )}
        </div>
      </div>
      {showBulkActions && selectedRows.length > 0 && !manualPaymentOpen && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            padding: 12,
            marginBottom: 14,
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-panel)",
          }}
        >
          <strong style={{ fontSize: 13 }}>{selectedRows.length} dipilih</strong>
          {isExpiredTable ? (
            <Button variant="secondary" size="sm" disabled={reactivating} onClick={() => void reactivateSelected()}>
              {reactivating ? "Mengaktifkan…" : "Aktifkan kembali"}
            </Button>
          ) : (
            <>
              <select
                className="field-input"
                aria-label="Metode payment"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                disabled={loadingPaymentMethods || paymentMethods.length === 0}
                style={{ maxWidth: 210 }}
              >
                <option value="">
                  {loadingPaymentMethods
                    ? "Memuat metode payment…"
                    : paymentMethods.length === 0
                      ? "Metode payment tidak tersedia"
                      : "Pilih metode payment"}
                </option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="sm"
                disabled={bulkBusy || loadingPaymentMethods || paymentMethods.length === 0}
                onClick={() => void runSelected()}
              >
                {loadingPaymentMethods ? "Memuat metode…" : "Buat payment"}
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
            Batal pilih
          </Button>
        </div>
      )}
      {manualPaymentOpen && manualPaymentTarget?.status === "pending_payment" && (
        createPortal(<div role="presentation" onClick={() => !bulkBusy && setManualPaymentOpen(false)} style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", zIndex: 2147483000, background: "rgba(0,0,0,.55)", display: "grid", placeItems: "center", padding: 16, boxSizing: "border-box" }}>
        <section role="dialog" aria-modal="true" aria-labelledby="manual-payment-title" onClick={(event) => event.stopPropagation()} style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(560px, calc(100vw - 32px))", maxHeight: "calc(100dvh - 32px)", overflowY: "auto", padding: 22, border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", background: "var(--color-surface)", boxShadow: "0 16px 48px rgba(0,0,0,.2)", boxSizing: "border-box" }}>
          <strong id="manual-payment-title">Detail pembayaran per peserta</strong>
          <button type="button" aria-label="Tutup dialog" disabled={bulkBusy} onClick={() => setManualPaymentOpen(false)} style={{ float: "right", border: 0, background: "transparent", fontSize: 20, cursor: "pointer", color: "var(--color-ink-3)" }}>×</button>
          {[manualPaymentTarget].map((row) => {
            const draft = manualPaymentDrafts[row.id] ?? { method: "", paid_at: "", reference: "" };
            const update = (patch: Partial<typeof draft>) => setManualPaymentDrafts((all) => ({ ...all, [row.id]: { ...draft, ...patch } }));
            return <div key={row.id} style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--color-line)" }}>
              <strong>{row.name} · {row.registration_number}</strong>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 12, marginTop: 12 }}>
                <label style={{ display: "grid", gap: 5, fontSize: 12 }}>Metode pembayaran<input className="field-input" aria-label={`Metode pembayaran ${row.name}`} value={draft.method} onChange={(e) => update({ method: e.target.value })} /></label>
                <label style={{ display: "grid", gap: 5, fontSize: 12 }}>Waktu pembayaran<input className="field-input" aria-label={`Waktu pembayaran ${row.name}`} type="datetime-local" value={draft.paid_at} onChange={(e) => update({ paid_at: e.target.value })} /></label>
                <label style={{ display: "grid", gap: 5, fontSize: 12 }}>Referensi<input className="field-input" aria-label={`Referensi pembayaran ${row.name}`} value={draft.reference} onChange={(e) => update({ reference: e.target.value })} /></label>
              </div>
            </div>;
          })}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button variant="ghost" size="sm" disabled={bulkBusy} onClick={() => setManualPaymentOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" disabled={bulkBusy} onClick={() => void markSelectedPaid()}>{bulkBusy ? "Memproses…" : "Simpan dan tandai lunas"}</Button>
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--color-ink-3)", margin: "14px 0 0" }}>Harga, donasi, fee, dan pencatatan saldo dihitung serta diproses oleh backend mengikuti aturan pembayaran biasa.</p>
        </section></div>, document.body)
      )}
      {showBulkActions && !isExpiredTable && paymentOutcomes.length > 0 && (
        <div
          style={{
            padding: 14,
            marginBottom: 14,
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-surface)",
          }}
        >
          <strong>Instruksi payment dibuat</strong>
          {paymentOutcomes.map((item) => (
            <div
              key={item.payment.transaction_id}
              style={{ fontSize: 13, paddingTop: 10, marginTop: 10, borderTop: "1px solid var(--color-line)" }}
            >
              <strong>
                {item.name}
                {item.registrationNumber ? ` · ${item.registrationNumber}` : ""}
              </strong>
              {item.payment.qr_string && (
                <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
                  <div style={{ background: "#fff", padding: 12, borderRadius: "var(--radius-md)" }}>
                    {/^https?:\/\//i.test(item.payment.qr_string) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.payment.qr_string}
                        alt="Kode QR pembayaran"
                        width={280}
                        height={280}
                        style={{ display: "block", maxWidth: "100%", height: "auto" }}
                      />
                    ) : (
                      <QRCodeSVG
                        value={item.payment.qr_string}
                        size={280}
                        level="M"
                        style={{ display: "block", maxWidth: "100%", height: "auto" }}
                      />
                    )}
                  </div>
                </div>
              )}
              <div style={{ fontFamily: "var(--font-mono)", overflowWrap: "anywhere", marginTop: 4 }}>
                {item.payment.va_number ? `VA ${item.payment.va_number}` : ""}
                {item.payment.biller_code ? ` · Kode perusahaan ${item.payment.biller_code}` : ""}
                {item.payment.bill_key ? ` · Kode pembayaran ${item.payment.bill_key}` : ""}
                {item.payment.payment_url ? ` · ${item.payment.payment_url}` : ""}
                {item.payment.deeplink_url ? ` · ${item.payment.deeplink_url}` : ""}
              </div>
              <div>
                Harga: Rp {item.payment.quote.price.toLocaleString("id-ID")} · Donasi: Rp{" "}
                {item.payment.quote.donation.toLocaleString("id-ID")} · Fee Platform: Rp{" "}
                {item.payment.quote.fee_platform.toLocaleString("id-ID")} · Fee Payment: Rp{" "}
                {item.payment.quote.fee_midtrans.toLocaleString("id-ID")}
              </div>
              <strong>Subtotal: Rp {item.payment.quote.sub_total.toLocaleString("id-ID")}</strong>
            </div>
          ))}
        </div>
      )}
      {showBulkActions && bulkOutcomes.length > 0 && (
        <div
          style={{
            padding: 14,
            marginBottom: 14,
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-surface)",
          }}
        >
          <strong>Hasil aksi massal</strong>
          {bulkOutcomes.map((item, index) => (
            <p
              key={`${item.name}-${index}`}
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                color: item.success ? "var(--color-ok)" : "var(--color-danger)",
              }}
            >
              {item.name}: {item.message}
            </p>
          ))}
        </div>
      )}
      {err && (
        <Alert variant="danger" className="mb-4">
          {err}
        </Alert>
      )}
      {!loading && rows && rows.length === 0 && page === 1 ? (
        <p style={{ color: "var(--color-ink-3)", fontSize: 15 }}>
          {statusFilter === "pending_payment"
            ? "Tidak ada peserta yang belum lunas."
            : statusFilter === "expired"
              ? "Tidak ada peserta kedaluwarsa."
              : "Belum ada peserta."}
        </p>
      ) : (
        <>
          <DataTable
            columns={cols}
            data={loading ? [] : (rows ?? [])}
            keyField="id"
            minRows={pageSize === 0 ? 8 : pageSize}
            loading={loading}
          />
          {pageSize !== 0 && (
            <div
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16 }}
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => {
                  setSelectedIds([]);
                  setLoading(true);
                  setPage((current) => Math.max(1, current - 1));
                }}
              >
                Sebelumnya
              </Button>
              <span style={{ fontSize: 14, color: "var(--color-ink-3)" }}>Halaman {page}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasNextPage}
                onClick={() => {
                  setSelectedIds([]);
                  setLoading(true);
                  setPage((current) => current + 1);
                }}
              >
                Berikutnya
              </Button>
            </div>
          )}
        </>
      )}
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
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (err) return <p style={{ color: "var(--color-ink-3)" }}>{err}</p>;
  if (!report) return <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 4 }}>Pendapatan Tiket</div>
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
        <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 4 }}>Total Donasi (terpisah)</div>
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
        Donasi yang sudah settled dari peserta. Pisah dari pendapatan tiket dan tidak bisa di-withdraw - disalurkan ke
        penerima donasi.
      </p>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 4 }}>Total Donasi Settled</div>
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
        <p style={{ fontSize: 15, color: "var(--color-ink-3)" }}>Belum ada donasi yang masuk.</p>
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
                <tr key={e.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
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
                    {e.created_at ? new Date(e.created_at).toLocaleString("id-ID") : "—"}
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
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);

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
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const REFUND_STATUS: Record<string, { label: string; variant: "ok" | "warn" | "danger" }> = {
    requested: { label: "Menunggu review", variant: "warn" },
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
          <div
            style={{
              fontSize: 13,
              color: "var(--color-ink-3)",
              marginBottom: 4,
            }}
          >
            Jumlah Refund
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
        <table style={{ width: "100%", minWidth: 1120, borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr
              style={{
                borderBottom: "2px solid var(--color-line)",
                textAlign: "left",
              }}
            >
              <th style={th}>No. registrasi</th>
              <th style={th}>Tanggal</th>
              <th style={th}>Total Dibayarkan</th>
              <th style={th}>Dana Refund</th>
              <th style={th}>Metode</th>
              <th style={th}>Status</th>
              <th style={th}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((r) => {
              const s = REFUND_STATUS[r.status] ?? {
                label: r.status,
                variant: "warn" as const,
              };
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                  <td style={td}>
                    <code style={{ fontSize: 12 }}>{r.registration_number || `${r.registration_id.slice(0, 8)}…`}</code>
                  </td>
                  <td style={td}>{r.created_at ? new Date(r.created_at).toLocaleString("id-ID") : "—"}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)" }}>
                    {r.payment_sub_total === undefined ? "—" : formatRupiah(r.payment_sub_total)}
                  </td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-danger)" }}>
                    {formatRupiah(r.amount)}
                  </td>
                  <td style={td}>
                    {r.method} · {r.mode === "auto" ? "Otomatis" : "Manual"}
                  </td>
                  <td style={td}>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </td>
                  <td style={td}>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedRefund(r)}>
                      Lihat Detail
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedRefund &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-detail-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedRefund(null);
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "grid",
              alignContent: "start",
              justifyItems: "center",
              overflowY: "auto",
              boxSizing: "border-box",
              padding: "24px 16px",
              background: "rgba(20,24,31,.78)",
            }}
          >
            <section
              style={{
                width: "min(100%, 540px)",
                maxHeight: "calc(100dvh - 48px)",
                overflowY: "auto",
                padding: 24,
                borderRadius: "var(--radius-lg)",
                background: "var(--color-panel)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-line)",
                boxShadow: "var(--shadow-sh-3)",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <p
                    style={{
                      margin: "0 0 5px",
                      color: "var(--color-sprint)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: ".1em",
                    }}
                  >
                    RINCIAN TRANSAKSI REFUND
                  </p>
                  <h2
                    id="refund-detail-title"
                    style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 23, lineHeight: 1.2 }}
                  >
                    {selectedRefund.registration_number || "Detail Refund"}
                  </h2>
                  <p style={{ margin: "6px 0 0", color: "var(--color-ink-2)", fontSize: 14, fontWeight: 600 }}>
                    {selectedRefund.participant_name || "Nama peserta tidak tersedia"}
                  </p>
                  <p style={{ margin: "6px 0 0", color: "var(--color-ink-3)", fontSize: 13 }}>
                    {selectedRefund.created_at
                      ? new Date(selectedRefund.created_at).toLocaleString("id-ID")
                      : "Tanggal tidak tersedia"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Tutup detail refund"
                  onClick={() => setSelectedRefund(null)}
                  style={{
                    width: 36,
                    height: 36,
                    border: "1px solid var(--color-line)",
                    borderRadius: 999,
                    background: "var(--color-surface)",
                    color: "var(--color-ink-2)",
                    fontSize: 22,
                    lineHeight: 1,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 18,
                  padding: 16,
                  border: "1px solid var(--color-danger-tint)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-surface)",
                }}
              >
                <div>
                  <div style={{ color: "var(--color-ink-3)", fontSize: 12, marginBottom: 4 }}>Dana refund</div>
                  <div
                    style={{
                      color: "var(--color-danger)",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: 24,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatRupiah(selectedRefund.amount)}
                  </div>
                </div>
                <Badge variant={REFUND_STATUS[selectedRefund.status]?.variant ?? "warn"}>
                  {REFUND_STATUS[selectedRefund.status]?.label ?? selectedRefund.status}
                </Badge>
              </div>

              <section style={{ marginTop: 20 }}>
                <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: 16 }}>Data peserta</h3>
                <dl
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 8,
                    margin: 0,
                  }}
                >
                  <RefundInfo label="Nama" value={selectedRefund.participant_name || "—"} />
                  <RefundInfo label="Email" value={selectedRefund.participant_email || "—"} />
                  <RefundInfo label="Nomor telepon" value={selectedRefund.participant_phone || "—"} />
                  <RefundInfo label="Tanggal lahir" value={selectedRefund.participant_birth_date || "—"} />
                  <RefundInfo label="Nomor BIB" value={selectedRefund.bib_number || "—"} />
                  <RefundInfo label="Gender" value={selectedRefund.gender || "—"} />
                  <RefundInfo
                    label="Kelas usia"
                    value={formatAgeClass(selectedRefund.age_class, selectedRefund.category_name) || "—"}
                  />
                  <RefundInfo label="Kategori" value={selectedRefund.category_name || "—"} />
                  <RefundInfo label="Kategori tiket" value={selectedRefund.ticket_name || "—"} />
                </dl>
              </section>

              <section style={{ marginTop: 22 }}>
                <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: 16 }}>
                  Rincian pembayaran
                </h3>
                <dl
                  style={{
                    margin: 0,
                    padding: "4px 14px",
                    border: "1px solid var(--color-line)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-surface)",
                  }}
                >
                  <RefundMoneyRow
                    label="Harga Event"
                    value={
                      selectedRefund.ticket_base_price === undefined
                        ? selectedRefund.ticket_price === undefined
                          ? "—"
                          : formatRupiah(selectedRefund.ticket_price)
                        : formatRupiah(selectedRefund.ticket_base_price)
                    }
                  />
                  {selectedRefund.addons?.map((addon) => (
                    <RefundMoneyRow
                      key={addon.id}
                      label={`Add-on: ${addon.title} - ${addon.name}`}
                      value={formatRupiah(addon.price)}
                    />
                  ))}
                  <RefundMoneyRow
                    label="Fee Platform"
                    value={selectedRefund.fee_platform === undefined ? "—" : formatRupiah(selectedRefund.fee_platform)}
                  />
                  <RefundMoneyRow label="Biaya Transaksi" value={formatRupiah(selectedRefund.fee_midtrans)} />
                  <RefundMoneyRow
                    label="Donasi"
                    value={`${formatRupiah(selectedRefund.donation)}${selectedRefund.donation > 0 ? (selectedRefund.donation_still_given ? " · tetap disalurkan" : " · dikembalikan") : ""}`}
                  />
                  <RefundMoneyRow
                    label="Total dibayarkan"
                    value={
                      selectedRefund.payment_sub_total === undefined
                        ? "—"
                        : formatRupiah(selectedRefund.payment_sub_total)
                    }
                    strong
                  />
                </dl>
              </section>

              <section style={{ marginTop: 20 }}>
                <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: 16 }}>Informasi refund</h3>
                <dl
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 8,
                    margin: 0,
                  }}
                >
                  <RefundInfo label="Metode" value={selectedRefund.method || "—"} />
                  <RefundInfo label="Mode" value={selectedRefund.mode === "auto" ? "Otomatis" : "Manual"} />
                  <RefundInfo label="Rekening tujuan" value={selectedRefund.bank_account || "Tidak ada"} />
                  <RefundInfo label="Alasan" value={selectedRefund.reason || "Tidak dicantumkan"} />
                </dl>
              </section>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <Button variant="secondary" onClick={() => setSelectedRefund(null)}>
                  Tutup
                </Button>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </div>
  );
}

function RefundMoneyRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 16,
        padding: "10px 0",
        borderBottom: "1px solid var(--color-line)",
        fontWeight: strong ? 700 : 400,
      }}
    >
      <dt style={{ color: strong ? "var(--color-ink)" : "var(--color-ink-2)", fontSize: 13 }}>{label}</dt>
      <dd
        style={{
          margin: 0,
          textAlign: "right",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          fontVariantNumeric: "tabular-nums",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </dd>
    </div>
  );
}

function RefundInfo({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 11,
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-sm)",
        background: "var(--color-surface)",
        minWidth: 0,
      }}
    >
      <dt style={{ color: "var(--color-ink-3)", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{label}</dt>
      <dd style={{ margin: 0, color: "var(--color-ink)", fontSize: 13, overflowWrap: "anywhere" }}>{value}</dd>
    </div>
  );
}

function RefundSummaryCard({ eventId }: { eventId: string }) {
  const [summary, setSummary] = useState<RefundSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api
      .get<ApiResponse<RefundSummary>>(`/api/v1/events/${eventId}/refunds/summary`)
      .then((res) => {
        if (!cancelled) setSummary(res.data);
      })
      .catch((error) => {
        if (!cancelled) setErr(error instanceof ApiError ? error.message : "Gagal memuat ringkasan refund.");
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <section style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--color-line)" }}>
      <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-display)", fontSize: 16 }}>Ringkasan Refund</h3>
      {err ? (
        <Alert variant="danger">{err}</Alert>
      ) : !summary ? (
        <p style={{ margin: 0, color: "var(--color-ink-3)", fontSize: 14 }}>Memuat ringkasan refund…</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <RefundMetric label={`Total nominal · ${summary.total_count} refund`} amount={summary.total_amount} />
            <RefundMetric label={`Selesai · ${summary.completed_count} refund`} amount={summary.completed_amount} />
            <RefundMetric label={`Diproses · ${summary.processing_count} refund`} amount={summary.processing_amount} />
          </div>
          <p style={{ margin: "12px 0 0", color: "var(--color-ink-3)", fontSize: 12 }}>
            Menunggu review: {summary.requested_count} · Ditolak: {summary.rejected_count}. Total nominal mencakup
            refund selesai dan sedang diproses.
          </p>
        </>
      )}
    </section>
  );
}

function RefundMetric({ label, amount }: { label: string; amount: number }) {
  return (
    <div
      style={{
        padding: 14,
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-sm)",
        background: "var(--color-paper)",
      }}
    >
      <div style={{ color: "var(--color-ink-3)", fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div
        style={{
          color: "var(--color-danger)",
          fontFamily: "var(--font-mono)",
          fontSize: 18,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatRupiah(amount)}
      </div>
    </div>
  );
}

// ComplimentaryManager lets organizers manage the free-ticket whitelist for an event.
function ComplimentaryManager({ eventId }: { eventId: string }) {
  const [persons, setPersons] = useState<ComplimentaryPerson[] | null>(null);
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [addErr, setAddErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const sortedPersons = [...(persons ?? [])].sort((a, b) => Number(a.registered) - Number(b.registered));
  const pageCount = Math.max(1, Math.ceil(sortedPersons.length / pageSize));
  const pagePersons = sortedPersons.slice((page - 1) * pageSize, page * pageSize);

  const load = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ComplimentaryPerson[]>>(`/api/v1/events/${eventId}/complimentary`);
      setPersons(res.data ?? []);
      setPage(1);
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
    if (!isValidEmail(email.trim())) {
      setAddErr("Masukkan alamat email yang valid.");
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
          {pagePersons.map((p) => (
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

      {persons && persons.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            margin: "-4px 0 16px",
            color: "var(--color-ink-3)",
            fontSize: 13,
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Tampilkan
            <select
              className="field-input"
              aria-label="Jumlah peserta gratis per halaman"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{ width: 76, padding: "6px 8px" }}
            >
              {[5, 10, 15].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            per halaman · {sortedPersons.length} peserta
          </label>
          {pageCount > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Sebelumnya
              </button>
              <span>
                Halaman {page} dari {pageCount}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page === pageCount}
                onClick={() => setPage(page + 1)}
              >
                Berikutnya
              </button>
            </div>
          )}
        </div>
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
          <input className="field-input" placeholder="08xx" value={phone} onChange={(e) => setPhone(e.target.value)} />
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

  async function transition(target: EventStatus, confirmMsg?: string, variant: "primary" | "danger" = "primary") {
    if (confirmMsg && !(await confirm({ message: confirmMsg, variant }))) return;
    setError(null);
    setBusy(true);
    try {
      await api.patch<ApiResponse<Event>>(`/api/v1/events/${event.id}/status`, {
        status: target,
      });
      await onChanged();
      onNotice("Status event diperbarui.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengubah status.");
    } finally {
      setBusy(false);
    }
  }

  const isDraft = event.status === "draft";
  const isComingSoon = event.status === "coming_soon";
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
        {isDraft && <span style={{ fontSize: 14, color: "var(--color-ink-3)" }}>Draft</span>}
        {isDraft && (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() =>
              transition(
                "coming_soon",
                "Tampilkan event sebagai Segera Hadir? Detail event dan tiket akan terlihat, tetapi pendaftaran belum dibuka.",
              )
            }
          >
            Set Segera Hadir
          </Button>
        )}
        {isComingSoon && (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => transition("draft")}>
            Kembalikan ke Draft
          </Button>
        )}
        {(isDraft || isComingSoon) && (
          <Button
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() =>
              transition("published", "Publikasikan event ini? Event akan langsung terlihat di marketplace.")
            }
          >
            Publikasikan
          </Button>
        )}
        {(isDraft || isComingSoon || isPublished) && (
          <Button
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={() =>
              transition("cancelled", "Batalkan event ini? Tindakan ini tidak dapat dibatalkan.", "danger")
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
      setError(err instanceof ApiError ? err.message : "Gagal menambah kategori.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(did: string) {
    if (
      !(await confirm({
        message: "Hapus kategori ini? Kategori tiket di dalamnya juga akan ikut terhapus.",
        variant: "danger",
      }))
    )
      return;
    setError(null);
    try {
      await api.delete(`/api/v1/events/${eventId}/categories/${did}`);
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus kategori.");
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
                  <input
                    className="field-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ flex: "1 1 180px" }}
                  />
                  <input
                    className="field-input"
                    inputMode="numeric"
                    value={formatNumberInput(editQuota)}
                    onChange={(e) => setEditQuota(parseNumberInput(e.target.value))}
                    style={{ width: 100 }}
                    aria-label="Kuota kategori"
                  />
                  <Button variant="secondary" size="sm" disabled={busy} onClick={saveEdit}>
                    Simpan
                  </Button>
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => setEditingId(null)}>
                    Batal
                  </Button>
                </div>
              ) : (
                <span style={{ fontSize: 15 }}>{d.name}</span>
              )}
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
                  <button
                    type="button"
                    onClick={() => startEdit(d)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-sprint)",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    Edit
                  </button>
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
          <input className="field-input" placeholder="Mis. 5K" value={name} onChange={(e) => setName(e.target.value)} />
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
  addonGroups,
  availableModes,
}: {
  detail: EventDetail;
  live: EventFormValues | null;
  registrationFields: RegistrationFieldPreview[];
  addonGroups: RegistrationAddonGroup[];
  availableModes: PreviewMode[];
}) {
  const [mode, setMode] = useState<PreviewMode>(availableModes[0]);
  const ev = detail.event;
  const name = live?.name || ev.name || "Nama Event";
  const location = (live ? live.location : ev.location) || "Lokasi belum diatur";
  const eventDate = live ? live.event_date : ev.event_date;
  const isRunning = live ? live.event_type === "running" : ev.event_type === "running";
  const donationEnabled = live ? live.donation_enabled : ev.donation_enabled;
  const description = live ? live.description : ev.description;
  const color = (live ? live.color : ev.color) || undefined;

  // Display-only mirrors of the marketplace projection (server stays the
  // source of truth for real listings).
  const distances = detail.categories.map((d) => d.name);
  const prices = detail.ticket_categories.map((t) => t.price).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const quotaRemaining = detail.categories.reduce((sum, d) => sum + Math.max(0, d.quota - d.quota_used), 0);

  // Display-only mirror of the public PublicEventDetail shape, fed with live
  // form values - rendered by the SAME EventDetailView component as
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
    ticket_categories: detail.ticket_categories
      .filter((t) => t.is_visible)
      .map((t) => ({
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
    addon_groups: [],
  };

  const modeBtn = (active: boolean): React.CSSProperties => ({
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 600,
    border: active ? "1px solid var(--color-gold-deep)" : "1px solid var(--color-line)",
    borderRadius: 999,
    cursor: "pointer",
    backgroundColor: active ? "var(--color-navy)" : "var(--color-surface)",
    color: active ? "var(--color-gold-soft)" : "var(--color-ink-2)",
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
          {mode === "register" ? "Pratinjau Form Pendaftaran" : "Pratinjau"}
        </div>
        {availableModes.length > 1 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
            {availableModes.includes("card") && (
              <button
                type="button"
                style={modeBtn(mode === "card")}
                aria-pressed={mode === "card"}
                onClick={() => setMode("card")}
              >
                Kartu
              </button>
            )}
            {availableModes.includes("detail") && (
              <button
                type="button"
                style={modeBtn(mode === "detail")}
                aria-pressed={mode === "detail"}
                onClick={() => setMode("detail")}
              >
                Halaman Detail
              </button>
            )}
            {availableModes.includes("register") && (
              <button
                type="button"
                style={modeBtn(mode === "register")}
                aria-pressed={mode === "register"}
                onClick={() => setMode("register")}
              >
                Form Pendaftaran
              </button>
            )}
          </div>
        )}
      </div>

      {mode === "card" ? (
        <>
          <EventCard
            title={name}
            location={location}
            date={formatDate(eventDate)}
            distances={isRunning && distances.length === 0 ? ["Event Lari"] : distances}
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
            Ikut berubah saat Anda mengetik, memilih warna, atau mengunggah banner. Harga &amp; kuota mengikuti
            kategori/tiket yang tersimpan.
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
            <p style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 12 }}>← {name}</p>
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
            <p style={{ color: "var(--color-ink-3)", marginBottom: 20, fontSize: 14 }}>Langkah 2 dari 3</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <RegistrationPreviewField label="Nama Lengkap" placeholder="Nama peserta" />
              <RegistrationPreviewField label="Email" type="email" placeholder="nama@email.com" />
              <RegistrationPreviewField label="No. HP" type="tel" placeholder="08xxxxxxxxxx" />
              <RegistrationPreviewField
                label="Tanggal Lahir"
                type="date"
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
                    <RegistrationPreviewCustomField key={field.id ?? `${field.name}-${index}`} field={field} />
                  ))}
                </>
              )}
              {addonGroups.length > 0 && (
                <>
                  <hr style={{ border: "none", borderTop: "1px solid var(--color-line)", margin: "4px 0" }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink-2)", margin: 0 }}>
                    Custom Add-ons (opsional)
                  </p>
                  {addonGroups.map((group) => (
                    <fieldset key={group.id} className="field" style={{ border: 0, padding: 0, margin: 0 }}>
                      <legend className="field-label">{group.title || "Add-ons"}</legend>
                      {group.options.map((option) => (
                        <label
                          key={option.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            padding: "7px 0",
                            fontSize: 14,
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input type="radio" disabled />
                            {option.name || "Name Add-ons"}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                            {option.price > 0 ? `+${formatRupiah(option.price)}` : "Gratis"}
                          </span>
                        </label>
                      ))}
                    </fieldset>
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

function RegistrationPreviewCustomField({ field }: { field: RegistrationFieldPreview }) {
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
        <span className="field-label" style={{ margin: 0 }}>
          {label}
        </span>
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

// BannerUploader lets the organizer upload the event banner (stored on R2).
// Shown at the top of the Detail tab as a large click/drop zone so it can't be
// missed. When no banner is set, the marketplace card falls back to the event color.
function BannerUploader({ event, onUploaded }: { event: Event; onUploaded: (ev: Event) => void }) {
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
    if (!EVENT_IMAGE_TYPES.includes(f.type)) {
      setError("Format tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return;
    }
    const compressed = await compressEventImage(f);
    if (compressed.size > EVENT_IMAGE_MAX_BYTES) {
      setError(`Ukuran file ${formatImageSize(compressed.size)} (setelah kompresi) masih melebihi batas 10 MB.`);
      return;
    }
    setError(null);
    setFile(compressed);
    setPreviewUrl(URL.createObjectURL(compressed));
    if (compressed !== f) {
      setNotice(`Gambar dikompresi otomatis: ${formatImageSize(f.size)} → ${formatImageSize(compressed.size)}.`);
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
      const res = await api.postForm<ApiResponse<Event>>(`/api/v1/events/${event.id}/banner`, form);
      onUploaded(res.data);
      reset();
      setNotice("Banner tersimpan. Kartu marketplace & halaman detail langsung memakainya.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengunggah banner.");
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
        Gambar utama di kartu marketplace &amp; halaman detail. Tanpa banner, warna header kartu yang dipakai.
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
        accept={EVENT_IMAGE_TYPES.join(",")}
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
            ? `linear-gradient(180deg, rgba(7,19,24,0.64), rgba(7,19,24,0.84)), url(${shownImage}) center/cover no-repeat`
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
        <ImageIcon size={28} aria-hidden />
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: shownImage ? "#fff" : "var(--color-ink-2)",
            textShadow: shownImage ? "0 1px 3px rgba(0,0,0,0.6)" : undefined,
          }}
        >
          {previewUrl
            ? "Pratinjau - klik “Simpan Banner” untuk menyimpan"
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
          JPG / PNG / WebP · maks 10 MB · saran 1200×400 px (rasio 3:1)
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

  const distanceName = (id: string) => distances.find((d) => d.id === id)?.name ?? "—";
  const sortedTickets = [...tickets].sort((a, b) => a.name.localeCompare(b.name, "id", { sensitivity: "base" }));

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
      setError(err instanceof ApiError ? err.message : "Gagal memperbarui tiket.");
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
      setError(err instanceof ApiError ? err.message : "Gagal mengubah visibilitas tiket.");
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
      setError(err instanceof ApiError ? err.message : "Gagal menghapus tiket.");
    }
  }

  if (distances.length === 0) {
    return <p style={{ color: "var(--color-ink-3)", fontSize: 15 }}>Tambahkan kategori terlebih dahulu.</p>;
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
          {sortedTickets.map((t) => (
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
                  <input
                    className="field-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    aria-label="Nama tiket"
                  />
                  <select
                    className="field-input"
                    value={editDistanceId}
                    onChange={(e) => setEditDistanceId(e.target.value)}
                    aria-label="Kategori tiket"
                  >
                    {distances.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="field-input"
                    inputMode="numeric"
                    value={formatNumberInput(editPrice)}
                    onChange={(e) => setEditPrice(parseNumberInput(e.target.value))}
                    aria-label="Harga tiket"
                  />
                  <input
                    className="field-input"
                    inputMode="numeric"
                    value={formatNumberInput(editQuota)}
                    onChange={(e) => setEditQuota(parseNumberInput(e.target.value))}
                    aria-label="Kuota tiket"
                  />
                  <input
                    className="field-input"
                    type="datetime-local"
                    value={editSaleStart}
                    onChange={(e) => setEditSaleStart(e.target.value)}
                    aria-label="Mulai penjualan"
                  />
                  <input
                    className="field-input"
                    type="datetime-local"
                    value={editSaleEnd}
                    onChange={(e) => setEditSaleEnd(e.target.value)}
                    aria-label="Akhir penjualan"
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="secondary" size="sm" disabled={busy} onClick={() => saveTicket(t)}>
                      Simpan
                    </Button>
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => setEditingId(null)}>
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div
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
                    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{formatRupiah(t.price)}</span>
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
                          color: t.is_visible ? "var(--color-ink-3)" : "var(--color-ok)",
                          cursor: busy ? "not-allowed" : "pointer",
                          fontSize: 14,
                        }}
                      >
                        {t.is_visible ? "Sembunyikan" : "Tampilkan"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startTicketEdit(t)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-sprint)",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
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
                        {t.sale_end ? `Berlaku s.d. ${formatDateTime(t.sale_end)}` : "Tanpa batas waktu penjualan"}
                      </span>
                    </>
                  </div>
                </>
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
          <select className="field-input" value={distanceId} onChange={(e) => setDistanceId(e.target.value)}>
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
        Kuota tiket tidak boleh melebihi kuota kategori yang dipilih (divalidasi server). Setelah tanggal berakhir,
        tiket tidak bisa dipilih peserta.
      </p>
    </div>
  );
}
