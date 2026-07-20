-- Add column linking a credit note to its source invoice
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS credited_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Index for quick lookup of credit notes linked to an invoice
CREATE INDEX IF NOT EXISTS idx_invoices_credited_invoice_id
  ON invoices(credited_invoice_id)
  WHERE credited_invoice_id IS NOT NULL;
