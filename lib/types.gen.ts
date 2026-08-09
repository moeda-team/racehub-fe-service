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

export type EventType =
  "running" | "concert" | "seminar" | "workshop" | "cycling" | "custom";

export interface Event {
  id: string;
  organizer_id: string;
  name: string;
  description: string;
  location: string;
  event_date: string;
  status: EventStatus;
  event_type: string;
  master_age_threshold: number;
  refund_cutoff_date: string | null;
  registration_close_date: string | null;
  donation_enabled: boolean;
  refund_donation_on_cancel: boolean;
  banner_url: string | null;
  color: string;
  submitted_for_review: boolean;
  rejection_reason: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventDetail {
  event: Event;
  categories: Category[];
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
  event_type: string;
  master_age_threshold: number;
  refund_cutoff_date: string | null;
  donation_enabled: boolean;
  banner_url: string | null;
  color: string;
  quota_remaining: number;
  min_price: number;
}

export interface PublicCategory {
  id: string;
  name: string;
  quota: number;
  quota_remaining: number;
}

export interface PublicTicket {
  id: string;
  category_id: string;
  name: string;
  price: number;
  quota: number;
  quota_remaining: number;
  sale_start: string | null;
  sale_end: string | null;
}

export interface PublicEventDetail {
  event: PublicEvent;
  categories: PublicCategory[];
  ticket_categories: PublicTicket[];
  registration_fields: RegistrationField[];
}

export interface RegistrationField {
  id: string;
  event_id: string;
  name: string;
  label: string;
  field_type: string;
  options: string;
  placeholder: string;
  required: boolean;
  sort_order: number;
}

export interface UpsertRegistrationFieldRequest {
  id?: string;
  name: string;
  label: string;
  field_type: string;
  options?: string;
  placeholder?: string;
  required?: boolean;
  sort_order?: number;
}

export interface RejectEventRequest {
  reason: string;
}

// === Registration (F4) ===

export interface CreateRegistrationRequest {
  event_id: string;
  ticket_category_id: string;
  category_id: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string; // YYYY-MM-DD (required)
  gender: string;
  donation?: number;
  extra_data?: Record<string, string>;
}

export interface Registration {
  id: string;
  registration_number: string;
  event_id: string;
  ticket_category_id: string;
  category_id: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  age_class: "" | "Open" | "Master";
  donation: number;
  status: RegistrationStatus;
  is_complimentary?: boolean;
  extra_data?: Record<string, string>;
  qr_token?: string; // only present when status=paid
  pending_payment?: PaymentChargeResponse;
  payment_paid_at?: string;
  payment_expires_at?: string;
}

export interface StandaloneDonation {
  id: string;
  event_id: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  method: PaymentMethod;
  transaction_id: string;
  status: "pending" | "paid" | "expired" | "cancelled";
  expires_at?: string;
  va_number?: string;
  biller_code?: string;
  bill_key?: string;
  qr_string?: string;
  deeplink_url?: string;
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
  event_type?: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  location?: string;
  event_date?: string;
  event_type?: string;
  master_age_threshold?: number;
  refund_cutoff_date?: string;
  registration_close_date?: string;
  donation_enabled?: boolean;
  color?: string;
}

export interface UpdateEventRequest {
  name: string;
  description?: string;
  location?: string;
  event_date?: string;
  event_type?: string;
  master_age_threshold?: number;
  refund_cutoff_date?: string;
  registration_close_date?: string;
  donation_enabled?: boolean;
  color?: string;
}

export interface EventListResponse {
  data: Event[];
}

export interface StatusTransitionRequest {
  status: EventStatus;
}

// === Category ===

export interface Category {
  id: string;
  event_id: string;
  name: string;
  quota: number;
  quota_used: number;
  created_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  quota: number;
}

export interface UpdateCategoryRequest {
  name: string;
  quota: number;
}

// === Ticket Category ===

export interface TicketCategory {
  id: string;
  event_id: string;
  category_id: string;
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
  category_id: string;
  sale_start?: string;
  sale_end?: string;
}

export interface UpdateTicketRequest {
  name: string;
  price: number;
  quota: number;
  category_id: string;
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
  fee_midtrans_charged_to_buyer: boolean;
  sub_total: number;
  payment_method: string;
  payment_method_label: string;
  original_price?: number;
  original_fee_platform?: number;
}

export type PaymentMethod =
  | "va_bca"
  | "va_bni"
  | "va_bri"
  | "va_mandiri"
  | "va_permata"
  | "gopay"
  | "card"
  | "qris";

export interface PaymentChargeRequest {
  registration_id: string;
  payment_method: PaymentMethod;
}

export interface PaymentChargeResponse {
  registration_id: string;
  transaction_id: string;
  status: string;
  expires_at?: string;
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
  category_name: string;
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

export type RefundStatus = "requested" | "processing" | "completed" | "rejected";

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
  data: Event[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// === BIB / Check-in / Reporting (F6/F11/F12/F13) ===

export interface BibResult {
  generated: number;
  strategy: BibGenerationStrategy;
}

export type BibGenerationStrategy =
  | "all"
  | "category"
  | "gender"
  | "category_gender";

export interface GenerateBibRequest {
  strategy?: BibGenerationStrategy;
}

export type CheckinStage = "rpc" | "raceday";

export interface CheckinParticipant {
  id: string;
  registration_number: string;
  bib_number: string;
  name: string;
  gender: string;
  age_class: "" | "Open" | "Master";
  category_id: string;
  rpc_status: string; // "" | "collected"
  raceday_status: string; // "" | "checked_in"
}

export interface RPCAccessSession {
  event_id: string;
  event_name: string;
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
  rpc_collected: number;
  rpc_pending: number;
}

export interface RecapRow {
  category_id: string;
  category_name: string;
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
  category_name: string;
  ticket_name: string;
}

// === API Response Wrappers ===

export interface ApiResponse<T> {
  data: T;
}

export interface ApiMessageResponse {
  message: string;
}
