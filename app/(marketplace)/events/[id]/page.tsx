"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatRupiah, formatDate } from "@/lib/format";
import type { ApiResponse, PublicEventDetail } from "@/lib/types.gen";
import Badge from "@/components/ui/Badge";
import Pill from "@/components/ui/Pill";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<PublicEventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Public detail must use the anonymous (PublicEventDetail) shape even
        // when an organizer is logged in, otherwise the owner view (different
        // shape, no quota_remaining) leaks through.
        const res = await api.get<ApiResponse<PublicEventDetail>>(`/api/v1/events/${id}`, {
          auth: false,
        });
        if (!cancelled) setDetail(res.data);
      } catch {
        if (!cancelled) setError("Event tidak ditemukan atau belum dipublikasikan.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return <main className="max-w-3xl mx-auto px-4 py-12"><p style={{ color: "var(--color-ink-3)" }}>Memuat…</p></main>;
  }

  if (error || !detail) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" style={{ fontSize: 13, color: "var(--color-ink-3)", display: "inline-block", marginBottom: 12 }}>
          ← Kembali ke marketplace
        </Link>
        <Alert variant="danger">{error ?? "Event tidak ditemukan."}</Alert>
      </main>
    );
  }

  const { event, distance_categories, ticket_categories } = detail;

  const ticketsByDistance = distance_categories.map((d) => ({
    distance: d,
    tickets: ticket_categories.filter((t) => t.distance_category_id === d.id),
  }));

  return (
    <main key="event-detail" className="max-w-3xl mx-auto px-4 py-8 rh-reveal">
      <Link href="/" style={{ fontSize: 13, color: "var(--color-ink-3)", display: "inline-block", marginBottom: 12 }}>
        ← Kembali ke marketplace
      </Link>

      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, marginBottom: 4 }}>
        {event.name}
      </h1>
      <p style={{ color: "var(--color-ink-3)", marginBottom: 12 }}>
        {event.location || "Lokasi belum diatur"} &middot; {formatDate(event.event_date)}
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {event.is_running_event && <Badge variant="sprint">Event Lari</Badge>}
        {event.donation_enabled && <Badge variant="flame">Donasi Tersedia</Badge>}
        <Badge variant={event.quota_remaining > 0 ? "ok" : "danger"}>
          {event.quota_remaining > 0 ? `${event.quota_remaining} slot tersisa` : "Kuota habis"}
        </Badge>
      </div>

      {event.description && (
        <p style={{ marginBottom: 24, lineHeight: 1.6 }}>{event.description}</p>
      )}

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
          Kategori Jarak
        </h2>
        {distance_categories.length === 0 ? (
          <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>Belum ada kategori jarak.</p>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {distance_categories.map((d) => (
              <Pill key={d.id}>
                {d.name} · {d.quota_remaining}/{d.quota} sisa
              </Pill>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
          Tiket
        </h2>
        {ticket_categories.length === 0 ? (
          <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>Belum ada tiket.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {ticketsByDistance.map(({ distance, tickets }) => tickets.length === 0 ? null : (
              <div key={distance.id}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-ink-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                }}>
                  {distance.name}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {tickets.map((t) => (
                    <div
                      key={t.id}
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
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
                          {t.quota_remaining}/{t.quota} sisa
                        </div>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{formatRupiah(t.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link href={`/register/${event.id}`}>
        <Button variant="primary" size="lg" style={{ width: "100%" }} disabled={event.quota_remaining <= 0}>
          {event.quota_remaining > 0 ? "Daftar Sekarang" : "Kuota Habis"}
        </Button>
      </Link>
    </main>
  );
}
