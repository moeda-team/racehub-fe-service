import { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { MarketplaceNav } from "@/components/MarketplaceNav";
import { Container } from "@/components/ui/Layout";

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
          <div className="market-footer-brand"><Brand size="sm" /></div>
          <div className="market-footer-copy">
            <p>Temukan, daftar, dan kelola event dengan cepat dan transparan.</p>
            <p className="market-footer-meta">
              © {new Date().getFullYear()} LowkeyThings · by{" "}
              <a href="https://www.hompimpa.biz.id/" target="_blank" rel="noopener noreferrer">Hompimpa</a>
              {process.env.NEXT_PUBLIC_SUPPORT_EMAIL && <>{" · "}<a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}>Hubungi dukungan</a></>}
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
