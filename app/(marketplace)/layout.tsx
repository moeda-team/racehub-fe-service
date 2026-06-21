import { ReactNode } from "react";
import Link from "next/link";

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header
        style={{
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-line)",
          padding: "12px 16px",
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 20,
              color: "var(--color-flame)",
            }}
          >
            RaceHub
          </Link>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/" style={{ fontSize: 14, color: "var(--color-ink-2)" }}>
              Beranda
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
