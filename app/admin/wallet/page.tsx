"use client";

import { useEffect, useState } from "react";
import { adminApi, ApiError } from "@/lib/admin";
import { formatRupiah } from "@/lib/format";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { ApiResponse, PlatformRevenue } from "@/lib/types.gen";

export default function AdminWalletPage() {
  const [wallet, setWallet] = useState<PlatformRevenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function load() {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.get<ApiResponse<PlatformRevenue>>(
          "/api/v1/admin/platform",
        );
        if (!cancelled) setWallet(res.data);
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }

  useEffect(() => {
    load();
  }, []);

  async function withdraw() {
    const amount = parseInt(withdrawAmount.replace(/\D/g, ""), 10);
    if (!amount || amount <= 0) {
      setErr("Masukkan nominal penarikan yang valid.");
      return;
    }
    if (amount > (wallet?.balance ?? 0)) {
      setErr("Nominal melebihi saldo yang tersedia.");
      return;
    }
    setWithdrawing(true);
    setErr(null);
    setNotice(null);
    try {
      await adminApi.post("/api/v1/admin/platform/withdraw", {
        amount,
        bank_account: bankAccount || undefined,
      });
      setNotice(`Penarikan ${formatRupiah(amount)} berhasil.`);
      setWithdrawAmount("");
      setBankAccount("");
      load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Penarikan gagal.");
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div className="rh-reveal">
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        Platform Wallet
      </h1>
      <p
        style={{ color: "var(--color-ink-3)", fontSize: 14, marginBottom: 28 }}
      >
        Kelola saldo fee platform dari semua transaksi
      </p>

      {notice && (
        <Alert variant="info" className="mb-4">
          {notice}
        </Alert>
      )}
      {err && (
        <Alert variant="danger" className="mb-4">
          {err}
        </Alert>
      )}

      {loading ? (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      ) : wallet ? (
        <>
          {/* Balance cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div className="stat stat-accent">
              <div className="stat-lab">Balance</div>
              <div className="stat-val">{formatRupiah(wallet.balance)}</div>
            </div>
            <div className="stat">
              <div className="stat-lab">Total Collected</div>
              <div
                className="stat-val"
                style={{ fontSize: 24, color: "var(--color-ok)" }}
              >
                {formatRupiah(wallet.total_collected)}
              </div>
            </div>
            <div className="stat">
              <div className="stat-lab">Total Withdrawn</div>
              <div
                className="stat-val"
                style={{ fontSize: 24, color: "var(--color-ink-3)" }}
              >
                {formatRupiah(wallet.total_withdrawn)}
              </div>
            </div>
          </div>

          {/* Withdraw form */}
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-md)",
              padding: 24,
              maxWidth: 520,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 17,
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              Tarik Saldo
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="field">
                <label className="field-label">Nominal Penarikan (Rp)</label>
                <input
                  className="field-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={withdrawAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    const num = parseInt(raw || "0", 10);
                    setWithdrawAmount(formatRupiah(num));
                  }}
                />
              </div>
              <div className="field">
                <label className="field-label">No. Rekening (opsional)</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Untuk catatan penarikan"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                disabled={withdrawing || !withdrawAmount}
                onClick={withdraw}
              >
                {withdrawing ? "Memproses…" : "Tarik Saldo"}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p style={{ color: "var(--color-ink-3)" }}>Gagal memuat data wallet.</p>
      )}
    </div>
  );
}
