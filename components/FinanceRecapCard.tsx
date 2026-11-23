"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import type { ApiResponse, FinanceRecap, FinanceRecapRow } from "@/lib/types.gen";
import Alert from "@/components/ui/Alert";
import DataTable, { type Column } from "@/components/ui/DataTable";

type FinanceRecapView = "category" | "ticket" | "ticket_voucher";

const VIEWS: { id: FinanceRecapView; label: string }[] = [
  { id: "category", label: "Kategori" },
  { id: "ticket", label: "Kategori Tiket" },
  { id: "ticket_voucher", label: "Kategori Tiket + Voucher" },
];

const TOTAL_ID = "total";

interface FinanceRecapCardProps {
  eventId: string;
  /** "Kategori Jarak" for running events, "Kategori" otherwise. */
  categoryLabel: string;
}

function viewButtonStyle(active: boolean): CSSProperties {
  return {
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 600,
    border: active ? "1px solid var(--color-flame)" : "1px solid var(--color-line)",
    borderRadius: 999,
    cursor: "pointer",
    backgroundColor: active ? "var(--color-flame-tint)" : "var(--color-surface)",
    color: active ? "var(--color-flame-700)" : "var(--color-ink-2)",
  };
}

function rowsFor(recap: FinanceRecap, view: FinanceRecapView): FinanceRecapRow[] {
  if (view === "category") return recap.by_category;
  if (view === "ticket") return recap.by_ticket_category;
  return recap.by_ticket_voucher;
}

function rowKey(row: FinanceRecapRow): string {
  return `${row.category_id}-${row.ticket_category_id ?? ""}-${row.voucher_code ?? ""}`;
}

function bold(row: FinanceRecapRow, value: ReactNode): ReactNode {
  return row.category_id === TOTAL_ID ? <strong>{value}</strong> : value;
}

function voucherCell(row: FinanceRecapRow): ReactNode {
  if (row.category_id === TOTAL_ID) return "";
  if (!row.voucher_code) return <span style={{ color: "var(--color-ink-3)" }}>Tanpa voucher</span>;
  return <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{row.voucher_code}</span>;
}

function buildColumns(view: FinanceRecapView, categoryLabel: string): Column<FinanceRecapRow>[] {
  const cols: Column<FinanceRecapRow>[] = [
    { key: "category", header: categoryLabel, render: (r) => bold(r, r.category_name) },
  ];
  if (view !== "category") {
    cols.push({ key: "ticket", header: "Kategori Tiket", render: (r) => r.ticket_name ?? "" });
  }
  if (view === "ticket_voucher") {
    cols.push({ key: "voucher", header: "Voucher", render: voucherCell });
  }
  cols.push(
    { key: "participants", header: "Peserta", render: (r) => bold(r, r.participants), mono: true },
    { key: "gross", header: "Harga Kotor", render: (r) => bold(r, formatRupiah(r.gross)), mono: true },
    {
      key: "discount",
      header: "Diskon Voucher",
      render: (r) => bold(r, r.discount > 0 ? `− ${formatRupiah(r.discount)}` : formatRupiah(0)),
      mono: true,
    },
    { key: "net", header: "Pendapatan Bersih", render: (r) => bold(r, formatRupiah(r.net)), mono: true },
  );
  return cols;
}

// FinanceRecapCard shows ticket revenue per category, per ticket class, and per
// ticket class × voucher. Every amount comes from GET /events/{id}/recap/finance;
// the client only switches which server-computed grouping is displayed.
export default function FinanceRecapCard({ eventId, categoryLabel }: FinanceRecapCardProps) {
  const [recap, setRecap] = useState<FinanceRecap | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [view, setView] = useState<FinanceRecapView>("category");

  useEffect(() => {
    let cancelled = false;
    api
      .get<ApiResponse<FinanceRecap>>(`/api/v1/events/${eventId}/recap/finance`)
      .then((res) => {
        if (!cancelled) setRecap(res.data);
      })
      .catch((error: unknown) => {
        if (!cancelled) setErr(error instanceof ApiError ? error.message : "Gagal memuat rekap pendapatan.");
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (err) return <Alert variant="danger">{err}</Alert>;
  if (!recap) return <p style={{ margin: 0, color: "var(--color-ink-3)", fontSize: 14 }}>Memuat rekap pendapatan…</p>;

  const rows = rowsFor(recap, view);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div role="group" aria-label="Kelompokkan rekap" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={view === v.id}
            style={viewButtonStyle(view === v.id)}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p style={{ margin: 0, color: "var(--color-ink-3)", fontSize: 14 }}>
          {view === "ticket_voucher" ? "Belum ada peserta lunas." : "Belum ada kategori tiket untuk direkap."}
        </p>
      ) : (
        <DataTable columns={buildColumns(view, categoryLabel)} data={[...rows, recap.total]} keyFn={rowKey} />
      )}
      <p style={{ margin: 0, color: "var(--color-ink-3)", fontSize: 12 }}>
        Hanya peserta lunas (tidak termasuk refund). Harga kotor = tiket + add-ons sebelum diskon; pendapatan bersih =
        yang masuk wallet organizer. Donasi dan fee tidak termasuk.
      </p>
    </div>
  );
}
