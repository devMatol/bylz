-- tests/test_full_migrations_and_emit.sql
-- Validation d'émission et d'instantané légal sur schéma réel post-migrations

BEGIN;

DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS pgtap; EXCEPTION WHEN OTHERS THEN null; END $$;

SELECT plan(9);

DO $$
DECLARE
  v_user_tva uuid := '11111111-2222-3333-4444-555555555555'::uuid;
  v_comp_tva uuid := 'aaaa1111-2222-3333-4444-555555555555'::uuid;
  v_client_tva uuid := 'bbbb1111-2222-3333-4444-555555555555'::uuid;
  v_inv_tva uuid := 'cccc1111-2222-3333-4444-555555555555'::uuid;

  v_user_fra uuid := '22222222-3333-4444-5555-666666666666'::uuid;
  v_comp_fra uuid := 'aaaa2222-3333-4444-5555-666666666666'::uuid;
  v_client_fra uuid := 'bbbb2222-3333-4444-5555-666666666666'::uuid;
  v_inv_fra uuid := 'cccc2222-3333-4444-5555-666666666666'::uuid;

  v_emitted public.invoices%ROWTYPE;
  v_snap jsonb;
BEGIN
  -- Utilisateur et profil TVA (Solo)
  INSERT INTO auth.users (id, email) VALUES (v_user_tva, 'tva@bylz.fr') ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.profiles (id, email, plan) VALUES (v_user_tva, 'tva@bylz.fr', 'solo') ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.companies (
    id, user_id, siret, siren, legal_name, address, postal_code, city, activity_type, vat_regime, vat_option, structure, urssaf_frequency, accent_color, default_payment_terms, previous_ca
  ) VALUES (
    v_comp_tva, v_user_tva, '12345678900012', '123456789', 'Société TVA SAS', '10 Rue de la Paix', '75002', 'Paris', 'artisan_bic', 'vat', 'encaissements', 'SAS', 'monthly', '#000000', '30d', 0
  );

  INSERT INTO public.clients (
    id, company_id, name, type, siren, siret, address, postal_code, city
  ) VALUES (
    v_client_tva, v_comp_tva, 'Client B2B Pro', 'b2b', '987654321', '98765432100019', '20 Avenue des Champs', '75008', 'Paris'
  );

  -- Facture TVA en brouillon
  INSERT INTO public.invoices (
    id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, pa_status
  ) VALUES (
    v_inv_tva, v_comp_tva, v_client_tva, 'FAC-2026-TVA', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, '30d', 100.00, 20.00, 120.00, 'none'
  );

  INSERT INTO public.invoice_lines (
    id, invoice_id, description, quantity, unit_price, vat_rate, nature, position
  ) VALUES (
    gen_random_uuid(), v_inv_tva, 'Conseil dev', 1, 100.00, 20.00, 'service', 1
  );

  -- Configuration du contexte JWT pour l'utilisateur TVA
  PERFORM set_config('request.jwt.claim.sub', v_user_tva::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- Émission via emit_invoice()
  v_emitted := public.emit_invoice(v_inv_tva);
  v_snap := v_emitted.legal_snapshot;

  PERFORM ok(v_emitted.status = 'pending', 'Émission réussie : la facture passe au statut pending');
  PERFORM is(v_emitted.number, 'FAC-2026-001', 'Masque séquentiel sur 3 chiffres : FAC-2026-001');
  PERFORM ok(v_snap IS NOT NULL, 'Émission réussie : legal_snapshot généré et non null');
  PERFORM is(v_snap->'seller'->>'postal_code', '75002', 'Snapshot seller postal_code exact');
  PERFORM is(v_snap->'buyer'->>'city', 'Paris', 'Snapshot buyer city exact');
  PERFORM ok(NOT (v_snap->'seller' ? 'iban'), 'Snapshot seller ne contient aucune clé iban inexistante');
  PERFORM is((v_snap->'lines'->0->>'vat_rate')::numeric, 20.00, 'Snapshot ligne vat_rate = 20% exact');

  -- Test de modification autorisée pa_status sur facture émise
  UPDATE public.invoices 
  SET pa_status = 'submitting' 
  WHERE id = v_inv_tva;

  UPDATE public.invoices 
  SET pa_status = 'submitted', pa_lifecycle_code = 200 
  WHERE id = v_inv_tva;

  PERFORM ok(
    (SELECT pa_status FROM public.invoices WHERE id = v_inv_tva) = 'submitted',
    'UPDATE pa_status vers submitted sur facture émise autorisé sous RLS et trigger d inaltérabilité'
  );

  -- Test facture en franchise en base
  INSERT INTO auth.users (id, email) VALUES (v_user_fra, 'fra@bylz.fr') ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.profiles (id, email, plan) VALUES (v_user_fra, 'fra@bylz.fr', 'solo') ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.companies (
    id, user_id, siret, siren, legal_name, address, postal_code, city, activity_type, vat_regime, structure, urssaf_frequency, accent_color, default_payment_terms, previous_ca
  ) VALUES (
    v_comp_fra, v_user_fra, '55555555500011', '555555555', 'Micro Franchise', '5 Rue Verte', '69001', 'Lyon', 'freelance_bnc', 'franchise', 'EI', 'quarterly', '#111111', 'on_receipt', 0
  );

  INSERT INTO public.clients (
    id, company_id, name, type, address, postal_code, city
  ) VALUES (
    v_client_fra, v_comp_fra, 'Client Particulier', 'b2c', '10 Rue Bleue', '69002', 'Lyon'
  );

  INSERT INTO public.invoices (
    id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, pa_status
  ) VALUES (
    v_inv_fra, v_comp_fra, v_client_fra, 'FAC-2026-FRA', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 200.00, 0.00, 200.00, 'none'
  );

  INSERT INTO public.invoice_lines (
    id, invoice_id, description, quantity, unit_price, vat_rate, nature, position
  ) VALUES (
    gen_random_uuid(), v_inv_fra, 'Formation', 2, 100.00, 0.00, 'service', 1
  );

  PERFORM set_config('request.jwt.claim.sub', v_user_fra::text, true);
  v_emitted := public.emit_invoice(v_inv_fra);
  v_snap := v_emitted.legal_snapshot;

  PERFORM is((v_snap->'lines'->0->>'vat_rate')::numeric, 0.00, 'Facture franchise : ligne snapshot vat_rate = 0% garanti');

END $$;

SELECT finish();

COMMIT;
