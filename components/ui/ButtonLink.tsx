import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export default function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children: ReactNode;
  }) {
  return (
    <Link className={`btn btn-${variant} btn-${size} ${className}`} {...props}>
      {children}
    </Link>
  );
}
