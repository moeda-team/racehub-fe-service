import { Clock3, Globe2, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { Eyebrow } from "@/components/ui/Layout";

const fallbackEmail = "halo@lowkeythings.id";

export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || fallbackEmail;

  return (
    <main className="contact-page rh-reveal">
      <header className="lk-container contact-header">
        <Eyebrow>Kontak</Eyebrow>
        <h1>Hubungi Kami</h1>
        <p>
          Ada pertanyaan soal event, kerja sama penyelenggaraan, atau butuh
          bantuan teknis? Tim LowkeyThings siap bantu.
        </p>
      </header>

      <section className="lk-container contact-grid" aria-label="Informasi kontak">
        <div>
          <div className="contact-list">
            <ContactItem icon={<Mail aria-hidden />} label="Email" value={<a href={`mailto:${supportEmail}`}>{supportEmail}</a>} description="Respons dalam 1×24 jam kerja" />
            <ContactItem icon={<MessageCircle aria-hidden />} label="WhatsApp" value={<a href="https://wa.me/6281234567890">+62 812-3456-7890</a>} description="Chat cepat untuk info & bantuan pendaftaran" />
            <ContactItem icon={<MapPin aria-hidden />} label="Alamat" value="Jl. Diponegoro No. 45, Ungaran, Kabupaten Semarang, Jawa Tengah" description="Kunjungan kantor dengan janji temu" />
            <ContactItem icon={<Globe2 aria-hidden />} label="Sosial Media" value="@lowkeythings.id" description="Instagram · TikTok · X" />
          </div>

          <div className="contact-hours" aria-label="Jam operasional">
            <Clock3 aria-hidden />
            <div><strong>Senin – Jumat</strong><span>09.00 – 17.00 WIB</span></div>
            <div><strong>Sabtu</strong><span>09.00 – 13.00 WIB</span></div>
            <div><strong>Minggu / Libur</strong><span>Tutup</span></div>
          </div>

          <form className="contact-form" action={`mailto:${supportEmail}`} method="get" encType="text/plain">
            <Eyebrow>Kirim Pesan</Eyebrow>
            <div className="contact-form-row">
              <label className="field"><span className="field-label">Nama</span><input className="field-input" name="nama" placeholder="Nama kamu" required /></label>
              <label className="field"><span className="field-label">Email</span><input className="field-input" name="email" type="email" placeholder="nama@email.com" required /></label>
            </div>
            <label className="field contact-message-field"><span className="field-label">Pesan</span><textarea className="field-input" name="body" rows={4} placeholder="Tulis pertanyaan atau kebutuhan kerja samamu…" required /></label>
            <input type="hidden" name="subject" value="Pesan dari halaman Hubungi Kami" />
            <button className="btn btn-primary btn-lg" type="submit"><Send size={17} aria-hidden />Kirim Pesan</button>
          </form>
        </div>

        <aside className="contact-map" aria-label="Lokasi kantor LowkeyThings">
          <iframe
            className="contact-map-frame"
            title="Peta lokasi kantor LowkeyThings di Ungaran"
            src="https://www.openstreetmap.org/export/embed.html?bbox=110.3780%2C-7.1660%2C110.4320%2C-7.1120&layer=mapnik&marker=-7.1390%2C110.4050"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="contact-map-label"><strong>Kantor LowkeyThings</strong><span>Ungaran, Kabupaten Semarang — Jawa Tengah</span></div>
          <a className="contact-map-link" href="https://www.openstreetmap.org/?mlat=-7.1390&amp;mlon=110.4050#map=14/-7.1390/110.4050" target="_blank" rel="noopener noreferrer">Buka peta lebih besar <span aria-hidden>↗</span></a>
        </aside>
      </section>
    </main>
  );
}

function ContactItem({ icon, label, value, description }: { icon: React.ReactNode; label: string; value: React.ReactNode; description: string }) {
  return <article className="contact-item"><span className="contact-item-icon">{icon}</span><div><span className="contact-item-label">{label}</span><div className="contact-item-value">{value}</div><p>{description}</p></div></article>;
}
