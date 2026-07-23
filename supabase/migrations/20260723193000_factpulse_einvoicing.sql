-- Migration for FactPulse E-Invoicing & E-Reporting Layer

-- 1. FactPulse Token & Service Status Table
CREATE TABLE IF NOT EXISTS factpulse_status (
  id text PRIMARY KEY DEFAULT 'default',
  token_valid boolean NOT NULL DEFAULT true,
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  last_error text
);

-- Initialize default status row
INSERT INTO factpulse_status (id, token_valid, last_checked_at)
VALUES ('default', true, now())
ON CONFLICT (id) DO NOTHING;

-- 2. Update Invoices table with FactPulse ref and User Transmission Choice
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS factpulse_ref text DEFAULT NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pa_submission_choice boolean NOT NULL DEFAULT true;

-- 3. PA Submission Errors Log
CREATE TABLE IF NOT EXISTS pa_submission_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  error text NOT NULL,
  error_code text,
  retried_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. PA Webhook Events Log
CREATE TABLE IF NOT EXISTS pa_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);

-- 5. E-Reporting Batches (B2C)
CREATE TABLE IF NOT EXISTS ereporting_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period text NOT NULL,
  nature text NOT NULL DEFAULT 'services',
  count integer NOT NULL DEFAULT 0,
  amount_ttc numeric(12,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'pending',
  factpulse_ref text,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Enable RLS on new tables
ALTER TABLE factpulse_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE pa_submission_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pa_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereporting_batches ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "Admins can read factpulse_status" ON factpulse_status FOR SELECT USING (true);
CREATE POLICY "Admins can manage factpulse_status" ON factpulse_status FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

CREATE POLICY "Users can read own pa_submission_errors" ON pa_submission_errors FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM invoices
    JOIN companies ON companies.id = invoices.company_id
    WHERE invoices.id = pa_submission_errors.invoice_id
    AND companies.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own ereporting_batches" ON ereporting_batches FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = ereporting_batches.company_id
    AND companies.user_id = auth.uid()
  )
);
