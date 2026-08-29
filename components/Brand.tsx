import Image from "next/image";

type BrandProps = {
  className?: string;
  context?: string;
  size?: "sm" | "md" | "lg";
};

export function Brand({
  className = "",
  context,
  size = "md",
}: BrandProps) {
  return (
    <span
      className={`brand-lockup brand-lockup-${size}${className ? ` ${className}` : ""}`}
    >
      <Image
        src="/lowkeythings-logo.png"
        alt=""
        aria-hidden="true"
        width={2109}
        height={1923}
        className="brand-lockup-logo"
      />
      <span className="brand-lockup-copy">
        <span className="brand-lockup-name">LowkeyThings</span>
        {context && <span className="brand-lockup-context">{context}</span>}
      </span>
    </span>
  );
}
