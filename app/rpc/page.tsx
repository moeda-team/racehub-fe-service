"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
  ApiResponse,
  CheckinParticipant,
  CheckinSearchPage,
  CheckinStage,
  Event,
} from "@/lib/types.gen";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import ParticipantDetailModal from "@/components/rpc/ParticipantDetailModal";
import BarcodeScanner from "@/components/rpc/BarcodeScanner";

const PAGE_SIZE_OPTIONS = [8, 16, 24] as const;

// Field RPC / check-in module (F6, FR-602..605). Built for one-handed phone use
// at a busy desk: high contrast, large targets, manual search is the PRIMARY
// method; QR camera scan is secondary.
export default function RpcPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [stage, setStage] = useState<CheckinStage>("rpc");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<Event[]>>(
          "/api/v1/events?page_size=200",
        );
        if (cancelled) return;
        const list = res.data ?? [];
        setEvents(list);
        if (list.length > 0) setEventId(list[0].id);
      } catch {
        /* surfaced by the empty state below */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-navy-deep)" }} />
    );
  }

  return (
    <main
      className="rh-reveal"
      style={{
        minHeight: "100vh",
        background: "var(--color-navy-deep)",
        color: "var(--color-text-on-dark)",
        padding: "16px 16px 48px",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          RPC / Check-in
        </h1>
        <a
          href="/dashboard"
          style={{ color: "var(--color-ink-4)", fontSize: 14 }}
        >
          Dashboard
        </a>
      </header>

      {events.length === 0 ? (
        <p style={{ color: "var(--color-ink-4)" }}>
          Belum ada event. Buat event di dashboard terlebih dahulu.
        </p>
      ) : (
        <>
          {/* Event picker */}
          <label
            style={{
              display: "block",
              fontSize: 13,
              color: "var(--color-ink-4)",
              marginBottom: 6,
            }}
          >
            Event
          </label>
          <select
            value={eventId ?? ""}
            onChange={(e) => setEventId(e.target.value || null)}
            style={fieldStyle}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>

          {/* Stage toggle — two big targets */}
          <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
            <StageButton
              active={stage === "rpc"}
              onClick={() => setStage("rpc")}
              label="Pengambilan perlengkapan"
            />
            <StageButton
              active={stage === "raceday"}
              onClick={() => setStage("raceday")}
              label="Hari-H"
            />
          </div>

          {eventId != null && (
            <CheckinPanel
              key={`${eventId}-${stage}`}
              eventId={eventId}
              stage={stage}
            />
          )}
        </>
      )}
    </main>
  );
}

function StageButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minHeight: 56,
        borderRadius: "var(--radius-md)",
        border: active
          ? "2px solid var(--color-gold)"
          : "1px solid var(--color-ink-2)",
        background: active ? "var(--color-gold)" : "transparent",
        color: active ? "var(--color-navy-deep)" : "var(--color-text-on-dark-muted)",
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function CheckinPanel({
  eventId,
  stage,
}: {
  eventId: string;
  stage: CheckinStage;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CheckinParticipant[]>([]);
  const [total, setTotal] = useState(0);
  const [paidTotal, setPaidTotal] = useState(0);
  const [rpcCollected, setRpcCollected] = useState(0);
  const [racedayCheckedIn, setRacedayCheckedIn] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [refresh, setRefresh] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<CheckinParticipant | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setErr(null);
      try {
        const params = new URLSearchParams({
          q: q.trim(), stage, limit: String(pageSize),
          offset: String((page - 1) * pageSize),
        });
        const res = await api.get<CheckinSearchPage>(
          `/api/v1/events/${eventId}/checkin/search?${params}`,
        );
        if (cancelled) return;
        setResults(res.data ?? []);
        setTotal(res.total);
        setPaidTotal(res.paid_total);
        setRpcCollected(res.rpc_collected);
        setRacedayCheckedIn(res.raceday_checked_in);
      } catch (e) {
        if (!cancelled) {
          setResults([]);
          setErr(e instanceof ApiError ? e.message : "Daftar peserta gagal dimuat.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, q ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [eventId, stage, q, page, pageSize, refresh]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, total);

  function beginSearch() {
    setLoading(true);
    setErr(null);
  }

  async function mark(p: CheckinParticipant) {
    if (markingId) return; // ignore a rapid double-tap while a mark is in flight
    setErr(null);
    setMarkingId(p.id);
    try {
      const res = await api.post<ApiResponse<CheckinParticipant>>(
        `/api/v1/events/${eventId}/checkin`,
        {
          registration_id: p.id,
          stage,
        },
      );
      setFlash(`${res.data.name} · ${stageLabel(stage)} ✓`);
      setSelected(res.data);
      beginSearch();
      setRefresh((current) => current + 1);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Gagal menandai check-in.");
    } finally {
      setMarkingId(null);
    }
  }

  async function markByToken(token: string) {
    setErr(null);
    try {
      const res = await api.post<ApiResponse<CheckinParticipant>>(
        `/api/v1/events/${eventId}/checkin/scan`,
        {
          qr_token: token,
          stage,
        },
      );
      setSelected(res.data);
    } catch (e) {
      setErr(
        e instanceof ApiError ? e.message : "QR tidak valid untuk event ini.",
      );
    }
  }

  return (
    <div>
      <p style={{ margin: "0 0 12px", color: "var(--color-ink-4)", fontSize: 14, lineHeight: 1.5 }}>
        {paidTotal} peserta lunas · {stage === "rpc" ? rpcCollected : racedayCheckedIn} sudah {stage === "rpc" ? "ambil perlengkapan" : "check-in acara"}
      </p>
      <label style={{ display: "grid", gap: 6, color: "var(--color-ink-4)", fontSize: 13 }}>
        Cari peserta
        <input
          value={q}
          onChange={(e) => { beginSearch(); setQ(e.target.value); setPage(1); }}
          placeholder="Nama / BIB / no. registrasi"
          inputMode="search"
          autoFocus
          style={fieldStyle}
        />
      </label>

      <BarcodeScanner onToken={markByToken} />

      {flash && (
        <div
          style={{
            margin: "12px 0",
            padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-sprint)",
            color: "var(--color-ink)",
            fontWeight: 700,
          }}
        >
          {flash}
        </div>
      )}
      {err && (
        <Alert variant="danger" className="mb-4">
          {err}
        </Alert>
      )}

      <div
        aria-busy={loading}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 12,
        }}
      >
        {loading && <p role="status" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-ink-4)", fontSize: 14 }}><span className="spinner" aria-hidden="true" style={{ borderTopColor: "var(--color-gold)" }} />Memuat peserta…</p>}
        {!loading && results.map((p) => (
          <ParticipantCard
            key={p.id}
            p={p}
            marking={markingId === p.id}
            onOpen={() => setSelected(p)}
          />
        ))}
      </div>
      {!loading && total === 0 && !err && (
        <p style={{ color: "var(--color-ink-4)", fontSize: 14, marginTop: 12 }}>
          Tidak ada peserta yang cocok.
        </p>
      )}
      {total > 0 && !err && (
        <nav aria-label="Halaman daftar peserta" style={paginationStyle}>
          <div style={paginationInfoStyle}>
            <span>{rangeStart}–{rangeEnd} dari {total} peserta</span>
            <select
              aria-label="Jumlah peserta per halaman"
              value={pageSize}
              onChange={(e) => { beginSearch(); setPageSize(Number(e.target.value)); setPage(1); }}
              style={pageSizeStyle}
            >
              {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size} per halaman</option>)}
            </select>
          </div>
          <div style={paginationButtonsStyle}>
            <button type="button" onClick={() => { beginSearch(); setPage(currentPage - 1); }} disabled={loading || currentPage === 1} style={{ ...pageButtonStyle, opacity: loading || currentPage === 1 ? 0.5 : 1 }}>← Sebelumnya</button>
            <span aria-live="polite" style={{ whiteSpace: "nowrap" }}>Halaman {currentPage} dari {totalPages}</span>
            <button type="button" onClick={() => { beginSearch(); setPage(currentPage + 1); }} disabled={loading || currentPage === totalPages} style={{ ...pageButtonStyle, opacity: loading || currentPage === totalPages ? 0.5 : 1 }}>Berikutnya →</button>
          </div>
        </nav>
      )}
      {selected && <ParticipantDetailModal participant={selected} stage={stage} marking={markingId === selected.id} onClose={() => setSelected(null)} onClaim={() => mark(selected)} />}
    </div>
  );
}

function ParticipantCard({
  p,
  marking,
  onOpen,
}: {
  p: CheckinParticipant;
  marking: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        color: "var(--color-ink)",
        borderRadius: "var(--radius-md)",
        padding: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            {p.bib_number || "—"}
          </span>
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {p.name}
          </span>
        </div>
        <div
          style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 2 }}
        >
          {p.registration_number}
          {p.age_class ? ` · ${p.age_class}` : ""}
          {p.gender ? ` · ${p.gender}` : ""}
        </div>
        <div style={{ fontSize: 13, color: "var(--color-ink-2)", marginTop: 4 }}>
          {p.category_name} · {p.ticket_name}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <StatusPill on={p.rpc_status !== ""} label="Perlengkapan" />
          <StatusPill on={p.raceday_status !== ""} label="Hari-H" />
        </div>
      </div>
      <Button
        type="button"
        onClick={onOpen}
        disabled={marking}
        variant="secondary"
        size="md"
        style={{ minHeight: 56, minWidth: 112, flexShrink: 0, borderRadius: "var(--radius-md)", fontWeight: 800 }}
      >
        {marking ? "Memproses…" : "Lihat informasi"}
      </Button>
    </div>
  );
}

function StatusPill({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 999,
        background: on ? "var(--color-sprint)" : "var(--color-panel)",
        color: on ? "var(--color-ink)" : "var(--color-ink-3)",
        border: on ? "none" : "1px solid var(--color-line)",
      }}
    >
      {on ? "✓ " : ""}
      {label}
    </span>
  );
}

function stageLabel(stage: CheckinStage): string {
  return stage === "rpc" ? "Pengambilan perlengkapan" : "Check-in acara";
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 48,
  padding: "10px 14px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-ink-2)",
  background: "var(--color-surface)",
  color: "var(--color-ink)",
  fontSize: 16,
  marginBottom: 0,
};

const paginationStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 20, color: "var(--color-ink-4)", fontSize: 13 };
const paginationInfoStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 };
const paginationButtonsStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 };
const pageSizeStyle: React.CSSProperties = { minHeight: 40, padding: "6px 8px", border: "1px solid var(--color-ink-2)", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", color: "var(--color-ink)", fontSize: 13 };
const pageButtonStyle: React.CSSProperties = { minHeight: 44, padding: "6px 10px", border: "1px solid var(--color-ink-2)", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--color-text-on-dark)", fontSize: 13, fontWeight: 700, cursor: "pointer" };
