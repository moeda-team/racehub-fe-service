import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          backgroundColor: "var(--color-ink)",
          color: "white",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          RaceHub Admin
        </span>
        <nav style={{ display: "flex", gap: 16 }}>
          <a href="/admin" style={{ fontSize: 14, color: "var(--color-ink-4)" }}>
            Home
          </a>
          <a href="/admin/approvals" style={{ fontSize: 14, color: "var(--color-ink-4)" }}>
            Approval
          </a>
          <a href="/admin/refunds" style={{ fontSize: 14, color: "var(--color-ink-4)" }}>
            Refund
          </a>
        </nav>
      </header>
      <main style={{ padding: "24px 32px" }}>{children}</main>
    </div>
  );
}
