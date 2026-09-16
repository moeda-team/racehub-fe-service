import { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { MarketplaceNav } from "@/components/MarketplaceNav";
import { Container } from "@/components/ui/Layout";

const supportEmail = "admin@lowkeythings.my.id";

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="market-shell">
      <header className="market-nav">
        <Container className="market-nav-inner">
          <Link href="/" className="market-brand" aria-label="LowkeyThings beranda">
            <Brand />
          </Link>
          <MarketplaceNav />
        </Container>
      </header>
      <div className="market-content">{children}</div>
      <footer id="contact" className="market-footer">
        <Container className="market-footer-inner">
          <div className="market-footer-intro">
            <div className="market-footer-brand">
              <Brand size="sm" />
            </div>
            <p>Temukan, daftar, dan kelola event dengan cepat dan transparan.</p>
          </div>
          <div className="market-footer-column">
            <h2>Halaman</h2>
            <Link href="/">Home Page</Link>
            <Link href="/jelajahi-event">Event</Link>
            <Link href="/hubungi-kami">Hubungi Kami</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/refund-policy">Refund Policy</Link>
            <Link href="/terms-conditions">Syarat & Ketentuan</Link>
          </div>
          <div className="market-footer-column">
            <h2>Kontak</h2>
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            <a href="https://wa.me/6285148351241" target="_blank" rel="noopener noreferrer">
              +6285148351241
            </a>
            <span>
              Jebor Bumen Kutowinangun RT 002 RW 003 Desa Kutowinangun, Kecamatan Kutowinangun, Kabupaten Kebumen,
              Provinsi Jawa Tengah
            </span>
          </div>
          <div className="market-footer-bottom">
            <p>© {new Date().getFullYear()} LowkeyThings</p>
            <p>
              By{" "}
              <a href="https://www.hompimpa.biz.id/" target="_blank" rel="noopener noreferrer">
                Hompimpa
              </a>
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
