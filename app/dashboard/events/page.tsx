"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { eventStatusDisplay } from "@/lib/event-status";
import type { Event, EventStatus } from "@/lib/types.gen";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

type PagedEvents = {
  data: Event[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

const STATUS_FILTERS: { label: string; value: EventStatus | "all" }[] = [
  { label: "Semua", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Terbit", value: "published" },
  { label: "Selesai", value: "finished" },
  { label: "Dibatalkan", value: "cancelled" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

export default function EventListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const isFirstLoad = useRef(true);

  // Debounce search input 300ms.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters or page size change (but not on page change itself).
  useEffect(() => {
    if (isFirstLoad.current) return;
    setPage(1);
  }, [debouncedSearch, statusFilter, pageSize]);

  // Fetch from backend whenever page/pageSize/filter/search change.
  useEffect(() => {
    isFirstLoad.current = false;
    let cancelled = false;
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);

    (async () => {
      try {
        const res = await api.get<PagedEvents>(`/api/v1/events?${params}`);
        if (!cancelled) {
          setEvents(res.data ?? []);
          setTotal(res.total ?? 0);
          setTotalPages(res.total_pages ?? 1);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Gagal memuat daftar event.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, debouncedSearch, statusFilter]);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

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
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700 }}>
          Event Saya
        </h1>
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

      {/* Search & Filter bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <input
          type="search"
          className="field-input"
          placeholder="Cari event…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box" }}
          aria-label="Cari event"
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
                fontSize: 13,
                fontWeight: statusFilter === f.value ? 600 : 400,
                cursor: "pointer",
                border: "1px solid",
                borderColor:
                  statusFilter === f.value ? "var(--color-flame)" : "var(--color-line)",
                backgroundColor:
                  statusFilter === f.value ? "var(--color-flame-tint)" : "var(--color-surface)",
                color:
                  statusFilter === f.value ? "var(--color-flame)" : "var(--color-ink-2)",
                transition: "all 150ms ease",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      ) : events.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)" }}>
          {total === 0 && !debouncedSearch && statusFilter === "all" ? (
            <>
              Belum ada event.{" "}
              <Link
                href="/dashboard/events/new"
                style={{ color: "var(--color-flame)", fontWeight: 500 }}
              >
                Buat event pertama Anda
              </Link>
              .
            </>
          ) : (
            "Tidak ada event yang cocok."
          )}
        </p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.map((ev) => {
              const status = eventStatusDisplay(ev.status);
              return (
                <Link
                  key={ev.id}
                  href={`/dashboard/events/${ev.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    border: "1px solid var(--color-line)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-surface)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--color-ink)" }}>{ev.name}</div>
                    <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
                      {ev.location || "Lokasi belum diatur"}
                      {ev.is_running_event ? " · Event lari" : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        color: "var(--color-ink-3)",
                      }}
                    >
                      {ev.total_quota_used}/{ev.total_quota}
                    </span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 20,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
                {rangeStart}–{rangeEnd} dari {total} event
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-line)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-ink-2)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
                aria-label="Jumlah per halaman"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} per halaman
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  border: "1px solid var(--color-line)",
                  backgroundColor: "var(--color-surface)",
                  color: page === 1 ? "var(--color-ink-4)" : "var(--color-ink-2)",
                }}
              >
                ← Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "…" ? (
                    <span
                      key={`ellipsis-${i}`}
                      style={{ padding: "6px 10px", fontSize: 13, color: "var(--color-ink-4)" }}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 13,
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor: page === item ? "var(--color-flame)" : "var(--color-line)",
                        backgroundColor: page === item ? "var(--color-flame)" : "var(--color-surface)",
                        color: page === item ? "#fff" : "var(--color-ink-2)",
                        fontWeight: page === item ? 600 : 400,
                      }}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  border: "1px solid var(--color-line)",
                  backgroundColor: "var(--color-surface)",
                  color: page === totalPages ? "var(--color-ink-4)" : "var(--color-ink-2)",
                }}
              >
                Berikutnya →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
