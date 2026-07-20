-- ENUMS
create type plan_type as enum ('starter','solo','pro');
create type activity_type as enum ('freelance_bnc','artisan_bic','commerce','liberal');
create type vat_regime as enum ('franchise','vat');
create type urssaf_freq as enum ('monthly','quarterly');
create type client_type as enum ('b2b','b2c');
create type item_nature as enum ('goods','service');
create type quote_status as enum ('draft','sent','accepted','refused');
create type invoice_status as enum ('draft','pending','late','paid','rejected');
create type invoice_type as enum ('invoice','credit_note');
create type pa_status as enum ('none','submitted','delivered','received','accepted','rejected');
create type payment_method as enum ('transfer','stripe','cash','check');
create type payment_source as enum ('manual','stripe_webhook');
create type ereporting_status as enum ('pending','submitted','confirmed','error');
create type payment_terms as enum ('on_receipt','30d','60d');
create type ticket_category as enum ('bug','question','billing','feature');
create type ticket_priority as enum ('high','normal','low');
create type ticket_status as enum ('open','in_progress','resolved');

-- TABLES
create table profiles (
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

create table companies (
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

create table clients (
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

create table catalog_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  description text not null,
  unit_price numeric(12,2) not null check (unit_price > 0),
  nature item_nature not null,
  created_at timestamptz not null default now()
);

create table quotes (
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

create table quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  catalog_item_id uuid references catalog_items(id),
  description text not null,
  quantity numeric(10,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  nature item_nature not null,
  position int not null default 0
);

create table invoices (
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

create table invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  catalog_item_id uuid references catalog_items(id),
  description text not null,
  quantity numeric(10,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  nature item_nature not null,
  position int not null default 0
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method payment_method not null,
  paid_at timestamptz not null default now(),
  source payment_source not null default 'manual'
);

create table ereporting_batches (
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

create table urssaf_declarations (
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

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  subject text not null,
  category ticket_category not null,
  priority ticket_priority not null default 'normal',
  status ticket_status not null default 'open',
  created_at timestamptz not null default now()
);

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references profiles(id),
  action text not null,
  target_user_id uuid references profiles(id),
  details jsonb,
  created_at timestamptz not null default now()
);

-- RLS
alter table profiles enable row level security;
alter table companies enable row level security;
alter table clients enable row level security;
alter table catalog_items enable row level security;
alter table quotes enable row level security;
alter table quote_lines enable row level security;
alter table invoices enable row level security;
alter table invoice_lines enable row level security;
alter table payments enable row level security;
alter table ereporting_batches enable row level security;
alter table urssaf_declarations enable row level security;
alter table support_tickets enable row level security;
alter table ticket_messages enable row level security;
alter table audit_logs enable row level security;

create policy "own profile" on profiles for all using (id = auth.uid());
create policy "own companies" on companies for all using (user_id = auth.uid());
create policy "own clients" on clients for all using (company_id in (select id from companies where user_id = auth.uid()));
create policy "own catalog" on catalog_items for all using (company_id in (select id from companies where user_id = auth.uid()));
create policy "own quotes" on quotes for all using (company_id in (select id from companies where user_id = auth.uid()));
create policy "own quote_lines" on quote_lines for all using (quote_id in (select id from quotes where company_id in (select id from companies where user_id = auth.uid())));
create policy "own invoices" on invoices for all using (company_id in (select id from companies where user_id = auth.uid()));
create policy "own invoice_lines" on invoice_lines for all using (invoice_id in (select id from invoices where company_id in (select id from companies where user_id = auth.uid())));
create policy "own payments" on payments for all using (invoice_id in (select id from invoices where company_id in (select id from companies where user_id = auth.uid())));
create policy "own ereporting" on ereporting_batches for all using (company_id in (select id from companies where user_id = auth.uid()));
create policy "own urssaf" on urssaf_declarations for all using (company_id in (select id from companies where user_id = auth.uid()));
create policy "own tickets" on support_tickets for all using (user_id = auth.uid());
create policy "own ticket messages" on ticket_messages for select using (ticket_id in (select id from support_tickets where user_id = auth.uid()));
