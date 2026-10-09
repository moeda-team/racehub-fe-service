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
  const claimLabel = stage === "rpc" ? "Tandai diambil" : "Tandai check-in";
  const doneLabel = stage === "rpc" ? "Sudah diambil" : "Sudah check-in";

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
          <Detail label="Kategori" value={participant.category_name} />
          <Detail label="Jenis tiket" value={participant.ticket_name} />
          {participant.gender && <Detail label="Gender" value={participant.gender} />}
          {participant.age_class && <Detail label="Kelas usia" value={participant.age_class} />}
          <Detail label="Status perlengkapan" value={participant.rpc_status ? "Sudah diambil" : "Belum diambil"} />
          <Detail label="Status Hari-H" value={participant.raceday_status ? "Sudah check-in" : "Belum check-in"} />
        </dl>

        <div style={{ marginTop: 12 }}>
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
          <Button type="button" variant="secondary" onClick={onClose} disabled={marking} style={{ flex: 1, minWidth: 0 }}>Tutup</Button>
          <Button type="button" variant={done ? "secondary" : "primary"} onClick={onClaim} disabled={done || marking} style={{ flex: 1, minWidth: 0 }}>
            {done ? doneLabel : marking ? "Memproses…" : claimLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div style={detailStyle}><dt style={termStyle}>{label}</dt><dd style={{ ...valueStyle, ...(mono ? { fontFamily: "var(--font-mono)" } : {}) }}>{value}</dd></div>;
}

const backdropStyle: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: 8, background: "rgba(20,24,31,.78)" };
const modalStyle: React.CSSProperties = { width: "min(100%, 440px)", maxHeight: "calc(100dvh - 16px)", overflowY: "auto", padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--color-panel)", color: "var(--color-ink)", border: "1px solid var(--color-line)", boxShadow: "var(--shadow-sh-3)" };
const headerStyle: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 };
const eyebrowStyle: React.CSSProperties = { margin: "0 0 4px", color: "var(--color-gold-deep)", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, letterSpacing: ".12em" };
const titleStyle: React.CSSProperties = { margin: 0, fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 1.2, overflowWrap: "anywhere" };
const closeStyle: React.CSSProperties = { width: 32, height: 32, flexShrink: 0, border: "1px solid var(--color-line)", borderRadius: 999, background: "transparent", color: "var(--color-ink-2)", cursor: "pointer" };
const detailGridStyle: React.CSSProperties = { display: "grid", margin: "10px 0 0" };
const answersStyle: React.CSSProperties = { display: "grid", margin: "4px 0 0" };
const detailStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(105px, 36%) minmax(0, 1fr)", alignItems: "start", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--color-line)" };
const termStyle: React.CSSProperties = { color: "var(--color-ink-3)", fontSize: 12, lineHeight: 1.35 };
const valueStyle: React.CSSProperties = { margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.35, overflowWrap: "anywhere" };
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontFamily: "var(--font-display)", fontSize: 15 };
const emptyStyle: React.CSSProperties = { margin: "5px 0 0", color: "var(--color-ink-3)", fontSize: 12 };
const actionsStyle: React.CSSProperties = { position: "sticky", bottom: -14, display: "flex", gap: 8, marginTop: 12, paddingTop: 10, background: "var(--color-panel)" };
