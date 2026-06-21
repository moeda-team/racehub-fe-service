import { ReactNode } from "react";

type BadgeVariant = "ok" | "warn" | "danger" | "neutral" | "flame" | "sprint";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  ok: "badge-ok",
  warn: "badge-warn",
  danger: "badge-danger",
  neutral: "badge-neutral",
  flame: "badge-flame",
  sprint: "badge-sprint",
};

export default function Badge({
  variant = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span className={`badge ${variantClass[variant]} ${className}`}>
      {children}
    </span>
  );
}
