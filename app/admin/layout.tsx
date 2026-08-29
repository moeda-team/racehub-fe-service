"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/adminAuth";
import { Brand } from "@/components/Brand";
import { LogOut, Menu, X } from "lucide-react";

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
      <main className="auth-shell">
        <Link
          href="/"
          className="auth-brand"
        >
          <Brand context="Admin Panel" size="lg" />
        </Link>
        <div className="auth-card">
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
          <Brand context="Admin Panel" />
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
  return open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />;
}

function LogoutIcon() {
  return <LogOut size={16} aria-hidden />;
}
