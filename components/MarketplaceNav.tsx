"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const items = [
  { href: "/", label: "Beranda" },
  { href: "/jelajahi-event", label: "Jelajahi Event" },
  { href: "/hubungi-kami", label: "Hubungi Kami" },
];

export function MarketplaceNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="market-nav-toggle"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
        aria-controls="market-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        <span>Menu</span>
      </button>
      <nav
        id="market-navigation"
        className="market-nav-links"
        data-open={open ? "true" : "false"}
        aria-label="Navigasi utama"
      >
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "market-nav-active" : undefined}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
