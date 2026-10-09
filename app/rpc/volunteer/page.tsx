"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type {
  ApiResponse,
  CheckinParticipant,
  CheckinStage,
  CheckinSearchPage,
  RPCAccessSession,
} from "@/lib/types.gen";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ParticipantDetailModal from "@/components/rpc/ParticipantDetailModal";
import BarcodeScanner from "@/components/rpc/BarcodeScanner";

const PAGE_SIZE_OPTIONS = [8, 16, 24] as const;

// This page intentionally has no organizer session. The volunteer code stays
// only in component state and is sent only to narrowly scoped RPC endpoints.
export default function VolunteerRPCPage() {
  const [code, setCode] = useState("");
  const [session, setSession] = useState<RPCAccessSession | null>(null);
  const [participants, setParticipants] = useState<CheckinParticipant[]>([]);
  const [total, setTotal] = useState(0);
  const [paidTotal, setPaidTotal] = useState(0);
  const [rpcCollected, setRpcCollected] = useState(0);
  const [racedayCheckedIn, setRacedayCheckedIn] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [stage, setStage] = useState<CheckinStage>("rpc");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<CheckinParticipant | null>(null);

  const options = {
    auth: false,
    headers: { "X-RPC-Access-Code": code },
  };

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          q: query.trim(), stage, limit: String(pageSize),
          offset: String((page - 1) * pageSize),
        });
        const response = await api.get<CheckinSearchPage>(
          `/api/v1/events/${session.event_id}/checkin/search?${params}`,
          { auth: false, headers: { "X-RPC-Access-Code": code } },
        );
        if (cancelled) return;
        setParticipants(response.data ?? []);
        setTotal(response.total);
        setPaidTotal(response.paid_total);
        setRpcCollected(response.rpc_collected);
        setRacedayCheckedIn(response.raceday_checked_in);
      } catch (err) {
        if (cancelled) return;
        setParticipants([]);
        setError(err instanceof ApiError ? err.message : "Daftar peserta gagal dimuat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query ? 250 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [session, code, query, stage, page, pageSize, refresh]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, total);

  function beginSearch() {
    setLoading(true);
    setError(null);
  }

  async function enterEvent(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const access = await api.get<ApiResponse<RPCAccessSession>>(
        "/api/v1/rpc-access/session",
        options,
      );
      const event = access.data;
      setSession(event);
      setLoading(true);
      setQuery("");
      setPage(1);
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof ApiError
          ? err.message
          : "Kode akses RPC tidak dapat digunakan.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function collect(participant: CheckinParticipant) {
    const done = stage === "rpc" ? participant.rpc_status !== "" : participant.raceday_status !== "";
    if (!session || done || markingId) return;
    setError(null);
    setMarkingId(participant.id);
    try {
      const response = await api.post<ApiResponse<CheckinParticipant>>(
        `/api/v1/events/${session.event_id}/checkin`,
        { registration_id: participant.id, stage },
        options,
      );
      setSelected(response.data);
      beginSearch();
      setRefresh((current) => current + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Pengambilan perlengkapan gagal ditandai.");
    } finally {
      setMarkingId(null);
    }
  }

  async function previewByToken(token: string) {
    if (!session) return;
    setError(null);
    try {
      const response = await api.post<ApiResponse<CheckinParticipant>>(
        `/api/v1/events/${session.event_id}/checkin/scan`,
        { qr_token: token, stage },
        options,
      );
      setSelected(response.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Barcode tidak valid untuk event ini.");
    }
  }

  if (!session) {
    return (
      <main style={pageStyle}>
        <section style={loginCardStyle}>
          <p style={eyebrowStyle}>VOLUNTEER</p>
          <h1 style={titleStyle}>Akses Pengambilan Perlengkapan</h1>
          <p style={descriptionStyle}>
            Masukkan kode akses RPC dari organizer. Anda tidak perlu memakai akun organizer.
          </p>
          {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
          <form onSubmit={enterEvent} style={{ display: "grid", gap: 14 }}>
            <label style={labelStyle}>
              Kode akses RPC
              <input
                autoFocus
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Masukkan kode dari organizer"
                style={inputStyle}
              />
            </label>
            <Button
              type="submit"
              variant="primary"
              disabled={busy || !code.trim()}
              style={{ width: "100%", minHeight: 48 }}
            >
              {busy ? "Memeriksa akses…" : "Masuk ke event"}
            </Button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <p style={eyebrowStyle}>PENGAMBILAN PERLENGKAPAN</p>
        <h1 style={titleStyle}>{session.event_name}</h1>
        <div style={summaryStyle}>
          <p style={summaryTextStyle}>
            {paidTotal} peserta lunas · {stage === "rpc" ? rpcCollected : racedayCheckedIn} sudah {stage === "rpc" ? "ambil perlengkapan" : "check-in acara"}
          </p>
          <button type="button" onClick={() => { setSession(null); setParticipants([]); setQuery(""); setPage(1); setTotal(0); setPaidTotal(0); setRpcCollected(0); setRacedayCheckedIn(0); setStage("rpc"); }} style={changeCodeStyle}>
            Ganti kode
          </button>
        </div>
      </header>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      <div style={stageToggleStyle}>
        <StageButton active={stage === "rpc"} onClick={() => { if (stage !== "rpc") { beginSearch(); setSelected(null); setStage("rpc"); setPage(1); } }} label="Pengambilan perlengkapan" />
        <StageButton active={stage === "raceday"} onClick={() => { if (stage !== "raceday") { beginSearch(); setSelected(null); setStage("raceday"); setPage(1); } }} label="Check-in acara" />
      </div>
      <label style={searchLabelStyle}>
        Cari peserta
        <input
          autoFocus
          value={query}
          onChange={(event) => { beginSearch(); setQuery(event.target.value); setPage(1); }}
          placeholder="Nama / BIB / no. registrasi"
          inputMode="search"
          style={inputStyle}
        />
      </label>
      <BarcodeScanner onToken={previewByToken} />

      <div style={{ ...participantListStyle, marginTop: 12 }}>
        {!loading && participants.map((participant) => {
          return (
            <article key={participant.id} style={participantStyle}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <strong style={bibStyle}>{participant.bib_number || "—"}</strong>
                  <strong style={participantNameStyle}>{participant.name}</strong>
                </div>
                <p style={participantMetaStyle}>
                  {participant.registration_number}
                  {participant.age_class ? ` · ${participant.age_class}` : ""}
                  {participant.gender ? ` · ${participant.gender}` : ""}
                </p>
                <p style={{ ...participantMetaStyle, fontFamily: "inherit", fontSize: 13 }}>
                  {participant.category_name} · {participant.ticket_name}
                </p>
                <div style={statusListStyle}>
                  <StatusPill done={participant.rpc_status !== ""} label="Perlengkapan" />
                  <StatusPill done={participant.raceday_status !== ""} label="Check-in" />
                </div>
              </div>
              <Button
                type="button"
                onClick={() => setSelected(participant)}
                variant="secondary"
                size="md"
                disabled={markingId === participant.id}
                style={markButtonStyle}
              >
                {markingId === participant.id ? "Memproses…" : "Lihat informasi"}
              </Button>
            </article>
          );
        })}
      </div>
      {loading && <p style={descriptionStyle}>Memuat peserta…</p>}
      {!loading && total === 0 && !error && (
        <p style={descriptionStyle}>Tidak ada peserta yang cocok.</p>
      )}
      {total > 0 && !error && (
        <nav aria-label="Halaman daftar peserta" style={paginationStyle}>
          <div style={paginationInfoStyle}>
            <span>{rangeStart}–{rangeEnd} dari {total} peserta</span>
            <select
              aria-label="Jumlah peserta per halaman"
              value={pageSize}
              onChange={(event) => { beginSearch(); setPageSize(Number(event.target.value)); setPage(1); }}
              style={pageSizeStyle}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size} per halaman</option>
              ))}
            </select>
          </div>
          <div style={paginationButtonsStyle}>
            <button type="button" onClick={() => { beginSearch(); setPage(currentPage - 1); }} disabled={loading || currentPage === 1} style={{ ...pageButtonStyle, opacity: currentPage === 1 ? 0.5 : 1 }}>← Sebelumnya</button>
            <span aria-live="polite" style={{ whiteSpace: "nowrap" }}>Halaman {currentPage} dari {totalPages}</span>
            <button type="button" onClick={() => { beginSearch(); setPage(currentPage + 1); }} disabled={loading || currentPage === totalPages} style={{ ...pageButtonStyle, opacity: currentPage === totalPages ? 0.5 : 1 }}>Berikutnya →</button>
          </div>
        </nav>
      )}
      {selected && <ParticipantDetailModal participant={selected} stage={stage} marking={markingId === selected.id} onClose={() => setSelected(null)} onClaim={() => collect(selected)} />}
    </main>
  );
}

function StageButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...stageButtonStyle, ...(active ? stageButtonActiveStyle : {}) }}
    >
      {label}
    </button>
  );
}

function StatusPill({ done, label }: { done: boolean; label: string }) {
  return (
    <span style={{ ...statusPillStyle, ...(done ? statusPillDoneStyle : {}) }}>
      {done ? "✓ " : ""}{label}
    </span>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh", maxWidth: 560, margin: "0 auto", padding: "16px 16px 48px",
  background: "var(--color-navy-deep)", color: "var(--color-text-on-dark)",
};
const loginCardStyle: React.CSSProperties = { maxWidth: 440, margin: "10vh auto 0", padding: 24, borderRadius: "var(--radius-lg)", background: "var(--color-surface)", color: "var(--color-ink)" };
const eyebrowStyle: React.CSSProperties = { margin: "0 0 6px", color: "var(--color-gold)", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 11, letterSpacing: "0.12em" };
const titleStyle: React.CSSProperties = { margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600 };
const descriptionStyle: React.CSSProperties = { color: "var(--color-ink-3)", fontSize: 14, lineHeight: 1.5, margin: "0 0 24px" };
const labelStyle: React.CSSProperties = { display: "grid", gap: 6, fontSize: 14, fontWeight: 700 };
const headerStyle: React.CSSProperties = { marginBottom: 16 };
const summaryStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" };
const summaryTextStyle: React.CSSProperties = { margin: 0, color: "var(--color-ink-4)", fontSize: 14, lineHeight: 1.5 };
const stageToggleStyle: React.CSSProperties = { display: "flex", gap: 8, margin: "16px 0" };
const stageButtonStyle: React.CSSProperties = { flex: 1, minHeight: 56, border: "1px solid var(--color-ink-2)", borderRadius: "var(--radius-md)", background: "transparent", color: "var(--color-ink-4)", fontSize: 15, fontWeight: 700, cursor: "pointer" };
const stageButtonActiveStyle: React.CSSProperties = { border: "2px solid var(--color-gold)", background: "var(--color-gold)", color: "var(--color-navy-deep)" };
const searchLabelStyle: React.CSSProperties = { display: "grid", gap: 6, marginBottom: 12, color: "var(--color-ink-4)", fontSize: 13 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid var(--color-ink-2)", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", color: "var(--color-ink)", fontSize: 16 };
const participantListStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };
const participantStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 14, borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-ink)" };
const bibStyle: React.CSSProperties = { minWidth: 42, fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 800 };
const participantNameStyle: React.CSSProperties = { fontSize: 17, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const participantMetaStyle: React.CSSProperties = { margin: "2px 0 0", color: "var(--color-ink-3)", fontFamily: "var(--font-mono)", fontSize: 12 };
const statusListStyle: React.CSSProperties = { display: "flex", gap: 6, marginTop: 6 };
const statusPillStyle: React.CSSProperties = { display: "inline-block", padding: "2px 8px", border: "1px solid var(--color-line)", borderRadius: 999, background: "var(--color-panel)", color: "var(--color-ink-3)", fontSize: 11, fontWeight: 700 };
const statusPillDoneStyle: React.CSSProperties = { border: "none", background: "var(--color-sprint)", color: "var(--color-ink)" };
const markButtonStyle: React.CSSProperties = { minWidth: 112, minHeight: 56, flexShrink: 0, borderRadius: "var(--radius-md)", fontWeight: 800 };
const changeCodeStyle: React.CSSProperties = { minHeight: 36, padding: "0 10px", border: "1px solid var(--color-ink-2)", borderRadius: "var(--radius-pill)", background: "transparent", color: "var(--color-ink-4)", cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" };
const paginationStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 20, color: "var(--color-ink-4)", fontSize: 13 };
const paginationInfoStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 };
const paginationButtonsStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 };
const pageSizeStyle: React.CSSProperties = { minHeight: 40, padding: "6px 8px", border: "1px solid var(--color-ink-2)", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", color: "var(--color-ink)", fontSize: 13 };
const pageButtonStyle: React.CSSProperties = { minHeight: 44, padding: "6px 10px", border: "1px solid var(--color-ink-2)", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--color-text-on-dark)", fontSize: 13, fontWeight: 700, cursor: "pointer" };
