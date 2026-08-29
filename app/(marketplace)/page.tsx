import ButtonLink from "@/components/ui/ButtonLink";
import { Eyebrow } from "@/components/ui/Layout";

export default function HomePage() {
  return (
    <main className="lk-container marketplace-page rh-reveal">
      <section className="market-hero">
        <div className="market-hero-copy">
          <Eyebrow>LowkeyThings</Eyebrow>
          <h1>
            Pengalaman event yang <span>terasa lebih personal.</span>
          </h1>
          <p>
            Temukan pengalaman pilihan, daftar dengan mudah, dan simpan semua
            detail tiketmu dalam satu tempat.
          </p>
          <div className="market-hero-actions">
            <ButtonLink href="/jelajahi-event" size="lg">Jelajahi Event</ButtonLink>
            <ButtonLink href="/hubungi-kami" variant="ghost" size="lg">
              Hubungi Kami
            </ButtonLink>
          </div>
        </div>
        <div className="market-hero-empty">
          <Eyebrow>Curated / Experiences</Eyebrow>
          <strong>Acara menarik, proses sederhana, momen yang berkesan.</strong>
        </div>
      </section>
    </main>
  );
}
