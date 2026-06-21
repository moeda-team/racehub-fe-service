"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/events", label: "Event Saya" },
  { href: "/dashboard/profile", label: "Profil" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, profile, logout } = useAuth();

  // Guard: redirect to login when not authenticated.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-ink-3)",
        }}
      >
        Memuat…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 240,
          backgroundColor: "var(--color-surface)",
          borderRight: "1px solid var(--color-line)",
          padding: "24px 16px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 20,
            color: "var(--color-flame)",
            display: "block",
            marginBottom: 24,
          }}
        >
          RaceHub
        </Link>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--color-flame)" : "var(--color-ink-2)",
                  backgroundColor: active ? "var(--color-flame-tint)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          {profile && (
            <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 8 }}>
              {profile.name}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            style={{
              background: "none",
              border: "none",
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--color-ink-3)",
              textAlign: "left",
            }}
          >
            Keluar
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "24px 32px" }}>{children}</main>
    </div>
  );
}
