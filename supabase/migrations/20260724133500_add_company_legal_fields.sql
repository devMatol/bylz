-- Add legal fields for SAS, SASU, SARL, EURL, SA, EI companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_form text DEFAULT 'micro';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS share_capital numeric(12,2) DEFAULT NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS rcs_city text DEFAULT NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS vat_number text DEFAULT NULL;
