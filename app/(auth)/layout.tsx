import { ReactNode } from "react";
import Link from "next/link";

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
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 28,
          color: "var(--color-flame)",
          marginBottom: 32,
          display: "block",
          textAlign: "center",
        }}
      >
        RaceHub
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
