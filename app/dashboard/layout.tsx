"use client";

import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { OrganizerProfile } from "@/lib/types.gen";
import { Brand } from "@/components/Brand";
import { ChevronUp, LogOut, Menu, User, X } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/events", label: "Event Saya" },
  { href: "/dashboard/wallet", label: "Wallet" },
  { href: "/dashboard/refund", label: "Refund" },
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
  useEffect(() => {
    const id = requestAnimationFrame(() => setMenuOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

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

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="dash-shell">
      <aside className="dash-aside">
        <Link href="/" className="dash-brand">
          <Brand />
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
  const [menuPosition, setMenuPosition] = useState<CSSProperties | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement | null>(null);

  // Close when clicking outside the menu.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        !popupRef.current?.contains(e.target as Node)
      )
        setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKeyDown);
    firstMenuItemRef.current?.focus();
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!profile) return null;

  const toggleMenu = () => {
    if (open) {
      setOpen(false);
      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    setMenuPosition(
      isMobile
        ? {
            top: rect.bottom + 8,
            right: 12,
            bottom: "auto",
            left: "auto",
            width: Math.min(280, window.innerWidth - 24),
          }
        : {
            top: "auto",
            right: "auto",
            bottom: window.innerHeight - rect.top + 8,
            left: rect.left,
            width: rect.width,
          },
    );
    setOpen(true);
  };

  const popup = open && menuPosition && (
    <div
      className="profile-pop profile-pop-portal"
      role="menu"
      ref={popupRef}
      style={menuPosition}
    >
      <Link
        href="/dashboard/profile"
        className="profile-item"
        role="menuitem"
        ref={firstMenuItemRef}
        onClick={() => setOpen(false)}
      >
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
  );

  return (
    <>
      <div className={`profile-menu${open ? " open" : ""}`} ref={ref}>
      <button
        type="button"
        ref={triggerRef}
        className="profile-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleMenu}
      >
        <span className="profile-avatar">{initials(profile.name)}</span>
        <span className="profile-meta">
          <span className="profile-name">{profile.name}</span>
        </span>
        <ChevronIcon />
      </button>
      </div>
      {popup && createPortal(popup, document.body)}
    </>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[parts.length - 1][0];
}

function HamburgerIcon({ open }: { open: boolean }) {
  return open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />;
}

function ChevronIcon() {
  return <ChevronUp className="profile-caret" size={16} aria-hidden />;
}

function UserIcon() {
  return <User size={16} aria-hidden />;
}

function LogoutIcon() {
  return <LogOut size={16} aria-hidden />;
}
