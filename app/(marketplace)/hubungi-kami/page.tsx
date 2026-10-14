import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Eyebrow } from "@/components/ui/Layout";
import { ContactForm } from "@/components/ContactForm";

const supportEmail = "admin@lowkeythings.my.id";
const address =
  "Jebor Bumen Kutowinangun RT 002 RW 003 Desa Kutowinangun, Kecamatan Kutowinangun, Kabupaten Kebumen, Provinsi Jawa Tengah";

export default function ContactPage() {
  return (
    <main className="contact-page rh-reveal">
      <header className="lk-container contact-header">
        <Eyebrow>Kontak</Eyebrow>
        <h1>Hubungi Kami</h1>
        <p>
          Punya ide untuk sebuah event? Mari mulai dari percakapan sederhana. Kami terbuka untuk berbagai peluang
          kolaborasi, kebutuhan event, maupun hal lain yang ingin Anda wujudkan bersama LowkeyThings. Say hello. Let’s
          make it happen.
        </p>
      </header>

      <section className="lk-container contact-grid" aria-label="Informasi kontak">
        <div>
          <div className="contact-list">
            <ContactItem
              icon={<Mail aria-hidden />}
              label="Email"
              value={<a href={`mailto:${supportEmail}`}>{supportEmail}</a>}
              description="Respons dalam 1×24 jam kerja"
            />
            <ContactItem
              icon={<MessageCircle aria-hidden />}
              label="WhatsApp"
              value={<a href="https://wa.me/6285148351241">+6285148351241</a>}
              description="Chat cepat untuk info & bantuan pendaftaran"
            />
            <ContactItem
              icon={<MapPin aria-hidden />}
              label="Alamat"
              value={address}
              description="Kunjungan kantor dengan janji temu"
            />
          </div>

          <ContactForm />
        </div>
      </section>
    </main>
  );
}

function ContactItem({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  description: string;
}) {
  return (
    <article className="contact-item">
      <span className="contact-item-icon">{icon}</span>
      <div>
        <span className="contact-item-label">{label}</span>
        <div className="contact-item-value">{value}</div>
        <p>{description}</p>
      </div>
    </article>
  );
}
