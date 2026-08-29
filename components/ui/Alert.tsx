import { ReactNode } from "react";
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";

type AlertVariant = "success" | "warn" | "danger" | "info";

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

const variantClass: Record<AlertVariant, string> = {
  success: "alert-success",
  warn: "alert-warn",
  danger: "alert-danger",
  info: "alert-info",
};

const variantIcon: Record<AlertVariant, typeof Info> = {
  success: CircleCheck,
  warn: TriangleAlert,
  danger: CircleX,
  info: Info,
};

/* Bright semantic color for the icon circle background — distinct from the
   darker text color used by each alert variant. */
const variantIconBg: Record<AlertVariant, string> = {
  success: "var(--color-ok)",
  warn: "var(--color-warn)",
  danger: "var(--color-danger)",
  info: "var(--color-info)",
};

export default function Alert({
  variant = "info",
  children,
  className = "",
}: AlertProps) {
  const Icon = variantIcon[variant];
  return (
    <div className={`alert ${variantClass[variant]} ${className}`} role="alert">
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: variantIconBg[variant],
          color: "white",
          fontFamily: "var(--font-display)",
          fontSize: 13,
          fontWeight: 800,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <Icon size={13} strokeWidth={2.5} aria-hidden />
      </span>
      <span>{children}</span>
    </div>
  );
}
