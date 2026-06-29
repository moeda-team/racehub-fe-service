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
  id: string;
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
  id: string;
  organizer_id: string;
  name: string;
  description: string;
  location: string;
  event_date: string;
  status: EventStatus;
  is_running_event: boolean;
  master_age_threshold: number;
  refund_cutoff_date: string | null;
  registration_close_date: string | null;
  donation_enabled: boolean;
  refund_donation_on_cancel: boolean;
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
  id: string;
  name: string;
  description: string;
  location: string;
  event_date: string | null;
  status: "published";
  is_running_event: boolean;
  master_age_threshold: number;
  refund_cutoff_date: string | null;
  donation_enabled: boolean;
  quota_remaining: number;
  min_price: number;
}

export interface PublicDistance {
  id: string;
  name: string;
  quota: number;
  quota_remaining: number;
}

export interface PublicTicket {
  id: string;
  distance_category_id: string;
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
  event_id: string;
  ticket_category_id: string;
  distance_category_id: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string; // YYYY-MM-DD (required)
  gender: string;
  donation?: number;
}

export interface Registration {
  id: string;
  registration_number: string;
  event_id: string;
  ticket_category_id: string;
  distance_category_id: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  age_class: "" | "Open" | "Master";
  donation: number;
  status: RegistrationStatus;
  is_complimentary?: boolean;
}

export interface ComplimentaryPerson {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone: string;
  note: string;
  created_at: string;
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
  registration_close_date?: string;
  donation_enabled?: boolean;
}

export interface UpdateEventRequest {
  name: string;
  description?: string;
  location?: string;
  event_date?: string;
  is_running_event?: boolean;
  master_age_threshold?: number;
  refund_cutoff_date?: string;
  registration_close_date?: string;
  donation_enabled?: boolean;
}

export interface EventListResponse {
  data: Event[];
}

export interface StatusTransitionRequest {
  status: EventStatus;
}

// === Distance Category ===

export interface DistanceCategory {
  id: string;
  event_id: string;
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
  id: string;
  event_id: string;
  distance_category_id: string;
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
  distance_category_id: string;
  sale_start?: string;
  sale_end?: string;
}

export interface UpdateTicketRequest {
  name: string;
  price: number;
  quota: number;
  distance_category_id: string;
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
  registration_id: string;
  payment_method: string;
}

export interface PaymentQuoteResponse {
  registration_id: string;
  price: number;
  donation: number;
  fee_platform: number;
  fee_midtrans: number;
  sub_total: number;
  payment_method: string;
  payment_method_label: string;
  original_price?: number;
  original_fee_platform?: number;
}

export type PaymentMethod = "va_bca" | "va_bni" | "va_bri" | "va_mandiri" | "va_permata" | "gopay" | "card" | "qris";

export interface PaymentChargeRequest {
  registration_id: string;
  payment_method: PaymentMethod;
}

export interface PaymentChargeResponse {
  registration_id: string;
  transaction_id: string;
  status: string;
  va_number?: string;
  biller_code?: string;
  bill_key?: string;
  qr_string?: string;
  deeplink_url?: string;
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
  event_id: string;
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
  total_collected: number;
  total_withdrawn: number;
}

export interface WithdrawRequest {
  amount: number;
  bank_account?: string;
}

export type WalletEntryType = "credit" | "refund" | "withdraw";

export interface LedgerEntry {
  id: string;
  amount: number;
  type: WalletEntryType;
  reference_id: string;
  description: string;
  created_at: string;
}

export interface DonationReport {
  event_id: string;
  ticket_revenue: number;
  donation_total: number;
}

export interface DonationLedgerEntry {
  id: string;
  event_id: string;
  amount: number;
  reference_id: string;
  description: string;
  created_at: string;
}

// PlatformRevenue is now PlatformWalletBalance — kept for backward compat with admin/platform page.
export interface PlatformRevenue {
  balance: number;
  total_collected: number;
  total_withdrawn: number;
}

export interface DonationWalletBalance {
  balance: number;
  total_collected: number;
  total_withdrawn: number;
}

export interface PlatformWalletBalance {
  balance: number;
  total_collected: number;
  total_withdrawn: number;
}

// === Refund (F9) ===

export type RefundStatus = "processing" | "completed" | "rejected";

export type RefundMode = "auto" | "manual";

export interface RefundRequest {
  reason?: string;
  bank_account?: string;
}

export interface Refund {
  id: string;
  registration_id: string;
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
  event_id: string;
  refunded: number;
  failed: number;
  results: Refund[];
  errors?: string[];
}

// === Admin (paginated listings) ===

export interface RegistrationSummary {
  id: string;
  registration_number: string;
  name: string;
  gender: string;
  age_class: "" | "Open" | "Master";
  donation: number;
  status: RegistrationStatus;
  bib_number: string;
  rpc_status: string;
  raceday_status: string;
  created_at: string;
}

export interface AdminEventPage {
  events: Event[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AdminRegistrationPage {
  registrations: RegistrationSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// === BIB / Check-in / Reporting (F6/F11/F12/F13) ===

export interface BibResult {
  generated: number;
}

export type CheckinStage = "rpc" | "raceday";

export interface CheckinParticipant {
  id: string;
  registration_number: string;
  bib_number: string;
  name: string;
  gender: string;
  age_class: "" | "Open" | "Master";
  distance_category_id: string;
  rpc_status: string; // "" | "collected"
  raceday_status: string; // "" | "checked_in"
}

export interface ScanRequest {
  qr_token: string;
  stage: CheckinStage;
}

export interface CheckinRequest {
  registration_id: string;
  stage: CheckinStage;
}

export interface EventDashboard {
  event_id: string;
  event_name: string;
  status: string;
  paid_count: number;
  ticket_revenue: number;
  donation_total: number;
  wallet_balance: number;
}

export interface RecapRow {
  distance_id: string;
  distance_name: string;
  gender: string;
  age_class: "" | "Open" | "Master";
  total: number;
}

export interface ParticipantRow {
  id: string;
  registration_number: string;
  bib_number: string;
  name: string;
  gender: string;
  age_class: "" | "Open" | "Master";
  status: RegistrationStatus;
  rpc_status: string;
  raceday_status: string;
  distance_name: string;
  ticket_name: string;
}

// === API Response Wrappers ===

export interface ApiResponse<T> {
  data: T;
}

export interface ApiMessageResponse {
  message: string;
}
