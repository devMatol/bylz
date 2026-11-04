-- Migration: 20261031180000_factpulse_vat_backfill_and_snapshot.sql
-- 1. Extension enum pa_status, ajout colonnes pa_lifecycle_code et pa_status_updated_at
-- 2. Backfill postal_code et city depuis address (NULLIF('') avant COALESCE)
-- 3. Backfill vat_rate déduit de la facture (0 si total_vat=0, sinon 20, 10, 5.5 ou 2.1)
-- 4. Contrôle arithmétique strict uniquement sur les factures migrées (RAISE EXCEPTION si anomalie)
-- 5. freeze_invoice_legal_snapshot sans aucune référence à iban et rejet explicite si vat_rate est NULL

-- 1. Enrichissement du cycle de vie PA
DO $$
BEGIN
  ALTER TYPE public.pa_status ADD VALUE IF NOT EXISTS 'submitting';
  ALTER TYPE public.pa_status ADD VALUE IF NOT EXISTS 'litigation';
  ALTER TYPE public.pa_status ADD VALUE IF NOT EXISTS 'suspended';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS pa_lifecycle_code integer;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS pa_status_updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_pa_status_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pa_status IS DISTINCT FROM OLD.pa_status THEN
    NEW.pa_status_updated_at := clock_timestamp();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_pa_status_updated_at ON public.invoices;
CREATE TRIGGER trg_set_pa_status_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.set_pa_status_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS idx_pa_webhook_events_event_id 
ON public.pa_webhook_events (event_id) 
WHERE event_id IS NOT NULL;

-- 2. Extraction regex postal_code et city depuis address (ex: "10 rue de la Paix 75002 Paris")
-- Traite postal_code = '' comme absent (NULLIF avant COALESCE) et ignore les adresses non reconnues sans les modifier.
UPDATE public.companies
SET 
  postal_code = COALESCE(NULLIF(postal_code, ''), (regexp_match(address, '\m(\d{5})\s+([A-Za-zÀ-ÿ\- ''’]+)$'))[1]),
  city = COALESCE(NULLIF(city, ''), trim((regexp_match(address, '\m(\d{5})\s+([A-Za-zÀ-ÿ\- ''’]+)$'))[2]))
WHERE (postal_code IS NULL OR postal_code = '' OR city IS NULL OR city = '')
  AND address IS NOT NULL
  AND address ~ '\m\d{5}\s+([A-Za-zÀ-ÿ\- ''’]+)$';

UPDATE public.clients
SET 
  postal_code = COALESCE(NULLIF(postal_code, ''), (regexp_match(address, '\m(\d{5})\s+([A-Za-zÀ-ÿ\- ''’]+)$'))[1]),
  city = COALESCE(NULLIF(city, ''), trim((regexp_match(address, '\m(\d{5})\s+([A-Za-zÀ-ÿ\- ''’]+)$'))[2]))
WHERE (postal_code IS NULL OR postal_code = '' OR city IS NULL OR city = '')
  AND address IS NOT NULL
  AND address ~ '\m\d{5}\s+([A-Za-zÀ-ÿ\- ''’]+)$';

-- 3. Backfill vat_rate déduit de la FACTURE, pas du régime actuel de la société
DO $$
DECLARE
  v_inv record;
  v_matched_rate numeric;
  v_diff numeric;
  v_unmatched_count int := 0;
  v_migrated_count int := 0;
  v_verif record;
  c_rates numeric[] := ARRAY[20.0, 10.0, 5.5, 2.1];
  r numeric;
BEGIN
  -- Activation du bypass du verrou d'immutabilité fiscale
  PERFORM set_config('app.bypass_invoice_lock', 'on', true);

  CREATE TEMP TABLE IF NOT EXISTS tmp_migrated_invoices (
    invoice_id uuid PRIMARY KEY
  ) ON COMMIT DROP;

  CREATE TEMP TABLE IF NOT EXISTS tmp_unmatched_vat_invoices (
    invoice_id uuid PRIMARY KEY,
    invoice_number text,
    total_ht numeric,
    total_vat numeric,
    ratio numeric
  ) ON COMMIT DROP;

  -- Parcours des factures comportant des lignes sans vat_rate renseigné (IS NULL)
  FOR v_inv IN
    SELECT i.id, i.number, COALESCE(i.total_ht, 0) as total_ht, COALESCE(i.total_vat, 0) as total_vat
    FROM public.invoices i
    WHERE EXISTS (
      SELECT 1 FROM public.invoice_lines il 
      WHERE il.invoice_id = i.id AND il.vat_rate IS NULL
    )
  LOOP
    v_matched_rate := NULL;

    -- Cas 1 : total_vat = 0 -> 0% garanti
    IF v_inv.total_vat = 0 OR v_inv.total_ht = 0 THEN
      v_matched_rate := 0.0;
    ELSE
      -- Cas 2 : recherche parmi 20, 10, 5.5, 2.1 avec tolérance de 0.05 € sur le total
      FOREACH r IN ARRAY c_rates LOOP
        IF abs(round(v_inv.total_ht * (r / 100.0), 2) - v_inv.total_vat) <= 0.05 THEN
          v_matched_rate := r;
          EXIT;
        END IF;
      END LOOP;
    END IF;

    IF v_matched_rate IS NOT NULL THEN
      UPDATE public.invoice_lines
      SET vat_rate = v_matched_rate
      WHERE invoice_id = v_inv.id AND vat_rate IS NULL;
      
      INSERT INTO tmp_migrated_invoices (invoice_id) VALUES (v_inv.id) ON CONFLICT DO NOTHING;
      v_migrated_count := v_migrated_count + 1;
    ELSE
      -- Facture atypique ou multi-taux non déductible : lignes laissées à NULL sans modification
      v_unmatched_count := v_unmatched_count + 1;
      INSERT INTO tmp_unmatched_vat_invoices (invoice_id, invoice_number, total_ht, total_vat, ratio)
      VALUES (
        v_inv.id,
        v_inv.number,
        v_inv.total_ht,
        v_inv.total_vat,
        CASE WHEN v_inv.total_ht <> 0 THEN round((v_inv.total_vat / v_inv.total_ht) * 100, 2) ELSE NULL END
      ) ON CONFLICT (invoice_id) DO NOTHING;
      RAISE NOTICE 'Facture non migrée (taux atypique ou multi-taux) : ID %, N° %, HT %, TVA % (lignes restent à NULL)',
        v_inv.id, v_inv.number, v_inv.total_ht, v_inv.total_vat;
    END IF;
  END LOOP;

  -- 4. Contrôle arithmétique strict : UNIQUEMENT sur les factures migrées, exclut celles avec lignes NULL ou non migrées
  FOR v_verif IN
    SELECT 
      i.id,
      i.number,
      i.total_ht,
      COALESCE(i.total_vat, 0) as total_vat,
      COALESCE(SUM(round(il.quantity * il.unit_price * (il.vat_rate / 100.0), 2)), 0) as sum_calc_vat
    FROM public.invoices i
    JOIN public.invoice_lines il ON il.invoice_id = i.id
    WHERE i.id IN (SELECT invoice_id FROM tmp_migrated_invoices)
      AND NOT EXISTS (
        SELECT 1 FROM public.invoice_lines il_null 
        WHERE il_null.invoice_id = i.id AND il_null.vat_rate IS NULL
      )
    GROUP BY i.id, i.number, i.total_ht, i.total_vat
  LOOP
    v_diff := abs(v_verif.total_vat - v_verif.sum_calc_vat);
    IF v_diff > 0.05 THEN
      PERFORM set_config('app.bypass_invoice_lock', 'off', true);
      RAISE EXCEPTION 'Écart arithmétique TVA inacceptable sur facture % (ID: %) : total_vat=% € vs somme_lignes=% € (écart: % €)',
        v_verif.number, v_verif.id, v_verif.total_vat, v_verif.sum_calc_vat, v_diff;
    END IF;
  END LOOP;

  RAISE NOTICE 'Migration vat_rate terminée : % factures migrées avec succès, % factures atypiques conservées à NULL.',
    v_migrated_count, v_unmatched_count;

  -- Application de la contrainte NOT NULL si aucune ligne NULL ne subsiste
  IF NOT EXISTS (SELECT 1 FROM public.invoice_lines WHERE vat_rate IS NULL) THEN
    ALTER TABLE public.invoice_lines ALTER COLUMN vat_rate SET NOT NULL;
    RAISE NOTICE 'Contrainte NOT NULL appliquée sur public.invoice_lines.vat_rate';
  ELSE
    RAISE NOTICE 'Des lignes avec vat_rate NULL subsistent pour les factures atypiques : colonne maintenue nullable.';
  END IF;

  -- Désactivation du bypass
  PERFORM set_config('app.bypass_invoice_lock', 'off', true);
END $$;

-- 5. Mise à jour de freeze_invoice_legal_snapshot : erreur explicite si vat_rate est NULL, aucune référence à iban
CREATE OR REPLACE FUNCTION public.freeze_invoice_legal_snapshot()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_comp record;
  v_client record;
  v_lines jsonb;
BEGIN
  IF NEW.status <> 'draft' AND (OLD IS NULL OR OLD.status = 'draft' OR NEW.legal_snapshot IS NULL) THEN
    -- Contrôle strict : chaque ligne de la facture doit avoir son vat_rate renseigné
    IF EXISTS (SELECT 1 FROM public.invoice_lines WHERE invoice_id = NEW.id AND vat_rate IS NULL) THEN
      RAISE EXCEPTION 'Ligne de facture sans taux de TVA renseigné (vat_rate obligatoire).'
        USING ERRCODE = '23502';
    END IF;

    SELECT * INTO v_comp FROM public.companies WHERE id = NEW.company_id;
    SELECT * INTO v_client FROM public.clients WHERE id = NEW.client_id;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', il.id,
      'description', il.description,
      'quantity', il.quantity,
      'unit_price', il.unit_price,
      'nature', il.nature,
      'position', il.position,
      'vat_rate', il.vat_rate,
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
        'postal_code', v_comp.postal_code,
        'city', v_comp.city,
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
        'address', v_client.address,
        'postal_code', v_client.postal_code,
        'city', v_client.city
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
