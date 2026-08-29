"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { Camera, X } from "lucide-react";

const formats = ["qr_code", "code_128", "code_39", "ean_13", "ean_8"];

export default function BarcodeScanner({ onToken }: { onToken: (token: string) => void }) {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const supported = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stop = useCallback(() => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setOpen(true);
    if (!supported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const Detector = (window as unknown as {
        BarcodeDetector: new (options: { formats: string[] }) => {
          detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
        };
      }).BarcodeDetector;
      const detector = new Detector({ formats });
      const detectFrame = async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            stop();
            setOpen(false);
            onToken(codes[0].rawValue);
            return;
          }
        } catch {
          // A frame may fail while the camera is focusing; continue scanning.
        }
        frameRef.current = requestAnimationFrame(detectFrame);
      };
      frameRef.current = requestAnimationFrame(detectFrame);
    } catch {
      setCameraError("Tidak bisa mengakses kamera. Masukkan token tiket secara manual.");
    }
  }, [onToken, stop, supported]);

  return (
    <div style={{ marginTop: 12 }}>
      {!open ? (
        <button type="button" onClick={startCamera} style={scanButtonStyle}>
          <Camera size={18} aria-hidden /> Scan barcode / QR
        </button>
      ) : (
        <div style={panelStyle}>
          {supported && <video ref={videoRef} muted playsInline style={videoStyle} />}
          {cameraError && <p style={errorStyle}>{cameraError}</p>}
          {!supported && <p style={helpStyle}>Pemindaian kamera tidak didukung perangkat ini. Masukkan token yang tercetak pada tiket:</p>}
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

const scanButtonStyle: React.CSSProperties = { width: "100%", minHeight: 48, borderRadius: "var(--radius-md)", border: "1px dashed var(--color-ink-2)", background: "transparent", color: "var(--color-ink-4)", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const panelStyle: React.CSSProperties = { padding: 12, borderRadius: "var(--radius-md)", background: "var(--color-panel)" };
const videoStyle: React.CSSProperties = { width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: "var(--radius-sm)", background: "#000" };
const errorStyle: React.CSSProperties = { margin: "8px 0", color: "var(--color-danger)", fontSize: 13 };
const helpStyle: React.CSSProperties = { margin: "0 0 8px", color: "var(--color-ink-3)", fontSize: 13 };
const inputStyle: React.CSSProperties = { width: "100%", minHeight: 48, padding: "10px 14px", border: "1px solid var(--color-ink-2)", borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-ink)", fontSize: 16 };
const closeStyle: React.CSSProperties = { marginTop: 10, border: "none", background: "none", color: "var(--color-ink-3)", fontSize: 13, cursor: "pointer" };
