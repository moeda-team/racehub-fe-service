import { CSSProperties, HTMLAttributes } from "react";

type TicketVariant = "paper" | "dark";
type TicketSurround = "paper" | "dark" | "deep";

export default function TicketCard({
  variant = "paper",
  surround = "paper",
  perforated = false,
  notchPosition = "62%",
  className = "",
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: TicketVariant;
  surround?: TicketSurround;
  perforated?: boolean;
  notchPosition?: string;
}) {
  return (
    <div
      className={`lk-ticket-card lk-ticket-${variant} lk-ticket-surround-${surround}${perforated ? " lk-ticket-perforated" : ""} ${className}`}
      style={{ ...style, "--ticket-notch-position": notchPosition } as CSSProperties}
      {...props}
    />
  );
}
