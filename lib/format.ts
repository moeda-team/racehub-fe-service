/**
 * Format a plain integer with thousand-separator commas (id-ID locale). DISPLAY ONLY.
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

/**
 * Format a raw digit-only string for display inside a numeric text input.
 * "1000000" → "1.000.000" (id-ID). Empty / non-numeric → "".
 */
export function formatNumberInput(raw: string): string {
  const n = parseInt(raw.replace(/\D/g, ""), 10);
  if (isNaN(n)) return "";
  return new Intl.NumberFormat("id-ID").format(n);
}

/**
 * Strip thousand separators and any non-digit character from a formatted input
 * value so only raw digits remain for state storage and submission.
 */
export function parseNumberInput(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

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
