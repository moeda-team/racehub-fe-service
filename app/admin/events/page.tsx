"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type {
  AdminEventPage,
  EventStatus,
} from "@/lib/types.gen";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
  finished: "Finished",
};

const STATUS_BADGE: Record<string, "neutral" | "ok" | "danger" | "warn"> = {
  draft: "neutral",
  published: "ok",
  cancelled: "danger",
  finished: "neutral",
};

export default function AdminEventsPage() {
  const [result, setResult] = useState<AdminEventPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | EventStatus>("all");

  useEffect(() => {
    let cancelled = false;
    const raf = requestAnimationFrame(() => setLoading(true));
    (async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          page_size: "20",
        });
        if (filter !== "all") params.set("status", filter);
        const res = await adminApi.get<AdminEventPage>(
          `/api/v1/admin/events?${params.toString()}`,
        );
        if (!cancelled) {
          setResult(res);
        }
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [page, filter]);

  const events = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.total_pages ?? 1;

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
        Event
      </h1>
      <p
        style={{ color: "var(--color-ink-3)", fontSize: 14, marginBottom: 24 }}
      >
        Semua event di platform RaceHub
      </p>

      {/* Filter tabs */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}
      >
        {(["all", "published", "draft", "cancelled", "finished"] as const).map(
          (f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid",
                borderColor:
                  filter === f ? "var(--color-gold)" : "var(--color-line-2)",
                background:
                  filter === f ? "var(--color-gold)" : "var(--color-surface)",
                color: filter === f ? "var(--color-navy-deep)" : "var(--color-ink-2)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "0.15s",
              }}
            >
              {f === "all" ? "Semua" : STATUS_LABEL[f]}
            </button>
          ),
        )}
      </div>

      {/* Stats row */}
      {result && (
        <div
          style={{
            fontSize: 13,
            color: "var(--color-ink-3)",
            marginBottom: 12,
          }}
        >
          {total} event — halaman {page} dari {totalPages}
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      ) : events.length === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--color-ink-3)",
            border: "1px dashed var(--color-line)",
            borderRadius: "var(--radius-md)",
          }}
        >
          Tidak ada event untuk filter ini.
        </div>
      ) : (
        <>
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Nama Event</th>
                    <th>Status</th>
                    <th>Fecha Event</th>
                    <th>Lokasi</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} style={{ cursor: "pointer" }}>
                      <td>
                        <div
                          style={{
                            fontWeight: 600,
                            maxWidth: 260,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ev.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--color-ink-3)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {ev.organizer_id.slice(0, 8)}…
                        </div>
                      </td>
                      <td
                        style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
                      >
                        <Badge variant={STATUS_BADGE[ev.status] ?? "neutral"}>
                          {STATUS_LABEL[ev.status] ?? ev.status}
                        </Badge>
                      </td>
                      <td
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 13,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ev.event_date ? formatDate(ev.event_date) : "—"}
                      </td>
                      <td
                        style={{
                          fontSize: 13,
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ev.location || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginTop: 20,
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Sebelumnya
              </Button>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 13,
                  color: "var(--color-ink-3)",
                  padding: "0 12px",
                }}
              >
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Selanjutnya →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
