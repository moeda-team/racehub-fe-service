"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ApiResponse, PublicEventDetail } from "@/lib/types.gen";
import EventDetailView from "@/components/EventDetailView";
import Alert from "@/components/ui/Alert";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
        const res = await api.get<ApiResponse<PublicEventDetail>>(
          `/api/v1/events/${id}`,
          {
            auth: false,
          },
        );
        if (!cancelled) setDetail(res.data);
      } catch {
        if (!cancelled)
          setError("Event tidak ditemukan atau belum dipublikasikan.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      </main>
    );
  }

  if (error || !detail) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/jelajahi-event"
          style={{
            fontSize: 13,
            color: "var(--color-ink-3)",
            display: "inline-block",
            marginBottom: 12,
          }}
        >
          ← Kembali ke marketplace
        </Link>
        <Alert variant="danger">{error ?? "Event tidak ditemukan."}</Alert>
      </main>
    );
  }

  return (
    <main key="event-detail" className="max-w-3xl mx-auto px-4 py-8 rh-reveal">
      <Link
        href="/jelajahi-event"
        style={{
          fontSize: 13,
          color: "var(--color-ink-3)",
          display: "inline-block",
          marginBottom: 12,
        }}
      >
        ← Kembali ke marketplace
      </Link>
      <EventDetailView detail={detail} />
    </main>
  );
}
