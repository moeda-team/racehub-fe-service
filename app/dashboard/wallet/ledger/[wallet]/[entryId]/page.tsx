"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Alert from "@/components/ui/Alert";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import type { ApiResponse, WalletTransactionDetail } from "@/lib/types.gen";

const walletLabel: Record<string, string> = { organizer: "Organizer", donation: "Donasi", platform: "Admin" };
const typeLabel: Record<string, string> = { credit: "Pemasukan Tiket", refund: "Refund Peserta", withdraw: "Penarikan" };

export default function WalletTransactionPage() {
  const { wallet, entryId } = useParams<{ wallet: string; entryId: string }>();
  const [detail, setDetail] = useState<WalletTransactionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<WalletTransactionDetail>>(
          `/api/v1/organizers/me/wallet/history/${wallet}/${entryId}`,
        );
        if (!cancelled) setDetail(res.data ?? null);
      } catch {
        if (!cancelled) setError("Gagal memuat detail transaksi.");
      }
    })();
    return () => { cancelled = true; };
  }, [wallet, entryId]);

  return <div className="rh-reveal" style={{ maxWidth: 900 }}>
    <Link href="/dashboard/wallet/ledger" style={backLink}>← Riwayat Transaksi</Link>
    <h1 style={title}>Detail Transaksi</h1>

    {error ? <Alert variant="danger">{error}</Alert> : !detail ? <p style={muted}>Memuat detail transaksi…</p> : <TransactionDetail detail={detail} />}
  </div>;
}

function TransactionDetail({ detail }: { detail: WalletTransactionDetail }) {
  const signedAmount = `${detail.amount < 0 ? "−" : "+"}${formatRupiah(Math.abs(detail.amount))}`;
  return <div style={{ display: "grid", gap: 24 }}>
    <Section title="Transaksi">
      <FieldGrid>
        <Field label="Wallet" value={walletLabel[detail.wallet] ?? detail.wallet} />
        <Field label="Jenis" value={typeLabel[detail.type] ?? detail.type} />
        <Field label="Nominal" value={signedAmount} mono tone={detail.amount < 0 ? "danger" : "ok"} />
        <Field label="Tanggal" value={formatDate(detail.created_at)} />
        <Field label="Keterangan" value={detail.description || "—"} />
        <Field label="Rekening tujuan" value={detail.bank_account || "—"} mono />
        <Field label="Referensi" value={detail.reference_id || detail.id} mono />
      </FieldGrid>
    </Section>

    {detail.payment && <Section title="Rincian pembayaran">
      <FieldGrid>
        <Field label="ID transaksi" value={detail.payment.transaction_id || "—"} mono />
        <Field label="Metode pembayaran" value={detail.payment.method || "—"} />
        <Field label="Waktu pembayaran" value={formatDate(detail.payment.paid_at)} />
        <Field label="Harga tiket" value={formatRupiah(detail.payment.price)} mono />
        <Field label="Donasi" value={formatRupiah(detail.payment.donation)} mono />
        <Field label="Fee platform" value={formatRupiah(detail.payment.fee_platform)} mono />
        <Field label="Fee gateway" value={formatRupiah(detail.payment.fee_midtrans)} mono />
        <Field label="Sub total" value={formatRupiah(detail.payment.sub_total)} mono tone="ok" />
      </FieldGrid>
    </Section>}

    <Section title="Data pelanggan">
      {detail.customer ? <FieldGrid>
        <Field label="Nama" value={detail.customer.name} />
        <Field label="Email" value={detail.customer.email} />
        <Field label="No. HP" value={detail.customer.phone} mono />
        <Field label="No. registrasi" value={detail.customer.registration_number} mono />
        <Field label="Event" value={detail.customer.event_name} />
        <Field label="Kategori" value={detail.customer.category_name} />
        <Field label="Tiket" value={detail.customer.ticket_name} />
        <Field label="Status pendaftaran" value={detail.customer.registration_status} />
      </FieldGrid> : <p style={muted}>Data pelanggan tidak tersedia untuk transaksi ini.</p>}
    </Section>
  </div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={section}><h2 style={sectionTitle}>{title}</h2>{children}</section>;
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <dl style={grid}>{children}</dl>;
}

function Field({ label, value, mono = false, tone }: { label: string; value: string; mono?: boolean; tone?: "ok" | "danger" }) {
  return <div style={field}><dt style={term}>{label}</dt><dd style={{ ...valueStyle, ...(mono ? { fontFamily: "var(--font-mono)" } : {}), ...(tone ? { color: `var(--color-${tone})` } : {}) }}>{value}</dd></div>;
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const backLink: React.CSSProperties = { display: "inline-block", marginBottom: 12, color: "var(--color-ink-3)", fontSize: 13, fontWeight: 600, textDecoration: "none" };
const title: React.CSSProperties = { margin: "0 0 20px", fontFamily: "var(--font-display)", fontSize: 26 };
const section: React.CSSProperties = { padding: 20, border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", background: "var(--color-surface)" };
const sectionTitle: React.CSSProperties = { margin: "0 0 14px", fontFamily: "var(--font-display)", fontSize: 18 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, margin: 0 };
const field: React.CSSProperties = { padding: "10px 12px", border: "1px solid var(--color-line)", borderRadius: "var(--radius-sm)", background: "var(--color-paper)" };
const term: React.CSSProperties = { color: "var(--color-ink-3)", fontSize: 12, fontWeight: 700 };
const valueStyle: React.CSSProperties = { margin: "3px 0 0", fontSize: 14, fontWeight: 650, overflowWrap: "anywhere" };
const muted: React.CSSProperties = { margin: 0, color: "var(--color-ink-3)", fontSize: 14 };
