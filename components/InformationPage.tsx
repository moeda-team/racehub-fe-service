import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Layout";

export function InformationPage({
  title,
  eyebrow,
  description,
  effectiveDate,
  children,
}: {
  title: string;
  eyebrow: string;
  description?: string;
  effectiveDate?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="lk-container information-page">
      <header className="information-header">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {effectiveDate && (
          <p className="information-date">
            Berlaku sejak <time dateTime="2026-09-01">1 September 2026</time>
          </p>
        )}
      </header>
      <article className="information-content">{children}</article>
      <aside className="information-contact" aria-label="Bantuan LowkeyThings">
        <h2>Butuh bantuan atau klarifikasi?</h2>
        <p>
          Hubungi tim LowkeyThings melalui <Link href="/hubungi-kami">halaman Hubungi Kami</Link>.
        </p>
        <a href="mailto:admin@lowkeythings.my.id">admin@lowkeythings.my.id</a>
        <a href="https://wa.me/6285148351241">WhatsApp: +62 851-4835-1241</a>
        <p>Kebumen, Jawa Tengah, Indonesia</p>
      </aside>
    </main>
  );
}
