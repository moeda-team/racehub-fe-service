import type { Metadata } from "next";
import Link from "next/link";
import { InformationPage } from "@/components/InformationPage";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | LowkeyThings",
  description: "Syarat penggunaan platform LowkeyThings bagi peserta dan penyelenggara event.",
};

export default function TermsConditionsPage() {
  return (
    <InformationPage title="Syarat & Ketentuan" eyebrow="Dokumen Legal" description="Aturan main bagi peserta dan penyelenggara di platform kami." effectiveDate>
      <p>Selamat datang di LowkeyThings (&quot;Platform&quot;, &quot;kami&quot;). Syarat & Ketentuan ini mengatur penggunaan Platform oleh setiap pengguna, baik sebagai peserta/pembeli tiket (&quot;Pengguna&quot;) maupun penyelenggara event (&quot;Penyelenggara&quot;). Dengan mengakses atau menggunakan Platform, Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat pada seluruh ketentuan berikut.</p>
      <section>
        <h2>1. Definisi</h2>
        <ul>
          <li>&quot;Platform&quot; berarti website LowkeyThings beserta seluruh layanan di dalamnya.</li>
          <li>&quot;Pengguna&quot; berarti setiap individu yang mengakses Platform untuk mencari, mendaftar, atau membeli tiket event.</li>
          <li>&quot;Penyelenggara&quot; berarti pihak yang membuat, mengelola, dan bertanggung jawab atas penyelenggaraan suatu event yang dipublikasikan di Platform.</li>
          <li>&quot;Tiket&quot; berarti bukti pendaftaran/pembelian elektronik (e-tiket) yang memberikan hak akses kepada Pengguna untuk menghadiri event tertentu.</li>
          <li>&quot;Payment Gateway&quot; berarti pihak ketiga penyedia layanan pemrosesan pembayaran yang bekerja sama dengan Platform.</li>
        </ul>
      </section>
      <section>
        <h2>2. Peran Platform</h2>
        <p>LowkeyThings bertindak sebagai penyedia layanan perantara (marketplace) yang mempertemukan Penyelenggara dan Pengguna, meliputi proses discovery event, pendaftaran, pemrosesan pembayaran, penerbitan e-tiket, serta pengelolaan data peserta.</p>
        <p>Kami bukan penyelenggara event dan tidak bertanggung jawab atas pelaksanaan, kualitas, keamanan, atau perubahan jadwal event, yang sepenuhnya menjadi tanggung jawab Penyelenggara masing-masing.</p>
      </section>
      <section>
        <h2>3. Akun & Pendaftaran</h2>
        <p>Pengguna dapat melakukan pendaftaran/pembelian tiket tanpa membuat akun, tergantung pada pengaturan yang berlaku pada Platform.</p>
        <p>Pengguna wajib memberikan data yang benar, lengkap, dan terkini pada saat pendaftaran/pembelian, termasuk nama dan alamat email yang aktif.</p>
        <p>Pengguna bertanggung jawab penuh atas kerahasiaan data dan segala aktivitas yang dilakukan melalui akun tersebut.</p>
      </section>
      <section>
        <h2>4. Pemesanan & Pembayaran</h2>
        <p>Seluruh transaksi pembayaran diproses melalui Payment Gateway pihak ketiga (iPaymu) yang bekerja sama secara resmi dengan Platform.</p>
        <p>Harga tiket, biaya administrasi, dan total pembayaran ditampilkan secara jelas pada halaman ringkasan pesanan sebelum Pengguna melakukan pembayaran.</p>
        <p>Pesanan dianggap sah setelah pembayaran berhasil diverifikasi oleh Payment Gateway, diikuti pengiriman e-tiket otomatis ke email Pengguna.</p>
        <p>Platform berhak membatalkan transaksi yang terindikasi mencurigakan, tidak sah, atau melanggar ketentuan ini.</p>
      </section>
      <section>
        <h2>5. Tiket & Kehadiran Event</h2>
        <p>E-tiket bersifat pribadi dan hanya berlaku untuk event, tanggal, serta kategori yang tertera, kecuali dinyatakan lain oleh Penyelenggara.</p>
        <p>Pengguna wajib menunjukkan e-tiket yang sah pada saat check-in di lokasi event.</p>
        <p>Penggandaan, pemalsuan, atau penyalahgunaan e-tiket dapat mengakibatkan penolakan akses masuk oleh Penyelenggara.</p>
        <p className="information-note">Catatan: Ketentuan mengenai pembatalan dan pengembalian dana diatur secara terpisah dan lebih rinci dalam <Link href="/refund-policy">Kebijakan Pengembalian Dana (Refund Policy)</Link> kami, yang merupakan satu kesatuan dan bagian tidak terpisahkan dari Syarat & Ketentuan ini.</p>
      </section>
      <section>
        <h2>6. Kewajiban Penyelenggara</h2>
        <p>Penyelenggara bertanggung jawab penuh atas keakuratan informasi event yang dipublikasikan, termasuk tanggal, lokasi, harga, dan syarat mengikuti event.</p>
        <p>Penyelenggara wajib memberitahukan setiap perubahan, penundaan, atau pembatalan event kepada Platform dan Pengguna secepat mungkin.</p>
        <p>Penyelenggara bertanggung jawab atas pelaksanaan event, termasuk keamanan, kenyamanan, dan kelayakan lokasi/acara.</p>
      </section>
      <section>
        <h2>7. Larangan Penggunaan</h2>
        <p>Pengguna dan Penyelenggara dilarang untuk:</p>
        <ul>
          <li>Memberikan informasi palsu, menyesatkan, atau tidak akurat pada Platform.</li>
          <li>Menggunakan Platform untuk tujuan penipuan, pencucian uang, atau aktivitas melawan hukum lainnya.</li>
          <li>Melakukan tindakan yang dapat merusak, mengganggu, atau membebani sistem dan keamanan Platform.</li>
        </ul>
      </section>
      <section>
        <h2>8. Batasan Tanggung Jawab</h2>
        <p>Platform tidak bertanggung jawab atas kerugian akibat kelalaian Pengguna, seperti kesalahan input data, kehilangan akses email, atau kegagalan koneksi internet pada sisi Pengguna.</p>
        <p>Platform tidak bertanggung jawab atas pembatalan, penundaan, atau perubahan pelaksanaan event yang sepenuhnya menjadi kewenangan Penyelenggara.</p>
        <p>Dalam hal terjadi gangguan teknis pada Platform atau Payment Gateway, kami akan berupaya menyelesaikannya secepat mungkin dan berkoordinasi dengan pihak terkait.</p>
      </section>
      <section>
        <h2>9. Kekayaan Intelektual</h2>
        <p>Seluruh nama, logo, desain, dan konten yang terdapat pada Platform LowkeyThings merupakan hak milik kami atau pemberi lisensi kami, dan dilindungi oleh peraturan perundang-undangan yang berlaku mengenai kekayaan intelektual. Dilarang menyalin, mereproduksi, atau menggunakan konten Platform tanpa izin tertulis.</p>
      </section>
      <section>
        <h2>10. Perubahan Syarat & Ketentuan</h2>
        <p>Kami berhak untuk mengubah, menambah, atau memperbarui Syarat & Ketentuan ini sewaktu-waktu. Perubahan berlaku efektif sejak dipublikasikan pada Platform events.hompimpa.biz.id. Penggunaan Platform secara berkelanjutan setelah adanya perubahan dianggap sebagai persetujuan atas perubahan tersebut.</p>
      </section>
      <section>
        <h2>11. Hukum yang Berlaku</h2>
        <p>Syarat & Ketentuan ini diatur dan ditafsirkan berdasarkan hukum yang berlaku di Republik Indonesia. Setiap perselisihan yang timbul akan diselesaikan terlebih dahulu secara musyawarah untuk mufakat.</p>
      </section>
    </InformationPage>
  );
}
