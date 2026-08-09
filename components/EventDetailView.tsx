"use client";

import { useState } from "react";
import Link from "next/link";
import { formatRupiah, formatDate, formatNumber } from "@/lib/format";
import type { PublicEventDetail } from "@/lib/types.gen";
import Badge from "@/components/ui/Badge";
import RichText from "@/components/ui/RichText";
import Button from "@/components/ui/Button";

// EventDetailView is the shared body of the public event-detail page
// (app/(marketplace)/events/[id]) — also rendered inside the organizer
// dashboard as a live preview. `interactive` turns the register CTA into a
// real link; the preview renders it disabled-looking but non-navigating.
export default function EventDetailView({
  detail,
  interactive = true,
}: {
  detail: PublicEventDetail;
  interactive?: boolean;
}) {
  const { event, categories, ticket_categories } = detail;
  // Snapshot waktu saat render pertama — server tetap memvalidasi ulang periode penjualan.
  const [now] = useState(() => Date.now());

  const ticketsByDistance = categories.map((d) => ({
    distance: d,
    tickets: ticket_categories.filter((t) => t.category_id === d.id),
  }));

  const cta = (
    <Button
      variant="primary"
      size="lg"
      style={{ width: "100%" }}
      disabled={!interactive || event.quota_remaining <= 0}
    >
      {event.quota_remaining > 0 ? "Daftar Sekarang" : "Kuota Habis"}
    </Button>
  );

  return (
    <>
      {event.banner_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- R2 host is dynamic; next/image needs static remotePatterns
        <img
          src={event.banner_url}
          alt={`Banner ${event.name}`}
          style={{
            width: "100%",
            maxHeight: 280,
            objectFit: "cover",
            borderRadius: "var(--radius-lg)",
            marginBottom: 20,
            border: "1px solid var(--color-line)",
          }}
        />
      ) : event.color ? (
        <div
          style={{
            height: 120,
            borderRadius: "var(--radius-lg)",
            marginBottom: 20,
            background: `radial-gradient(120% 140% at 80% -20%, rgba(255,255,255,0.25), transparent 55%), linear-gradient(135deg, ${event.color}, ${event.color})`,
          }}
        />
      ) : null}

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 30,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {event.name}
      </h1>
      <p style={{ color: "var(--color-ink-3)", marginBottom: 12 }}>
        {event.location || "Lokasi belum diatur"} &middot;{" "}
        {formatDate(event.event_date)}
      </p>

      <div
        style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}
      >
        {event.event_type === "running" && (
          <Badge variant="sprint">Event Lari</Badge>
        )}
        {event.donation_enabled && (
          <Badge variant="flame">Donasi Tersedia</Badge>
        )}
        <Badge variant={event.quota_remaining > 0 ? "ok" : "danger"}>
          {event.quota_remaining > 0
            ? `${formatNumber(event.quota_remaining)} slot tersisa`
            : "Kuota habis"}
        </Badge>
      </div>

      {event.description && (
        <div style={{ marginBottom: 24 }}>
          <RichText html={event.description} />
        </div>
      )}

      {event.donation_enabled && interactive && (
        <Link href={`/donate/${event.id}`} style={{ display: "block", margin: "0 0 24px" }}>
          <Button variant="secondary" size="md" style={{ width: "100%" }}>Donasi tanpa mendaftar</Button>
        </Link>
      )}

      <section style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          {event.event_type === "running" ? "Kategori Jarak" : "Kategori"}
        </h2>
        {categories.length === 0 ? (
          <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
            Belum ada kategori.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 10,
            }}
          >
            {categories.map((d) => {
              const pct =
                d.quota > 0
                  ? Math.max(0, Math.min(1, d.quota_remaining / d.quota))
                  : 0;
              const empty = d.quota_remaining <= 0;
              return (
                <div
                  key={d.id}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid var(--color-line)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-surface)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 19,
                      fontWeight: 700,
                      color: "var(--color-ink)",
                    }}
                  >
                    {d.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: empty
                        ? "var(--color-danger, #C0392B)"
                        : "var(--color-ink-3)",
                      margin: "3px 0 8px",
                    }}
                  >
                    {empty
                      ? "Kuota habis"
                      : `${formatNumber(d.quota_remaining)} dari ${formatNumber(d.quota)} slot tersisa`}
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "var(--color-line)",
                      overflow: "hidden",
                    }}
                    aria-hidden
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct * 100}%`,
                        borderRadius: 2,
                        backgroundColor: "var(--color-flame, #F5471D)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Tiket
        </h2>
        {ticket_categories.length === 0 ? (
          <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>
            Belum ada tiket.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {ticketsByDistance.map(({ distance, tickets }) =>
              tickets.length === 0 ? null : (
                <div key={distance.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 4,
                        height: 16,
                        borderRadius: 2,
                        backgroundColor: "var(--color-flame, #F5471D)",
                      }}
                      aria-hidden
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--color-ink)",
                      }}
                    >
                      {distance.name}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {tickets.map((t) => {
                      const expired =
                        !!t.sale_end && new Date(t.sale_end).getTime() < now;
                      const soldOut = !expired && t.quota_remaining <= 0;
                      return (
                        <div
                          key={t.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                            padding: "14px 16px",
                            border: "1px solid var(--color-line)",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: "var(--color-surface)",
                            opacity: expired || soldOut ? 0.6 : 1,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={{ fontWeight: 600, fontSize: 15 }}>
                                {t.name}
                              </span>
                              {expired ? (
                                <Badge variant="neutral">Berakhir</Badge>
                              ) : soldOut ? (
                                <Badge variant="danger">Habis</Badge>
                              ) : (
                                <Badge variant="ok">Tersedia</Badge>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--color-ink-3)",
                                marginTop: 3,
                              }}
                            >
                              {expired
                                ? `Penjualan berakhir ${formatDate(t.sale_end)}`
                                : soldOut
                                  ? "Kuota habis"
                                  : `${formatNumber(t.quota_remaining)} dari ${formatNumber(t.quota)} slot tersisa${t.sale_end ? ` · s.d. ${formatDate(t.sale_end)}` : ""}`}
                            </div>
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 700,
                              fontSize: 17,
                              color: "var(--color-ink)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {t.price > 0 ? formatRupiah(t.price) : "Gratis"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      {interactive ? <Link href={`/register/${event.id}`}>{cta}</Link> : cta}
    </>
  );
}
