-- SQL Migration for Automated Payment Reminders & Bank Synchronization (Bridge API)

-- 1. Enum Types
DO $$ BEGIN
    CREATE TYPE reminder_tone AS ENUM ('friendly', 'firm', 'formal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reminder_source AS ENUM ('manual', 'automatic', 'skipped_no_email');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bank_connection_status AS ENUM ('active', 'error', 'reauth_required');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bank_match_status AS ENUM ('unmatched', 'auto_matched', 'manual_matched', 'ignored');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Companies Column Additions
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS auto_reminders_enabled boolean DEFAULT true;

-- 3. Invoices Column Additions
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS auto_reminders_disabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS next_auto_reminder_at text;

-- 4. Table: reminder_rules
CREATE TABLE IF NOT EXISTS public.reminder_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    enabled boolean NOT NULL DEFAULT true,
    delay_days integer NOT NULL DEFAULT 7,
    tone reminder_tone NOT NULL DEFAULT 'friendly',
    custom_subject text,
    custom_body text,
    created_at timestamptz DEFAULT now()
);

-- 5. Extend invoice_reminders table columns
ALTER TABLE public.invoice_reminders
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS rule_id uuid REFERENCES public.reminder_rules(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tone text,
ADD COLUMN IF NOT EXISTS recipient_email text;

-- 6. Table: bank_connections
CREATE TABLE IF NOT EXISTS public.bank_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    provider_item_id text NOT NULL,
    bank_name text NOT NULL,
    status bank_connection_status NOT NULL DEFAULT 'active',
    connected_at timestamptz DEFAULT now(),
    last_synced_at timestamptz
);

-- 7. Table: bank_transactions
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_connection_id uuid NOT NULL REFERENCES public.bank_connections(id) ON DELETE CASCADE,
    external_id text UNIQUE NOT NULL,
    amount numeric(12, 2) NOT NULL,
    currency text NOT NULL DEFAULT 'EUR',
    transaction_date date NOT NULL,
    label text NOT NULL,
    counterparty_name text,
    matched_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
    match_status bank_match_status NOT NULL DEFAULT 'unmatched',
    confidence_score integer,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reminder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users
CREATE POLICY "Users can manage company reminder rules" ON public.reminder_rules
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.companies WHERE id = company_id));

CREATE POLICY "Users can manage bank connections" ON public.bank_connections
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.companies WHERE id = company_id));

CREATE POLICY "Users can manage bank transactions" ON public.bank_transactions
    FOR ALL USING (
        bank_connection_id IN (
            SELECT id FROM public.bank_connections WHERE company_id IN (
                SELECT id FROM public.companies WHERE user_id = auth.uid()
            )
        )
    );
