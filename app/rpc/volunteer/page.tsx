"use client";

import { FormEvent, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type {
  ApiResponse,
  CheckinParticipant,
  CheckinStage,
  RPCAccessSession,
} from "@/lib/types.gen";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ParticipantDetailModal from "@/components/rpc/ParticipantDetailModal";
import BarcodeScanner from "@/components/rpc/BarcodeScanner";

// This page intentionally has no organizer session. The volunteer code stays
// only in component state and is sent only to narrowly scoped RPC endpoints.
export default function VolunteerRPCPage() {
  const [code, setCode] = useState("");
  const [session, setSession] = useState<RPCAccessSession | null>(null);
  const [participants, setParticipants] = useState<CheckinParticipant[]>([]);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<CheckinStage>("rpc");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<CheckinParticipant | null>(null);

  const options = {
    auth: false,
    headers: { "X-RPC-Access-Code": code },
  };

  const visibleParticipants = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return participants;
    return participants.filter((participant) =>
      [
        participant.name,
        participant.bib_number,
        participant.registration_number,
      ].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [participants, query]);

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
      const response = await api.get<ApiResponse<CheckinParticipant[]>>(
        `/api/v1/events/${event.event_id}/checkin/search`,
        options,
      );
      setSession(event);
      setParticipants(response.data ?? []);
    } catch (err) {
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
      setParticipants((current) =>
        current.map((item) => (item.id === participant.id ? response.data : item)),
      );
      setSelected(response.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Pengambilan racepack gagal ditandai.");
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
          <h1 style={titleStyle}>Akses Racepack Collection</h1>
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
        <p style={eyebrowStyle}>PENGAMBILAN RACEPACK</p>
        <h1 style={titleStyle}>{session.event_name}</h1>
        <div style={summaryStyle}>
          <p style={summaryTextStyle}>
            {participants.length} peserta lunas · {participants.filter((item) => stage === "rpc" ? item.rpc_status !== "" : item.raceday_status !== "").length} sudah {stage === "rpc" ? "ambil racepack" : "check-in Hari-H"}
          </p>
          <button type="button" onClick={() => { setSession(null); setParticipants([]); setQuery(""); setStage("rpc"); }} style={changeCodeStyle}>
            Ganti kode
          </button>
        </div>
      </header>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      <div style={stageToggleStyle}>
        <StageButton active={stage === "rpc"} onClick={() => setStage("rpc")} label="Racepack (H-1/H-2)" />
        <StageButton active={stage === "raceday"} onClick={() => setStage("raceday")} label="Hari-H" />
      </div>
      <label style={searchLabelStyle}>
        Cari peserta
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nama / BIB / no. registrasi"
          inputMode="search"
          style={inputStyle}
        />
      </label>
      <BarcodeScanner onToken={previewByToken} />

      <div style={{ ...participantListStyle, marginTop: 12 }}>
        {visibleParticipants.map((participant) => {
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
                <div style={statusListStyle}>
                  <StatusPill done={participant.rpc_status !== ""} label="Racepack" />
                  <StatusPill done={participant.raceday_status !== ""} label="Hari-H" />
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
      {visibleParticipants.length === 0 && (
        <p style={descriptionStyle}>Tidak ada peserta yang cocok.</p>
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
  background: "var(--color-ink)", color: "white",
};
const loginCardStyle: React.CSSProperties = { maxWidth: 440, margin: "10vh auto 0", padding: 24, borderRadius: "var(--radius-lg)", background: "var(--color-surface)", color: "var(--color-ink)" };
const eyebrowStyle: React.CSSProperties = { margin: "0 0 6px", color: "var(--color-flame)", fontWeight: 800, fontSize: 12, letterSpacing: "0.08em" };
const titleStyle: React.CSSProperties = { margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800 };
const descriptionStyle: React.CSSProperties = { color: "var(--color-ink-3)", fontSize: 14, lineHeight: 1.5, margin: "0 0 24px" };
const labelStyle: React.CSSProperties = { display: "grid", gap: 6, fontSize: 14, fontWeight: 700 };
const headerStyle: React.CSSProperties = { marginBottom: 16 };
const summaryStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" };
const summaryTextStyle: React.CSSProperties = { margin: 0, color: "var(--color-ink-4)", fontSize: 14, lineHeight: 1.5 };
const stageToggleStyle: React.CSSProperties = { display: "flex", gap: 8, margin: "16px 0" };
const stageButtonStyle: React.CSSProperties = { flex: 1, minHeight: 56, border: "1px solid var(--color-ink-2)", borderRadius: "var(--radius-md)", background: "transparent", color: "var(--color-ink-4)", fontSize: 15, fontWeight: 700, cursor: "pointer" };
const stageButtonActiveStyle: React.CSSProperties = { border: "2px solid var(--color-flame)", background: "var(--color-flame)", color: "white" };
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
