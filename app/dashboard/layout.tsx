"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { OrganizerProfile } from "@/lib/types.gen";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/events", label: "Event Saya" },
  { href: "/dashboard/wallet", label: "Wallet" },
  { href: "/rpc", label: "RPC / Check-in" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Guard: redirect to login when not authenticated.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Close mobile menu on route change.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

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

  const onLogout = () => { logout(); router.replace("/login"); };

  return (
    <div className="dash-shell">
      <aside className="dash-aside">
        <Link href="/" className="dash-brand">
          <span className="dash-brand-dot">L</span>
          LowkeyThings
        </Link>
        <nav className="dash-nav">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
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

        {/* Mobile-only hamburger */}
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
          <ProfileMenu profile={profile} onLogout={onLogout} />
        </div>
      </aside>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <nav className="dash-mobile-menu">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
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

// ProfileMenu shows the signed-in organizer as an avatar card that opens a
// dropdown containing the profile link and "Keluar".
function ProfileMenu({
  profile,
  onLogout,
}: {
  profile: OrganizerProfile | null;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside the menu.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!profile) return null;

  return (
    <div className={`profile-menu${open ? " open" : ""}`} ref={ref}>
      {open && (
        <div className="profile-pop" role="menu">
          <Link href="/dashboard/profile" className="profile-item" role="menuitem" onClick={() => setOpen(false)}>
            <UserIcon />
            Profil
          </Link>
          <div className="profile-sep" />
          <button
            type="button"
            className="profile-item profile-item-danger"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogoutIcon />
            Keluar
          </button>
        </div>
      )}
      <button
        type="button"
        className="profile-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="profile-avatar">{initials(profile.name)}</span>
        <span className="profile-meta">
          <span className="profile-name">{profile.name}</span>
        </span>
        <ChevronIcon />
      </button>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[parts.length - 1][0];
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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

function ChevronIcon() {
  return (
    <svg className="profile-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
