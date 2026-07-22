import { formatNumber } from "@/lib/format";
import Pill from "./Pill";

interface EventCardProps {
  title: string;
  location: string;
  date: string;
  distances: string[];
  price: string;
  quotaRemaining?: number;
  bannerUrl?: string | null;
  color?: string;
  href?: string;
  className?: string;
}

export default function EventCard({
  title,
  location,
  date,
  distances,
  price,
  quotaRemaining,
  bannerUrl,
  color,
  href,
  className = "",
}: EventCardProps) {
  // Header priority: banner image → organizer color → default flame gradient
  // (.evcard-top CSS). A dark scrim keeps text readable over images.
  const topStyle: React.CSSProperties | undefined = bannerUrl
    ? {
        background: `linear-gradient(180deg, rgba(0,0,0,0.30), rgba(0,0,0,0.45)), url(${bannerUrl}) center/cover no-repeat`,
      }
    : color
      ? {
          background: `radial-gradient(120% 140% at 80% -20%, rgba(255,255,255,0.25), transparent 55%), linear-gradient(135deg, ${color}, ${color})`,
        }
      : undefined;

  const content = (
    <>
      <div className="evcard-top" style={topStyle}>
        <div className="evcard-top-when">{date}</div>
        <div className="evcard-top-ttl">{title}</div>
      </div>
      <div className="evcard-body">
        <div className="evcard-meta">📍 {location}</div>
        <div className="evcard-pills">
          {distances.map((d) => (
            <Pill key={d}>{d}</Pill>
          ))}
        </div>
        <div className="evcard-foot">
          <div>
            <div className="evcard-price-k">Mulai dari</div>
            <div className="evcard-price-v">{price}</div>
          </div>
          {quotaRemaining !== undefined && (
            <div className="evcard-quota">
              <div className="evcard-quota-text">
                {quotaRemaining > 0
                  ? `${formatNumber(quotaRemaining)} slot tersisa`
                  : "Kuota habis"}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className={`evcard block ${className}`}>
        {content}
      </a>
    );
  }

  return <div className={`evcard ${className}`}>{content}</div>;
}
