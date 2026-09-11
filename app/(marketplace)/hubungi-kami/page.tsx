import { Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { Eyebrow } from "@/components/ui/Layout";

const supportEmail = "admin@lowkeythings.my.id";
const address =
  "Jebor Bumen Kutowinangun RT 002 RW 003 Desa Kutowinangun, Kec. Kutowinangun, Kab. Kebumen, Jawa Tengah. 54393";

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

          <form className="contact-form" action={`mailto:${supportEmail}`} method="get" encType="text/plain">
            <Eyebrow>Kirim Pesan</Eyebrow>
            <div className="contact-form-row">
              <label className="field">
                <span className="field-label">Nama</span>
                <input className="field-input" name="nama" placeholder="Nama kamu" required />
              </label>
              <label className="field">
                <span className="field-label">Email</span>
                <input className="field-input" name="email" type="email" placeholder="nama@email.com" required />
              </label>
            </div>
            <label className="field contact-message-field">
              <span className="field-label">Pesan</span>
              <textarea
                className="field-input"
                name="body"
                rows={4}
                placeholder="Tulis pertanyaan atau kebutuhan kerja samamu…"
                required
              />
            </label>
            <input type="hidden" name="subject" value="Pesan dari halaman Hubungi Kami" />
            <button className="btn btn-primary btn-lg" type="submit">
              <Send size={17} aria-hidden />
              Kirim Pesan
            </button>
          </form>
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
