/**
 * Generated API Types from OpenAPI backend (api/openapi.yaml).
 *
 * Tipe-tipe ini merefleksikan kontrak API RaceHub backend.
 * Semua angka uang adalah integer (int64) dalam Rupiah utuh.
 * JANGAN gunakan float untuk uang.
 */

// === Common ===

export interface HealthResponse {
  status: string;
}

export interface ErrorResponse {
  error: string;
}

// === Organizer ===

export interface OrganizerRegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface OrganizerLoginRequest {
  email: string;
  password: string;
}

export interface OrganizerLoginResponse {
  token: string;
  expires_at: string;
}

export interface OrganizerProfile {
  id: number;
  email: string;
  name: string;
  phone: string;
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string;
}

export interface WalletResponse {
  balance: number;
}

// === Event ===

export type EventStatus = "draft" | "published" | "cancelled" | "finished";

export interface Event {
  id: number;
  organizer_id: number;
  name: string;
  description: string;
  location: string;
  event_date: string;
  status: EventStatus;
  is_running_event: boolean;
  master_age_threshold: number;
  refund_cutoff_date: string | null;
  donation_enabled: boolean;
  total_quota: number;
  total_quota_used: number;
  submitted_for_review: boolean;
  rejection_reason: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventDetail {
  event: Event;
  distance_categories: DistanceCategory[];
  ticket_categories: TicketCategory[];
}

// === Public marketplace projections (with remaining quota, FR-1003) ===

export interface PublicEvent {
  id: number;
  name: string;
  description: string;
  location: string;
  event_date: string | null;
  status: "published";
  is_running_event: boolean;
  master_age_threshold: number;
  refund_cutoff_date: string | null;
  donation_enabled: boolean;
  total_quota: number;
  total_quota_used: number;
  quota_remaining: number;
}

export interface PublicDistance {
  id: number;
  name: string;
  quota: number;
  quota_remaining: number;
}

export interface PublicTicket {
  id: number;
  distance_category_id: number;
  name: string;
  price: number;
  quota: number;
  quota_remaining: number;
  sale_start: string | null;
  sale_end: string | null;
}

export interface PublicEventDetail {
  event: PublicEvent;
  distance_categories: PublicDistance[];
  ticket_categories: PublicTicket[];
}

export interface RejectEventRequest {
  reason: string;
}

// === Registration (F4) ===

export interface CreateRegistrationRequest {
  event_id: number;
  ticket_category_id: number;
  distance_category_id: number;
  name: string;
  email: string;
  phone: string;
  birth_date: string; // YYYY-MM-DD (required)
  gender: string;
  donation?: number;
}

export interface Registration {
  id: number;
  registration_number: string;
  event_id: number;
  ticket_category_id: number;
  distance_category_id: number;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  age_class: "" | "Open" | "Master";
  donation: number;
  status: RegistrationStatus;
}

export interface MarketplaceFilter {
  date_from?: string;
  date_to?: string;
  location?: string;
  is_running_event?: boolean;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  location?: string;
  event_date?: string;
  is_running_event?: boolean;
  master_age_threshold?: number;
  refund_cutoff_date?: string;
  donation_enabled?: boolean;
  total_quota?: number;
}

export interface UpdateEventRequest {
  name: string;
  description?: string;
  location?: string;
  event_date?: string;
  is_running_event?: boolean;
  master_age_threshold?: number;
  refund_cutoff_date?: string;
  donation_enabled?: boolean;
  total_quota?: number;
}

export interface EventListResponse {
  data: Event[];
}

export interface StatusTransitionRequest {
  status: EventStatus;
}

// === Distance Category ===

export interface DistanceCategory {
  id: number;
  event_id: number;
  name: string;
  quota: number;
  quota_used: number;
  created_at: string;
}

export interface CreateDistanceRequest {
  name: string;
  quota: number;
}

export interface UpdateDistanceRequest {
  name: string;
  quota: number;
}

// === Ticket Category ===

export interface TicketCategory {
  id: number;
  event_id: number;
  distance_category_id: number;
  name: string;
  price: number;
  quota: number;
  quota_used: number;
  sale_start: string | null;
  sale_end: string | null;
  created_at: string;
}

export interface CreateTicketRequest {
  name: string;
  price: number;
  quota: number;
  distance_category_id: number;
  sale_start?: string;
  sale_end?: string;
}

export interface UpdateTicketRequest {
  name: string;
  price: number;
  quota: number;
  distance_category_id: number;
  sale_start?: string;
  sale_end?: string;
}

// === Registration ===

export type RegistrationStatus =
  | "pending_payment"
  | "paid"
  | "confirmed"
  | "checked_in"
  | "cancelled"
  | "refunded"
  | "expired";

// === Payment ===

export interface PaymentQuoteRequest {
  registration_id: number;
  payment_method: string;
}

export interface PaymentQuoteResponse {
  registration_id: number;
  price: number;
  donation: number;
  fee_platform: number;
  fee_midtrans: number;
  sub_total: number;
  payment_method: string;
  payment_method_label: string;
}

export type PaymentMethod = "va" | "gopay" | "card" | "qris";

export interface PaymentChargeRequest {
  registration_id: number;
  payment_method: PaymentMethod;
}

export interface PaymentChargeResponse {
  registration_id: number;
  transaction_id: string;
  status: string;
  va_number?: string;
  qr_string?: string;
  quote: PaymentQuoteResponse;
}

export interface NotificationResult {
  transaction_id: string;
  status: string;
  already_processed: boolean;
}

// === E-ticket / Invoice (F7, FR-705) ===

export interface InvoiceBreakdown {
  method: string;
  payment_method_label: string;
  price: number;
  donation: number;
  fee_platform: number;
  fee_midtrans: number;
  sub_total: number;
  status: string;
}

export interface ETicket {
  registration_number: string;
  participant_name: string;
  event_id: number;
  event_name: string;
  distance_name: string;
  gender: string;
  age_class: "" | "Open" | "Master";
  qr_token: string;
  issued_at: string;
  registration_status: string;
  invoice?: InvoiceBreakdown;
}

// === Wallet (F8) ===

export interface WalletBalance {
  balance: number;
}

export interface WithdrawRequest {
  amount: number;
}

export type WalletEntryType = "credit" | "refund" | "withdraw";

export interface LedgerEntry {
  id: number;
  amount: number;
  type: WalletEntryType;
  reference_id: string;
  description: string;
  created_at: string;
}

export interface DonationReport {
  event_id: number;
  ticket_revenue: number;
  donation_total: number;
}

// === Refund (F9) ===

export type RefundStatus = "processing" | "completed" | "rejected";

export type RefundMode = "auto" | "manual";

export interface RefundRequest {
  reason?: string;
  bank_account?: string;
}

export interface Refund {
  id: number;
  registration_id: number;
  amount: number;
  fee_midtrans: number;
  donation: number;
  method: string;
  mode: RefundMode;
  bank_account?: string;
  status: RefundStatus;
  reason?: string;
  donation_still_given: boolean;
}

export interface MassRefundResult {
  event_id: number;
  refunded: number;
  failed: number;
  results: Refund[];
  errors?: string[];
}

// === API Response Wrappers ===

export interface ApiResponse<T> {
  data: T;
}

export interface ApiMessageResponse {
  message: string;
}
