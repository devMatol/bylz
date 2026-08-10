/*
  # Enforce plan quotas in the database

  The invoice-per-month and client caps were only checked in the browser
  (src/lib/planLimits.ts), so a caller writing straight to the Data API could
  exceed the plan it pays for. These triggers re-check the quota server-side at
  the moment of the write, using the plan of the company's owner.

  1. New functions
     - `public.plan_quota_for(uuid)` -> (invoice_limit int, client_limit int)
       resolves the effective limits for a company owner, preferring the `plans`
       row for the owner's plan and falling back to conservative defaults.
     - `public.enforce_invoice_quota()` BEFORE INSERT/UPDATE ON invoices
     - `public.enforce_client_quota()` BEFORE INSERT ON clients

  2. Notes
     - Draft invoices are never counted or blocked, matching the app's rules.
     - A NULL limit means unlimited.
     - Credit notes (linked to an existing invoice) are exempt so a user can
       always correct an already emitted invoice.
*/

CREATE OR REPLACE FUNCTION public.plan_quota_for(p_company uuid)
RETURNS TABLE (invoice_limit integer, client_limit integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan text;
BEGIN
  SELECT p.plan::text INTO v_plan
  FROM public.companies c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE c.id = p_company;

  IF v_plan IS NULL THEN
    v_plan := 'starter';
  END IF;

  RETURN QUERY
  SELECT pl.invoice_limit, pl.client_limit
  FROM public.plans pl
  WHERE pl.key = v_plan AND pl.is_active
  LIMIT 1;

  IF NOT FOUND THEN
    IF v_plan = 'starter' THEN
      RETURN QUERY SELECT 10::integer, 3::integer;
    ELSE
      RETURN QUERY SELECT NULL::integer, NULL::integer;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.plan_quota_for(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.plan_quota_for(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_invoice_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit integer;
  v_count integer;
  v_start timestamptz;
BEGIN
  -- Drafts are free, and a credit note correcting an existing invoice is never blocked.
  IF NEW.status::text = 'draft' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status::text <> 'draft' THEN
    RETURN NEW;
  END IF;

  IF NEW.credited_invoice_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT q.invoice_limit INTO v_limit FROM public.plan_quota_for(NEW.company_id) q;

  IF v_limit IS NULL THEN
    RETURN NEW;
  END IF;

  v_start := date_trunc('month', now());

  SELECT count(*) INTO v_count
  FROM public.invoices i
  WHERE i.company_id = NEW.company_id
    AND i.id <> NEW.id
    AND i.status::text <> 'draft'
    AND i.credited_invoice_id IS NULL
    AND i.created_at >= v_start;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'plan_invoice_limit_reached'
      USING HINT = 'Votre offre actuelle limite le nombre de factures émises ce mois-ci.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_invoice_quota ON public.invoices;
CREATE TRIGGER trg_enforce_invoice_quota
  BEFORE INSERT OR UPDATE OF status ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.enforce_invoice_quota();

CREATE OR REPLACE FUNCTION public.enforce_client_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit integer;
  v_count integer;
BEGIN
  SELECT q.client_limit INTO v_limit FROM public.plan_quota_for(NEW.company_id) q;

  IF v_limit IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.clients c
  WHERE c.company_id = NEW.company_id
    AND c.id <> NEW.id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'plan_client_limit_reached'
      USING HINT = 'Votre offre actuelle limite le nombre de clients enregistrés.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_client_quota ON public.clients;
CREATE TRIGGER trg_enforce_client_quota
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.enforce_client_quota();
