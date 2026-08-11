import type { PaymentMethod } from "@/lib/types.gen";

// Presentation only. Payment fees and final totals always come from the backend.
export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "va_bca", label: "VA BCA" },
  { value: "va_bni", label: "VA BNI" },
  { value: "va_bri", label: "VA BRI" },
  { value: "va_mandiri", label: "VA Mandiri" },
  { value: "va_permata", label: "VA Permata" },
  { value: "gopay", label: "GoPay" },
  { value: "qris", label: "QRIS" },
];

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_OPTIONS.find((item) => item.value === method)?.label ?? method;
}
