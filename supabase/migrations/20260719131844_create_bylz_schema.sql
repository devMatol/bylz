/*
# Bylz — Full SaaS invoicing schema for auto-entrepreneurs

1. Overview
This migration creates the complete database foundation for Bylz, a French SaaS
invoicing application for auto-entrepreneurs. It defines all enums, tables, and
row-level security policies needed for the application.

2. Enums
- plan_type: subscription plans (starter, solo, pro)
- activity_type: business activity classification (freelance_bnc, artisan_bic, commerce, liberal)
- vat_regime: VAT regime (franchise, vat)
- urssaf_freq: URSSAF declaration frequency (monthly, quarterly)
- client_type: client classification (b2b, b2c)
- item_nature: catalog item nature (goods, service)
- quote_status: quote lifecycle (draft, sent, accepted, refused)
- invoice_status: invoice lifecycle (draft, pending, late, paid, rejected)
- invoice_type: invoice or credit note
- pa_status: public accountant / factur-x status (none, submitted, delivered, received, accepted, rejected)
- payment_method: transfer, stripe, cash, check
- payment_source: manual or stripe_webhook
- ereporting_status: e-reporting lifecycle (pending, submitted, confirmed, error)
- payment_terms: on_receipt, 30d, 60d
- ticket_category: bug, question, billing, feature
- ticket_priority: high, normal, low
- ticket_status: open, in_progress, resolved

3. Tables
- profiles: user profile linked to auth.users, plan, stripe info, admin flag
- companies: auto-entrepreneur company info (SIRET, NAF, activity type, VAT regime, URSSAF freq)
- clients: client directory (B2B/B2C, SIRET, VAT number)
- catalog_items: reusable priced items (goods or service)
- quotes: quotes with totals, status, validity, payment terms
- quote_lines: line items on a quote
- invoices: invoices with totals, status, PA status, payment info, e-reporting status
- invoice_lines: line items on an invoice
- payments: payment records linked to invoices
- ereporting_batches: e-reporting batch submissions
- urssaf_declarations: URSSAF declaration records per period
- support_tickets: user support tickets
- ticket_messages: messages on support tickets
- audit_logs: admin action audit trail

4. Security (RLS)
- RLS enabled on every table.
- profiles: owner can access their own row (id = auth.uid()).
- companies: owner can access companies where user_id = auth.uid().
- All child tables scoped through company ownership chain.
- support_tickets + ticket_messages: owner-scoped via user_id.
- audit_logs: RLS enabled (admin access managed separately).

5. Important Notes
- All tables use gen_random_uuid() for primary keys.
- Foreign keys cascade on delete where appropriate.
- Unique constraints on (company_id, number) for quotes and invoices.
- Check constraints enforce business rules (e.g. B2B clients require SIREN, positive prices/quantities).
*/

-- ENUMS
DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('starter','solo','pro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM ('freelance_bnc','artisan_bic','commerce','liberal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vat_regime AS ENUM ('franchise','vat');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE urssaf_freq AS ENUM ('monthly','quarterly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_type AS ENUM ('b2b','b2c');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE item_nature AS ENUM ('goods','service');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE quote_status AS ENUM ('draft','sent','accepted','refused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft','pending','late','paid','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_type AS ENUM ('invoice','credit_note');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pa_status AS ENUM ('none','submitted','delivered','received','accepted','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('transfer','stripe','cash','check');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_source AS ENUM ('manual','stripe_webhook');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ereporting_status AS ENUM ('pending','submitted','confirmed','error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_terms AS ENUM ('on_receipt','30d','60d');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_category AS ENUM ('bug','question','billing','feature');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM ('high','normal','low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open','in_progress','resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TABLES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  plan plan_type not null default 'starter',
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  accountant_email text,
  tmi numeric(4,3),
  is_admin boolean not null default false,
  suspended_at timestamptz,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  siret char(14) unique not null,
  siren char(9) not null,
  legal_name text not null,
  commercial_name text,
  address text not null,
  naf_code text,
  activity_type activity_type not null,
  vat_regime vat_regime not null default 'franchise',
  urssaf_frequency urssaf_freq not null default 'quarterly',
  logo_url text,
  accent_color text not null default '#7C6FE0',
  invoice_footer text,
  default_payment_terms payment_terms not null default '30d',
  stripe_connect_account_id text,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  type client_type not null,
  siren char(9),
  siret char(14),
  vat_number text,
  email text,
  address text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  constraint b2b_requires_siren check (type = 'b2c' or siren is not null)
);

CREATE TABLE IF NOT EXISTS catalog_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  description text not null,
  unit_price numeric(12,2) not null check (unit_price > 0),
  nature item_nature not null,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid not null references clients(id),
  number text not null,
  status quote_status not null default 'draft',
  issue_date date not null default current_date,
  validity_date date,
  payment_terms payment_terms not null default '30d',
  note text,
  total_ht numeric(12,2) not null default 0,
  total_vat numeric(12,2) not null default 0,
  total_ttc numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

CREATE TABLE IF NOT EXISTS quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  catalog_item_id uuid references catalog_items(id),
  description text not null,
  quantity numeric(10,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  nature item_nature not null,
  position int not null default 0
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid not null references clients(id),
  quote_id uuid references quotes(id),
  number text not null,
  type invoice_type not null default 'invoice',
  status invoice_status not null default 'draft',
  pa_status pa_status not null default 'none',
  pa_rejection_reason text,
  issue_date date not null default current_date,
  due_date date not null,
  payment_terms payment_terms not null default '30d',
  total_ht numeric(12,2) not null default 0,
  total_vat numeric(12,2) not null default 0,
  total_ttc numeric(12,2) not null default 0,
  paid_at timestamptz,
  paid_amount numeric(12,2),
  payment_method payment_method,
  stripe_payment_link text,
  facturx_pdf_url text,
  ereporting_status ereporting_status,
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  catalog_item_id uuid references catalog_items(id),
  description text not null,
  quantity numeric(10,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  nature item_nature not null,
  position int not null default 0
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method payment_method not null,
  paid_at timestamptz not null default now(),
  source payment_source not null default 'manual'
);

CREATE TABLE IF NOT EXISTS ereporting_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  total_ht numeric(12,2) not null,
  total_vat numeric(12,2) not null,
  transaction_count int not null,
  nature item_nature not null,
  status ereporting_status not null default 'pending',
  factpulse_ref text,
  retry_count int not null default 0,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS urssaf_declarations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  revenue numeric(12,2) not null default 0,
  estimated_amount numeric(12,2) not null default 0,
  due_date date not null,
  declared_at timestamptz,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  subject text not null,
  category ticket_category not null,
  priority ticket_priority not null default 'normal',
  status ticket_status not null default 'open',
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references profiles(id),
  action text not null,
  target_user_id uuid references profiles(id),
  details jsonb,
  created_at timestamptz not null default now()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ereporting_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE urssaf_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES (idempotent: drop first, then create)
DROP POLICY IF EXISTS "own profile" ON profiles;
CREATE POLICY "own profile" ON profiles FOR ALL USING (id = auth.uid());

DROP POLICY IF EXISTS "own companies" ON companies;
CREATE POLICY "own companies" ON companies FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "own clients" ON clients;
CREATE POLICY "own clients" ON clients FOR ALL USING (company_id in (select id from companies where user_id = auth.uid()));

DROP POLICY IF EXISTS "own catalog" ON catalog_items;
CREATE POLICY "own catalog" ON catalog_items FOR ALL USING (company_id in (select id from companies where user_id = auth.uid()));

DROP POLICY IF EXISTS "own quotes" ON quotes;
CREATE POLICY "own quotes" ON quotes FOR ALL USING (company_id in (select id from companies where user_id = auth.uid()));

DROP POLICY IF EXISTS "own quote_lines" ON quote_lines;
CREATE POLICY "own quote_lines" ON quote_lines FOR ALL USING (quote_id in (select id from quotes where company_id in (select id from companies where user_id = auth.uid())));

DROP POLICY IF EXISTS "own invoices" ON invoices;
CREATE POLICY "own invoices" ON invoices FOR ALL USING (company_id in (select id from companies where user_id = auth.uid()));

DROP POLICY IF EXISTS "own invoice_lines" ON invoice_lines;
CREATE POLICY "own invoice_lines" ON invoice_lines FOR ALL USING (invoice_id in (select id from invoices where company_id in (select id from companies where user_id = auth.uid())));

DROP POLICY IF EXISTS "own payments" ON payments;
CREATE POLICY "own payments" ON payments FOR ALL USING (invoice_id in (select id from invoices where company_id in (select id from companies where user_id = auth.uid())));

DROP POLICY IF EXISTS "own ereporting" ON ereporting_batches;
CREATE POLICY "own ereporting" ON ereporting_batches FOR ALL USING (company_id in (select id from companies where user_id = auth.uid()));

DROP POLICY IF EXISTS "own urssaf" ON urssaf_declarations;
CREATE POLICY "own urssaf" ON urssaf_declarations FOR ALL USING (company_id in (select id from companies where user_id = auth.uid()));

DROP POLICY IF EXISTS "own tickets" ON support_tickets;
CREATE POLICY "own tickets" ON support_tickets FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "own ticket messages" ON ticket_messages;
CREATE POLICY "own ticket messages" ON ticket_messages FOR SELECT USING (ticket_id in (select id from support_tickets where user_id = auth.uid()));
