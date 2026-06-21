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
