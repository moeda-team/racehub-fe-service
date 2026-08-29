"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatDate, formatRupiah, formatNumber } from "@/lib/format";
import type { PublicEvent } from "@/lib/types.gen";
import EventCard from "@/components/ui/EventCard";
import Alert from "@/components/ui/Alert";
import { Eyebrow } from "@/components/ui/Layout";
import { CalendarDays, CircleCheck, MapPin, PersonStanding, RotateCcw } from "lucide-react";

type PagedEvents = {
  data: PublicEvent[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

const PAGE_SIZE_OPTIONS = [12, 24, 48];
const DEFAULT_PAGE_SIZE = 12;

export default function MarketplacePage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [runningOnly, setRunningOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const isFirstLoad = useRef(true);

  // Debounce search input 300ms.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change (not on page itself).
  useEffect(() => {
    if (isFirstLoad.current) return;
    setPage(1);
  }, [debouncedSearch, runningOnly, dateFrom, pageSize]);

  // Fetch whenever page or any filter changes.
  useEffect(() => {
    isFirstLoad.current = false;
    let cancelled = false;
    const raf = requestAnimationFrame(() => setIsLoading(true));

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
    if (runningOnly) params.set("event_type", "running");
    if (dateFrom) params.set("date_from", new Date(dateFrom).toISOString());

    (async () => {
      try {
        const res = await api.get<PagedEvents>(`/api/v1/events?${params}`, {
          auth: false,
        });
        if (!cancelled) {
          setEvents(res.data ?? []);
          setTotal(res.total ?? 0);
          setTotalPages(res.total_pages ?? 1);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Gagal memuat event. Coba lagi.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [page, pageSize, debouncedSearch, runningOnly, dateFrom]);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <main className="lk-container marketplace-page rh-reveal">
      <section id="events" className="market-catalog">
      <header className="event-catalog-intro">
        <Eyebrow>Katalog Event</Eyebrow>
        <h1>Temukan Event</h1>
        <p>
          Telusuri event yang sudah membuka pendaftaran, sedang berlangsung,
          atau yang sudah selesai — semua tercatat rapi di sini.
        </p>
      </header>

      {/* Filter bar */}
      <div
        className="lk-filter-bar market-filter"
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-end",
          marginBottom: 24,
          padding: "16px 20px",
          border: "1px solid var(--color-navy-line)",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--color-navy-soft)",
          boxShadow: "none",
        }}
      >
        <div className="field" style={{ flex: 1, minWidth: 220 }}>
          <label className="field-label">Cari</label>
          <div style={{ position: "relative" }}>
            <span style={inputIcon}>
              <MapPin size={16} aria-hidden />
            </span>
            <input
              className="field-input"
              style={inputWithIcon}
              placeholder="Cari nama event / lokasi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="field" style={{ width: 200 }}>
          <label className="field-label">Mulai tanggal</label>
          <div style={{ position: "relative" }}>
            <span style={inputIcon}>
              <CalendarDays size={16} aria-hidden />
            </span>
            <input
              className="field-input"
              style={inputWithIcon}
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setRunningOnly((v) => !v)}
          aria-pressed={runningOnly}
          style={pillButton(runningOnly)}
        >
          {runningOnly ? <CircleCheck size={18} aria-hidden /> : <PersonStanding size={17} aria-hidden />}
          Event lari saja
        </button>
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setDateFrom("");
            setRunningOnly(false);
          }}
          style={pillButton(false)}
        >
          <RotateCcw size={16} aria-hidden />
          Reset
        </button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <p style={{ color: "var(--color-ink-3)" }}>Memuat…</p>
      ) : events.length === 0 ? (
        <p style={{ color: "var(--color-ink-3)" }}>
          Belum ada event yang cocok dengan pencarian Anda.
        </p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {events.map((ev) => (
              <EventCard
                key={ev.id}
                href={`/events/${ev.id}`}
                title={ev.name}
                location={ev.location || "Lokasi belum diatur"}
                date={formatDate(ev.event_date)}
                distances={ev.event_type === "running" ? ["Event Lari"] : []}
                price={ev.min_price > 0 ? formatRupiah(ev.min_price) : "Gratis"}
                bannerUrl={ev.banner_url}
                color={ev.color || undefined}
                comingSoon={ev.status === "coming_soon"}
              />
            ))}
          </div>

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 28,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
                {formatNumber(rangeStart)}–{formatNumber(rangeEnd)} dari{" "}
                {formatNumber(total)} event
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
                style={pageBtn(page === 1, false)}
              >
                ← Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "…" ? (
                    <span
                      key={`e-${i}`}
                      style={{
                        padding: "6px 10px",
                        fontSize: 13,
                        color: "var(--color-ink-4)",
                      }}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      style={pageBtn(false, page === item)}
                    >
                      {item}
                    </button>
                  ),
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={pageBtn(page === totalPages, false)}
              >
                Berikutnya →
              </button>
            </div>
          </div>
        </>
      )}
      </section>
    </main>
  );
}

// --- Styles & icons ---

const inputIcon: React.CSSProperties = {
  position: "absolute",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
  color: "var(--color-ink-3)",
  pointerEvents: "none",
};

const inputWithIcon: React.CSSProperties = {
  paddingLeft: 38,
  borderRadius: "var(--radius-md)",
  width: "100%",
};

function pageBtn(disabled: boolean, active: boolean): React.CSSProperties {
  return {
    padding: "6px 14px",
    borderRadius: "var(--radius-sm)",
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid",
    borderColor: active ? "var(--color-gold)" : "var(--color-line)",
    backgroundColor: active ? "var(--color-gold)" : "var(--color-surface)",
    color: disabled
      ? "var(--color-ink-4)"
      : active
        ? "var(--color-navy-deep)"
        : "var(--color-ink-2)",
    fontWeight: active ? 600 : 400,
  };
}

function pillButton(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 46,
    padding: "0 20px",
    borderRadius: "var(--radius-pill)",
    border: active ? "1px solid transparent" : "1px solid var(--color-line)",
    backgroundColor: active ? "var(--color-gold)" : "var(--color-paper)",
    color: active ? "var(--color-navy-deep)" : "var(--color-ink-2)",
    fontFamily: "var(--font-body)",
    fontWeight: 700,
    fontSize: 13.5,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}
