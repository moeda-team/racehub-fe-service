import { HTMLAttributes } from "react";

type CardVariant = "paper" | "dark" | "soft-dark";

export default function Card({
  variant = "paper",
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return <div className={`lk-card lk-card-${variant} ${className}`} {...props} />;
}
