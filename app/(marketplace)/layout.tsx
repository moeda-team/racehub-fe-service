import { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { MarketplaceNav } from "@/components/MarketplaceNav";
import { Container } from "@/components/ui/Layout";

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "halo@lowkeythings.id";

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="market-shell">
      <header className="market-nav">
        <Container className="market-nav-inner">
          <Link href="/" className="market-brand" aria-label="LowkeyThings beranda"><Brand /></Link>
          <MarketplaceNav />
        </Container>
      </header>
      <div className="market-content">{children}</div>
      <footer id="contact" className="market-footer">
        <Container className="market-footer-inner">
          <div className="market-footer-intro">
            <div className="market-footer-brand"><Brand size="sm" /></div>
            <p>Temukan, daftar, dan kelola event dengan cepat dan transparan.</p>
          </div>
          <div className="market-footer-column">
            <h2>Halaman</h2>
            <Link href="/">Home Page</Link>
            <Link href="/jelajahi-event">Event</Link>
            <Link href="/hubungi-kami">Hubungi Kami</Link>
          </div>
          <div className="market-footer-column">
            <h2>Kontak</h2>
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">+62 812-3456-7890</a>
            <span>Ungaran, Jawa Tengah</span>
          </div>
          <div className="market-footer-column">
            <h2>Sosial</h2>
            <a href="https://www.instagram.com/lowkeythings.id/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://www.tiktok.com/@lowkeythings.id" target="_blank" rel="noopener noreferrer">TikTok</a>
            <a href="https://x.com/lowkeythings_id" target="_blank" rel="noopener noreferrer">X</a>
          </div>
          <div className="market-footer-bottom">
            <p>© {new Date().getFullYear()} LowkeyThings. Semua hak dilindungi.</p>
            <p>Dibuat dengan tenang, untuk event yang bermakna. Oleh <a href="https://www.hompimpa.biz.id/" target="_blank" rel="noopener noreferrer">Hompimpa</a>.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
