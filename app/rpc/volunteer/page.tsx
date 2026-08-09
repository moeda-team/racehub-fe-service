"use client";

import { FormEvent, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type {
  ApiResponse,
  CheckinParticipant,
  RPCAccessSession,
} from "@/lib/types.gen";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

// This page intentionally has no organizer session. The volunteer code stays
// only in component state and is sent only to narrowly scoped RPC endpoints.
export default function VolunteerRPCPage() {
  const [code, setCode] = useState("");
  const [session, setSession] = useState<RPCAccessSession | null>(null);
  const [participants, setParticipants] = useState<CheckinParticipant[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

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
    if (!session || participant.rpc_status === "collected" || markingId) return;
    setError(null);
    setMarkingId(participant.id);
    try {
      const response = await api.post<ApiResponse<CheckinParticipant>>(
        `/api/v1/events/${session.event_id}/checkin`,
        { registration_id: participant.id, stage: "rpc" },
        options,
      );
      setParticipants((current) =>
        current.map((item) => (item.id === participant.id ? response.data : item)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Pengambilan racepack gagal ditandai.");
    } finally {
      setMarkingId(null);
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
            <Button type="submit" variant="primary" disabled={busy || !code.trim()}>
              {busy ? "Memeriksa akses…" : "Masuk ke event"}
            </Button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <header style={{ marginBottom: 20 }}>
        <p style={eyebrowStyle}>PENGAMBILAN RACEPACK</p>
        <h1 style={titleStyle}>{session.event_name}</h1>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <p style={{ ...descriptionStyle, margin: 0 }}>
            {participants.length} peserta lunas · {participants.filter((item) => item.rpc_status === "collected").length} sudah mengambil
          </p>
          <button type="button" onClick={() => { setSession(null); setParticipants([]); setQuery(""); }} style={changeCodeStyle}>
            Ganti kode
          </button>
        </div>
      </header>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter nama, BIB, atau nomor registrasi"
        inputMode="search"
        style={{ ...inputStyle, marginBottom: 14 }}
      />

      <div style={{ display: "grid", gap: 8 }}>
        {visibleParticipants.map((participant) => {
          const collected = participant.rpc_status === "collected";
          return (
            <article key={participant.id} style={participantStyle}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <strong style={bibStyle}>{participant.bib_number || "—"}</strong>
                  <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{participant.name}</strong>
                </div>
                <p style={participantMetaStyle}>
                  {participant.registration_number}
                  {participant.age_class ? ` · ${participant.age_class}` : ""}
                  {participant.gender ? ` · ${participant.gender}` : ""}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={collected ? "secondary" : "primary"}
                disabled={collected || markingId === participant.id}
                onClick={() => collect(participant)}
              >
                {collected ? "Sudah diambil" : markingId === participant.id ? "Menandai…" : "Tandai ambil"}
              </Button>
            </article>
          );
        })}
      </div>
      {visibleParticipants.length === 0 && (
        <p style={descriptionStyle}>Tidak ada peserta yang cocok.</p>
      )}
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh", maxWidth: 680, margin: "0 auto", padding: "32px 16px 48px",
  background: "var(--color-ink)", color: "white",
};
const loginCardStyle: React.CSSProperties = { maxWidth: 440, margin: "10vh auto 0", padding: 24, borderRadius: "var(--radius-lg)", background: "var(--color-surface)", color: "var(--color-ink)" };
const eyebrowStyle: React.CSSProperties = { margin: "0 0 6px", color: "var(--color-flame)", fontWeight: 800, fontSize: 12, letterSpacing: "0.08em" };
const titleStyle: React.CSSProperties = { margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800 };
const descriptionStyle: React.CSSProperties = { color: "var(--color-ink-3)", fontSize: 14, lineHeight: 1.5, margin: "0 0 24px" };
const labelStyle: React.CSSProperties = { display: "grid", gap: 6, fontSize: 14, fontWeight: 700 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid var(--color-ink-2)", borderRadius: "var(--radius-sm)", background: "white", color: "var(--color-ink)", fontSize: 16 };
const participantStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 14, borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-ink)" };
const bibStyle: React.CSSProperties = { minWidth: 42, color: "var(--color-flame)", fontFamily: "var(--font-mono)", fontSize: 18 };
const participantMetaStyle: React.CSSProperties = { margin: "4px 0 0", color: "var(--color-ink-3)", fontFamily: "var(--font-mono)", fontSize: 12 };
const changeCodeStyle: React.CSSProperties = { padding: 0, border: 0, background: "transparent", color: "var(--color-ink-4)", cursor: "pointer", textDecoration: "underline", whiteSpace: "nowrap" };
