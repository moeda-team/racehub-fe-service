/**
 * Translates raw backend error strings (English, from racehub-be-service's
 * writeError/err.Error()) into the Indonesian text NFR-406 requires for the
 * UI. The backend is the source of truth for business logic, not UI copy —
 * it never localizes its own messages, so this is the single place that
 * bridges the two. Every ApiError construction point (lib/api.ts, lib/admin.ts)
 * runs its raw message through this before it reaches a component.
 *
 * Two kinds of raw strings show up here:
 *  - Fixed strings from `writeError(w, status, "...")` — matched exactly.
 *  - Wrapped sentinel errors from `writeError(w, status, err.Error())`, which
 *    arrive as "<context>: <sentinel message>" (the context prefix varies by
 *    call site) — matched by suffix against the sentinel's own text.
 * Anything not in the table is returned unchanged rather than hidden, so an
 * untranslated message is still visible instead of silently disappearing.
 */
const MESSAGES: Record<string, string> = {
  // Fixed strings (internal/handler/*.go writeError literals)
  "file too large or invalid multipart body (max 5 MB)":
    "File terlalu besar atau tidak valid (maks. 5 MB)",
  "invalid category_id": "ID kategori tidak valid",
  "invalid event_id": "ID event tidak valid",
  "invalid payment method": "Metode pembayaran tidak valid",
  "invalid refund id": "ID refund tidak valid",
  "invalid registration_id": "ID registrasi tidak valid",
  "invalid registration number": "Nomor registrasi tidak valid",
  "invalid request body": "Data permintaan tidak valid",
  "invalid status": "Status tidak valid",
  "invalid ticket_category_id": "ID kategori tiket tidak valid",
  "invalid ticket id": "ID tiket tidak valid",
  "ticket category does not match the selected event or category":
    "Kategori tiket tidak sesuai dengan event/kategori yang dipilih",
  "category category is in use by ticket categories":
    "Kategori masih digunakan oleh kategori tiket lain",
  "email already on complimentary list for this event":
    "Email sudah ada di daftar tiket komplimen untuk event ini",
  "email already registered": "Email sudah terdaftar",
  "event is finished and cannot be modified":
    "Event sudah selesai dan tidak dapat diubah",
  "event is locked and cannot be modified":
    "Event terkunci dan tidak dapat diubah",
  "event is not open for registration": "Event tidak dibuka untuk pendaftaran",
  "event must be cancelled for mass refund":
    "Event harus berstatus dibatalkan untuk refund massal",
  "insufficient wallet balance": "Saldo wallet tidak mencukupi",
  "quota exhausted": "Kuota habis",
  "refund cutoff date has passed": "Batas waktu refund sudah lewat",
  "registration already has a pending payment":
    "Registrasi sudah memiliki pembayaran yang menunggu",
  "registration already paid": "Registrasi sudah dibayar",
  "registration already refunded": "Registrasi sudah di-refund",
  "registration is not eligible for check-in":
    "Registrasi tidak memenuhi syarat untuk check-in",
  "registration is not refundable": "Registrasi tidak dapat di-refund",
  "registration status does not allow payment":
    "Status registrasi tidak mengizinkan pembayaran",
  "ticket sale period is closed": "Periode penjualan tiket sudah ditutup",
  forbidden: "Anda tidak memiliki akses untuk aksi ini",
  "failed to get wallet balance": "Gagal memuat saldo wallet",
  "failed to issue token": "Gagal membuat token",
  "failed to list categories": "Gagal memuat daftar kategori",
  "failed to list events": "Gagal memuat daftar event",
  "failed to list pending events": "Gagal memuat daftar event tertunda",
  "failed to list tickets": "Gagal memuat daftar tiket",
  "internal server error": "Terjadi kesalahan pada server",
  "event not found": "Event tidak ditemukan",
  "not found": "Data tidak ditemukan",
  "organizer not found": "Penyelenggara tidak ditemukan",
  "participant not found": "Peserta tidak ditemukan",
  "resource not found": "Data tidak ditemukan",
  "invalid email or password": "Email atau password salah",
  "invalid signature": "Signature tidak valid",
  unauthorized: "Anda perlu masuk untuk melanjutkan",

  // Sentinel .Error() text (internal/domain/errors.go), matched by suffix
  // since handlers wrap them with varying "<context>: " prefixes.
  "duplicate resource": "Data sudah ada",
  "invalid status transition": "Transisi status tidak diizinkan",
  "invalid input": "Input tidak valid",
  "invalid credentials": "Email atau password salah",
  "publish requires admin approval":
    "Publikasi event memerlukan persetujuan admin",
  "idempotent duplicate": "Permintaan sudah pernah diproses",
  "bank account is required for manual refund":
    "Nomor rekening wajib diisi untuk refund manual",
  "registration is still open; close it before generating BIB numbers":
    "Pendaftaran masih dibuka; tutup pendaftaran sebelum membuat nomor BIB",
  "BIB numbers already generated; confirm regeneration to overwrite":
    "Nomor BIB sudah dibuat; konfirmasi pembuatan ulang untuk menimpa",
  "invalid check-in stage": "Tahap check-in tidak valid",
};

// Longest suffix first so e.g. "resource not found" doesn't shadow a longer
// sentinel string that happens to end the same way.
const SUFFIX_KEYS = Object.keys(MESSAGES).sort((a, b) => b.length - a.length);

/** Translates a raw backend error string to Indonesian; unknown strings pass through unchanged. */
export function translateApiError(raw: string): string {
  if (!raw) return raw;
  const exact = MESSAGES[raw];
  if (exact) return exact;
  for (const key of SUFFIX_KEYS) {
    if (raw.endsWith(key)) return MESSAGES[key];
  }
  return raw;
}
