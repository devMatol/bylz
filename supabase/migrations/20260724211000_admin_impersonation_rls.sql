-- Helper function to check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to grant full access to admins for impersonation & support

-- Profiles
DROP POLICY IF EXISTS "own profile" ON profiles;
CREATE POLICY "own profile" ON profiles
  FOR ALL USING (id = auth.uid() OR is_admin());

-- Companies
DROP POLICY IF EXISTS "own companies" ON companies;
CREATE POLICY "own companies" ON companies
  FOR ALL USING (user_id = auth.uid() OR is_admin());

-- Clients
DROP POLICY IF EXISTS "own clients" ON clients;
CREATE POLICY "own clients" ON clients
  FOR ALL USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()) OR is_admin());

-- Catalog Items
DROP POLICY IF EXISTS "own catalog" ON catalog_items;
CREATE POLICY "own catalog" ON catalog_items
  FOR ALL USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()) OR is_admin());

-- Quotes
DROP POLICY IF EXISTS "own quotes" ON quotes;
CREATE POLICY "own quotes" ON quotes
  FOR ALL USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()) OR is_admin());

-- Quote Lines
DROP POLICY IF EXISTS "own quote_lines" ON quote_lines;
CREATE POLICY "own quote_lines" ON quote_lines
  FOR ALL USING (quote_id IN (SELECT id FROM quotes WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())) OR is_admin());

-- Invoices
DROP POLICY IF EXISTS "own invoices" ON invoices;
CREATE POLICY "own invoices" ON invoices
  FOR ALL USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()) OR is_admin());

-- Invoice Lines
DROP POLICY IF EXISTS "own invoice_lines" ON invoice_lines;
CREATE POLICY "own invoice_lines" ON invoice_lines
  FOR ALL USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())) OR is_admin());

-- Payments
DROP POLICY IF EXISTS "own payments" ON payments;
CREATE POLICY "own payments" ON payments
  FOR ALL USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())) OR is_admin());

-- E-reporting Batches
DROP POLICY IF EXISTS "own ereporting" ON ereporting_batches;
CREATE POLICY "own ereporting" ON ereporting_batches
  FOR ALL USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()) OR is_admin());

-- URSSAF Declarations
DROP POLICY IF EXISTS "own urssaf" ON urssaf_declarations;
CREATE POLICY "own urssaf" ON urssaf_declarations
  FOR ALL USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()) OR is_admin());

-- Support Tickets
DROP POLICY IF EXISTS "own tickets" ON support_tickets;
CREATE POLICY "own tickets" ON support_tickets
  FOR ALL USING (user_id = auth.uid() OR is_admin());

-- Ticket Messages
DROP POLICY IF EXISTS "own ticket messages" ON ticket_messages;
CREATE POLICY "own ticket messages" ON ticket_messages
  FOR ALL USING (ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid()) OR is_admin());
