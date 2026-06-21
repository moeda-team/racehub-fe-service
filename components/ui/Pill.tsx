import { ReactNode } from "react";

interface PillProps {
  children: ReactNode;
  className?: string;
}

export default function Pill({ children, className = "" }: PillProps) {
  return <span className={`pill ${className}`}>{children}</span>;
}
