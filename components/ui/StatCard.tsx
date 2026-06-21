interface StatCardProps {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "flat" };
  accent?: boolean;
  className?: string;
}

export default function StatCard({
  label,
  value,
  delta,
  accent = false,
  className = "",
}: StatCardProps) {
  return (
    <div className={`stat ${accent ? "stat-accent" : ""} ${className}`}>
      <div className="stat-lab">{label}</div>
      <div className="stat-val">{value}</div>
      {delta && (
        <div
          className={`stat-delta ${
            delta.direction === "up" ? "stat-delta-up" : "stat-delta-flat"
          }`}
        >
          {delta.direction === "up" ? "+" : ""}
          {delta.value}
        </div>
      )}
    </div>
  );
}
