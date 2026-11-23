"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { Camera, ChevronRight, X } from "lucide-react";

export default function BarcodeScanner({ onToken }: { onToken: (token: string) => void }) {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    const stopScan = stopRef.current;
    stopRef.current = null;
    stopScan?.();
  }, []);

  useEffect(() => () => stop(), [stop]);

  const startCamera = async () => {
    stop();
    setCameraError(null);
    setOpen(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Kamera memerlukan browser yang mendukung akses kamera dan halaman HTTPS. Masukkan token tiket secara manual.");
      return;
    }

    let cancelled = false;
    let stream: MediaStream | undefined;
    let stopDecoder: (() => void) | undefined;
    stopRef.current = () => {
      cancelled = true;
      stopDecoder?.();
      stream?.getTracks().forEach((track) => track.stop());
    };

    try {
      const [{ BrowserMultiFormatReader }, { BarcodeFormat }] = await Promise.all([
        import("@zxing/browser"),
        import("@zxing/library"),
      ]);
      if (cancelled) return;

      const video = videoRef.current;
      if (!video) throw new Error("Camera preview is unavailable");

      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const reader = new BrowserMultiFormatReader();
      reader.possibleFormats = [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
      ];

      const controls = await reader.decodeFromStream(stream, video, (result, _, scanControls) => {
        const token = result?.getText();
        if (cancelled || !token) return;

        stopDecoder = () => scanControls.stop();
        stop();
        setOpen(false);
        onToken(token);
      });

      if (cancelled) {
        if (!stopDecoder) controls.stop();
      } else {
        stopDecoder = () => controls.stop();
      }
    } catch {
      if (cancelled) return;
      stop();
      setCameraError("Tidak bisa memulai pemindaian. Periksa izin kamera atau masukkan token tiket secara manual.");
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      {!open ? (
        <button type="button" onClick={startCamera} className="barcode-scan-button">
          <span className="barcode-scan-icon" aria-hidden>
            <Camera size={21} strokeWidth={2} />
          </span>
          <span className="barcode-scan-copy">
            <strong>Pindai barcode / QR</strong>
            <small>Gunakan kamera perangkat</small>
          </span>
          <ChevronRight className="barcode-scan-arrow" size={20} aria-hidden />
        </button>
      ) : (
        <div style={panelStyle}>
          {!cameraError && <video ref={videoRef} muted playsInline style={videoStyle} />}
          {cameraError && <p style={errorStyle}>{cameraError}</p>}
          <form onSubmit={(event) => {
            event.preventDefault();
            if (!manual.trim()) return;
            onToken(manual.trim());
            setManual("");
            stop();
            setOpen(false);
          }} style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input value={manual} onChange={(event) => setManual(event.target.value)} placeholder="Token barcode / QR" style={{ ...inputStyle, flex: 1 }} />
            <Button type="submit" variant="secondary" size="md">Cek</Button>
          </form>
          <button type="button" onClick={() => { stop(); setOpen(false); }} style={closeStyle}><X size={16} aria-hidden /> Tutup</button>
        </div>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = { padding: 12, borderRadius: "var(--radius-md)", background: "var(--color-panel)" };
const videoStyle: React.CSSProperties = { width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: "var(--radius-sm)", background: "#000" };
const errorStyle: React.CSSProperties = { margin: "8px 0", color: "var(--color-danger)", fontSize: 13 };
const inputStyle: React.CSSProperties = { width: "100%", minHeight: 48, padding: "10px 14px", border: "1px solid var(--color-ink-2)", borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-ink)", fontSize: 16 };
const closeStyle: React.CSSProperties = { marginTop: 10, border: "none", background: "none", color: "var(--color-ink-3)", fontSize: 13, cursor: "pointer" };
