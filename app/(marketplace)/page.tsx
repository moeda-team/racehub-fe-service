"use client";

import { useEffect, useState } from "react";
import { BarChart3, Bell, CreditCard, Search, Ticket, Users } from "lucide-react";
import ButtonLink from "@/components/ui/ButtonLink";
import EventCard from "@/components/ui/EventCard";
import { Eyebrow } from "@/components/ui/Layout";
import { api } from "@/lib/api";
import { formatDate, formatRupiah } from "@/lib/format";
import type { PublicEvent } from "@/lib/types.gen";

type PagedEvents = { data: PublicEvent[] };

const services = [
  {
    icon: Search,
    title: "Temukan Event",
    description: "Cari event berdasarkan kategori, tanggal, atau kota — lengkap dengan status pendaftaran real-time.",
    code: "FITUR / 01 — DISCOVERY",
  },
  {
    icon: Ticket,
    title: "Pendaftaran Cepat",
    description: "Daftar tanpa akun dan terima tiket serta konfirmasi otomatis langsung melalui email.",
    code: "FITUR / 02 — REGISTRATION",
  },
  {
    icon: Users,
    title: "Kelola Peserta",
    description: "Dasbor penyelenggara untuk memantau, memverifikasi, dan mengelola peserta dari satu tempat.",
    code: "FITUR / 03 — MANAGEMENT",
  },
  {
    icon: CreditCard,
    title: "Pembayaran Aman",
    description: "Transaksi tercatat dan terverifikasi, dengan pilihan metode pembayaran yang umum digunakan.",
    code: "FITUR / 04 — PAYMENT",
  },
  {
    icon: Bell,
    title: "Notifikasi Otomatis",
    description: "Konfirmasi pendaftaran dan informasi penting dikirim langsung agar peserta selalu terhubung.",
    code: "FITUR / 05 — NOTIFICATION",
  },
  {
    icon: BarChart3,
    title: "Laporan & Insight",
    description: "Ringkasan performa event membantu penyelenggara mengambil keputusan dengan lebih percaya diri.",
    code: "FITUR / 06 — INSIGHT",
  },
];

export default function HomePage() {
  const [featuredEvent, setFeaturedEvent] = useState<PublicEvent | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await api.get<PagedEvents>("/api/v1/events?page=1&page_size=1", { auth: false });
        if (!cancelled) setFeaturedEvent(response.data?.[0] ?? null);
      } catch {
        if (!cancelled) setFeaturedEvent(null);
      } finally {
        if (!cancelled) setIsLoadingEvent(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="home-page rh-reveal">
      <section className="home-hero" style={{ paddingBottom: "clamp(40px, 4.45vw, 64px)" }}>
        <div className="lk-container home-hero-grid">
          <div className="home-hero-copy">
            <Eyebrow>Platform Event Indonesia</Eyebrow>
            <h1>
              Event yang pas,
              <br />
              <em>tanpa ribet.</em>
            </h1>
            <p>
              LowkeyThings - Small Things, Big Moments. Kami percaya bahwa setiap pengalaman besar selalu berawal dari
              sesuatu yang sederhana. Sebuah ide, sebuah pertemuan, sebuah komunitas, atau sebuah langkah kecil.
              LowkeyThings hadir untuk membantu mengubah hal-hal sederhana tersebut menjadi momen yang lebih mudah
              dibuat, dibagikan, dan dikenang.
            </p>
            <div className="home-hero-actions">
              <ButtonLink href="/jelajahi-event" size="lg">
                Jelajahi Event
              </ButtonLink>
              <ButtonLink href="/hubungi-kami" variant="ghost" size="lg">
                Hubungi Kami
              </ButtonLink>
            </div>
          </div>
          <div className="home-feature-event">
            {featuredEvent ? (
              <EventCard
                href={`/events/${featuredEvent.id}`}
                title={featuredEvent.name}
                location={featuredEvent.location || "Lokasi belum diatur"}
                date={formatDate(featuredEvent.event_date)}
                distances={featuredEvent.event_type === "running" ? ["Event Lari"] : []}
                price={featuredEvent.min_price > 0 ? formatRupiah(featuredEvent.min_price) : "Gratis"}
                bannerUrl={featuredEvent.banner_url}
                color={featuredEvent.color || undefined}
                comingSoon={featuredEvent.status === "coming_soon"}
              />
            ) : (
              <div className="market-hero-empty">
                <Eyebrow>Event / Preview</Eyebrow>
                <strong>
                  {isLoadingEvent ? "Menyiapkan event pilihan…" : "Event pilihan berikutnya akan hadir di sini."}
                </strong>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="lk-container home-about">
          <div>
            <span className="home-about-badge">Tentang Kami</span>
            <h2>Apa itu LowkeyThings?</h2>
          </div>
          <div className="home-about-copy">
            <p>
              LowkeyThings adalah platform event yang mempertemukan ide, pengalaman, dan manusia dalam satu ruang
              digital. Kami hadir untuk membuat setiap perjalanan event terasa lebih sederhana dari menemukan event yang
              tepat, melakukan pendaftaran, hingga mengelola pengalaman peserta secara seamless.
            </p>
            <p>
              Kami percaya, event yang berkesan tidak selalu harus ramai untuk terasa berarti. Di balik setiap event
              yang terlihat effortless, ada detail kecil yang dirancang dengan cermat. That’s where we come in. “Lowkey”
              menggambarkan cara kami bekerja: tenang, thoughtful, dan berada di balik layar, memastikan setiap proses
              berjalan dengan rapi sehingga penyelenggara dapat fokus menciptakan pengalaman, sementara peserta dapat
              menikmati momennya. LowkeyThings — we handle the details, you live the moment.
            </p>
          </div>
        </div>
      </section>

      <section className="home-section home-section-tight">
        <div className="lk-container">
          <div className="home-section-head">
            <Eyebrow>Arah Kami</Eyebrow>
            <h2>Visi & Misi</h2>
          </div>
          <div className="home-vm-grid">
            <article className="home-vm-card">
              <span>Visi</span>
              <h3>
                Menjadi platform event terpercaya yang menghubungkan manusia, komunitas, dan pengalaman melalui
                ekosistem event yang mudah diakses, seamless, dan berdampak
              </h3>
            </article>
            <article className="home-vm-card home-vm-mission">
              <span>Misi</span>
              <ol>
                <li>
                  Menghadirkan proses discovery, pendaftaran, pembayaran, dan pengelolaan event yang simple, cepat,
                  aman, dan seamless.
                </li>
                <li>
                  Membekali penyelenggara dengan teknologi dan tools yang membantu mereka mengelola peserta, data,
                  komunikasi, dan operasional event secara lebih efisien.
                </li>
                <li>
                  Mempertemukan penyelenggara, komunitas, brand, dan peserta dalam ekosistem yang terbuka dan saling
                  terhubung.
                </li>
                <li>
                  Membangun pengalaman event yang transparan dan terpercaya, dari informasi event hingga proses
                  registrasi dan pembayaran.
                </li>
                <li>
                  Mendorong pertumbuhan event lokal atau nasional di berbagai kota Indonesia agar lebih mudah ditemukan,
                  diikuti, dan berkembang secara berkelanjutan.
                </li>
              </ol>
            </article>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="lk-container">
          <div className="home-section-head">
            <Eyebrow>Layanan Kami</Eyebrow>
            <h2>Semua yang kamu butuhkan, dalam satu platform.</h2>
            <p>
              Fitur inti LowkeyThings dirancang untuk peserta yang ingin daftar cepat, dan penyelenggara yang ingin
              kelola event tanpa ribet.
            </p>
          </div>
          <div className="home-services-grid">
            {services.map(({ icon: Icon, title, description, code }) => (
              <article className="home-service-card" key={code}>
                <span className="home-service-icon">
                  <Icon size={20} aria-hidden />
                </span>
                <h3>{title}</h3>
                <div className="home-service-perf" />
                <p>{description}</p>
                <span className="home-service-code">{code}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section-tight">
        <div className="lk-container">
          <div className="home-cta">
            <div>
              <Eyebrow>Tagline Kami</Eyebrow>
              <h2>Small Things. Big Moments.</h2>
              <p>Kami bekerja quietly behind the scenes, agar setiap momen di depan layar terasa lebih berarti</p>
            </div>
            <ButtonLink href="/jelajahi-event" size="lg">
              Lihat Event Sekarang
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
