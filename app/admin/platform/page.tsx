"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin";
import { formatRupiah } from "@/lib/format";
import type { ApiResponse, PlatformRevenue } from "@/lib/types.gen";
import Alert from "@/components/ui/Alert";
import StatCard from "@/components/ui/StatCard";

export default function AdminPlatformPage() {
  const [revenue, setRevenue] = useState<PlatformRevenue | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.get<ApiResponse<PlatformRevenue>>("/api/v1/admin/platform");
        if (!cancelled) setRevenue(res.data);
      } catch {
        if (!cancelled) setError("Gagal memuat data revenue platform.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="rh-reveal" style={{ maxWidth: 760 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
        Revenue Platform
      </h1>
      <p style={{ fontSize: 14, color: "var(--color-ink-3)", marginBottom: 24 }}>
        Total fee platform (feePlatform) yang terkumpul dari seluruh pembayaran yang settled.
        Ini adalah pendapatan RaceHub — terpisah dari wallet organizer dan donasi.
      </p>

      {error && <Alert variant="danger">{error}</Alert>}

      {revenue && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <StatCard
            label="Total Fee Platform"
            value={formatRupiah(revenue.total)}
            accent
          />
        </div>
      )}

      {!revenue && !error && (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      )}
    </div>
  );
}
