import { ReactNode } from "react";

type AlertVariant = "warn" | "danger" | "info";

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

const variantClass: Record<AlertVariant, string> = {
  warn: "alert-warn",
  danger: "alert-danger",
  info: "alert-info",
};

const variantIcon: Record<AlertVariant, string> = {
  warn: "!",
  danger: "×",
  info: "i",
};

/* Bright semantic color for the icon circle background — distinct from the
   darker text color used by each alert variant. */
const variantIconBg: Record<AlertVariant, string> = {
  warn: "var(--color-warn)",
  danger: "var(--color-danger)",
  info: "var(--color-sprint)",
};

export default function Alert({
  variant = "info",
  children,
  className = "",
}: AlertProps) {
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
        {variantIcon[variant]}
      </span>
      <span>{children}</span>
    </div>
  );
}
