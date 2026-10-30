"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import EventCard from "@/components/ui/EventCard";
import { formatDate, formatRupiah } from "@/lib/format";
import type { PublicEvent } from "@/lib/types.gen";

export default function HomeEventCarousel({ events }: { events: PublicEvent[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<-1 | 1>(1);
  const pointerStart = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasChanged = useRef(false);

  const move = (direction: -1 | 1) => {
    setSlideDirection(direction);
    setActiveIndex((current) => (current + direction + events.length) % events.length);
  };

  const event = events[activeIndex];

  useEffect(() => {
    if (!hasChanged.current) {
      hasChanged.current = true;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    cardRef.current?.animate(
      [
        {
          opacity: 0.15,
          transform: `translateY(${slideDirection > 0 ? "88px" : "-88px"}) scale(0.96)`,
          filter: "blur(2px)",
        },
        { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0)" },
      ],
      { duration: 480, easing: "cubic-bezier(0.22, 0.8, 0.25, 1)" },
    );
  }, [activeIndex, slideDirection]);

  if (!event) return null;

  return (
    <div className="home-event-carousel" aria-label="Event pilihan">
      <div
        ref={cardRef}
        className="home-event-carousel-card"
        onPointerDown={(e) => { pointerStart.current = e.clientY; }}
        onPointerUp={(e) => {
          if (pointerStart.current === null) return;
          const distance = e.clientY - pointerStart.current;
          if (Math.abs(distance) > 40) move(distance < 0 ? 1 : -1);
          pointerStart.current = null;
        }}
        onPointerCancel={() => { pointerStart.current = null; }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
          if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
        }}
        tabIndex={0}
        aria-label={`Event ${activeIndex + 1} dari ${events.length}. Gunakan tombol panah atas atau bawah untuk mengganti event.`}
      >
        <EventCard
          href={`/events/${event.id}`}
          title={event.name}
          location={event.location || "Lokasi belum diatur"}
          date={formatDate(event.event_date)}
          distances={event.event_type === "running" ? ["Event Lari"] : []}
          price={event.min_price > 0 ? formatRupiah(event.min_price) : "Gratis"}
          bannerUrl={event.banner_url}
          color={event.color || undefined}
          comingSoon={event.status === "coming_soon"}
        />
      </div>
      <div className="home-event-carousel-controls">
        <span aria-live="polite">{String(activeIndex + 1).padStart(2, "0")} / {String(events.length).padStart(2, "0")}</span>
        <div>
          <button type="button" aria-label="Event sebelumnya" onClick={() => move(-1)}>
            <ArrowUp size={18} aria-hidden />
          </button>
          <button type="button" aria-label="Event berikutnya" onClick={() => move(1)}>
            <ArrowDown size={18} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
