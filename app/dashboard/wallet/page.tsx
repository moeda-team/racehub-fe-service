"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatRupiah, formatNumberInput, parseNumberInput } from "@/lib/format";
import type { ApiResponse, DonationWalletBalance, PlatformRevenue, WalletBalance } from "@/lib/types.gen";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function WalletPage() {
  const [org, setOrg] = useState<WalletBalance | null>(null);
  const [donation, setDonation] = useState<DonationWalletBalance | null>(null);
  const [platform, setPlatform] = useState<PlatformRevenue | null>(null);

  const [orgAmount, setOrgAmount] = useState("");
  const [orgBank, setOrgBank] = useState("");
  const [orgError, setOrgError] = useState<string | null>(null);
  const [orgNotice, setOrgNotice] = useState<string | null>(null);
  const [orgBusy, setOrgBusy] = useState(false);

  const [donAmount, setDonAmount] = useState("");
  const [donBank, setDonBank] = useState("");
  const [donError, setDonError] = useState<string | null>(null);
  const [donNotice, setDonNotice] = useState<string | null>(null);
  const [donBusy, setDonBusy] = useState(false);

  const [platAmount, setPlatAmount] = useState("");
  const [platBank, setPlatBank] = useState("");
  const [platError, setPlatError] = useState<string | null>(null);
  const [platNotice, setPlatNotice] = useState<string | null>(null);
  const [platBusy, setPlatBusy] = useState(false);

  const load = useCallback(async () => {
    const [o, don, plat] = await Promise.all([
      api.get<ApiResponse<WalletBalance>>("/api/v1/organizers/me/wallet"),
      api.get<ApiResponse<DonationWalletBalance>>("/api/v1/organizers/me/wallet/donations"),
      api.get<ApiResponse<PlatformRevenue>>("/api/v1/organizers/me/wallet/platform"),
    ]);
    setOrg(o.data);
    setDonation(don.data);
    setPlatform(plat.data);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  async function handleOrgWithdraw() {
    setOrgError(null); setOrgNotice(null);
    const n = Number(orgAmount);
    if (!n || n <= 0) { setOrgError("Masukkan nominal yang valid."); return; }
    if (org && n > org.balance) { setOrgError(`Nominal melebihi saldo tersedia (${formatRupiah(org.balance)}).`); return; }
    setOrgBusy(true);
    try {
      const body: { amount: number; bank_account?: string } = { amount: n };
      if (orgBank.trim()) body.bank_account = orgBank.trim();
      const res = await api.post<ApiResponse<WalletBalance>>("/api/v1/organizers/me/wallet/withdraw", body);
      setOrg(res.data);
      setOrgAmount(""); setOrgBank("");
      setOrgNotice(`Penarikan ${formatRupiah(n)} berhasil. Saldo kini ${formatRupiah(res.data.balance)}.`);
    } catch (err) {
      setOrgError(err instanceof ApiError ? err.message : "Penarikan gagal.");
    } finally { setOrgBusy(false); }
  }

  async function handleDonWithdraw() {
    setDonError(null); setDonNotice(null);
    const n = Number(donAmount);
    if (!n || n <= 0) { setDonError("Masukkan nominal yang valid."); return; }
    if (donation && n > donation.balance) { setDonError(`Nominal melebihi saldo donasi (${formatRupiah(donation.balance)}).`); return; }
    setDonBusy(true);
    try {
      const body: { amount: number; bank_account?: string } = { amount: n };
      if (donBank.trim()) body.bank_account = donBank.trim();
      const res = await api.post<ApiResponse<DonationWalletBalance>>("/api/v1/organizers/me/wallet/donations/withdraw", body);
      setDonation(res.data);
      setDonAmount(""); setDonBank("");
      setDonNotice(`Penarikan donasi ${formatRupiah(n)} berhasil. Saldo donasi kini ${formatRupiah(res.data.balance)}.`);
    } catch (err) {
      setDonError(err instanceof ApiError ? err.message : "Penarikan donasi gagal.");
    } finally { setDonBusy(false); }
  }

  async function handlePlatWithdraw() {
    setPlatError(null); setPlatNotice(null);
    const n = Number(platAmount);
    if (!n || n <= 0) { setPlatError("Masukkan nominal yang valid."); return; }
    if (platform && n > platform.balance) { setPlatError(`Nominal melebihi saldo admin (${formatRupiah(platform.balance)}).`); return; }
    setPlatBusy(true);
    try {
      const body: { amount: number; bank_account?: string } = { amount: n };
      if (platBank.trim()) body.bank_account = platBank.trim();
      const res = await api.post<ApiResponse<PlatformRevenue>>("/api/v1/organizers/me/wallet/platform/withdraw", body);
      setPlatform(res.data);
      setPlatAmount(""); setPlatBank("");
      setPlatNotice(`Penarikan admin ${formatRupiah(n)} berhasil. Saldo kini ${formatRupiah(res.data.balance)}.`);
    } catch (err) {
      setPlatError(err instanceof ApiError ? err.message : "Penarikan gagal.");
    } finally { setPlatBusy(false); }
  }

  return (
    <div className="rh-reveal">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Wallet</h1>

      {/* ── Wallet Organizer ── */}
      <section style={section}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
          <h2 style={sectionTitle}>Wallet Organizer</h2>
          <Link href="/dashboard/wallet/ledger" style={ledgerLink}>Lihat riwayat transaksi →</Link>
        </div>
        <p style={sectionDesc}>Harga tiket bersih dari setiap pembayaran yang settled. Tidak termasuk fee admin dan donasi.</p>

        {orgError && <Alert variant="danger" className="mb-3">{orgError}</Alert>}
        {orgNotice && <Alert variant="info" className="mb-3">{orgNotice}</Alert>}

        <div style={statGrid}>
          <StatCard label="Saldo" value={org ? formatRupiah(org.balance) : "—"} accent />
          <StatCard label="Total Terkumpul" value={org ? formatRupiah(org.total_collected) : "—"} />
          <StatCard label="Total Ditarik" value={org ? formatRupiah(org.total_withdrawn) : "—"} />
        </div>

        <WithdrawForm
          amount={orgAmount} bank={orgBank} busy={orgBusy} balance={org?.balance ?? 0}
          onAmount={setOrgAmount} onBank={setOrgBank} onSubmit={handleOrgWithdraw}
        />
      </section>

      {/* ── Wallet Donasi ── */}
      <section style={section}>
        <h2 style={sectionTitle}>Wallet Donasi</h2>
        <p style={sectionDesc}>Hasil donasi peserta dari seluruh event. Dana terpisah, dapat ditarik kapan saja.</p>

        {donError && <Alert variant="danger" className="mb-3">{donError}</Alert>}
        {donNotice && <Alert variant="info" className="mb-3">{donNotice}</Alert>}

        <div style={statGrid}>
          <StatCard label="Saldo" value={donation ? formatRupiah(donation.balance) : "—"} accent />
          <StatCard label="Total Terkumpul" value={donation ? formatRupiah(donation.total_collected) : "—"} />
          <StatCard label="Total Ditarik" value={donation ? formatRupiah(donation.total_withdrawn) : "—"} />
        </div>

        <WithdrawForm
          amount={donAmount} bank={donBank} busy={donBusy} balance={donation?.balance ?? 0}
          onAmount={setDonAmount} onBank={setDonBank} onSubmit={handleDonWithdraw}
        />
      </section>

      {/* ── Wallet Admin ── */}
      <section style={section}>
        <h2 style={sectionTitle}>Wallet Admin</h2>
        <p style={sectionDesc}>Fee aplikasi (Rp 5.000/transaksi) dari setiap pembayaran tiket.</p>

        {platError && <Alert variant="danger" className="mb-3">{platError}</Alert>}
        {platNotice && <Alert variant="info" className="mb-3">{platNotice}</Alert>}

        <div style={statGrid}>
          <StatCard label="Saldo" value={platform ? formatRupiah(platform.balance) : "—"} accent />
          <StatCard label="Total Terkumpul" value={platform ? formatRupiah(platform.total_collected) : "—"} />
          <StatCard label="Total Ditarik" value={platform ? formatRupiah(platform.total_withdrawn) : "—"} />
        </div>

        <WithdrawForm
          amount={platAmount} bank={platBank} busy={platBusy} balance={platform?.balance ?? 0}
          onAmount={setPlatAmount} onBank={setPlatBank} onSubmit={handlePlatWithdraw}
        />
      </section>
    </div>
  );
}

function WithdrawForm({
  amount, bank, busy, balance, onAmount, onBank, onSubmit,
}: {
  amount: string; bank: string; busy: boolean; balance: number;
  onAmount: (v: string) => void; onBank: (v: string) => void; onSubmit: () => void;
}) {
  const n = Number(amount);
  const overBalance = n > 0 && balance > 0 && n > balance;

  return (
    <div style={card}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Tarik Saldo</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="field">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <label className="field-label" style={{ margin: 0 }}>Nominal (Rp)</label>
            <button
              type="button"
              disabled={balance <= 0}
              onClick={() => onAmount(String(balance))}
              style={{
                fontSize: 12, fontWeight: 600, padding: "2px 10px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--color-primary)",
                backgroundColor: "transparent",
                color: balance <= 0 ? "var(--color-ink-4)" : "var(--color-primary)",
                cursor: balance <= 0 ? "not-allowed" : "pointer",
                lineHeight: 1.6,
              }}
            >
              Semua Saldo
            </button>
          </div>
          <input
            className="field-input"
            type="text" inputMode="numeric" value={formatNumberInput(amount)}
            onChange={(e) => onAmount(parseNumberInput(e.target.value))}
            placeholder="0"
            style={overBalance ? { borderColor: "var(--color-danger, #dc2626)" } : undefined}
          />
          {overBalance && (
            <span style={{ fontSize: 12, color: "var(--color-danger, #dc2626)", marginTop: 4, display: "block" }}>
              Melebihi saldo tersedia ({formatRupiah(balance)})
            </span>
          )}
          {!overBalance && balance > 0 && (
            <span style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 4, display: "block" }}>
              Saldo tersedia: {formatRupiah(balance)}
            </span>
          )}
        </div>
        <div className="field">
          <label className="field-label">No. Rekening Tujuan (opsional)</label>
          <input className="field-input" type="text" value={bank}
            onChange={(e) => onBank(e.target.value)} placeholder="Contoh: BCA 1234567890" />
        </div>
        <Button variant="primary" size="md" disabled={busy || overBalance || balance <= 0} onClick={onSubmit}>
          {busy ? "Memproses…" : "Tarik"}
        </Button>
      </div>
    </div>
  );
}

const section: React.CSSProperties = { marginBottom: 40 };
const sectionTitle: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, margin: 0,
};
const sectionDesc: React.CSSProperties = {
  fontSize: 13, color: "var(--color-ink-3)", marginBottom: 16, lineHeight: 1.5,
};
const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginBottom: 20,
};
const card: React.CSSProperties = {
  padding: 16,
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius-md)",
  backgroundColor: "var(--color-surface)",
};
const ledgerLink: React.CSSProperties = {
  fontSize: 13, fontWeight: 600,
  color: "var(--color-primary)",
  textDecoration: "none",
};
