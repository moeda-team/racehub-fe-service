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
  created_at: string;
  updated_at: string;
}

export interface EventDetail {
  event: Event;
  distance_categories: DistanceCategory[];
  ticket_categories: TicketCategory[];
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
  donation_amount: number;
  fee_platform: number;
  fee_midtrans: number;
  sub_total: number;
  payment_method: string;
  payment_method_label: string;
}

// === Refund ===

export type RefundStatus = "requested" | "approved" | "processed" | "completed" | "rejected";

// === API Response Wrappers ===

export interface ApiResponse<T> {
  data: T;
}

export interface ApiMessageResponse {
  message: string;
}
