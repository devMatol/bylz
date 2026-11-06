-- Migration 20261104160000_emit_invoice_padding_3_digits.sql
-- Harmonisation du formatage du numéro séquentiel à l'émission sur 3 chiffres (FAC-YYYY-XXX / AV-YYYY-XXX)
-- Garantit la rétro-compatibilité avec les factures existantes (3 et 4 chiffres) sans saut ni doublon.

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

  v_new_number := v_prefix || '-' || v_year || '-' || lpad(v_next_seq::text, 3, '0');

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

REVOKE EXECUTE ON FUNCTION public.emit_invoice(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.emit_invoice(uuid) TO authenticated, service_role;
