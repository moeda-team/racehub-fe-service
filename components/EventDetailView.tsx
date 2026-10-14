"use client";

import { useState } from "react";
import { formatRupiah, formatDate } from "@/lib/format";
import type { PublicEventDetail } from "@/lib/types.gen";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import RichText from "@/components/ui/RichText";
import { PUBLIC_DONATIONS_ENABLED } from "@/lib/features";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";

function getDistanceBadgeFontSize(name: string): number {
  if (name.length <= 3) return 18;
  if (name.length <= 5) return 14;
  if (name.length <= 8) return 11;
  return 10;
}

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
  const isComingSoon = event.status === "coming_soon";
  // Snapshot waktu saat render pertama — server tetap memvalidasi ulang periode penjualan.
  const [now] = useState(() => Date.now());

  const ticketsByDistance = categories.map((d) => ({
    distance: d,
    tickets: ticket_categories
      .filter((t) => t.category_id === d.id)
      .sort((a, b) => a.name.localeCompare(b.name, "id", { sensitivity: "base" })),
  }));

  const orphanTickets = ticket_categories.filter((t) => !categories.some((d) => d.id === t.category_id));

  const ticketsWithDistance = [
    ...ticketsByDistance.filter(({ tickets }) => tickets.length > 0),
    ...(orphanTickets.length > 0
      ? [
          {
            distance: { id: "general", name: "Tiket", quota: 0, quota_remaining: 0 },
            tickets: orphanTickets,
          },
        ]
      : []),
  ];

  const cta = (
    <Button variant="primary" size="lg" style={{ width: "100%" }} disabled={!interactive || isComingSoon}>
      {isComingSoon ? "Pendaftaran Belum Dibuka" : "Daftar Sekarang"}
    </Button>
  );

  return (
    <>
      {event.banner_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- banner URLs may be legacy absolute URLs or the backend media proxy
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
        {event.location || "Lokasi belum diatur"} &middot; {formatDate(event.event_date)}
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {isComingSoon && <Badge variant="warn">Segera Hadir</Badge>}
        {event.event_type === "running" && <Badge variant="sprint">Event Lari</Badge>}
        {PUBLIC_DONATIONS_ENABLED && event.donation_enabled && <Badge variant="flame">Donasi Tersedia</Badge>}
      </div>

      {isComingSoon && (
        <Alert variant="warn" className="mb-6">
          Pendaftaran belum dibuka. Pantau halaman ini untuk informasi pembukaan.
        </Alert>
      )}

      {event.description && (
        <div style={{ marginBottom: 24 }}>
          <RichText html={event.description} />
        </div>
      )}

      {PUBLIC_DONATIONS_ENABLED && event.donation_enabled && interactive && !isComingSoon && (
        <ButtonLink
          href={`/donate/${event.id}`}
          variant="secondary"
          size="md"
          style={{ width: "100%", margin: "0 0 24px" }}
        >
          Donasi tanpa mendaftar
        </ButtonLink>
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
          <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>Belum ada kategori.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 10,
            }}
          >
            {categories.map((d) => {
              return (
                <Card
                  key={d.id}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid var(--color-line)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-panel)",
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
                </Card>
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
          <p style={{ color: "var(--color-ink-3)", fontSize: 14 }}>Belum ada tiket.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {ticketsWithDistance.map(({ distance, tickets }) => (
              <div key={distance.id}>
                {ticketsWithDistance.length > 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 3,
                        height: 14,
                        borderRadius: 2,
                        backgroundColor: "var(--color-gold)",
                      }}
                      aria-hidden
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--color-ink)",
                      }}
                    >
                      {distance.name}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {tickets.map((t) => {
                    const expired = !!t.sale_end && new Date(t.sale_end).getTime() < now;
                    const isSoldOut = t.quota_remaining !== undefined && t.quota_remaining <= 0;
                    const isActionable = interactive && !isComingSoon && !expired && !isSoldOut;
                    const subtitle = t.name.toLowerCase().startsWith("tiket") ? t.name : `Tiket ${t.name}`;

                    return (
                      <div
                        key={t.id}
                        style={{
                          position: "relative",
                          backgroundColor: "var(--color-panel)",
                          border: "1px solid var(--color-line)",
                          borderRadius: 16,
                          opacity: expired ? 0.65 : 1,
                        }}
                      >
                        {/* Bagian Atas: Badge Jarak & Info Tiket */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 16px",
                          }}
                        >
                          {/* Badge Kategori Jarak */}
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              minWidth: 48,
                              borderRadius: 12,
                              backgroundColor: "var(--color-navy)",
                              color: "var(--color-paper)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "var(--font-display)",
                              fontWeight: 700,
                              fontSize: getDistanceBadgeFontSize(distance.name),
                              padding: "0 2px",
                              textAlign: "center",
                              lineHeight: 1.1,
                              userSelect: "none",
                            }}
                          ></div>

                          {/* Detail Tiket */}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "var(--font-display)",
                                  fontSize: 17,
                                  fontWeight: 700,
                                  color: "var(--color-ink)",
                                  lineHeight: 1.2,
                                }}
                              >
                                {distance.name}
                              </span>
                              {expired && <Badge variant="neutral">Berakhir</Badge>}
                              {isSoldOut && !expired && <Badge variant="danger">Habis</Badge>}
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--font-body)",
                                fontSize: 13,
                                color: "var(--color-ink-3)",
                                marginTop: 2,
                              }}
                            >
                              {subtitle}
                            </div>
                          </div>
                        </div>

                        {/* Garis Perforasi dengan Notch Kiri & Kanan */}
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            height: 0,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {/* Notch Kiri */}
                          <div
                            style={{
                              position: "absolute",
                              left: -11,
                              top: -11,
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              backgroundColor: "var(--color-paper)",
                              zIndex: 2,
                            }}
                            aria-hidden
                          />

                          {/* Garis Putus-putus */}
                          <div
                            style={{
                              width: "100%",
                              borderTop: "1.5px dashed var(--color-line-2)",
                              margin: "0 13px",
                              zIndex: 1,
                            }}
                            aria-hidden
                          />

                          {/* Notch Kanan */}
                          <div
                            style={{
                              position: "absolute",
                              right: -11,
                              top: -11,
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              backgroundColor: "var(--color-paper)",
                              zIndex: 2,
                            }}
                            aria-hidden
                          />
                        </div>

                        {/* Bagian Bawah: Label Harga, Nominal, dan Tombol CTA */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            padding: "10px 16px 12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontFamily: "var(--font-body)",
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "var(--color-ink-3)",
                                marginBottom: 2,
                              }}
                            >
                              HARGA
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--font-body)",
                                fontWeight: 700,
                                fontSize: 19,
                                color: "var(--color-ink)",
                                lineHeight: 1.1,
                              }}
                            >
                              {t.price > 0 ? formatRupiah(t.price) : "Gratis"}
                            </div>
                          </div>

                          <div>
                            {isActionable ? (
                              <Link
                                href={`/register/${event.id}?category=${distance.id}&ticket=${t.id}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "var(--color-navy)",
                                  color: "var(--color-paper)",
                                  padding: "7px 18px",
                                  borderRadius: 9999,
                                  fontFamily: "var(--font-body)",
                                  fontWeight: 600,
                                  fontSize: 13,
                                  textDecoration: "none",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  transition: "background-color 0.15s ease, opacity 0.15s ease",
                                }}
                                className="hover:opacity-90 active:scale-95"
                              >
                                Pilih tiket
                              </Link>
                            ) : (
                              <button
                                disabled
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor:
                                    isComingSoon || !interactive ? "var(--color-navy)" : "var(--color-line-2)",
                                  color: isComingSoon || !interactive ? "var(--color-paper)" : "var(--color-ink-3)",
                                  opacity: !interactive ? 0.75 : 1,
                                  padding: "7px 18px",
                                  borderRadius: 9999,
                                  fontFamily: "var(--font-body)",
                                  fontWeight: 600,
                                  fontSize: 13,
                                  border: "none",
                                  cursor: "not-allowed",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {isComingSoon
                                  ? "Pilih tiket"
                                  : expired
                                    ? "Berakhir"
                                    : isSoldOut
                                      ? "Habis"
                                      : "Pilih tiket"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {interactive && !isComingSoon ? (
        <ButtonLink href={`/register/${event.id}`} variant="primary" size="lg" style={{ width: "100%" }}>
          Daftar Sekarang
        </ButtonLink>
      ) : (
        cta
      )}
    </>
  );
}
