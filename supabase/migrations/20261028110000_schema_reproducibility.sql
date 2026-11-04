-- Migration : Reproductibilité complète du schéma pour environnements locaux et tests
-- Fichier : supabase/migrations/20261028110000_schema_reproducibility.sql

-- 1. Enum payment_source : ajout de 'bank_sync' et invoice_status : ajout de 'signed'
ALTER TYPE public.payment_source ADD VALUE IF NOT EXISTS 'bank_sync';
ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'signed';

-- 2. Enum bank_connection_status : alignement avec la production
DO $$
BEGIN
  ALTER TYPE public.bank_connection_status ADD VALUE IF NOT EXISTS 'active';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Colonnes sur public.companies
DO $$ BEGIN
  CREATE TYPE public.vat_payment_option AS ENUM ('encaissements', 'debits', 'non_renseigne');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS structure text DEFAULT 'micro';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS auto_reminders_enabled boolean DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS vat_option public.vat_payment_option NOT NULL DEFAULT 'non_renseigne';

-- 4. Colonnes sur public.clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS siren text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 5. Colonnes sur public.bank_connections
ALTER TABLE public.bank_connections ADD COLUMN IF NOT EXISTS provider_item_id text;
ALTER TABLE public.bank_connections ADD COLUMN IF NOT EXISTS bank_name text;

-- 6. Instantané légal des factures (gel des mentions obligatoires à l'émission)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS legal_snapshot jsonb;

-- 7. Colonne company_id sur public.bank_transactions avec clé étrangère RESTRICT
-- Garantit la pérennité de l'appartenance de la transaction même après déconnexion du compte bancaire
ALTER TABLE public.bank_transactions 
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_bank_transactions_company_id ON public.bank_transactions(company_id);

-- Remplissage de company_id depuis bank_connections pour les données déjà présentes
UPDATE public.bank_transactions bt
SET company_id = bc.company_id
FROM public.bank_connections bc
WHERE bt.bank_connection_id = bc.id
  AND bt.company_id IS NULL;

-- 8. Trigger d'alimentation automatique de company_id à l'insertion si omis
CREATE OR REPLACE FUNCTION public.set_bank_transaction_company_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.company_id IS NULL AND NEW.bank_connection_id IS NOT NULL THEN
    SELECT company_id INTO NEW.company_id
    FROM public.bank_connections
    WHERE id = NEW.bank_connection_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_bank_transaction_company_id ON public.bank_transactions;
CREATE TRIGGER trg_set_bank_transaction_company_id
BEFORE INSERT ON public.bank_transactions
FOR EACH ROW
EXECUTE FUNCTION public.set_bank_transaction_company_id();

-- 9. Assouplissement de la clé étrangère bank_transactions.bank_connection_id
ALTER TABLE public.bank_transactions ALTER COLUMN bank_connection_id DROP NOT NULL;
ALTER TABLE public.bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_bank_connection_id_fkey;
ALTER TABLE public.bank_transactions 
  ADD CONSTRAINT bank_transactions_bank_connection_id_fkey 
  FOREIGN KEY (bank_connection_id) REFERENCES public.bank_connections(id) ON DELETE SET NULL;

-- 10. Politique RLS de bank_transactions basée sur company_id avec contrôle strict WITH CHECK
-- Interdit formellement d'associer matched_invoice_id ou bank_connection_id à une autre société que celle de la ligne
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can manage company bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can manage bank transactions via company" ON public.bank_transactions;

CREATE POLICY "Users can manage bank transactions via company" ON public.bank_transactions
  FOR ALL
  TO authenticated
  USING (
    company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    OR (
      company_id IS NULL AND bank_connection_id IN (
        SELECT id FROM public.bank_connections WHERE company_id IN (
          SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    AND (
      bank_connection_id IS NULL 
      OR bank_connection_id IN (SELECT id FROM public.bank_connections WHERE company_id = bank_transactions.company_id)
    )
    AND (
      matched_invoice_id IS NULL 
      OR matched_invoice_id IN (SELECT id FROM public.invoices WHERE company_id = bank_transactions.company_id)
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_transactions TO authenticated;

-- 11. Politiques RLS strictes sur public.invoices
-- Les utilisateurs authentifiés ne peuvent insérer que des factures à l'état de brouillon ('draft')
-- L'émission séquentielle et le gel légal passent obligatoirement par la fonction emit_invoice()
DROP POLICY IF EXISTS "own invoices" ON public.invoices;
DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert_own" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_own" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete_own" ON public.invoices;

CREATE POLICY "invoices_select_own" ON public.invoices
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    OR public.is_platform_admin()
  );

CREATE POLICY "invoices_insert_own" ON public.invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    AND status = 'draft'
  );

CREATE POLICY "invoices_update_own" ON public.invoices
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    OR public.is_platform_admin()
  )
  WITH CHECK (
    company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    OR public.is_platform_admin()
  );

CREATE POLICY "invoices_delete_own" ON public.invoices
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    OR public.is_platform_admin()
  );

