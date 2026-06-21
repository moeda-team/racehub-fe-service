import Pill from "./Pill";

interface EventCardProps {
  title: string;
  location: string;
  date: string;
  distances: string[];
  price: string;
  quotaUsed: number;
  quotaTotal: number;
  href?: string;
  className?: string;
}

export default function EventCard({
  title,
  location,
  date,
  distances,
  price,
  quotaUsed,
  quotaTotal,
  href,
  className = "",
}: EventCardProps) {
  const pct = quotaTotal > 0 ? Math.round((quotaUsed / quotaTotal) * 100) : 0;

  const content = (
    <>
      <div className="evcard-top" />
      <div className="evcard-body">
        <div className="evcard-title">{title}</div>
        <div className="evcard-meta">
          {location} &middot; {date}
        </div>
        <div className="evcard-pills">
          {distances.map((d) => (
            <Pill key={d}>{d}</Pill>
          ))}
        </div>
        <div className="evcard-price">{price}</div>
        <div className="evcard-quota">
          <div className="evcard-quota-bar">
            <div
              className="evcard-quota-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="evcard-quota-text">
            {quotaUsed} / {quotaTotal} peserta
          </div>
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
