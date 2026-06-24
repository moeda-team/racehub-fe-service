/**
 * Format Rupiah — DISPLAY ONLY.
 * Menggunakan Indonesian locale. TIDAK melakukan perhitungan apapun.
 * Hanya memformat angka yang sudah diterima dari backend.
 */
export function formatRupiah(amount: number): string {
  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount).replace("Rp", "Rp ");
}

/**
 * Normalize a numeric <input type="number"> value string so it never keeps a
 * leading zero: "09000" -> "9000", "007" -> "7". A lone "0" and decimals like
 * "0.5" are preserved. DISPLAY ONLY — does not coerce or compute.
 */
export function normalizeNumberInput(value: string): string {
  return value.replace(/^0+(?=\d)/, "");
}

/**
 * Format an RFC3339 date string for display (id-ID). DISPLAY ONLY.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Tanggal belum diatur";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Tanggal belum diatur";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
