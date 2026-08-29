"use client";

import { useEffect } from "react";
import type { CheckinParticipant, CheckinStage } from "@/lib/types.gen";
import Button from "@/components/ui/Button";
import { X } from "lucide-react";

export default function ParticipantDetailModal({ participant, stage, marking, onClose, onClaim }: {
  participant: CheckinParticipant;
  stage: CheckinStage;
  marking: boolean;
  onClose: () => void;
  onClaim: () => void;
}) {
  const done = stage === "rpc" ? participant.rpc_status !== "" : participant.raceday_status !== "";
  const label = stage === "rpc" ? "RPC" : "check-in Hari-H";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !marking) onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [marking, onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="participant-detail-title" style={backdropStyle} onMouseDown={(event) => { if (event.target === event.currentTarget && !marking) onClose(); }}>
      <section style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>INFORMASI PESERTA</p>
            <h2 id="participant-detail-title" style={titleStyle}>{participant.name}</h2>
          </div>
          <button type="button" aria-label="Tutup modal" disabled={marking} onClick={onClose} style={closeStyle}><X size={20} aria-hidden /></button>
        </div>

        <dl style={detailGridStyle}>
          <Detail label="Nomor BIB" value={participant.bib_number || "—"} mono />
          <Detail label="No. registrasi" value={participant.registration_number} mono />
          {participant.gender && <Detail label="Gender" value={participant.gender} />}
          {participant.age_class && <Detail label="Kelas usia" value={participant.age_class} />}
          <Detail label="Status Racepack" value={participant.rpc_status ? "Sudah diambil" : "Belum diambil"} />
          <Detail label="Status Hari-H" value={participant.raceday_status ? "Sudah check-in" : "Belum check-in"} />
        </dl>

        <div style={{ marginTop: 18 }}>
          <h3 style={sectionTitleStyle}>Data tambahan</h3>
          {participant.custom_answers.length > 0 ? (
            <dl style={answersStyle}>
              {participant.custom_answers.map((answer, index) => (
                <Detail key={`${answer.label}-${index}`} label={answer.label} value={answer.value} />
              ))}
            </dl>
          ) : <p style={emptyStyle}>Tidak ada data tambahan pada formulir peserta.</p>}
        </div>

        <div style={actionsStyle}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={marking}>Tutup</Button>
          <Button type="button" variant={done ? "secondary" : "primary"} onClick={onClaim} disabled={done || marking}>
            {done ? `${label} sudah diklaim` : marking ? "Memproses…" : `Claim ${label}`}
          </Button>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div style={detailStyle}><dt style={termStyle}>{label}</dt><dd style={{ ...valueStyle, ...(mono ? { fontFamily: "var(--font-mono)" } : {}) }}>{value}</dd></div>;
}

const backdropStyle: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: 16, background: "rgba(20,24,31,.78)" };
const modalStyle: React.CSSProperties = { width: "min(100%, 520px)", maxHeight: "calc(100vh - 32px)", overflowY: "auto", padding: 20, borderRadius: "var(--radius-lg)", background: "var(--color-panel)", color: "var(--color-ink)", border: "1px solid var(--color-line)", boxShadow: "var(--shadow-sh-3)" };
const headerStyle: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 };
const eyebrowStyle: React.CSSProperties = { margin: "0 0 4px", color: "var(--color-gold-deep)", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, letterSpacing: ".12em" };
const titleStyle: React.CSSProperties = { margin: 0, fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 1.2 };
const closeStyle: React.CSSProperties = { width: 40, height: 40, flexShrink: 0, border: "1px solid var(--color-line)", borderRadius: 999, background: "transparent", color: "var(--color-ink-2)", fontSize: 26, cursor: "pointer" };
const detailGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, margin: "18px 0 0" };
const answersStyle: React.CSSProperties = { display: "grid", gap: 8, margin: "8px 0 0" };
const detailStyle: React.CSSProperties = { padding: "10px 12px", border: "1px solid var(--color-line)", borderRadius: "var(--radius-sm)", background: "var(--color-paper)" };
const termStyle: React.CSSProperties = { color: "var(--color-ink-3)", fontSize: 12, fontWeight: 700 };
const valueStyle: React.CSSProperties = { margin: "3px 0 0", fontSize: 15, fontWeight: 700, overflowWrap: "anywhere" };
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontFamily: "var(--font-display)", fontSize: 17 };
const emptyStyle: React.CSSProperties = { margin: "8px 0 0", color: "var(--color-ink-3)", fontSize: 14 };
const actionsStyle: React.CSSProperties = { display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap", marginTop: 22 };
