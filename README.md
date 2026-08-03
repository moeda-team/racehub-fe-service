# racehub-fe-service (Frontend)

Frontend web RaceHub — platform event Indonesia. Next.js App Router + TypeScript + Tailwind (design tokens).
Repo ini **konsumen API** dari [`racehub-be-service`](../racehub-be-service/); tidak memegang logika bisnis uang/kuota.

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind** v4
- Design tokens dari Design System v1.0 (`docs/racehub-design-system.html`)
- Font: Saira (display) · Hanken Grotesk (body) · Spline Sans Mono (data/tabular)
- API types: `lib/types.gen.ts` (manual sync dari `api/openapi.yaml` backend)

## Prasyarat

- Node.js ≥ 20
- [pnpm](https://pnpm.io/)
- Backend `racehub-be-service` berjalan (default `http://localhost:3001`)

## Menjalankan secara lokal

```bash
pnpm install

# Arahkan ke API backend (override default .env.example)
echo 'BACKEND_API_URL=http://localhost:3001' > .env.local

pnpm dev      # http://localhost:3000
pnpm lint
pnpm build
```

## Struktur halaman

| Route                    | Area               | Deskripsi                                              |
| ------------------------ | ------------------ | ------------------------------------------------------ |
| `/`                      | Marketplace publik | Daftar event + pencarian + filter                      |
| `/events/[id]`           | Marketplace publik | Detail event + kuota tersisa                           |
| `/register/[eventId]`    | Marketplace publik | Wizard pendaftaran 3 langkah (tanpa login)             |
| `/pay/[number]`          | Marketplace publik | Pilih metode bayar → rincian → charge                  |
| `/ticket/[number]`       | Marketplace publik | E-tiket + QR + invoice                                 |
| `/refund/[number]`       | Marketplace publik | Status refund peserta                                  |
| `/login`, `/register`    | Auth               | Login & daftar organizer                               |
| `/dashboard`             | Organizer          | Overview + CRUD event + kategori + tiket               |
| `/dashboard/events/[id]` | Organizer          | Detail event: dashboard, BIB, check-in, export, donasi |
| `/dashboard/wallet`      | Organizer          | 3 wallet (organizer/donasi/admin) + penarikan          |
| `/dashboard/profile`     | Organizer          | Profil organizer                                       |
| `/rpc`                   | Lapangan           | Modul check-in (cari manual + scan QR, 2 tahap)        |
| `/admin/*`               | Admin              | Approval, refund, platform wallet (**belum dibangun**) |

## Aturan emas

> Frontend **TIDAK PERNAH** menghitung fee, total, atau refund di sisi klien.
> Semua angka pembayaran dari `POST /api/v1/payments/quote`, ditampilkan apa adanya.

## Perintah

```bash
pnpm dev        # development server
pnpm build      # production build
pnpm lint       # ESLint
pnpm gen:api    # generate lib/openapi.gen.ts dari OpenAPI backend
pnpm check:api  # gagal bila output generator belum di-commit
```

## Dokumentasi lanjutan

- [`AGENTS.md`](./AGENTS.md) — panduan AI coding agent
- [`CLAUDE.md`](./CLAUDE.md) — alur kerja Claude Code
- [`memory.md`](./memory.md) — memori berjalan
- Backend: [`racehub-be-service/AGENTS.md`](../racehub-be-service/AGENTS.md) · [`api/openapi.yaml`](../racehub-be-service/api/openapi.yaml)
