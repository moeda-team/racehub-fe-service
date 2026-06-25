import { ReactNode } from "react";
import Link from "next/link";

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(246,247,244,.82)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <div
          className="max-w-5xl mx-auto"
          style={{ display: "flex", alignItems: "center", gap: 24, height: 60, padding: "0 24px" }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: "-0.02em",
              color: "var(--color-ink)",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: "var(--color-flame)",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "var(--shadow-sh-flame)",
                flexShrink: 0,
              }}
            >
              L
            </span>
            LowkeyThings
          </Link>
          <nav style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            <Link
              href="/"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-ink-2)",
                textDecoration: "none",
                padding: "6px 11px",
                borderRadius: "var(--radius-pill)",
              }}
            >
              Beranda
            </Link>
          </nav>
        </div>
      </header>
      <div style={{ flex: 1 }}>{children}</div>
      <footer
        style={{
          background: "var(--color-ink)",
          color: "#c7cdd6",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Checkerboard accent stripe — matches design system footer */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 8,
            backgroundImage:
              "linear-gradient(45deg,var(--color-flame) 25%,transparent 25%,transparent 75%,var(--color-flame) 75%)," +
              "linear-gradient(45deg,var(--color-flame) 25%,transparent 25%,transparent 75%,var(--color-flame) 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0,8px 8px",
          }}
        />
        <div
          className="max-w-5xl mx-auto"
          style={{
            padding: "40px 24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "var(--color-flame)",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              L
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 16,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              LowkeyThings
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              color: "#c7cdd6",
            }}
          >
            by{" "}
            <a
              href="https://www.hompimpa.biz.id/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--color-flame-300)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Hompimpa
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
