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
  danger: "x",
  info: "i",
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
          background: "currentColor",
          color: "white",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {variantIcon[variant]}
      </span>
      <span>{children}</span>
    </div>
  );
}
