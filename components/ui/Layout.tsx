import { HTMLAttributes, ReactNode } from "react";

export function Container({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`lk-container ${className}`} {...props} />;
}

export function Section({
  compact = false,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & { compact?: boolean }) {
  return (
    <section
      className={`lk-section${compact ? " lk-section-compact" : ""} ${className}`}
      {...props}
    />
  );
}

export function Eyebrow({
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`lk-eyebrow ${className}`} {...props} />;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`lk-section-header ${className}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2>{title}</h2>
      {description && <p className="lk-section-description">{description}</p>}
    </header>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="lk-page-header">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="lk-page-actions">{actions}</div>}
    </header>
  );
}
