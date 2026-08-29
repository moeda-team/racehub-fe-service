import { Mail } from "lucide-react";
import { Eyebrow } from "@/components/ui/Layout";

export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <main className="lk-container marketplace-page rh-reveal">
      <section className="market-catalog">
        <div className="lk-section-header">
          <Eyebrow>Contact / Support</Eyebrow>
          <h1>Hubungi Kami</h1>
          <p>
            Punya pertanyaan tentang event, tiket, atau kerja sama? Tim kami
            siap membantu.
          </p>
        </div>

        <div className="lk-card" style={{ maxWidth: 620, marginTop: 40 }}>
          <Mail size={24} aria-hidden />
          <h2 style={{ marginTop: 18 }}>Email LowkeyThings</h2>
          {supportEmail ? (
            <a className="btn btn-primary" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
          ) : (
            <p style={{ color: "var(--color-ink-soft)" }}>
              Alamat email dukungan akan segera tersedia.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
