// Enums as union types matching the SQL schema exactly

export type PlanType = "starter" | "solo" | "pro";
export type ActivityType = "freelance_bnc" | "artisan_bic" | "commerce" | "liberal";
export type VatRegime = "franchise" | "vat";
export type UrssafFreq = "monthly" | "quarterly";
export type ClientType = "b2b" | "b2c";
export type ItemNature = "goods" | "service";
export type QuoteStatus = "draft" | "sent" | "accepted" | "refused";
export type InvoiceStatus = "draft" | "pending" | "late" | "paid" | "rejected";
export type InvoiceType = "invoice" | "credit_note";
export type PaStatus = "none" | "submitted" | "delivered" | "received" | "accepted" | "rejected";
export type PaymentMethod = "transfer" | "stripe" | "cash" | "check";
export type PaymentSource = "manual" | "stripe_webhook";
export type EreportingStatus = "pending" | "submitted" | "confirmed" | "error";
export type PaymentTerms = "on_receipt" | "30d" | "60d";
export type TicketCategory = "bug" | "question" | "billing" | "feature";
export type TicketPriority = "high" | "normal" | "low";
export type TicketStatus = "open" | "in_progress" | "resolved";

export type AdminRole = "super_admin" | "admin" | null;

// Table row interfaces

export interface Profile {
  id: string;
  email: string;
  plan: PlanType;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  trial_used: boolean;
  accountant_email: string | null;
  tmi: number | null;
  is_admin: boolean;
  admin_role: AdminRole;
  suspended_at: string | null;
  created_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  siret: string;
  siren: string;
  legal_name: string;
  commercial_name: string | null;
  address: string;
  naf_code: string | null;
  activity_type: ActivityType;
  vat_regime: VatRegime;
  urssaf_frequency: UrssafFreq;
  logo_url: string | null;
  accent_color: string;
  invoice_footer: string | null;
  default_payment_terms: PaymentTerms;
  stripe_connect_account_id: string | null;
  previous_ca: number;
  created_at: string;
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  type: ClientType;
  siren: string | null;
  siret: string | null;
  vat_number: string | null;
  email: string | null;
  address: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface CatalogItem {
  id: string;
  company_id: string;
  description: string;
  unit_price: number;
  nature: ItemNature;
  created_at: string;
}

export interface Quote {
  id: string;
  company_id: string;
  client_id: string;
  number: string;
  status: QuoteStatus;
  issue_date: string;
  validity_date: string | null;
  payment_terms: PaymentTerms;
  note: string | null;
  total_ht: number;
  total_vat: number;
  total_ttc: number;
  created_at: string;
}

export interface QuoteLine {
  id: string;
  quote_id: string;
  catalog_item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  nature: ItemNature;
  position: number;
}

export interface Invoice {
  id: string;
  company_id: string;
  client_id: string;
  quote_id: string | null;
  credited_invoice_id: string | null;
  number: string;
  type: InvoiceType;
  status: InvoiceStatus;
  pa_status: PaStatus;
  pa_rejection_reason: string | null;
  factpulse_ref?: string | null;
  pa_submission_choice?: boolean;
  issue_date: string;
  due_date: string;
  payment_terms: PaymentTerms;
  total_ht: number;
  total_vat: number;
  total_ttc: number;
  paid_at: string | null;
  paid_amount: number | null;
  payment_method: PaymentMethod | null;
  stripe_payment_link: string | null;
  facturx_pdf_url: string | null;
  ereporting_status: EreportingStatus | null;
  note: string | null;
  created_at: string;
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  catalog_item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  nature: ItemNature;
  position: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  source: PaymentSource;
}

export interface EreportingBatch {
  id: string;
  company_id: string;
  period_start: string;
  period_end: string;
  total_ht: number;
  total_vat: number;
  transaction_count: number;
  nature: ItemNature;
  status: EreportingStatus;
  factpulse_ref: string | null;
  retry_count: number;
  submitted_at: string | null;
  created_at: string;
}

export interface UrssafDeclaration {
  id: string;
  company_id: string;
  period_start: string;
  period_end: string;
  revenue: number;
  estimated_amount: number;
  due_date: string;
  declared_at: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface InvoiceReminder {
  id: string;
  invoice_id: string;
  sent_at: string;
  days_late: number;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Plan {
  id: string;
  key: PlanType;
  name: string;
  price_cents: number;
  stripe_price_id: string | null;
  features: Record<string, boolean>;
  invoice_limit: number | null;
  client_limit: number | null;
  is_active: boolean;
  updated_at: string;
}

export interface AdminImpersonationSession {
  id: string;
  admin_id: string;
  target_user_id: string;
  started_at: string;
  ended_at: string | null;
  expires_at: string;
}

export interface FactpulseStatus {
  id: string;
  access_token?: string | null;
  token_valid: boolean;
  last_checked_at: string;
  last_error: string | null;
}

export interface PaSubmissionError {
  id: string;
  invoice_id: string;
  error: string;
  error_code: string | null;
  retried_at: string | null;
  created_at: string;
}

export interface PaWebhookEvent {
  id: string;
  event_id: string | null;
  invoice_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  received_at: string;
}

