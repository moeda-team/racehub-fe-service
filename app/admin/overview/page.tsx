"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin";
import { formatRupiah } from "@/lib/format";
import type { ApiResponse, PlatformRevenue } from "@/lib/types.gen";
import type { AdminEventPage } from "@/lib/types.gen";
import { PageHeader } from "@/components/ui/Layout";

export default function AdminOverviewPage() {
  const [events, setEvents] = useState<{
    total: number;
    published: number;
    draft: number;
    pending: number;
  } | null>(null);
  const [wallet, setWallet] = useState<PlatformRevenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [evRes, walletRes] = await Promise.all([
          adminApi.get<AdminEventPage>("/api/v1/admin/events?page_size=1"),
          adminApi.get<ApiResponse<PlatformRevenue>>("/api/v1/admin/platform"),
        ]);
        if (cancelled) return;

        const evTotal = evRes.total ?? 0;

        // Fetch counts per status with parallel queries
        const [pubRes, draftRes, pendingRes] = await Promise.all([
          adminApi.get<AdminEventPage>(
            "/api/v1/admin/events?status=published&page_size=1",
          ),
          adminApi.get<AdminEventPage>(
            "/api/v1/admin/events?status=draft&page_size=1",
          ),
          adminApi.get<AdminEventPage>(
            "/api/v1/admin/events?status=pending&page_size=1",
          ),
        ]);

        if (cancelled) return;
        setEvents({
          total: evTotal,
          published: pubRes.total ?? 0,
          draft: draftRes.total ?? 0,
          pending: pendingRes.total ?? 0,
        });
        setWallet(walletRes.data ?? null);
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rh-reveal">
      <PageHeader eyebrow="Admin / Overview" title="Overview" description="Ringkasan operasional platform LowkeyThings." />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="Total Event"
          value={loading ? "…" : String(events?.total ?? 0)}
        />
        <StatCard
          label="Published"
          value={loading ? "…" : String(events?.published ?? 0)}
          accent="ok"
        />
        <StatCard
          label="Draft"
          value={loading ? "…" : String(events?.draft ?? 0)}
          accent="neutral"
        />
        <StatCard
          label="Menunggu Approval"
          value={loading ? "…" : String(events?.pending ?? 0)}
          accent="warn"
        />
      </div>

      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-md)",
          padding: 24,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 17,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Platform Wallet
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--color-ink-3)",
            marginTop: 0,
            marginBottom: 20,
          }}
        >
          Total fee platform yang dikumpulkan dari semua transaksi
        </p>
        {wallet ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-ink-3)",
                  marginBottom: 4,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Balance
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 26,
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatRupiah(wallet.balance)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-ink-3)",
                  marginBottom: 4,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Total Collected
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 26,
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatRupiah(wallet.total_collected)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-ink-3)",
                  marginBottom: 4,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Total Withdrawn
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 26,
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--color-ink-3)",
                }}
              >
                {formatRupiah(wallet.total_withdrawn)}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
            {loading ? "Memuat…" : "Gagal memuat data wallet"}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "ok" | "warn" | "neutral";
}) {
  const bgMap = {
    ok: "var(--color-ok)",
    warn: "var(--color-warn)",
    neutral: "var(--color-ink)",
  };
  return (
    <div className="stat">
      <div className="stat-lab">{label}</div>
      <div
        className="stat-val"
        style={
          accent
            ? {
                color: bgMap[accent],
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 36,
                margin: "8px 0 2px",
                fontVariantNumeric: "tabular-nums",
              }
            : undefined
        }
      >
        {value}
      </div>
    </div>
  );
}
