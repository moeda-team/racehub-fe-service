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
              LowkeyThings adalah platform yang mempertemukan penyelenggara event dan peserta dalam satu tempat — mulai
              dari pencarian event, pendaftaran, sampai pengelolaan peserta, semuanya dilakukan secara digital dan
              transparan.
            </p>
            <p>
              Kami percaya event terbaik nggak harus heboh untuk terasa bermakna. Nama “Lowkey” mewakili cara kami
              bekerja: tenang di belakang layar, memastikan setiap proses berjalan mulus tanpa peserta maupun
              penyelenggara harus pusing dengan hal teknis.
            </p>
            <div className="home-tags">
              <span>Pendaftaran Online</span>
              <span>Manajemen Peserta</span>
              <span>Pembayaran Aman</span>
              <span>Untuk Komunitas & EO</span>
            </div>
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
                Menjadi platform event terpercaya yang memudahkan siapa saja untuk menemukan dan menyelenggarakan
                kegiatan di seluruh Indonesia.
              </h3>
              <p>
                Kami ingin setiap komunitas, kecil maupun besar, punya akses yang sama untuk membuat event mereka
                ditemukan dan diikuti.
              </p>
            </article>
            <article className="home-vm-card home-vm-mission">
              <span>Misi</span>
              <ol>
                <li>Menyediakan sistem pendaftaran event yang cepat, aman, dan mudah digunakan.</li>
                <li>Membantu penyelenggara mengelola peserta secara efisien dari satu dasbor.</li>
                <li>Menjaga transparansi informasi event, mulai dari jadwal hingga status pendaftaran.</li>
                <li>Membangun ekosistem event lokal yang berkelanjutan di berbagai kota.</li>
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
              <h2>“Temukan, daftar, dan kelola event dengan cepat dan transparan.”</h2>
              <p>Itu janji LowkeyThings ke setiap peserta dan penyelenggara event.</p>
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
