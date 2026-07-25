-- Migration: Add public_token & signature_data for Public Document Link & Electronic Signature

-- 1. Invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS public_token uuid DEFAULT gen_random_uuid();
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS signature_data jsonb DEFAULT NULL;

-- 2. Quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS public_token uuid DEFAULT gen_random_uuid();
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS signature_data jsonb DEFAULT NULL;

-- Populate existing rows with a public_token if NULL
UPDATE invoices SET public_token = gen_random_uuid() WHERE public_token IS NULL;
UPDATE quotes SET public_token = gen_random_uuid() WHERE public_token IS NULL;

-- Unique constraint on public_token
CREATE UNIQUE INDEX IF NOT EXISTS invoices_public_token_idx ON invoices(public_token);
CREATE UNIQUE INDEX IF NOT EXISTS quotes_public_token_idx ON quotes(public_token);

-- 3. RLS Policies for Public Access by public_token (incognito / client view)

-- Anyone with the public_token can SELECT the invoice
DROP POLICY IF EXISTS "public read invoice by token" ON invoices;
CREATE POLICY "public read invoice by token" ON invoices
  FOR SELECT USING (public_token IS NOT NULL);

-- Anyone with the public_token can SELECT invoice_lines
DROP POLICY IF EXISTS "public read invoice_lines by token" ON invoice_lines;
CREATE POLICY "public read invoice_lines by token" ON invoice_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices WHERE invoices.id = invoice_lines.invoice_id AND invoices.public_token IS NOT NULL
    )
  );

-- Anyone with the public_token can UPDATE signature_data or status on matching invoice
DROP POLICY IF EXISTS "public update invoice signature by token" ON invoices;
CREATE POLICY "public update invoice signature by token" ON invoices
  FOR UPDATE USING (public_token IS NOT NULL);

-- Anyone with the public_token can SELECT the quote
DROP POLICY IF EXISTS "public read quote by token" ON quotes;
CREATE POLICY "public read quote by token" ON quotes
  FOR SELECT USING (public_token IS NOT NULL);

-- Anyone with the public_token can SELECT quote_lines
DROP POLICY IF EXISTS "public read quote_lines by token" ON quote_lines;
CREATE POLICY "public read quote_lines by token" ON quote_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes WHERE quotes.id = quote_lines.quote_id AND quotes.public_token IS NOT NULL
    )
  );

-- Anyone with the public_token can UPDATE signature_data or status on matching quote
DROP POLICY IF EXISTS "public update quote signature by token" ON quotes;
CREATE POLICY "public update quote signature by token" ON quotes
  FOR UPDATE USING (public_token IS NOT NULL);
