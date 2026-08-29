"use client";

import React, { ReactNode } from "react";
import { createPortal } from "react-dom";
import { createRoot, Root } from "react-dom/client";
import Button from "@/components/ui/Button";
import { CircleAlert, Info } from "lucide-react";

interface ConfirmDialogProps {
  title: ReactNode;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Ya",
  cancelLabel = "Batal",
  variant = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(2px)",
        animation: "confirmFadeIn 0.15s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <style>{`
        @keyframes confirmFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-lg)",
          padding: "28px 24px",
          maxWidth: 420,
          width: "calc(100% - 32px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
          animation: "confirmFadeIn 0.15s ease-out",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                backgroundColor:
                  variant === "danger"
                    ? "var(--color-danger-tint)"
                    : "var(--color-info-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {variant === "danger" ? <CircleAlert size={22} color="var(--color-danger)" aria-hidden /> : <Info size={22} color="var(--color-info)" aria-hidden />}
            </div>
            <h2
              id="confirm-dialog-title"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 17,
                fontWeight: 700,
                color: "var(--color-ink)",
                margin: 0,
                lineHeight: 1.4,
                paddingTop: 6,
              }}
            >
              {title}
            </h2>
          </div>

          <p
            style={{
              fontSize: 14,
              color: "var(--color-ink-2)",
              margin: 0,
              lineHeight: 1.65,
            }}
          >
            {message}
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button
              variant="secondary"
              size="md"
              onClick={onCancel}
              type="button"
            >
              {cancelLabel}
            </Button>
            <Button
              variant={variant === "danger" ? "danger" : "primary"}
              size="md"
              onClick={onConfirm}
              type="button"
              autoFocus
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm API (Promise-based, like native window.confirm) ─────────────────

interface ConfirmOptions {
  title?: ReactNode;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
}

/**
 * Shows a styled confirmation dialog.
 *
 * Usage:
 *   const ok = await confirm({ message: "Hapus item ini?" });
 *   if (!ok) return;
 *   // do the thing
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let root: Root | null = null;
    const container = document.createElement("div");
    document.body.appendChild(container);

    root = createRoot(container);
    root.render(
      createPortal(
        <ConfirmDialog
          title={options.title ?? "Konfirmasi"}
          message={options.message}
          confirmLabel={options.confirmLabel}
          cancelLabel={options.cancelLabel}
          variant={options.variant}
          onConfirm={() => {
            root!.unmount();
            container.remove();
            resolve(true);
          }}
          onCancel={() => {
            root!.unmount();
            container.remove();
            resolve(false);
          }}
        />,
        container,
      ),
    );
  });
}

// ─── Inline variant (for use inside component trees) ────────────────────────

interface InlineConfirmProps extends ConfirmDialogProps {
  open: boolean;
}

export function InlineConfirm(props: InlineConfirmProps) {
  if (!props.open) return null;
  return createPortal(<ConfirmDialog {...props} />, document.body);
}
