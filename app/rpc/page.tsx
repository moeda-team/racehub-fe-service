"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
  ApiResponse,
  CheckinParticipant,
  CheckinStage,
  Event,
} from "@/lib/types.gen";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

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
        const res = await api.get<ApiResponse<Event[]>>("/api/v1/events");
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
    return <div style={{ minHeight: "100vh", background: "var(--color-ink)" }} />;
  }

  return (
    <main
      className="rh-reveal"
      style={{
        minHeight: "100vh",
        background: "var(--color-ink)",
        color: "white",
        padding: "16px 16px 48px",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800 }}>RPC / Check-in</h1>
        <a href="/dashboard" style={{ color: "var(--color-ink-4)", fontSize: 14 }}>
          Dashboard
        </a>
      </header>

      {events.length === 0 ? (
        <p style={{ color: "var(--color-ink-4)" }}>Belum ada event. Buat event di dashboard terlebih dahulu.</p>
      ) : (
        <>
          {/* Event picker */}
          <label style={{ display: "block", fontSize: 13, color: "var(--color-ink-4)", marginBottom: 6 }}>
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
            <StageButton active={stage === "rpc"} onClick={() => setStage("rpc")} label="Racepack (H-1/H-2)" />
            <StageButton active={stage === "raceday"} onClick={() => setStage("raceday")} label="Hari-H" />
          </div>

          {eventId != null && <CheckinPanel key={`${eventId}-${stage}`} eventId={eventId} stage={stage} />}
        </>
      )}
    </main>
  );
}

function StageButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minHeight: 56,
        borderRadius: "var(--radius-md)",
        border: active ? "2px solid var(--color-flame)" : "1px solid var(--color-ink-2)",
        background: active ? "var(--color-flame)" : "transparent",
        color: active ? "white" : "var(--color-ink-4)",
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function CheckinPanel({ eventId, stage }: { eventId: string; stage: CheckinStage }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CheckinParticipant[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!q.trim()) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await api.get<ApiResponse<CheckinParticipant[]>>(
        `/api/v1/events/${eventId}/checkin/search?q=${encodeURIComponent(q.trim())}`,
      );
      setResults(res.data ?? []);
      if ((res.data ?? []).length === 0) setErr("Tidak ada peserta yang cocok.");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Pencarian gagal.");
    } finally {
      setBusy(false);
    }
  }, [eventId, q]);

  // Replace a participant in the current result list after marking.
  const applyMarked = useCallback((p: CheckinParticipant) => {
    setResults((prev) => {
      const i = prev.findIndex((r) => r.id === p.id);
      if (i === -1) return [p, ...prev];
      const next = [...prev];
      next[i] = p;
      return next;
    });
    setFlash(`${p.name} · ${stageLabel(stage)} ✓`);
  }, [stage]);

  async function mark(p: CheckinParticipant) {
    setErr(null);
    try {
      const res = await api.post<ApiResponse<CheckinParticipant>>(`/api/v1/events/${eventId}/checkin`, {
        registration_id: p.id,
        stage,
      });
      applyMarked(res.data);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Gagal menandai check-in.");
    }
  }

  async function markByToken(token: string) {
    setErr(null);
    try {
      const res = await api.post<ApiResponse<CheckinParticipant>>(`/api/v1/events/${eventId}/checkin/scan`, {
        qr_token: token,
        stage,
      });
      applyMarked(res.data);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "QR tidak valid untuk event ini.");
    }
  }

  return (
    <div>
      {/* Primary: manual search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama / BIB / no. registrasi"
          inputMode="search"
          autoFocus
          style={{ ...fieldStyle, flex: 1, marginBottom: 0 }}
        />
        <Button type="submit" variant="primary" size="md" disabled={busy}>
          {busy ? "…" : "Cari"}
        </Button>
      </form>

      <QrScanner onToken={markByToken} />

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

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
        {results.map((p) => (
          <ParticipantCard key={p.id} p={p} stage={stage} onMark={() => mark(p)} />
        ))}
      </div>
    </div>
  );
}

function ParticipantCard({
  p,
  stage,
  onMark,
}: {
  p: CheckinParticipant;
  stage: CheckinStage;
  onMark: () => void;
}) {
  const done = stage === "rpc" ? p.rpc_status !== "" : p.raceday_status !== "";
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
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 800 }}>
            {p.bib_number || "—"}
          </span>
          <span style={{ fontSize: 17, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.name}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 2 }}>
          {p.registration_number}
          {p.age_class ? ` · ${p.age_class}` : ""}
          {p.gender ? ` · ${p.gender}` : ""}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <StatusPill on={p.rpc_status !== ""} label="Racepack" />
          <StatusPill on={p.raceday_status !== ""} label="Hari-H" />
        </div>
      </div>
      <button
        type="button"
        onClick={onMark}
        disabled={done}
        style={{
          minHeight: 56,
          minWidth: 96,
          flexShrink: 0,
          borderRadius: "var(--radius-md)",
          border: "none",
          background: done ? "var(--color-line)" : "var(--color-flame)",
          color: done ? "var(--color-ink-3)" : "white",
          fontSize: 15,
          fontWeight: 800,
          cursor: done ? "default" : "pointer",
        }}
      >
        {done ? "✓ OK" : `Tandai ${stageLabel(stage)}`}
      </button>
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

// QrScanner: secondary check-in input. Uses the native BarcodeDetector
// API for camera scanning where supported (Chrome/Android), with a manual token
// paste fallback everywhere else — no extra dependency.
function QrScanner({ onToken }: { onToken: (token: string) => void }) {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState("");
  const [camErr, setCamErr] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const supported = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  const startCamera = useCallback(async () => {
    setCamErr(null);
    setOpen(true);
    if (!supported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // BarcodeDetector is experimental; typed loosely to avoid a hard dep.
      const Detector = (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      const detector = new Detector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0 && codes[0].rawValue) {
            stop();
            setOpen(false);
            onToken(codes[0].rawValue);
            return;
          }
        } catch {
          /* transient frame errors are ignored */
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCamErr("Tidak bisa mengakses kamera. Masukkan token QR manual di bawah.");
    }
  }, [supported, onToken, stop]);

  return (
    <div style={{ marginTop: 12 }}>
      {!open ? (
        <button
          type="button"
          onClick={startCamera}
          style={{
            width: "100%",
            minHeight: 48,
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--color-ink-2)",
            background: "transparent",
            color: "var(--color-ink-4)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          📷 Scan QR (sekunder)
        </button>
      ) : (
        <div style={{ background: "var(--color-panel)", borderRadius: "var(--radius-md)", padding: 12 }}>
          {supported && (
            <video
              ref={videoRef}
              muted
              playsInline
              style={{ width: "100%", borderRadius: "var(--radius-sm)", background: "#000", aspectRatio: "1 / 1", objectFit: "cover" }}
            />
          )}
          {camErr && (
            <p style={{ color: "var(--color-danger)", fontSize: 13, margin: "8px 0" }}>{camErr}</p>
          )}
          {!supported && (
            <p style={{ color: "var(--color-ink-3)", fontSize: 13, marginBottom: 8 }}>
              Kamera scan tidak didukung di perangkat ini. Tempel token QR e-tiket:
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manual.trim()) {
                onToken(manual.trim());
                setManual("");
                stop();
                setOpen(false);
              }
            }}
            style={{ display: "flex", gap: 8, marginTop: 8 }}
          >
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Token QR e-tiket"
              style={{ ...fieldStyle, flex: 1, marginBottom: 0 }}
            />
            <Button type="submit" variant="secondary" size="md">
              Cek
            </Button>
          </form>
          <button
            type="button"
            onClick={() => {
              stop();
              setOpen(false);
            }}
            style={{ background: "none", border: "none", color: "var(--color-ink-3)", fontSize: 13, marginTop: 10, cursor: "pointer" }}
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
}

function stageLabel(stage: CheckinStage): string {
  return stage === "rpc" ? "Racepack" : "Hari-H";
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
