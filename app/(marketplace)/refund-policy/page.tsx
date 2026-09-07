import type { Metadata } from "next";
import { InformationPage } from "@/components/InformationPage";

export const metadata: Metadata = {
  title: "Kebijakan Pengembalian Dana | LowkeyThings",
  description: "Syarat pengembalian dana, pembatalan event, penukaran jadwal, dan estimasi proses refund LowkeyThings.",
};

export default function RefundPolicyPage() {
  return (
    <InformationPage title="Kebijakan Pengembalian Dana (Refund Policy)" eyebrow="Kebijakan Resmi" effectiveDate>
      <p>Kebijakan ini menjelaskan syarat dan ketentuan pengembalian dana (refund) atas transaksi pembelian tiket event melalui platform LowkeyThings. Dengan bertransaksi di platform kami, Anda dianggap telah membaca, memahami, dan menyetujui kebijakan berikut.</p>
      <section>
        <h2>1. Prinsip Umum</h2>
        <p>LowkeyThings adalah platform perantara (marketplace) yang mempertemukan penyelenggara event (&quot;Penyelenggara&quot;) dengan peserta/pembeli tiket (&quot;Peserta&quot;).</p>
        <p>Kebijakan refund tunduk pada ketentuan umum di platform ini, dan dapat disesuaikan dengan kebijakan spesifik masing-masing event, sepanjang telah diinformasikan secara jelas pada halaman event sebelum transaksi dilakukan.</p>
        <p>Setiap pengajuan refund akan diverifikasi terlebih dahulu oleh tim kami sebelum diproses.</p>
      </section>
      <section>
        <h2>2. Kondisi yang Berhak Mendapatkan Pengembalian Dana Penuh</h2>
        <p>Peserta berhak atas pengembalian dana penuh (100%) dari nilai transaksi, dalam kondisi berikut:</p>
        <ul>
          <li>Event dibatalkan sepenuhnya oleh Penyelenggara.</li>
          <li>Terjadi duplikasi transaksi/pembayaran ganda (double payment) akibat kegagalan sistem pada saat proses pembayaran.</li>
          <li>Dana telah terpotong dari akun/kartu Peserta namun tiket tidak diterbitkan akibat kegagalan teknis pada sistem pembayaran atau platform kami.</li>
          <li>Kesalahan penagihan (jumlah yang ditagihkan tidak sesuai dengan harga tiket yang tertera).</li>
        </ul>
      </section>
      <section>
        <h2>3. Refund Sebagian / Penukaran Jadwal</h2>
        <p>Apabila event ditunda (reschedule) oleh Penyelenggara, Peserta dapat memilih salah satu opsi berikut:</p>
        <ul>
          <li>Menggunakan tiket yang sama pada jadwal baru yang ditetapkan Penyelenggara; atau</li>
          <li>Mengajukan pengembalian dana sesuai kebijakan yang ditetapkan Penyelenggara untuk event tersebut, yang akan diinformasikan melalui email resmi dan/atau halaman event.</li>
        </ul>
      </section>
      <section>
        <h2>4. Kondisi Non-Refundable</h2>
        <p>Pengembalian dana tidak berlaku pada kondisi berikut, kecuali ditentukan lain oleh Penyelenggara:</p>
        <ul>
          <li>Peserta berubah pikiran (change of mind) dan tidak dapat/tidak ingin menghadiri event.</li>
          <li>Peserta tidak hadir pada saat event berlangsung (no-show) tanpa pemberitahuan sebelumnya.</li>
          <li>Kesalahan input data oleh Peserta saat pemesanan (tanggal, kategori, atau jumlah tiket) yang telah dikonfirmasi sebelum pembayaran.</li>
          <li>Tiket promo, tiket diskon, atau tiket yang secara eksplisit dinyatakan non-refundable pada halaman event.</li>
        </ul>
        <p className="information-note">Penting: Biaya administrasi/biaya layanan pihak ketiga (payment gateway) yang telah dibebankan pada saat transaksi bersifat non-refundable, kecuali pembatalan terjadi akibat kesalahan sistem dari pihak kami.</p>
      </section>
      <dl className="information-estimates">
        <div><dt>Estimasi Verifikasi</dt><dd>3–7 hari kerja</dd></div>
        <div><dt>Estimasi Dana Kembali</dt><dd>7–14 hari kerja setelah disetujui</dd></div>
        <div><dt>Metode Pengembalian</dt><dd>Sama dengan metode pembayaran awal</dd></div>
      </dl>
      <a className="btn btn-primary" href="mailto:event.lowkeythings@gmail.com?subject=Pengajuan%20Refund">Ajukan Refund</a>
    </InformationPage>
  );
}
