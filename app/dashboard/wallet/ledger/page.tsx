"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import type { ApiResponse, LedgerEntry, WalletEntryType } from "@/lib/types.gen";
import Alert from "@/components/ui/Alert";

const TYPE_LABEL: Record<string, string> = {
  credit: "Pemasukan Tiket",
  refund: "Refund Peserta",
  withdraw: "Penarikan",
};

const TYPE_COLOR: Record<string, string> = {
  credit: "var(--color-ok)",
  refund: "var(--color-danger)",
  withdraw: "var(--color-warn)",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<WalletEntryType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<ApiResponse<LedgerEntry[]>>("/api/v1/organizers/me/wallet/ledger?limit=500");
        if (!cancelled) setEntries(res.data ?? []);
      } catch {
        if (!cancelled) setError("Gagal memuat riwayat transaksi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59").getTime() : null;

    return entries.filter((e) => {
      if (typeFilter && e.type !== typeFilter) return false;
      if (q && !e.description.toLowerCase().includes(q) && !e.reference_id.toLowerCase().includes(q)) return false;
      if (from && new Date(e.created_at).getTime() < from) return false;
      if (to && new Date(e.created_at).getTime() > to) return false;
      return true;
    });
  }, [entries, search, typeFilter, dateFrom, dateTo]);

  const totalShown = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered]
  );

  return (
    <div className="rh-reveal">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <Link
          href="/dashboard/wallet"
          style={{ fontSize: 13, color: "var(--color-ink-3)", textDecoration: "none", fontWeight: 500 }}
        >
          ← Wallet
        </Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, margin: 0 }}>
          Riwayat Transaksi
        </h1>
      </div>

      {/* Filters */}
      <div style={filterRow}>
        <div className="field" style={{ flex: "2 1 200px" }}>
          <label className="field-label">Cari keterangan / referensi</label>
          <input
            className="field-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ketik untuk mencari…"
          />
        </div>

        <div className="field" style={{ flex: "1 1 140px" }}>
          <label className="field-label">Jenis</label>
          <select
            className="field-input"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as WalletEntryType | "")}
          >
            <option value="">Semua</option>
            <option value="credit">Pemasukan Tiket</option>
            <option value="refund">Refund Peserta</option>
            <option value="withdraw">Penarikan</option>
          </select>
        </div>

        <div className="field" style={{ flex: "1 1 140px" }}>
          <label className="field-label">Dari tanggal</label>
          <input
            className="field-input"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="field" style={{ flex: "1 1 140px" }}>
          <label className="field-label">Sampai tanggal</label>
          <input
            className="field-input"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {(search || typeFilter || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => { setSearch(""); setTypeFilter(""); setDateFrom(""); setDateTo(""); }}
            style={{ alignSelf: "flex-end", padding: "8px 14px", fontSize: 13, border: "1px solid var(--color-line)", borderRadius: "var(--radius-sm)", background: "none", cursor: "pointer", color: "var(--color-ink-3)", whiteSpace: "nowrap" }}
          >
            Reset filter
          </button>
        )}
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Summary bar */}
      {!loading && (
        <div style={summaryBar}>
          <span style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
            {filtered.length} transaksi ditampilkan
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14, color: totalShown >= 0 ? "var(--color-ok)" : "var(--color-danger)" }}>
            Net: {totalShown >= 0 ? "+" : "−"}{formatRupiah(Math.abs(totalShown))}
          </span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)" }}>Tidak ada transaksi yang sesuai filter.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                {["Tanggal", "Jenis", "Keterangan", "Nominal"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                  <td style={{ ...td, color: "var(--color-ink-3)", whiteSpace: "nowrap", fontSize: 12 }}>
                    {e.created_at ? formatDate(e.created_at) : "—"}
                  </td>
                  <td style={td}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-xs)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: TYPE_COLOR[e.type] ?? "var(--color-ink-3)",
                      backgroundColor: `color-mix(in srgb, ${TYPE_COLOR[e.type] ?? "var(--color-ink-3)"} 12%, transparent)`,
                    }}>
                      {TYPE_LABEL[e.type] ?? e.type}
                    </span>
                  </td>
                  <td style={{ ...td, color: "var(--color-ink-2)", fontSize: 13 }}>
                    {e.description || e.reference_id}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600, whiteSpace: "nowrap", color: e.amount < 0 ? "var(--color-danger)" : "var(--color-ok)" }}>
                    {e.amount < 0 ? "−" : "+"}{formatRupiah(Math.abs(e.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const filterRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "flex-start",
  marginBottom: 20,
  padding: 16,
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius-md)",
  backgroundColor: "var(--color-surface)",
};

const summaryBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  marginBottom: 12,
  borderBottom: "1px solid var(--color-line)",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-ink-3)",
  borderBottom: "2px solid var(--color-line)",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "middle",
};
