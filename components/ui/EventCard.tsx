import Pill from "./Pill";

interface EventCardProps {
  title: string;
  location: string;
  date: string;
  distances: string[];
  price: string;
  quotaRemaining?: number;
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
  href,
  className = "",
}: EventCardProps) {
  const content = (
    <>
      <div className="evcard-top">
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
              <div className="evcard-quota-text">{quotaRemaining} slot tersisa</div>
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
