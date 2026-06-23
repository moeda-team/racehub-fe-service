"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import { eventStatusDisplay } from "@/lib/event-status";
import type { ApiResponse, Event } from "@/lib/types.gen";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function DashboardPage() {
  const { wallet, getWallet } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getWallet();
        const res = await api.get<ApiResponse<Event[]>>("/api/v1/events");
        if (!cancelled) setEvents(res.data ?? []);
      } catch {
        if (!cancelled) setError("Gagal memuat data dashboard.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getWallet]);

  const publishedCount = events.filter((e) => e.status === "published").length;

  return (
    <div className="rh-reveal">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700 }}>Dashboard</h1>
        <Link href="/dashboard/events/new">
          <Button variant="primary" size="md">
            + Buat Event
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard label="Total Event" value={String(events.length)} />
        <StatCard label="Event Terbit" value={String(publishedCount)} />
        <StatCard label="Saldo Wallet" value={wallet ? formatRupiah(wallet.balance) : "—"} accent />
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
        Event Terbaru
      </h2>

      {isLoading ? (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      ) : events.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)" }}>
          Belum ada event.{" "}
          <Link href="/dashboard/events/new" style={{ color: "var(--color-flame)", fontWeight: 500 }}>
            Buat event pertama Anda
          </Link>
          .
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {events.slice(0, 7).map((ev) => {
            const status = eventStatusDisplay(ev.status);
            return (
              <Link
                key={ev.id}
                href={`/dashboard/events/${ev.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  border: "1px solid var(--color-line)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "var(--color-ink)" }}>{ev.name}</div>
                  <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
                    {ev.location || "Lokasi belum diatur"}
                  </div>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
