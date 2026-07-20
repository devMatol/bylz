/*
# Create invoice_reminders table

1. New Tables
- `invoice_reminders`
  - `id` (uuid, primary key)
  - `invoice_id` (uuid, references invoices, on delete cascade)
  - `sent_at` (timestamptz, default now())
  - `days_late` (int, days between due_date and sent_at; 0 if not yet due)
2. Security
- Enable RLS on `invoice_reminders`.
- Owner-scoped CRUD via the parent invoice's company ownership.
3. Notes
- Tracks manual payment reminders sent to clients for each invoice.
- Used to display reminder history ("Relancé le 12 juillet — 1ère relance") on the invoice detail page.
*/

CREATE TABLE IF NOT EXISTS invoice_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  days_late int NOT NULL DEFAULT 0
);

ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_invoice_reminders" ON invoice_reminders;
CREATE POLICY "select_own_invoice_reminders" ON invoice_reminders FOR SELECT
  TO authenticated USING (
    invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "insert_own_invoice_reminders" ON invoice_reminders;
CREATE POLICY "insert_own_invoice_reminders" ON invoice_reminders FOR INSERT
  TO authenticated WITH CHECK (
    invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "update_own_invoice_reminders" ON invoice_reminders;
CREATE POLICY "update_own_invoice_reminders" ON invoice_reminders FOR UPDATE
  TO authenticated USING (
    invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  ) WITH CHECK (
    invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "delete_own_invoice_reminders" ON invoice_reminders;
CREATE POLICY "delete_own_invoice_reminders" ON invoice_reminders FOR DELETE
  TO authenticated USING (
    invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  );
