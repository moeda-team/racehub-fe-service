# Changelog — racehub-fe-service

Semua perubahan signifikan dicatat di sini. Format mengikuti [Keep a Changelog](https://keepachangelog.com/).

## [v1.0.0] — 2026-07-05

Release awal. Platform event Indonesia — frontend web.

### Marketplace Publik
- Halaman utama: daftar event (evcard) + pencarian nama/lokasi (`?q=`)
- Filter: tanggal, lokasi, event lari saja
- Detail event publik: kuota tersisa real-time, banner, warna header, WYSIWYG deskripsi
- Redesign kategori: grid kartu dengan progress bar kuota + state (Tersedia/Berakhir/Habis)
- Tiket: badge status, harga mono tabular, tanggal berakhir penjualan

### Registrasi Peserta (Tanpa Login)
- Wizard 3 langkah: pilih kategori + tiket → data peserta (birth_date wajib) → donasi + ringkasan
- Opsi tiket disable: `(berakhir)` / `(belum dibuka)` / `(habis)`
- Kelas usia badge (Open/Master) tampil di layar sukses
- Error server (kuota/periode/birth_date) tampil via Alert
- Idempotency-Key: cegah double-submit

### Pembayaran
- Pilih metode bayar (VA / GoPay / QRIS / Card) → quote → rincian FR-502 apa adanya
- Charge: tampil VA number / QR string + badge "Menunggu Pembayaran"
- Polling status tiap 4 detik sampai `paid` → tombol ke e-tiket
- **Tidak menghitung uang** — semua angka dari `POST /payments/quote`

### E-Tiket + QR
- Tampil QR asli via `qrcode.react` (`QRCodeSVG`)
- Invoice breakdown dari server
- Link ke halaman refund bila status `refunded`
- 404 bila belum bayar → arahkan ke /pay

### Halaman Refund Peserta
- Status badge, nominal, metode, mode (auto/manual), rekening/QR
- Notice donasi non-refundable
- Link dari e-tiket saat status = refunded

### Dashboard Organizer
- Overview: StatCard (jumlah event, saldo wallet)
- CRUD event: form lengkap + WYSIWYG (Tiptap v3)
- Manajemen kategori + tiket (tambah, edit, hapus, tanggal berakhir)
- Banner upload: drag & drop, kompresi WebP klien, pratinjau live
- Color picker header kartu (`<input type="color">`)
- Live preview kartu event (kanan form)
- Pratinjau halaman detail (50/50, toggle Kartu / Halaman Detail)
- Transisi status (draft → submit → published → cancelled)
- Tab detail: Dashboard, Kategori, Tiket, Keuangan, Refund

### Dashboard — Dashboard & Reporting
- Kartu ringkasan: paid count, ticket revenue, donation total
- Tabel rekap kategori (DataTable)
- Generate BIB + konfirmasi regenerate (409 → window.confirm)
- Tabel peserta + Export CSV (fetch blob + `<a download>`)
- Laporan donasi per event (Pendapatan Tiket vs Total Donasi)

### Dashboard — 3 Wallet
- **Wallet Organizer**: saldo + form tarik + riwayat ledger (kredit hijau / refund·withdraw merah)
- **Wallet Donasi**: balance / terkumpul / ditarik + form tarik
- **Wallet Admin/Platform**: balance + form tarik (JWT organizer, bukan admin)
- Field "No. Rekening Tujuan" opsional di form tarik
- Idempotency-Key otomatis di setiap request withdraw

### Dashboard — Profil
- Edit profil organizer

### Auth
- Login & registrasi organizer
- Token JWT di `localStorage` (`racehub_token`)
- `AuthProvider` di root layout (guard + hidrasi token)
- Dashboard guard: redirect ke /login bila tak auth

### Admin (lib/admin.ts siap, halaman BELUM dibangun)
- Client API admin (`adminApi`, token `racehub_admin_token`)
- Halaman approval queue, refund management, platform wallet — **belum ada di disk**

### Modul RPC / Check-in (Lapangan)
- Kontras tinggi (latar ink, teks putih), target tap ≥48–56px
- Pilih event → toggle tahap RPC / Hari-H
- **Cari manual PRIMARY**: nama / BIB / nomor registrasi
- **Scan QR sekunder**: `BarcodeDetector` native (Chrome/Android) + fallback token manual
- Kartu peserta: BIB besar mono, nama, 2 status pill (Racepack / Hari-H)

### Platform Generalisasi
- Bukan hanya event lari — label kondisional:
  - `is_running_event` = true → "Kategori Jarak"
  - `is_running_event` = false → "Kategori"
- Branding: "Platform Event Indonesia", hero "Temukan Event"
- Filter "Event lari saja", badge "Event Lari" tetap ada

### Design System & Responsif
- Design tokens: Flame `#F5471D`, Sprint `#2456E6`, ink/neutral palette
- Font: Saira (display), Hanken Grotesk (body), Spline Sans Mono (data/tabular)
- Mobile-first responsive di semua halaman
- Dashboard sidebar → top bar horizontal di ≤768px
- Layer motion global (reduced-motion aware): entrance, stagger, mikro-interaksi
- Komponen UI: Alert, Badge, Button, DataTable, EventCard, Field, PaymentBreakdown, Pill, RichText, StatCard, Ticket

### Stack
Next.js 16.2.9 (App Router) · React 19 · TypeScript 5 · Tailwind v4 · Tiptap v3 (WYSIWYG) · qrcode.react · isomorphic-dompurify

---

[v1.0.0]: https://github.com/moeda-team/racehub-fe-service/releases/tag/v1.0.0
