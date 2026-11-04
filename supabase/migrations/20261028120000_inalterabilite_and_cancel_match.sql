-- Migration : Inaltérabilité des factures et paiements, gel des mentions légales et contre-passation
-- Fichier : supabase/migrations/20261028120000_inalterabilite_and_cancel_match.sql

-- 1. Ajout de la valeur 'partially_paid' à l'enum invoice_status si absente
DO $$
BEGIN
  ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'partially_paid';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Contrainte stricte de signe sur le montant des paiements
-- Un paiement classique est strictement positif ; une contre-passation est strictement négative.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_amount_check;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_amount_nonzero;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_amount_sign;

-- 3. Colonnes de traçabilité bancaire et contre-passation sur payments
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS bank_transaction_id uuid 
  REFERENCES public.bank_transactions(id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS reversed_payment_id uuid 
  REFERENCES public.payments(id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS is_reversal boolean NOT NULL DEFAULT false;

-- Application de la contrainte de signe
ALTER TABLE public.payments 
  ADD CONSTRAINT payments_amount_sign CHECK ((is_reversal AND amount < 0) OR (NOT is_reversal AND amount > 0));

CREATE INDEX IF NOT EXISTS idx_payments_bank_transaction_id ON public.payments(bank_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_reversed_payment_id ON public.payments(reversed_payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_reversal ON public.payments(reversed_payment_id) WHERE reversed_payment_id IS NOT NULL;

-- 4. Rattrapage prudent et déterministe pour les transactions déjà rapprochées
WITH single_matches AS (
  SELECT 
    bt.id AS bank_transaction_id,
    p.id AS payment_id
  FROM public.bank_transactions bt
  JOIN public.payments p ON p.invoice_id = bt.matched_invoice_id
  WHERE bt.matched_invoice_id IS NOT NULL
    AND p.bank_transaction_id IS NULL
    AND p.amount = ABS(bt.amount)
    AND (
      SELECT COUNT(*) 
      FROM public.payments p2 
      WHERE p2.invoice_id = bt.matched_invoice_id 
        AND p2.amount = ABS(bt.amount)
    ) = 1
)
UPDATE public.payments p
SET bank_transaction_id = sm.bank_transaction_id
FROM single_matches sm
WHERE p.id = sm.payment_id;

-- 5. Trigger d'inaltérabilité sur payments
CREATE OR REPLACE FUNCTION public.check_payment_inalterabilite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('app.bypass_payment_lock', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Inaltérabilité comptable : la modification d''un paiement enregistré est strictement interdite. Seule une contre-passation est autorisée.';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Inaltérabilité comptable : la suppression d''un paiement enregistré est strictement interdite. Seule une contre-passation est autorisée.';
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_inalterabilite ON public.payments;
CREATE TRIGGER trg_payments_inalterabilite
BEFORE UPDATE OR DELETE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.check_payment_inalterabilite();

-- 6. Gel des mentions obligatoires à l'émission d'une facture (legal_snapshot)
CREATE OR REPLACE FUNCTION public.freeze_invoice_legal_snapshot()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_comp record;
  v_client record;
  v_lines jsonb;
BEGIN
  -- Dès qu'une facture n'est plus un brouillon (émission effective)
  IF NEW.status <> 'draft' AND (OLD IS NULL OR OLD.status = 'draft' OR NEW.legal_snapshot IS NULL) THEN
    SELECT * INTO v_comp FROM public.companies WHERE id = NEW.company_id;
    SELECT * INTO v_client FROM public.clients WHERE id = NEW.client_id;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', il.id,
      'description', il.description,
      'quantity', il.quantity,
      'unit_price', il.unit_price,
      'nature', il.nature,
      'position', il.position,
      'vat_rate', 0,
      'total_ht', round(il.quantity * il.unit_price, 2)
    ) ORDER BY il.position), '[]'::jsonb)
    INTO v_lines
    FROM public.invoice_lines il
    WHERE il.invoice_id = NEW.id;

    NEW.legal_snapshot := jsonb_build_object(
      'frozen_at', clock_timestamp(),
      'invoice_number', NEW.number,
      'issue_date', NEW.issue_date,
      'due_date', NEW.due_date,
      'payment_terms', NEW.payment_terms,
      'seller', jsonb_build_object(
        'id', v_comp.id,
        'legal_name', v_comp.legal_name,
        'commercial_name', v_comp.commercial_name,
        'siret', v_comp.siret,
        'siren', v_comp.siren,
        'address', v_comp.address,
        'structure', v_comp.structure,
        'vat_regime', v_comp.vat_regime,
        'activity_type', v_comp.activity_type,
        'logo_url', v_comp.logo_url,
        'accent_color', v_comp.accent_color,
        'invoice_footer', v_comp.invoice_footer,
        'penalty_mention', 'Pénalités de retard : trois fois le taux d''intérêt légal. Indemnité forfaitaire de recouvrement : 40 €.',
        'vat_mention', CASE 
          WHEN v_comp.vat_regime = 'franchise' THEN 'TVA non applicable, art. 293 B du CGI'
          WHEN v_comp.vat_regime = 'vat' AND v_comp.vat_option = 'debits' THEN 'Option pour le paiement de la taxe d''après les débits'
          ELSE NULL
        END,
        'payment_terms', NEW.payment_terms
      ),
      'buyer', jsonb_build_object(
        'id', v_client.id,
        'name', v_client.name,
        'type', v_client.type,
        'siren', v_client.siren,
        'siret', v_client.siret,
        'vat_number', v_client.vat_number,
        'address', v_client.address
      ),
      'lines', v_lines,
      'totals', jsonb_build_object(
        'total_ht', NEW.total_ht,
        'total_vat', NEW.total_vat,
        'total_ttc', NEW.total_ttc
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_freeze_invoice_legal_snapshot ON public.invoices;
CREATE TRIGGER trg_freeze_invoice_legal_snapshot
BEFORE INSERT OR UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.freeze_invoice_legal_snapshot();

-- Rattrapage du snapshot pour les factures déjà émises :
-- NOTE D'AUDIT : ce rattrapage fige l'état des données au jour de la migration sans
-- prétendre rétroactivement dater de l'émission originale.
DO $$
DECLARE
  r record;
  v_comp record;
  v_client record;
  v_lines jsonb;
BEGIN
  FOR r IN SELECT * FROM public.invoices WHERE status <> 'draft' AND legal_snapshot IS NULL LOOP
    SELECT * INTO v_comp FROM public.companies WHERE id = r.company_id;
    SELECT * INTO v_client FROM public.clients WHERE id = r.client_id;
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', il.id,
      'description', il.description,
      'quantity', il.quantity,
      'unit_price', il.unit_price,
      'nature', il.nature,
      'position', il.position,
      'vat_rate', 0,
      'total_ht', round(il.quantity * il.unit_price, 2)
    ) ORDER BY il.position), '[]'::jsonb)
    INTO v_lines
    FROM public.invoice_lines il WHERE il.invoice_id = r.id;

    UPDATE public.invoices
    SET legal_snapshot = jsonb_build_object(
      'frozen_at', clock_timestamp(),
      'backfill_migration', true,
      'invoice_number', r.number,
      'issue_date', r.issue_date,
      'due_date', r.due_date,
      'payment_terms', r.payment_terms,
      'seller', jsonb_build_object(
        'id', v_comp.id,
        'legal_name', v_comp.legal_name,
        'commercial_name', v_comp.commercial_name,
        'siret', v_comp.siret,
        'siren', v_comp.siren,
        'address', v_comp.address,
        'structure', v_comp.structure,
        'vat_regime', v_comp.vat_regime,
        'activity_type', v_comp.activity_type,
        'logo_url', v_comp.logo_url,
        'accent_color', v_comp.accent_color,
        'invoice_footer', v_comp.invoice_footer,
        'penalty_mention', 'Pénalités de retard : trois fois le taux d''intérêt légal. Indemnité forfaitaire de recouvrement : 40 €.',
        'vat_mention', CASE 
          WHEN v_comp.vat_regime = 'franchise' THEN 'TVA non applicable, art. 293 B du CGI'
          WHEN v_comp.vat_regime = 'vat' AND v_comp.vat_option = 'debits' THEN 'Option pour le paiement de la taxe d''après les débits'
          ELSE NULL
        END,
        'payment_terms', r.payment_terms
      ),
      'buyer', jsonb_build_object(
        'id', v_client.id,
        'name', v_client.name,
        'type', v_client.type,
        'siren', v_client.siren,
        'siret', v_client.siret,
        'vat_number', v_client.vat_number,
        'address', v_client.address
      ),
      'lines', v_lines,
      'totals', jsonb_build_object(
        'total_ht', r.total_ht,
        'total_vat', r.total_vat,
        'total_ttc', r.total_ttc
      )
    )
    WHERE id = r.id;
  END LOOP;
END $$;

-- 7. Trigger d'inaltérabilité des factures émises (liste blanche stricte et interdiction retour brouillon)
CREATE OR REPLACE FUNCTION public.check_invoice_immutability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('app.bypass_invoice_lock', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- Règle 0 : Interdire toute transition directe d'un brouillon vers un statut émis hors fonction emit_invoice()
  IF OLD.status = 'draft' AND NEW.status <> 'draft' 
     AND COALESCE(current_setting('app.emitting_invoice', true), '') <> 'on' THEN
    RAISE EXCEPTION 'L''émission d''une facture doit obligatoirement passer par la fonction emit_invoice.'
      USING ERRCODE = '42501';
  END IF;

  IF OLD.status <> 'draft' THEN
    -- Règle 1 : Interdire formellement tout retour vers le statut 'draft'
    IF NEW.status = 'draft' THEN
      RAISE EXCEPTION 'Inaltérabilité fiscale : une facture émise ne peut pas redevenir un brouillon.'
        USING ERRCODE = '42501';
    END IF;

    -- Règle 2 : Liste blanche stricte des colonnes modifiables après émission.
    -- Seules peuvent changer : status, paid_amount, paid_at, payment_method, pa_status,
    -- pa_rejection_reason, ereporting_status, factpulse_ref, facturx_pdf_url, stripe_payment_link,
    -- auto_reminders_disabled, last_reminder_sent_at, reminder_count.
    -- signature_data et signed_at ne peuvent être écrites qu'une fois si initialement NULL.
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.company_id IS DISTINCT FROM OLD.company_id
       OR NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.quote_id IS DISTINCT FROM OLD.quote_id
       OR NEW.number IS DISTINCT FROM OLD.number
       OR NEW.type IS DISTINCT FROM OLD.type
       OR NEW.issue_date IS DISTINCT FROM OLD.issue_date
       OR NEW.due_date IS DISTINCT FROM OLD.due_date
       OR NEW.payment_terms IS DISTINCT FROM OLD.payment_terms
       OR NEW.total_ht IS DISTINCT FROM OLD.total_ht
       OR NEW.total_vat IS DISTINCT FROM OLD.total_vat
       OR NEW.total_ttc IS DISTINCT FROM OLD.total_ttc
       OR NEW.note IS DISTINCT FROM OLD.note
       OR NEW.credited_invoice_id IS DISTINCT FROM OLD.credited_invoice_id
       OR NEW.public_token IS DISTINCT FROM OLD.public_token
       OR NEW.legal_snapshot IS DISTINCT FROM OLD.legal_snapshot
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.pa_submission_choice IS DISTINCT FROM OLD.pa_submission_choice
       OR (OLD.signature_data IS NOT NULL AND NEW.signature_data IS DISTINCT FROM OLD.signature_data)
    THEN
      RAISE EXCEPTION 'Inaltérabilité fiscale : modification interdite sur une facture émise en dehors des colonnes autorisées en liste blanche.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_immutability ON public.invoices;
CREATE TRIGGER trg_invoice_immutability
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.check_invoice_immutability();

CREATE OR REPLACE FUNCTION public.check_invoice_no_delete_if_issued()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('app.bypass_invoice_lock', true) = 'on' THEN
    RETURN OLD;
  END IF;

  IF OLD.status <> 'draft' THEN
    RAISE EXCEPTION 'Inaltérabilité fiscale : la suppression d''une facture émise est strictement interdite. Émettez un avoir pour annuler.'
      USING ERRCODE = '42501';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_no_delete ON public.invoices;
CREATE TRIGGER trg_invoice_no_delete
BEFORE DELETE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.check_invoice_no_delete_if_issued();

-- 8. Inaltérabilité des lignes de factures émises (INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION public.check_invoice_lines_immutability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_inv_status public.invoice_status;
  v_target_invoice_id uuid;
BEGIN
  IF current_setting('app.bypass_invoice_lock', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  v_target_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  SELECT status INTO v_inv_status FROM public.invoices WHERE id = v_target_invoice_id;

  IF v_inv_status IS NOT NULL AND v_inv_status <> 'draft' THEN
    RAISE EXCEPTION 'Inaltérabilité fiscale : les lignes d''une facture émise ne peuvent plus être créées, modifiées ni supprimées.'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_lines_immutability ON public.invoice_lines;
CREATE TRIGGER trg_invoice_lines_immutability
BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_lines
FOR EACH ROW
EXECUTE FUNCTION public.check_invoice_lines_immutability();

-- 9. Fonction RPC sécurisée : annulation d'un rapprochement bancaire avec contre-passation
CREATE OR REPLACE FUNCTION public.cancel_bank_transaction_match(p_bank_transaction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_is_service boolean := (
    COALESCE(
      auth.role(),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
      current_setting('request.jwt.claim.role', true),
      session_user,
      current_user
    ) = 'service_role'
  );
  v_bt record;
  v_orig_payment record;
  v_reversal_id uuid;
  v_total_paid numeric(12,2);
  v_total_ttc numeric(12,2);
  v_due_date date;
  v_new_status invoice_status;
  v_warning text := null;
  v_orig_payment_date date;
  v_current_date_paris date;
BEGIN
  -- Refuser si aucun utilisateur connecté (sauf rôle de service explicite)
  IF v_caller_id IS NULL AND NOT v_is_service THEN
    RAISE EXCEPTION 'Authentification requise : auth.uid() est NULL.';
  END IF;

  -- Contrôle d'appartenance de la transaction bancaire
  SELECT 
    bt.*,
    c.user_id
  INTO v_bt
  FROM public.bank_transactions bt
  JOIN public.companies c ON c.id = bt.company_id
  WHERE bt.id = p_bank_transaction_id;

  IF NOT FOUND THEN
    SELECT 
      bt.*,
      c.user_id
    INTO v_bt
    FROM public.bank_transactions bt
    JOIN public.bank_connections bc ON bc.id = bt.bank_connection_id
    JOIN public.companies c ON c.id = bc.company_id
    WHERE bt.id = p_bank_transaction_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Transaction bancaire introuvable ou accès refusé.';
    END IF;
  END IF;

  IF NOT v_is_service AND v_bt.user_id != v_caller_id THEN
    RAISE EXCEPTION 'Accès refusé : la transaction n''appartient pas à l''utilisateur connecté.';
  END IF;

  -- CONTRÔLE DE SÉCURITÉ STRICT : vérification que la facture rapprochée appartient à la même société
  IF v_bt.matched_invoice_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM public.invoices inv
      WHERE inv.id = v_bt.matched_invoice_id
        AND inv.company_id = v_bt.company_id
    ) THEN
      RAISE EXCEPTION 'Accès refusé : la facture rapprochée n''appartient pas à la même entreprise que la transaction.';
    END IF;
  END IF;

  -- Si déjà dé-rapprochée (matched_invoice_id IS NULL) ET qu'une contre-passation existe, renvoyer succès idempotent
  IF v_bt.matched_invoice_id IS NULL THEN
    IF EXISTS (
      SELECT 1 
      FROM public.payments
      WHERE bank_transaction_id = p_bank_transaction_id
        AND is_reversal = true
    ) THEN
      RETURN jsonb_build_object(
        'success', true,
        'already_cancelled', true,
        'message', 'Cette transaction a déjà été annulée et contre-passée.'
      );
    END IF;

    RAISE EXCEPTION 'Cette transaction bancaire n''est pas rapprochée d''une facture.';
  END IF;

  -- Retrouver le paiement d'origine non encore contre-passé par bank_transaction_id
  SELECT p.*
  INTO v_orig_payment
  FROM public.payments p
  JOIN public.invoices inv ON inv.id = p.invoice_id
  WHERE p.bank_transaction_id = p_bank_transaction_id
    AND inv.company_id = v_bt.company_id
    AND p.is_reversal = false
    AND p.reversed_payment_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.payments rev WHERE rev.reversed_payment_id = p.id
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Repli sur correspondance exacte de montant et facture pour historique antérieur
    -- avec vérification stricte d'appartenance à la même entreprise
    SELECT p.*
    INTO v_orig_payment
    FROM public.payments p
    JOIN public.invoices inv ON inv.id = p.invoice_id
    WHERE p.invoice_id = v_bt.matched_invoice_id
      AND inv.company_id = v_bt.company_id
      AND p.amount = ABS(v_bt.amount)
      AND p.is_reversal = false
      AND p.reversed_payment_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.payments rev WHERE rev.reversed_payment_id = p.id
      )
    ORDER BY p.paid_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Paiement d''origine introuvable pour cette transaction bancaire.';
    END IF;
  END IF;

  -- Protection anti double-clic
  IF EXISTS (
    SELECT 1 
    FROM public.payments
    WHERE reversed_payment_id = v_orig_payment.id
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_cancelled', true,
      'message', 'Cette transaction a déjà été annulée et contre-passée.'
    );
  END IF;

  -- Calcul des dates pour l'avertissement de période déclarative
  v_orig_payment_date := (v_orig_payment.paid_at AT TIME ZONE 'Europe/Paris')::date;
  v_current_date_paris := (clock_timestamp() AT TIME ZONE 'Europe/Paris')::date;

  IF date_trunc('month', v_orig_payment_date) < date_trunc('month', v_current_date_paris) THEN
    v_warning := 'Attention : le paiement initial date d''une période comptable ou fiscale antérieure (' 
      || to_char(v_orig_payment_date, 'DD/MM/YYYY') 
      || '). La contre-passation est enregistrée à la date du jour (' 
      || to_char(v_current_date_paris, 'DD/MM/YYYY') 
      || '). Pensez à régulariser vos déclarations URSSAF ou TVA si cette période a déjà été déclarée.';
  END IF;

  -- Écriture d'annulation (contre-passation)
  INSERT INTO public.payments (
    invoice_id,
    amount,
    method,
    paid_at,
    source,
    bank_transaction_id,
    reversed_payment_id,
    is_reversal
  ) VALUES (
    v_orig_payment.invoice_id,
    -v_orig_payment.amount,
    v_orig_payment.method,
    clock_timestamp(),
    'bank_sync',
    p_bank_transaction_id,
    v_orig_payment.id,
    true
  ) RETURNING id INTO v_reversal_id;

  -- Dérapprochement de la transaction bancaire
  UPDATE public.bank_transactions
  SET 
    matched_invoice_id = NULL,
    match_status = 'unmatched',
    confidence_score = NULL
  WHERE id = p_bank_transaction_id;

  -- Recalcul de la somme algébrique des paiements de la facture
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_paid
  FROM public.payments
  WHERE invoice_id = v_orig_payment.invoice_id;

  SELECT total_ttc, due_date
  INTO v_total_ttc, v_due_date
  FROM public.invoices
  WHERE id = v_orig_payment.invoice_id;

  IF v_total_paid >= v_total_ttc AND v_total_ttc > 0 THEN
    v_new_status := 'paid'::invoice_status;
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partially_paid'::invoice_status;
  ELSE
    IF v_due_date < v_current_date_paris THEN
      v_new_status := 'late'::invoice_status;
    ELSE
      v_new_status := 'pending'::invoice_status;
    END IF;
  END IF;

  UPDATE public.invoices
  SET 
    paid_amount = CASE WHEN v_total_paid > 0 THEN v_total_paid ELSE NULL END,
    paid_at = CASE WHEN v_total_paid >= v_total_ttc AND v_total_ttc > 0 THEN paid_at ELSE NULL END,
    status = v_new_status
  WHERE id = v_orig_payment.invoice_id;

  RETURN jsonb_build_object(
    'success', true,
    'reversal_payment_id', v_reversal_id,
    'cancelled_amount', v_orig_payment.amount,
    'remaining_paid_amount', v_total_paid,
    'invoice_new_status', v_new_status,
    'warning', v_warning
  );
END;
$$;

-- 10. Déconnexion d'une banque en préservant l'historique et company_id
CREATE OR REPLACE FUNCTION public.disconnect_bank_connection(p_connection_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_is_service boolean := (
    COALESCE(
      auth.role(),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
      current_setting('request.jwt.claim.role', true),
      session_user,
      current_user
    ) = 'service_role'
  );
  v_comp_user_id uuid;
BEGIN
  IF v_caller_id IS NULL AND NOT v_is_service THEN
    RAISE EXCEPTION 'Authentification requise : auth.uid() est NULL.';
  END IF;

  SELECT c.user_id INTO v_comp_user_id
  FROM public.bank_connections bc
  JOIN public.companies c ON c.id = bc.company_id
  WHERE bc.id = p_connection_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Connexion bancaire introuvable.';
  END IF;

  IF NOT v_is_service AND v_comp_user_id != v_caller_id THEN
    RAISE EXCEPTION 'Accès refusé : la connexion n''appartient pas à l''utilisateur connecté.';
  END IF;

  -- S'assurer que company_id est renseigné sur les transactions avant de rompre le lien
  UPDATE public.bank_transactions bt
  SET company_id = bc.company_id
  FROM public.bank_connections bc
  WHERE bc.id = p_connection_id
    AND bt.bank_connection_id = p_connection_id
    AND bt.company_id IS NULL;

  -- Détacher les transactions liées
  UPDATE public.bank_transactions
  SET bank_connection_id = NULL
  WHERE bank_connection_id = p_connection_id;

  -- Supprimer la connexion bancaire
  DELETE FROM public.bank_connections
  WHERE id = p_connection_id;
END;
$$;

-- 11. Procédure RGPD sécurisée d'anonymisation des données personnelles
-- Ne supprime PAS les factures, paiements ni clients liés à des factures.
-- Préserve intactes les mentions obligatoires sur les factures via le snapshot figé.
CREATE OR REPLACE FUNCTION public.delete_company_gdpr(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_service boolean := (
    COALESCE(
      auth.role(),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
      current_setting('request.jwt.claim.role', true),
      session_user,
      current_user
    ) = 'service_role'
  );
  v_user_id uuid;
  v_invoices_count int;
  v_payments_count int;
BEGIN
  IF NOT v_is_service THEN
    RAISE EXCEPTION 'Accès refusé : la procédure de suppression RGPD est strictement réservée au rôle service_role.';
  END IF;

  SELECT user_id INTO v_user_id FROM public.companies WHERE id = p_company_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entreprise introuvable.';
  END IF;

  -- 1. S'assurer que toutes les factures émises ont leur snapshot légal figé
  PERFORM set_config('app.bypass_invoice_lock', 'on', true);

  -- 2. Suppression des transactions bancaires NON rapprochées
  DELETE FROM public.bank_transactions 
  WHERE company_id = p_company_id 
    AND matched_invoice_id IS NULL;

  -- 3. Anonymisation des transactions bancaires rapprochées conservées
  UPDATE public.bank_transactions
  SET 
    label = 'Transaction bancaire rapprochée archivée (RGPD)',
    counterparty_name = '[Masqué - RGPD]',
    bank_connection_id = NULL
  WHERE company_id = p_company_id;

  -- 4. Suppression des connexions bancaires
  DELETE FROM public.bank_connections WHERE company_id = p_company_id;

  -- 5. Clients NON rattachés à des factures -> Suppression complète
  DELETE FROM public.clients
  WHERE company_id = p_company_id
    AND NOT EXISTS (
      SELECT 1 FROM public.invoices i WHERE i.client_id = clients.id
    );

  -- 6. Clients rattachés à des factures -> Seules les coordonnées de contact sont purgées
  -- Le nom et l'adresse restent disponibles pour la cohérence des mentions des factures
  UPDATE public.clients
  SET 
    email = NULL,
    archived_at = clock_timestamp()
  WHERE company_id = p_company_id;

  -- 7. Coordonnées de contact de l'entreprise purgées
  UPDATE public.companies
  SET 
    phone = NULL,
    auto_reminders_enabled = false
  WHERE id = p_company_id;

  -- 8. Anonymisation du profil utilisateur
  IF v_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      email = 'anonymized-' || v_user_id || '@rgpd.invalid'
    WHERE id = v_user_id;
  END IF;

  PERFORM set_config('app.bypass_invoice_lock', 'off', true);

  -- 9. Comptage des pièces comptables conservées
  SELECT count(*) INTO v_invoices_count FROM public.invoices WHERE company_id = p_company_id;
  SELECT count(*) INTO v_payments_count FROM public.payments p JOIN public.invoices i ON i.id = p.invoice_id WHERE i.company_id = p_company_id;

  RETURN jsonb_build_object(
    'success', true,
    'anonymized', true,
    'preserved_invoices', v_invoices_count,
    'preserved_payments', v_payments_count,
    'message', 'Données personnelles anonymisées avec succès. Pièces comptables et mentions obligatoires conservées conformément aux obligations légales (Art. L123-22 Code de commerce).'
  );
END;
$$;

-- 12. Privilèges stricts
REVOKE EXECUTE ON FUNCTION public.cancel_bank_transaction_match(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_bank_transaction_match(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.disconnect_bank_connection(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.disconnect_bank_connection(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.delete_company_gdpr(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_company_gdpr(uuid) TO service_role;

-- 12b. Fonctions temporelles au fuseau Europe/Paris (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.paris_today()
RETURNS date
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT (clock_timestamp() AT TIME ZONE 'Europe/Paris')::date;
$$;

CREATE OR REPLACE FUNCTION public.paris_year()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT to_char((clock_timestamp() AT TIME ZONE 'Europe/Paris')::date, 'YYYY');
$$;

GRANT EXECUTE ON FUNCTION public.paris_today() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.paris_year() TO PUBLIC, anon, authenticated, service_role;

-- 13. Fonction SECURITY DEFINER d'émission officielle de facture
-- Pose un verrou exclusif sur la société (FOR UPDATE) pour sérialiser l'attribution
-- du numéro séquentiel sans collision ni trou, calcule issue_date au fuseau Europe/Paris via paris_today(),
-- recalcule due_date selon payment_terms, positionne status = 'pending' et fige l'instantané légal (legal_snapshot).
CREATE OR REPLACE FUNCTION public.emit_invoice(p_invoice_id uuid)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_is_service boolean := (
    COALESCE(
      auth.role(),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
      current_setting('request.jwt.claim.role', true),
      session_user,
      current_user
    ) = 'service_role'
  );
  v_inv public.invoices%ROWTYPE;
  v_comp public.companies%ROWTYPE;
  v_paris_date date;
  v_year text;
  v_prefix text;
  v_next_seq integer;
  v_new_number text;
  v_due_date date;
BEGIN
  IF v_caller_id IS NULL AND NOT v_is_service THEN
    RAISE EXCEPTION 'Authentification requise : auth.uid() est NULL.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_inv FROM public.invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Facture introuvable.';
  END IF;

  -- Sérialisation stricte par verrouillage exclusif de la ligne entreprise
  SELECT * INTO v_comp FROM public.companies WHERE id = v_inv.company_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entreprise introuvable.';
  END IF;

  IF NOT v_is_service AND v_comp.user_id != v_caller_id AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Accès refusé : vous n''êtes pas propriétaire de cette facture.' USING ERRCODE = '42501';
  END IF;

  -- Re-lecture de la facture après verrouillage de l'entreprise pour détecter les émissions concurrentes
  SELECT * INTO v_inv FROM public.invoices WHERE id = p_invoice_id;
  IF v_inv.status <> 'draft' THEN
    RAISE EXCEPTION 'Cette facture vient d''être émise.' USING ERRCODE = '42501';
  END IF;

  -- Date courante et année au fuseau Europe/Paris
  v_paris_date := public.paris_today();
  v_year := public.paris_year();
  v_prefix := CASE WHEN v_inv.type = 'credit_note' THEN 'AV' ELSE 'FAC' END;

  -- Recalcul de due_date à l'émission : issue_date + (0 si on_receipt, 30 si 30d, 60 si 60d)
  v_due_date := v_paris_date + CASE 
    WHEN v_inv.payment_terms = 'on_receipt' THEN 0
    WHEN v_inv.payment_terms = '30d' THEN 30
    WHEN v_inv.payment_terms = '60d' THEN 60
    ELSE 30
  END;

  -- Recherche du numéro séquentiel maximal pour cette société, ce type et cette année
  SELECT COALESCE(MAX(
    substring(number from '^[A-Z]+-[0-9]{4}-([0-9]+)$')::integer
  ), 0) + 1
  INTO v_next_seq
  FROM public.invoices
  WHERE company_id = v_inv.company_id
    AND number ~ ('^' || v_prefix || '-' || v_year || '-[0-9]+$')
    AND status <> 'draft';

  v_new_number := v_prefix || '-' || v_year || '-' || lpad(v_next_seq::text, 4, '0');

  PERFORM set_config('app.emitting_invoice', 'on', true);

  UPDATE public.invoices
  SET 
    number = v_new_number,
    issue_date = v_paris_date,
    due_date = v_due_date,
    status = 'pending'
  WHERE id = p_invoice_id
  RETURNING * INTO v_inv;

  PERFORM set_config('app.emitting_invoice', 'off', true);

  RETURN v_inv;
END;
$$;

-- 14. admin_delete_user sécurisé : suppression autorisée si et seulement si aucune facture émise ni paiement
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_has_issued_invoices boolean;
  v_has_payments boolean;
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_target = auth.uid() THEN
    RAISE EXCEPTION 'cannot delete your own account';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
     WHERE id = p_target AND admin_role = 'super_admin'::admin_role
  ) THEN
    RAISE EXCEPTION 'cannot delete a super admin';
  END IF;

  -- Vérifier s'il existe des factures émises ou des paiements pour les sociétés de cet utilisateur
  SELECT EXISTS (
    SELECT 1 
    FROM public.invoices i
    JOIN public.companies c ON c.id = i.company_id
    WHERE c.user_id = p_target AND i.status <> 'draft'
  ) INTO v_has_issued_invoices;

  SELECT EXISTS (
    SELECT 1
    FROM public.payments p
    JOIN public.invoices i ON i.id = p.invoice_id
    JOIN public.companies c ON c.id = i.company_id
    WHERE c.user_id = p_target
  ) INTO v_has_payments;

  IF v_has_issued_invoices OR v_has_payments THEN
    RAISE EXCEPTION 'Suppression directe impossible : cet utilisateur possède des factures émises ou des paiements enregistrés. Utilisez la procédure de suppression de compte RGPD delete_user_account_gdpr(p_user_id) pour archiver les pièces comptables obligatoires.'
      USING ERRCODE = '42501';
  END IF;

  -- Si l'utilisateur n'a AUCUNE facture émise ni paiement, la suppression directe des brouillons/données est autorisée
  PERFORM public.write_audit_log('user_deleted_admin', p_target, '{}'::jsonb);

  PERFORM set_config('app.bypass_invoice_lock', 'on', true);
  
  DELETE FROM public.invoice_lines WHERE invoice_id IN (
    SELECT i.id FROM public.invoices i JOIN public.companies c ON c.id = i.company_id WHERE c.user_id = p_target
  );
  DELETE FROM public.invoices WHERE company_id IN (
    SELECT id FROM public.companies WHERE user_id = p_target
  );
  DELETE FROM public.quote_lines WHERE quote_id IN (
    SELECT q.id FROM public.quotes q JOIN public.companies c ON c.id = q.company_id WHERE c.user_id = p_target
  );
  DELETE FROM public.quotes WHERE company_id IN (
    SELECT id FROM public.companies WHERE user_id = p_target
  );
  DELETE FROM public.bank_transactions WHERE company_id IN (
    SELECT id FROM public.companies WHERE user_id = p_target
  );
  DELETE FROM public.bank_connections WHERE company_id IN (
    SELECT id FROM public.companies WHERE user_id = p_target
  );
  DELETE FROM public.clients WHERE company_id IN (
    SELECT id FROM public.companies WHERE user_id = p_target
  );
  DELETE FROM public.companies WHERE user_id = p_target;
  UPDATE public.audit_logs SET target_user_id = NULL WHERE target_user_id = p_target;
  DELETE FROM public.profiles WHERE id = p_target;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DELETE FROM auth.users WHERE id = p_target;
  END IF;

  PERFORM set_config('app.bypass_invoice_lock', 'off', true);
END;
$$;

-- 15. Procédure complète de suppression de compte RGPD au niveau utilisateur (service_role)
CREATE OR REPLACE FUNCTION public.delete_user_account_gdpr(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_service boolean := (
    COALESCE(
      auth.role(),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
      current_setting('request.jwt.claim.role', true),
      session_user,
      current_user
    ) = 'service_role'
  );
  v_comp record;
  v_invoices_count int := 0;
  v_payments_count int := 0;
BEGIN
  IF NOT v_is_service THEN
    RAISE EXCEPTION 'Accès refusé : la procédure de suppression de compte RGPD est strictement réservée au rôle service_role.'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) 
     AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Utilisateur introuvable.';
  END IF;

  -- 1. Nettoyage et anonymisation de chaque entreprise de l'utilisateur via delete_company_gdpr
  FOR v_comp IN SELECT id FROM public.companies WHERE user_id = p_user_id LOOP
    PERFORM public.delete_company_gdpr(v_comp.id);
  END LOOP;

  -- 2. Désactivation du compte auth (bannissement définitif + anonymisation email dans auth.users)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    UPDATE auth.users
    SET 
      banned_until = '2999-12-31 23:59:59+00'::timestamptz,
      email = 'anonymized-' || p_user_id || '@rgpd.invalid'
    WHERE id = p_user_id;
  END IF;

  -- Invalidation des sessions auth si les tables sessions/refresh_tokens existent
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'sessions') THEN
    DELETE FROM auth.sessions WHERE user_id = p_user_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'refresh_tokens') THEN
    DELETE FROM auth.refresh_tokens WHERE user_id = p_user_id::text;
  END IF;

  -- 3. Anonymisation du profil utilisateur
  UPDATE public.profiles
  SET 
    email = 'anonymized-' || p_user_id || '@rgpd.invalid'
  WHERE id = p_user_id;

  -- 4. Comptage des pièces comptables préservées
  SELECT count(*) INTO v_invoices_count 
  FROM public.invoices i 
  JOIN public.companies c ON c.id = i.company_id 
  WHERE c.user_id = p_user_id;

  SELECT count(*) INTO v_payments_count 
  FROM public.payments p 
  JOIN public.invoices i ON i.id = p.invoice_id 
  JOIN public.companies c ON c.id = i.company_id 
  WHERE c.user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'anonymized', true,
    'preserved_invoices', v_invoices_count,
    'preserved_payments', v_payments_count,
    'message', 'Compte utilisateur désactivé et données personnelles anonymisées avec succès. Pièces comptables et mentions obligatoires conservées conformément aux obligations légales (Art. L123-22 Code de commerce).'
  );
END;
$$;

-- 16. Privilèges stricts supplémentaires
REVOKE EXECUTE ON FUNCTION public.emit_invoice(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.emit_invoice(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.delete_user_account_gdpr(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account_gdpr(uuid) TO service_role;

-- 17. Alignement du quota de factures du plan Starter sur la règle métier (3 factures/mois)
UPDATE public.plans 
SET invoice_limit = 3 
WHERE key = 'starter' AND (invoice_limit IS NULL OR invoice_limit <> 3);


