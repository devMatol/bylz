-- Migration: Add postal_code & city to companies and clients, and vat_rate to invoice_lines
-- Note: vat_rate est créé nullable sans DEFAULT 0.00 pour permettre une déduction exacte lors du backfill.

-- 1. Companies: postal_code and city
ALTER TABLE companies ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city text;

-- 2. Clients: postal_code and city
ALTER TABLE clients ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city text;

-- 3. Invoice lines: vat_rate per line (nullable sans défaut initial)
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2);
