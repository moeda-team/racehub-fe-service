import type { Metadata } from "next";
import Link from "next/link";
import { InformationPage } from "@/components/InformationPage";

export const metadata: Metadata = {
  title: "FAQ | LowkeyThings",
  description: "Pertanyaan seputar pendaftaran, pembayaran, e-tiket, kehadiran, dan pembatalan event di LowkeyThings.",
};

const groups = [
  { title: "Umum", items: [
    ["Apa itu LowkeyThings?", "LowkeyThings adalah platform digital untuk menemukan, mendaftar, dan mengelola tiket event di seluruh Indonesia. Kami menghubungkan penyelenggara event dengan peserta melalui proses discovery, pendaftaran, pembayaran, dan penerbitan e-tiket yang cepat, transparan, dan aman."],
    ["Apakah saya perlu membuat akun untuk membeli tiket?", "Tidak. LowkeyThings mendukung pendaftaran tanpa akun (guest registration). Setelah pembayaran berhasil, tiket dan konfirmasi akan dikirimkan otomatis melalui email yang Anda daftarkan."],
    ["Bagaimana cara mendaftar atau membeli tiket event?", <>Pilih event yang diinginkan pada halaman <Link href="/jelajahi-event">Jelajahi Event</Link>, klik tombol daftar/beli tiket, isi data diri sesuai formulir yang tersedia, pilih metode pembayaran, lalu selesaikan pembayaran. E-tiket akan otomatis dikirim ke email setelah pembayaran terverifikasi.</>],
  ] },
  { title: "Pembayaran", items: [
    ["Metode pembayaran apa saja yang tersedia?", "Pembayaran diproses melalui payment gateway resmi (iPaymu), mendukung metode seperti transfer bank/Virtual Account, kartu kredit/debit, dan e-wallet, tergantung ketersediaan pada saat transaksi."],
    ["Apakah transaksi di LowkeyThings aman?", "Ya sangat aman. Seluruh transaksi diproses melalui payment gateway pihak ketiga yang berizin dan tersertifikasi, sehingga data pembayaran kamu tidak disimpan langsung oleh LowkeyThings dan diproses secara terenkripsi."],
    ["Bagaimana jika pembayaran gagal namun saldo/kartu sudah terpotong?", <>Segera hubungi tim kami melalui email atau WhatsApp pada bagian <Link href="/hubungi-kami">Kontak Kami</Link> dengan menyertakan bukti transaksi. Tim kami akan melakukan pengecekan status pembayaran ke payment gateway dan menindaklanjuti dalam 1–3 hari kerja.</>],
    ["Apakah ada biaya tambahan (biaya admin/layanan)?", "Biaya admin/layanan akan ditampilkan secara jelas dan transparan pada halaman ringkasan pesanan sebelum kamu melakukan pembayaran."],
  ] },
  { title: "Tiket & Kehadiran", items: [
    ["Di mana saya bisa melihat e-tiket saya?", "E-tiket dikirimkan secara otomatis ke alamat email yang didaftarkan segera setelah pembayaran berhasil diverifikasi. Mohon periksa folder spam/promosi apabila email tidak ditemukan di kotak masuk."],
    ["Apakah tiket bisa dipindahtangankan ke orang lain?", "Kebijakan pemindahtanganan tiket bergantung pada masing-masing penyelenggara event. Silakan periksa syarat & ketentuan event terkait, atau hubungi tim kami untuk informasi lebih lanjut."],
    ["Apa yang harus saya lakukan saat hari-H event?", "Tunjukkan e-tiket (dalam bentuk QR code/kode registrasi) melalui perangkat digital atau hasil cetak kepada petugas check-in di lokasi event."],
  ] },
  { title: "Pembatalan & Refund", items: [
    ["Bagaimana jika saya ingin membatalkan pesanan?", <>Silakan merujuk pada <Link href="/refund-policy">Kebijakan Pengembalian Dana (Refund Policy)</Link> kami untuk ketentuan pengembalian dana.</>],
    ["Bagaimana jika event dibatalkan atau ditunda oleh penyelenggara?", <>Jika event dibatalkan atau ditunda oleh penyelenggara, peserta berhak atas pengembalian dana penuh atau penukaran tiket ke jadwal baru, sesuai dengan penjelasan pada <Link href="/refund-policy">Kebijakan Pengembalian Dana</Link>.</>],
  ] },
  { title: "Lainnya", items: [
    ["Bagaimana cara menghubungi tim LowkeyThings?", <>Kamu dapat menghubungi kami melalui email, WhatsApp, atau halaman <Link href="/hubungi-kami">Hubungi Kami</Link> di website resmi. Tim kami siap membantu pada hari dan jam kerja.</>],
    ["Apakah LowkeyThings memiliki aplikasi mobile?", "Saat ini LowkeyThings dapat diakses melalui website resmi kami dan telah dioptimalkan untuk perangkat mobile (mobile-responsive)."],
  ] },
];

export default function FAQPage() {
  return (
    <InformationPage title="Frequently Asked Questions (FAQ)" eyebrow="Pusat Bantuan" description="Semua yang ingin kamu tahu sebelum daftar, bayar, dan hadir di event kami.">
      <p>Halaman ini merangkum pertanyaan yang paling sering diajukan seputar penggunaan platform LowkeyThings — mulai dari pendaftaran, pembayaran, e-tiket, hingga kebijakan pembatalan. Jika pertanyaanmu belum terjawab di sini, tim kami siap membantu melalui halaman <Link href="/hubungi-kami">Hubungi Kami</Link>.</p>
      {groups.map((group, index) => (
        <section key={group.title}>
          <h2>{index + 1}. {group.title}</h2>
          {group.items.map(([question, answer]) => (
            <details className="information-question" key={String(question)}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
          {index === 3 && <p className="information-note">Tips: Simpan email konfirmasi pemesanan kamu — email ini berisi nomor referensi yang akan mempercepat proses bantuan jika suatu saat kamu perlu menghubungi tim kami.</p>}
        </section>
      ))}
    </InformationPage>
  );
}
