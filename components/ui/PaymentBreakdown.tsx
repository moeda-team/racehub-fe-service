interface LineItem {
  label: string;
  value: string;
}

interface PaymentBreakdownProps {
  method?: string;
  methodOptions?: { value: string; label: string }[];
  onMethodChange?: (method: string) => void;
  lines: LineItem[];
  total: string;
  className?: string;
}

export default function PaymentBreakdown({
  method,
  methodOptions,
  onMethodChange,
  lines,
  total,
  className = "",
}: PaymentBreakdownProps) {
  return (
    <div className={`pay ${className}`}>
      <div className="pay-title">Rincian Pembayaran</div>

      {methodOptions && methodOptions.length > 0 && (
        <div className="pay-method">
          <label htmlFor="pay-method" style={{ fontSize: 14, fontWeight: 500, color: "var(--color-ink-2)", marginBottom: 6, display: "block" }}>
            Metode Pembayaran
          </label>
          <select
            id="pay-method"
            className="field-input"
            value={method ?? ""}
            onChange={(e) => onMethodChange?.(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">Pilih metode...</option>
            {methodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {lines.map((line, i) => (
        <div key={i} className="pay-line">
          <span className="pay-line-lab">{line.label}</span>
          <span className="pay-line-val">{line.value}</span>
        </div>
      ))}

      <div className="pay-line pay-total">
        <span className="pay-line-lab">Sub Total</span>
        <span className="pay-line-val">{total}</span>
      </div>
    </div>
  );
}
