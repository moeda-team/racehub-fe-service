import { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px 16px",
      }}
    >
      <Link
        href="/"
        style={{
          color: "var(--color-ink)",
          marginBottom: 32,
          display: "flex",
          textDecoration: "none",
        }}
      >
        <Brand size="lg" />
      </Link>
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-line)",
          padding: "32px 24px",
        }}
      >
        {children}
      </div>
    </main>
  );
}
