"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/adminAuth";

const navItems = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/events", label: "Event" },
  { href: "/admin/approval", label: "Approval" },
  { href: "/admin/refunds", label: "Refund" },
  { href: "/admin/wallet", label: "Platform Wallet" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const { isAuthenticated, isLoading, logout } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMenuOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [isLoading, isAuthenticated, router, isLoginPage]);

  // Show loading spinner for protected pages only; let login page render freely.
  if (!isLoginPage && (isLoading || !isAuthenticated)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-ink-3)",
          fontFamily: "var(--font-body)",
        }}
      >
        Memuat…
      </div>
    );
  }

  if (isLoginPage) {
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
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 28,
            color: "var(--color-ink)",
            marginBottom: 32,
            display: "block",
            textAlign: "center",
          }}
        >
          Admin Panel
        </span>
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

  const onLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  return (
    <div className="dash-shell">
      <aside className="dash-aside">
        <Link href="/admin/overview" className="dash-brand">
          <span className="dash-brand-dot">A</span>
          Admin Panel
        </Link>
        <nav className="dash-nav">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dash-link${active ? " active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="dash-hamburger"
          aria-label="Menu navigasi"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <HamburgerIcon open={menuOpen} />
        </button>

        <div className="dash-foot">
          <div className="profile-menu">
            <button
              type="button"
              className="profile-trigger"
              onClick={onLogout}
              style={{ width: "100%", textAlign: "left" }}
            >
              <span className="profile-avatar">A</span>
              <span className="profile-meta">
                <span className="profile-name">Admin</span>
              </span>
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {menuOpen && (
        <nav className="dash-mobile-menu">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dash-mobile-link${active ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      <main className="dash-main">{children}</main>
    </div>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <line x1="4" y1="4" x2="16" y2="16" />
          <line x1="16" y1="4" x2="4" y2="16" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="17" y2="6" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="14" x2="17" y2="14" />
        </>
      )}
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
