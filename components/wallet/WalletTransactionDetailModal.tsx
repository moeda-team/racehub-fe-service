"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { WalletTransactionDetail } from "@/lib/types.gen";
import Button from "@/components/ui/Button";

type Props = {
  detail: WalletTransactionDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
};

const walletLabel: Record<string, string> = { organizer: "Organizer", donation: "Donasi", platform: "Admin" };
const typeLabel: Record<string, string> = { credit: "Pemasukan Tiket", refund: "Refund Peserta", withdraw: "Penarikan" };

export default function WalletTransactionDetailModal({ detail, loading, error, onClose, onRetry }: Props) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="wallet-transaction-title" style={backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section style={modal}>
        <header style={header}>
          <div>
            <p style={eyebrow}>DETAIL TRANSAKSI</p>
            <h2 id="wallet-transaction-title" style={title}>Rincian transaksi wallet</h2>
          </div>
          <button type="button" aria-label="Tutup modal" onClick={onClose} style={closeButton}><X size={20} aria-hidden /></button>
        </header>

        {loading ? <p style={muted}>Memuat detail transaksi…</p> : error ? (
          <div style={errorBox}><p style={{ margin: 0 }}>{error}</p><Button type="button" variant="secondary" size="sm" onClick={onRetry}>Coba lagi</Button></div>
        ) : detail ? <DetailContent detail={detail} onClose={onClose} /> : null}
      </section>
    </div>
  );
}

function DetailContent({ detail, onClose }: { detail: WalletTransactionDetail; onClose: () => void }) {
  const signedAmount = `${detail.amount < 0 ? "−" : "+"}${formatRupiah(Math.abs(detail.amount))}`;
  return <div style={{ marginTop: 20, display: "grid", gap: 20 }}>
    <section>
      <h3 style={sectionTitle}>Transaksi</h3>
      <dl style={grid}>
        <Field label="Wallet" value={walletLabel[detail.wallet] ?? detail.wallet} />
        <Field label="Jenis" value={typeLabel[detail.type] ?? detail.type} />
        <Field label="Nominal" value={signedAmount} mono tone={detail.amount < 0 ? "danger" : "ok"} />
        <Field label="Tanggal" value={formatDate(detail.created_at)} />
        <Field label="Keterangan" value={detail.description || "—"} />
        <Field label="Rekening tujuan" value={detail.bank_account || "—"} mono />
        <Field label="Referensi" value={detail.reference_id || detail.id} mono />
      </dl>
    </section>

    {detail.payment && <section>
      <h3 style={sectionTitle}>Rincian pembayaran</h3>
      <dl style={grid}>
        <Field label="ID transaksi" value={detail.payment.transaction_id || "—"} mono />
        <Field label="Metode pembayaran" value={detail.payment.method || "—"} />
        <Field label="Waktu pembayaran" value={formatDate(detail.payment.paid_at)} />
      </dl>
      <dl style={{ ...grid, marginTop: 10 }}>
        <Field label="Harga tiket" value={formatRupiah(detail.payment.price)} mono />
        <Field label="Donasi" value={formatRupiah(detail.payment.donation)} mono />
        <Field label="Fee platform" value={formatRupiah(detail.payment.fee_platform)} mono />
        <Field label="Fee gateway" value={formatRupiah(detail.payment.fee_midtrans)} mono />
        <Field label="Sub total" value={formatRupiah(detail.payment.sub_total)} mono tone="ok" />
      </dl>
    </section>}

    <section>
      <h3 style={sectionTitle}>Data pelanggan</h3>
      {detail.customer ? <dl style={grid}>
        <Field label="Nama" value={detail.customer.name} />
        <Field label="Email" value={detail.customer.email} />
        <Field label="No. HP" value={detail.customer.phone} mono />
        <Field label="No. registrasi" value={detail.customer.registration_number} mono />
        <Field label="Event" value={detail.customer.event_name} />
        <Field label="Kategori" value={detail.customer.category_name} />
        <Field label="Tiket" value={detail.customer.ticket_name} />
        <Field label="Status pendaftaran" value={detail.customer.registration_status} />
      </dl> : <p style={muted}>Data pelanggan tidak tersedia untuk transaksi ini.</p>}
    </section>

    <div style={{ display: "flex", justifyContent: "flex-end" }}><Button type="button" variant="secondary" onClick={onClose}>Tutup</Button></div>
  </div>;
}

function Field({ label, value, mono = false, tone }: { label: string; value: string; mono?: boolean; tone?: "ok" | "danger" }) {
  return <div style={field}><dt style={term}>{label}</dt><dd style={{ ...valueStyle, ...(mono ? { fontFamily: "var(--font-mono)" } : {}), ...(tone ? { color: `var(--color-${tone})` } : {}) }}>{value}</dd></div>;
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const backdrop: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: 16, background: "rgba(20,24,31,.78)" };
const modal: React.CSSProperties = { width: "min(100%, 720px)", maxHeight: "calc(100vh - 32px)", overflowY: "auto", padding: 20, borderRadius: "var(--radius-lg)", background: "var(--color-surface)", color: "var(--color-ink)", border: "1px solid var(--color-line)", boxShadow: "var(--shadow-sh-3)" };
const header: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 };
const eyebrow: React.CSSProperties = { margin: "0 0 4px", color: "var(--color-flame)", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em" };
const title: React.CSSProperties = { margin: 0, fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 1.2 };
const closeButton: React.CSSProperties = { width: 40, height: 40, flexShrink: 0, border: "1px solid var(--color-line)", borderRadius: 999, background: "transparent", color: "var(--color-ink-2)", cursor: "pointer" };
const sectionTitle: React.CSSProperties = { margin: "0 0 10px", fontFamily: "var(--font-display)", fontSize: 17 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, margin: 0 };
const field: React.CSSProperties = { padding: "10px 12px", border: "1px solid var(--color-line)", borderRadius: "var(--radius-sm)", background: "var(--color-paper)" };
const term: React.CSSProperties = { color: "var(--color-ink-3)", fontSize: 12, fontWeight: 700 };
const valueStyle: React.CSSProperties = { margin: "3px 0 0", fontSize: 14, fontWeight: 650, overflowWrap: "anywhere" };
const muted: React.CSSProperties = { margin: 0, color: "var(--color-ink-3)", fontSize: 14 };
const errorBox: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: 12, borderRadius: "var(--radius-sm)", color: "var(--color-danger)", background: "color-mix(in srgb, var(--color-danger) 10%, transparent)" };
