-- Migration: Add created_via to invoices table to track creation channel
-- Prepared for WhatsApp Starter limit (3 invoices / month)
-- NOTE: Prepared WITHOUT applying (aucun db push).
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS created_via text NOT NULL DEFAULT 'web'
CHECK (created_via IN ('web', 'whatsapp', 'api'));

CREATE INDEX IF NOT EXISTS idx_invoices_created_via_month 
ON invoices (company_id, created_via, created_at);

COMMENT ON COLUMN invoices.created_via IS 'Canal de création de la facture : web, whatsapp ou api';
