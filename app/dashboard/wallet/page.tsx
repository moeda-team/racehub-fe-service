"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import type { ApiResponse, LedgerEntry, WalletBalance } from "@/lib/types.gen";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

const ENTRY_LABEL: Record<string, string> = {
  credit: "Pemasukan tiket",
  refund: "Refund",
  withdraw: "Penarikan",
};

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [bal, led] = await Promise.all([
      api.get<ApiResponse<WalletBalance>>("/api/v1/organizers/me/wallet"),
      api.get<ApiResponse<LedgerEntry[]>>("/api/v1/organizers/me/wallet/ledger"),
    ]);
    setBalance(bal.data.balance);
    setLedger(led.data ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch {
        if (!cancelled) setError("Gagal memuat data wallet.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function handleWithdraw() {
    setError(null);
    setNotice(null);
    const n = Number(amount);
    if (!n || n <= 0) {
      setError("Masukkan nominal penarikan yang valid.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<ApiResponse<WalletBalance>>("/api/v1/organizers/me/wallet/withdraw", { amount: n });
      setBalance(res.data.balance);
      setAmount("");
      setNotice(`Penarikan ${formatRupiah(n)} berhasil. Saldo kini ${formatRupiah(res.data.balance)}.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Penarikan gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rh-reveal">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Wallet</h1>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      {notice && <Alert variant="info" className="mb-4">{notice}</Alert>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Saldo Wallet" value={balance != null ? formatRupiah(balance) : "—"} accent />
      </div>

      <div style={card}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Tarik Saldo</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label className="field-label">Nominal (Rp)</label>
            <input
              className="field-input"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <Button variant="primary" size="md" disabled={busy} onClick={handleWithdraw}>
            {busy ? "Memproses…" : "Tarik"}
          </Button>
        </div>
        <p style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 8 }}>
          Penarikan dibatasi saldo tersedia. Donasi dilaporkan terpisah per event (lihat detail event).
        </p>
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, margin: "24px 0 12px" }}>Riwayat Transaksi</h2>
      {loading ? (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      ) : ledger.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)" }}>Belum ada transaksi.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ledger.map((e) => (
            <div key={e.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{ENTRY_LABEL[e.type] ?? e.type}</div>
                <div style={{ fontSize: 12, color: "var(--color-ink-3)" }}>{e.description || e.reference_id}</div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: e.amount < 0 ? "var(--color-danger)" : "var(--color-ok)" }}>
                {e.amount < 0 ? "−" : "+"}{formatRupiah(Math.abs(e.amount))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  padding: 16,
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius-md)",
  backgroundColor: "var(--color-surface)",
};
