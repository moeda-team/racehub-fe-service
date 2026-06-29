interface LineItem {
  label: string;
  value: string;
  /** When set, shown struck-through before value (e.g. original price before waiver). */
  original?: string;
}

interface PaymentBreakdownProps {
  /** Short subtitle shown on the right of the dark header, e.g. "10K · Reguler" */
  subtitle?: string;
  method?: string;
  methodOptions?: { value: string; label: string }[];
  onMethodChange?: (method: string) => void;
  lines: LineItem[];
  total: string;
  className?: string;
}

export default function PaymentBreakdown({
  subtitle,
  method,
  methodOptions,
  onMethodChange,
  lines,
  total,
  className = "",
}: PaymentBreakdownProps) {
  return (
    <div className={`pay ${className}`}>
      <div className="pay-ph">
        <div className="pay-ph-title">Rincian Pembayaran</div>
        {subtitle && <div className="pay-ph-sub">{subtitle}</div>}
      </div>

      {methodOptions && methodOptions.length > 0 && (
        <div className="pay-methods">
          {methodOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`pay-mbtn${method === opt.value ? " on" : ""}`}
              onClick={() => onMethodChange?.(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="pay-lines">
        {lines.map((line, i) => (
          <div key={i} className="pay-pln">
            <span className="pay-pln-l">{line.label}</span>
            <span className="pay-pln-v" style={{ display: "flex", gap: 6, alignItems: "baseline", justifyContent: "flex-end" }}>
              {line.original && (
                <span style={{ textDecoration: "line-through", opacity: 0.45, fontSize: "0.9em" }}>{line.original}</span>
              )}
              {line.value}
            </span>
          </div>
        ))}
      </div>

      <div className="pay-total">
        <span className="pay-total-l">Sub Total</span>
        <span className="pay-total-v">{total}</span>
      </div>
    </div>
  );
}
