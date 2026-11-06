-- tests/test_cancel_bank_transaction.sql
-- Suite de tests transactionnels complets pour l'inaltérabilité, la traçabilité bancaire et le RGPD
-- Exécutable sur base de test / psql / supabase test db / PGlite :
--   psql -h localhost -p 54322 -U postgres -d postgres -f tests/test_cancel_bank_transaction.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(89);

-- =========================================================================
-- SETUP : Création des utilisateurs, entreprises et connexions bancaires
-- =========================================================================
DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_user_b UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_comp_b UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID;
  v_client_a UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_client_b UUID := 'c2222222-2222-2222-2222-222222222222'::UUID;
  v_conn_a UUID := 'd1111111-1111-1111-1111-111111111111'::UUID;
  v_conn_b UUID := 'd2222222-2222-2222-2222-222222222222'::UUID;
BEGIN
  -- 1. Lignes auth.users créées en premier
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (id, email, aud, role) 
    VALUES 
      (v_user_a, 'user_a@test.local', 'authenticated', 'authenticated'),
      (v_user_b, 'user_b@test.local', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 2. Profils et Entreprise A
  INSERT INTO public.profiles (id, email, plan) VALUES (v_user_a, 'user_a@test.local', 'solo')
  ON CONFLICT (id) DO UPDATE SET plan = 'solo';
  INSERT INTO public.companies (id, user_id, siret, siren, legal_name, address, postal_code, city, activity_type, vat_regime, structure, urssaf_frequency, accent_color, default_payment_terms, previous_ca)
  VALUES (v_comp_a, v_user_a, '11111111100011', '111111111', 'Entreprise A EI', '1 rue A', '75001', 'Paris', 'freelance_bnc', 'franchise', 'micro', 'quarterly', '#7C6FE0', 'on_receipt', 0)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.clients (id, company_id, name, type, siren, address, postal_code, city) VALUES (v_client_a, v_comp_a, 'Client A', 'b2b', '111111111', '1 rue Client', '75001', 'Paris') ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.bank_connections (id, company_id, provider_item_id, bank_name, status)
  VALUES (v_conn_a, v_comp_a, 'conn_a_001', 'Qonto', 'active') ON CONFLICT (id) DO NOTHING;

  -- 3. Profils et Entreprise B
  INSERT INTO public.profiles (id, email, plan) VALUES (v_user_b, 'user_b@test.local', 'solo')
  ON CONFLICT (id) DO UPDATE SET plan = 'solo';
  INSERT INTO public.companies (id, user_id, siret, siren, legal_name, address, postal_code, city, activity_type, vat_regime, structure, urssaf_frequency, accent_color, default_payment_terms, previous_ca)
  VALUES (v_comp_b, v_user_b, '22222222200022', '222222222', 'Entreprise B EI', '2 rue B', '75002', 'Paris', 'freelance_bnc', 'franchise', 'micro', 'quarterly', '#7C6FE0', 'on_receipt', 0)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.clients (id, company_id, name, type, siren, address, postal_code, city) VALUES (v_client_b, v_comp_b, 'Client B', 'b2b', '222222222', '2 rue Client', '75002', 'Paris') ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.bank_connections (id, company_id, provider_item_id, bank_name, status)
  VALUES (v_conn_b, v_comp_b, 'conn_b_001', 'BoursoBank', 'active') ON CONFLICT (id) DO NOTHING;
END $$;

-- =========================================================================
-- SCÉNARIO 1 : Appel sans utilisateur connecté (auth.uid() IS NULL) -> levée d'exception exacte
-- =========================================================================
DO $$
DECLARE
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_conn_a UUID := 'd1111111-1111-1111-1111-111111111111'::UUID;
  v_tx UUID := gen_random_uuid();
  v_err_msg TEXT := '';
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('request.jwt.claim.role', 'anon', true);

  INSERT INTO public.bank_transactions (id, company_id, bank_connection_id, external_id, amount, currency, transaction_date, label, match_status)
  VALUES (v_tx, v_comp_a, v_conn_a, 'ext_test_anon_01', 100, 'EUR', CURRENT_DATE, 'Virement Test Anon', 'unmatched');

  BEGIN
    PERFORM public.cancel_bank_transaction_match(v_tx);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_msg = MESSAGE_TEXT;
  END;

  PERFORM is(v_err_msg, 'Authentification requise : auth.uid() est NULL.', 'Scénario 1 : Appel sans utilisateur connecté refusé avec message exact');
END $$;

-- =========================================================================
-- SCÉNARIO 2 : Isolation A contre B (Utilisateur A tente d'annuler une transaction de B)
-- =========================================================================
DO $$
DECLARE
  v_comp_b UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID;
  v_client_b UUID := 'c2222222-2222-2222-2222-222222222222'::UUID;
  v_conn_b UUID := 'd2222222-2222-2222-2222-222222222222'::UUID;
  v_inv_b UUID := gen_random_uuid();
  v_tx_b UUID := gen_random_uuid();
  v_pay_b UUID := gen_random_uuid();
  v_err_msg TEXT := '';
BEGIN
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_amount)
  VALUES (v_inv_b, v_comp_b, v_client_b, 'FAC-B-001', 'invoice', 'paid', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 100, 0, 100, 100);

  INSERT INTO public.bank_transactions (id, company_id, bank_connection_id, external_id, amount, currency, transaction_date, label, match_status, matched_invoice_id)
  VALUES (v_tx_b, v_comp_b, v_conn_b, 'ext_tx_b_001', 100, 'EUR', CURRENT_DATE, 'Virement Client B', 'manual_matched', v_inv_b);

  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source, bank_transaction_id)
  VALUES (v_pay_b, v_inv_b, 100, 'transfer', CURRENT_TIMESTAMP, 'bank_sync', v_tx_b);

  -- Simuler connexion de l'utilisateur A
  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    PERFORM public.cancel_bank_transaction_match(v_tx_b);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_msg = MESSAGE_TEXT;
  END;

  PERFORM is(v_err_msg, 'Accès refusé : la transaction n''appartient pas à l''utilisateur connecté.', 'Scénario 2 : Isolation A contre B vérifiée avec message exact');
END $$;

-- =========================================================================
-- SCÉNARIO 3 : Inaltérabilité des paiements (UPDATE et DELETE directs bloqués)
-- =========================================================================
DO $$
DECLARE
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_client_a UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_inv UUID := gen_random_uuid();
  v_pay UUID := gen_random_uuid();
  v_update_err TEXT := '';
  v_delete_err TEXT := '';
BEGIN
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_amount)
  VALUES (v_inv, v_comp_a, v_client_a, 'FAC-A-INAL-01', 'invoice', 'paid', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 150, 0, 150, 150);

  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source)
  VALUES (v_pay, v_inv, 150, 'transfer', CURRENT_TIMESTAMP, 'manual');

  -- Test UPDATE direct
  BEGIN
    UPDATE public.payments SET amount = 200 WHERE id = v_pay;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_update_err = MESSAGE_TEXT;
  END;

  -- Test DELETE direct
  BEGIN
    DELETE FROM public.payments WHERE id = v_pay;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_delete_err = MESSAGE_TEXT;
  END;

  PERFORM is(v_update_err, 'Inaltérabilité comptable : la modification d''un paiement enregistré est strictement interdite. Seule une contre-passation est autorisée.', 'Scénario 3a : L''UPDATE direct d''un paiement est bloqué par le trigger');
  PERFORM is(v_delete_err, 'Inaltérabilité comptable : la suppression d''un paiement enregistré est strictement interdite. Seule une contre-passation est autorisée.', 'Scénario 3b : Le DELETE direct d''un paiement est bloqué par le trigger');
END $$;

-- =========================================================================
-- SCÉNARIO 4 : Annulation simple (Facture payée en 1 fois par virement)
-- =========================================================================
DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_client_a UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_conn_a UUID := 'd1111111-1111-1111-1111-111111111111'::UUID;
  v_inv UUID := gen_random_uuid();
  v_tx UUID := gen_random_uuid();
  v_pay UUID := gen_random_uuid();
  v_res JSONB;
  v_inv_status public.invoice_status;
  v_rev_count INT;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_user_a::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_amount)
  VALUES (v_inv, v_comp_a, v_client_a, 'FAC-A-002', 'invoice', 'paid', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 250, 0, 250, 250);

  INSERT INTO public.bank_transactions (id, company_id, bank_connection_id, external_id, amount, currency, transaction_date, label, match_status, matched_invoice_id)
  VALUES (v_tx, v_comp_a, v_conn_a, 'ext_tx_a_002', 250, 'EUR', CURRENT_DATE, 'Virement Client 250', 'manual_matched', v_inv);

  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source, bank_transaction_id)
  VALUES (v_pay, v_inv, 250, 'transfer', CURRENT_TIMESTAMP, 'bank_sync', v_tx);

  v_res := public.cancel_bank_transaction_match(v_tx);

  SELECT status INTO v_inv_status FROM public.invoices WHERE id = v_inv;
  SELECT count(*) INTO v_rev_count FROM public.payments WHERE reversed_payment_id = v_pay AND amount = -250 AND is_reversal = true;

  PERFORM is(v_inv_status::text, 'pending', 'Scénario 4a : Statut de la facture après annulation simple = pending');
  PERFORM is(v_rev_count, 1, 'Scénario 4b : Une écriture de contre-passation de -250 € a été insérée');
END $$;

-- =========================================================================
-- SCÉNARIO 5 : Un paiement parmi deux (Acompte 400 € + Solde bancaire 600 €)
-- =========================================================================
DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_client_a UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_conn_a UUID := 'd1111111-1111-1111-1111-111111111111'::UUID;
  v_inv UUID := gen_random_uuid();
  v_tx UUID := gen_random_uuid();
  v_pay1 UUID := gen_random_uuid();
  v_pay2 UUID := gen_random_uuid();
  v_res JSONB;
  v_inv_status public.invoice_status;
  v_inv_paid_amount NUMERIC;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_user_a::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_amount)
  VALUES (v_inv, v_comp_a, v_client_a, 'FAC-A-003', 'invoice', 'paid', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 1000, 0, 1000, 1000);

  -- Acompte de 400 € (manuel)
  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source)
  VALUES (v_pay1, v_inv, 400, 'cash', CURRENT_TIMESTAMP, 'manual');

  -- Solde de 600 € (bancaire)
  INSERT INTO public.bank_transactions (id, company_id, bank_connection_id, external_id, amount, currency, transaction_date, label, match_status, matched_invoice_id)
  VALUES (v_tx, v_comp_a, v_conn_a, 'ext_tx_a_003', 600, 'EUR', CURRENT_DATE, 'Virement Solde 600', 'manual_matched', v_inv);

  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source, bank_transaction_id)
  VALUES (v_pay2, v_inv, 600, 'transfer', CURRENT_TIMESTAMP, 'bank_sync', v_tx);

  v_res := public.cancel_bank_transaction_match(v_tx);

  SELECT status, paid_amount INTO v_inv_status, v_inv_paid_amount FROM public.invoices WHERE id = v_inv;

  PERFORM is(v_inv_paid_amount, 400.00::NUMERIC, 'Scénario 5a : Somme algébrique restante après annulation partielle = 400.00 €');
  PERFORM is(v_inv_status::text, 'partially_paid', 'Scénario 5b : Statut repositionné à partially_paid');
END $$;

-- =========================================================================
-- SCÉNARIO 6 : Protection double-clic (Deux appels consécutifs)
-- =========================================================================
DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_client_a UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_conn_a UUID := 'd1111111-1111-1111-1111-111111111111'::UUID;
  v_inv UUID := gen_random_uuid();
  v_tx UUID := gen_random_uuid();
  v_pay UUID := gen_random_uuid();
  v_res1 JSONB;
  v_res2 JSONB;
  v_rev_count INT;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_user_a::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_amount)
  VALUES (v_inv, v_comp_a, v_client_a, 'FAC-A-004', 'invoice', 'paid', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 300, 0, 300, 300);

  INSERT INTO public.bank_transactions (id, company_id, bank_connection_id, external_id, amount, currency, transaction_date, label, match_status, matched_invoice_id)
  VALUES (v_tx, v_comp_a, v_conn_a, 'ext_tx_a_004', 300, 'EUR', CURRENT_DATE, 'Virement 300', 'manual_matched', v_inv);

  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source, bank_transaction_id)
  VALUES (v_pay, v_inv, 300, 'transfer', CURRENT_TIMESTAMP, 'bank_sync', v_tx);

  v_res1 := public.cancel_bank_transaction_match(v_tx);
  v_res2 := public.cancel_bank_transaction_match(v_tx);

  SELECT count(*) INTO v_rev_count FROM public.payments WHERE reversed_payment_id = v_pay;

  PERFORM is(v_rev_count, 1, 'Scénario 6 : Une seule contre-passation enregistrée malgré le double clic');
END $$;

-- =========================================================================
-- SCÉNARIO 7 : Annulation d'un encaissement du mois précédent (Règle de date)
-- =========================================================================
DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_client_a UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_conn_a UUID := 'd1111111-1111-1111-1111-111111111111'::UUID;
  v_inv UUID := gen_random_uuid();
  v_tx UUID := gen_random_uuid();
  v_pay UUID := gen_random_uuid();
  v_res JSONB;
  v_rev_date DATE;
  v_today_paris DATE := (clock_timestamp() AT TIME ZONE 'Europe/Paris')::DATE;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_user_a::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_amount)
  VALUES (v_inv, v_comp_a, v_client_a, 'FAC-A-005', 'invoice', 'paid', CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '40 days', 'on_receipt', 500, 0, 500, 500);

  INSERT INTO public.bank_transactions (id, company_id, bank_connection_id, external_id, amount, currency, transaction_date, label, match_status, matched_invoice_id)
  VALUES (v_tx, v_comp_a, v_conn_a, 'ext_tx_a_005', 500, 'EUR', CURRENT_DATE - INTERVAL '40 days', 'Virement Ancien', 'manual_matched', v_inv);

  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source, bank_transaction_id)
  VALUES (v_pay, v_inv, 500, 'transfer', CURRENT_TIMESTAMP - INTERVAL '40 days', 'bank_sync', v_tx);

  v_res := public.cancel_bank_transaction_match(v_tx);

  SELECT paid_at::DATE INTO v_rev_date FROM public.payments WHERE reversed_payment_id = v_pay;

  PERFORM is(v_rev_date, v_today_paris, 'Scénario 7a : La contre-passation porte la date du jour Europe/Paris');
  PERFORM ok((v_res->>'warning') IS NOT NULL, 'Scénario 7b : Un message d''avertissement URSSAF/TVA est retourné');
END $$;

-- =========================================================================
-- SCÉNARIO 8 : Suppression de transaction bancaire : non rapprochée vs rapprochée
-- =========================================================================
DO $$
DECLARE
  v_conn_a UUID := 'd1111111-1111-1111-1111-111111111111'::UUID;
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_client_a UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_tx_free UUID := gen_random_uuid();
  v_tx_matched UUID := gen_random_uuid();
  v_inv UUID := gen_random_uuid();
  v_pay UUID := gen_random_uuid();
  v_free_deleted BOOLEAN := FALSE;
  v_err_sqlstate TEXT := '';
BEGIN
  -- 1. Transaction non rapprochée
  INSERT INTO public.bank_transactions (id, company_id, bank_connection_id, external_id, amount, currency, transaction_date, label, match_status)
  VALUES (v_tx_free, v_comp_a, v_conn_a, 'ext_free_del_01', 50, 'EUR', CURRENT_DATE, 'Achat Fournitures Non Rapproché', 'unmatched');

  DELETE FROM public.bank_transactions WHERE id = v_tx_free;
  v_free_deleted := TRUE;

  -- 2. Transaction rapprochée et référencée par un paiement
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_amount)
  VALUES (v_inv, v_comp_a, v_client_a, 'FAC-A-DEL-01', 'invoice', 'paid', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 80, 0, 80, 80);

  INSERT INTO public.bank_transactions (id, company_id, bank_connection_id, external_id, amount, currency, transaction_date, label, match_status, matched_invoice_id)
  VALUES (v_tx_matched, v_comp_a, v_conn_a, 'ext_matched_del_01', 80, 'EUR', CURRENT_DATE, 'Virement Rapproché', 'manual_matched', v_inv);

  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source, bank_transaction_id)
  VALUES (v_pay, v_inv, 80, 'transfer', CURRENT_TIMESTAMP, 'bank_sync', v_tx_matched);

  -- Forcer la vérification immédiate de la contrainte différée
  SET CONSTRAINTS ALL IMMEDIATE;
  BEGIN
    DELETE FROM public.bank_transactions WHERE id = v_tx_matched;
  EXCEPTION WHEN foreign_key_violation THEN
    GET STACKED DIAGNOSTICS v_err_sqlstate = RETURNED_SQLSTATE;
  END;
  SET CONSTRAINTS ALL DEFERRED;

  PERFORM ok(v_free_deleted, 'Scénario 8a : La suppression d''une transaction non rapprochée doit réussir');
  PERFORM is(v_err_sqlstate, '23503', 'Scénario 8b : La suppression d''une transaction rapprochée est bloquée par FK (code 23503)');
END $$;

-- =========================================================================
-- SCÉNARIO 9 : Rapprochement -> Annulation -> Ré-association -> Deuxième annulation
-- =========================================================================
DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_client_a UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_conn_a UUID := 'd1111111-1111-1111-1111-111111111111'::UUID;
  v_inv UUID := gen_random_uuid();
  v_tx UUID := gen_random_uuid();
  v_pay1 UUID := gen_random_uuid();
  v_pay2 UUID := gen_random_uuid();
  v_res1 JSONB;
  v_res2 JSONB;
  v_final_status public.invoice_status;
  v_final_paid NUMERIC;
  v_reversals_count INT;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_user_a::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_amount)
  VALUES (v_inv, v_comp_a, v_client_a, 'FAC-A-REMATCH', 'invoice', 'paid', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 500, 0, 500, 500);

  INSERT INTO public.bank_transactions (id, company_id, bank_connection_id, external_id, amount, currency, transaction_date, label, match_status, matched_invoice_id)
  VALUES (v_tx, v_comp_a, v_conn_a, 'ext_tx_a_rematch', 500, 'EUR', CURRENT_DATE, 'Virement 500', 'manual_matched', v_inv);

  -- 1er paiement et 1ère annulation
  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source, bank_transaction_id)
  VALUES (v_pay1, v_inv, 500, 'transfer', CURRENT_TIMESTAMP, 'bank_sync', v_tx);

  v_res1 := public.cancel_bank_transaction_match(v_tx);

  -- 2ème rapprochement de la même transaction sur la facture
  UPDATE public.bank_transactions
  SET matched_invoice_id = v_inv, match_status = 'manual_matched'
  WHERE id = v_tx;

  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source, bank_transaction_id)
  VALUES (v_pay2, v_inv, 500, 'transfer', CURRENT_TIMESTAMP, 'bank_sync', v_tx);

  UPDATE public.invoices SET status = 'paid', paid_amount = 500 WHERE id = v_inv;

  -- 2ème annulation : doit cibler v_pay2 et non v_pay1 déjà contre-passé
  v_res2 := public.cancel_bank_transaction_match(v_tx);

  SELECT status, paid_amount INTO v_final_status, v_final_paid FROM public.invoices WHERE id = v_inv;
  SELECT count(*) INTO v_reversals_count FROM public.payments WHERE invoice_id = v_inv AND is_reversal = true;

  PERFORM is(v_final_status::text, 'pending', 'Scénario 9a : Après deuxième annulation, statut retombe à pending');
  PERFORM is(v_reversals_count, 2, 'Scénario 9b : Deux contre-passations distinctes enregistrées avec solde net à 0 €');
END $$;

-- =========================================================================
-- SCÉNARIO 10 : company_id pérenne, déconnexion, annulation propriétaire vs refus tiers
-- =========================================================================
DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_user_b UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_client_a UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_conn_temp UUID := gen_random_uuid();
  v_inv UUID := gen_random_uuid();
  v_tx UUID := gen_random_uuid();
  v_tx_unmatched UUID := gen_random_uuid();
  v_pay UUID := gen_random_uuid();
  v_conn_exists BOOLEAN;
  v_tx_conn_id UUID;
  v_tx_comp_id UUID;
  v_unauthorized_err TEXT := '';
  v_unmatched_err TEXT := '';
  v_res_owner JSONB;
  v_res_already JSONB;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_user_a::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- Création d'une connexion bancaire temporaire
  INSERT INTO public.bank_connections (id, company_id, provider_item_id, bank_name, status)
  VALUES (v_conn_temp, v_comp_a, 'item_temp_p2', 'Crédit Mutuel', 'active');

  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_amount)
  VALUES (v_inv, v_comp_a, v_client_a, 'FAC-A-P2', 'invoice', 'paid', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 450, 0, 450, 450);

  INSERT INTO public.bank_transactions (id, company_id, bank_connection_id, external_id, amount, currency, transaction_date, label, match_status, matched_invoice_id)
  VALUES (v_tx, v_comp_a, v_conn_temp, 'ext_tx_p2_matched', 450, 'EUR', CURRENT_DATE, 'Virement Rapproché P2', 'manual_matched', v_inv);

  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source, bank_transaction_id)
  VALUES (v_pay, v_inv, 450, 'transfer', CURRENT_TIMESTAMP, 'bank_sync', v_tx);

  -- Déconnexion de la banque : bank_connections supprimée, bank_transactions.bank_connection_id = NULL
  PERFORM public.disconnect_bank_connection(v_conn_temp);

  SELECT EXISTS(SELECT 1 FROM public.bank_connections WHERE id = v_conn_temp) INTO v_conn_exists;
  SELECT bank_connection_id, company_id INTO v_tx_conn_id, v_tx_comp_id FROM public.bank_transactions WHERE id = v_tx;

  PERFORM is(v_conn_exists, false, 'Scénario 10a : La connexion bancaire a été supprimée lors de la déconnexion');
  PERFORM ok(v_tx_conn_id IS NULL AND v_tx_comp_id = v_comp_a, 'Scénario 10b : bank_connection_id est NULL mais company_id est conservé sur la transaction');

  -- Tentative d'annulation par l'utilisateur B (tiers) -> Doit échouer grâce au company_id
  PERFORM set_config('request.jwt.claim.sub', v_user_b::TEXT, true);
  BEGIN
    PERFORM public.cancel_bank_transaction_match(v_tx);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_unauthorized_err = MESSAGE_TEXT;
  END;

  PERFORM is(v_unauthorized_err, 'Accès refusé : la transaction n''appartient pas à l''utilisateur connecté.', 'Scénario 10c : Tentative d''annulation par un tiers sur transaction déconnectée refusée');

  -- Annulation par le propriétaire (utilisateur A) -> Doit réussir
  PERFORM set_config('request.jwt.claim.sub', v_user_a::TEXT, true);
  v_res_owner := public.cancel_bank_transaction_match(v_tx);

  PERFORM is((v_res_owner->>'success')::text, 'true', 'Scénario 10d : L''annulation par le propriétaire de la transaction déconnectée réussit');

  -- Deuxième appel d'annulation par le propriétaire alors que la transaction est déjà dé-rapprochée (matched_invoice_id IS NULL)
  -- Doit renvoyer already_cancelled = true sans lever d'exception (Point 1)
  v_res_already := public.cancel_bank_transaction_match(v_tx);

  PERFORM is((v_res_already->>'already_cancelled')::text, 'true', 'Scénario 10e : Second appel sur transaction déjà dé-rapprochée et contre-passée renvoie already_cancelled = true');

  -- Appel sur une transaction qui n'a JAMAIS été rapprochée -> Doit lever l'exception (Point 1)
  INSERT INTO public.bank_transactions (id, company_id, external_id, amount, currency, transaction_date, label, match_status)
  VALUES (v_tx_unmatched, v_comp_a, 'ext_never_matched', 10, 'EUR', CURRENT_DATE, 'Frais bancaires', 'unmatched');

  BEGIN
    PERFORM public.cancel_bank_transaction_match(v_tx_unmatched);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_unmatched_err = MESSAGE_TEXT;
  END;

  PERFORM is(v_unmatched_err, 'Cette transaction bancaire n''est pas rapprochée d''une facture.', 'Scénario 10f : Appel sur transaction jamais rapprochée lève bien l''exception attendue');
END $$;

-- =========================================================================
-- SCÉNARIO 11 : Contrainte stricte de signe sur payments
-- =========================================================================
DO $$
DECLARE
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_client_a UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_inv UUID := gen_random_uuid();
  v_err_neg TEXT := '';
  v_err_pos TEXT := '';
BEGIN
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_amount)
  VALUES (v_inv, v_comp_a, v_client_a, 'FAC-A-SIGN', 'invoice', 'pending', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 200, 0, 200, NULL);

  -- 11a : Paiement négatif sans être une contre-passation -> rejeté
  BEGIN
    INSERT INTO public.payments (invoice_id, amount, method, is_reversal)
    VALUES (v_inv, -50, 'transfer', false);
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS v_err_neg = RETURNED_SQLSTATE;
  END;

  -- 11b : Paiement positif avec flag is_reversal = true -> rejeté
  BEGIN
    INSERT INTO public.payments (invoice_id, amount, method, is_reversal)
    VALUES (v_inv, 50, 'transfer', true);
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS v_err_pos = RETURNED_SQLSTATE;
  END;

  PERFORM is(v_err_neg, '23514', 'Scénario 11a : Paiement négatif sans is_reversal rejeté par CHECK payments_amount_sign');
  PERFORM is(v_err_pos, '23514', 'Scénario 11b : Contre-passation positive rejetée par CHECK payments_amount_sign');
END $$;

-- =========================================================================
-- SCÉNARIO 12 : Procédure RGPD d'anonymisation (delete_company_gdpr)
-- =========================================================================
DO $$
DECLARE
  v_user_temp UUID := gen_random_uuid();
  v_comp_temp UUID := gen_random_uuid();
  v_client_temp UUID := gen_random_uuid();
  v_inv_temp UUID := gen_random_uuid();
  v_pay_temp UUID := gen_random_uuid();
  v_unauthorized_err TEXT := '';
  v_gdpr_res JSONB;
  v_inv_still_exists BOOLEAN;
  v_pay_still_exists BOOLEAN;
  v_comp_phone TEXT;
  v_client_email TEXT;
BEGIN
  -- 1. auth.users créé en premier
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (id, email, aud, role)
    VALUES (v_user_temp, 'gdpr_user@test.local', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 2. Profil et Société avec tous les champs NOT NULL fournis
  INSERT INTO public.profiles (id, email, plan) VALUES (v_user_temp, 'gdpr_user@test.local', 'solo') ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.companies (id, user_id, siret, siren, legal_name, address, activity_type, vat_regime, structure, urssaf_frequency, accent_color, default_payment_terms, previous_ca, phone)
  VALUES (v_comp_temp, v_user_temp, '99999999900099', '999999999', 'Entreprise GDPR Test EI', '9 rue Test', 'freelance_bnc', 'franchise', 'micro', 'quarterly', '#7C6FE0', 'on_receipt', 0, '0611223344');

  -- 3. Client B2B avec SIREN fourni
  INSERT INTO public.clients (id, company_id, name, type, siren, email, address) 
  VALUES (v_client_temp, v_comp_temp, 'Client B2B Test', 'b2b', '999999999', 'contact@clientb2b.fr', '10 rue Client');

  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_amount)
  VALUES (v_inv_temp, v_comp_temp, v_client_temp, 'FAC-GDPR-01', 'invoice', 'paid', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 350, 0, 350, 350);

  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source)
  VALUES (v_pay_temp, v_inv_temp, 350, 'transfer', CURRENT_TIMESTAMP, 'manual');

  -- 12a : Appel en tant qu'utilisateur standard -> Doit être refusé
  PERFORM set_config('request.jwt.claim.sub', v_user_temp::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    PERFORM public.delete_company_gdpr(v_comp_temp);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_unauthorized_err = MESSAGE_TEXT;
  END;

  PERFORM is(v_unauthorized_err, 'Accès refusé : la procédure de suppression RGPD est strictement réservée au rôle service_role.', 'Scénario 12a : delete_company_gdpr refusé pour un utilisateur standard');

  -- 12b : Appel en tant que service_role -> Succès d'anonymisation
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  v_gdpr_res := public.delete_company_gdpr(v_comp_temp);

  PERFORM is((v_gdpr_res->>'anonymized')::text, 'true', 'Scénario 12b : delete_company_gdpr exécuté avec succès en mode anonymisation');

  -- 12c : Vérification de la conservation stricte des pièces comptables (Art. L123-22 Code de commerce)
  SELECT EXISTS(SELECT 1 FROM public.invoices WHERE id = v_inv_temp) INTO v_inv_still_exists;
  SELECT EXISTS(SELECT 1 FROM public.payments WHERE id = v_pay_temp) INTO v_pay_still_exists;

  PERFORM ok(v_inv_still_exists AND v_pay_still_exists, 'Scénario 12c : Factures et paiements conservés intacts pour les obligations légales de 10 ans');

  -- 12d : Téléphone et canaux de contact de l'entreprise purgés
  SELECT phone INTO v_comp_phone FROM public.companies WHERE id = v_comp_temp;
  PERFORM ok(v_comp_phone IS NULL, 'Scénario 12d : Numéro de téléphone et canaux directs de l''entreprise purgés');

  -- 12e : E-mail du client purgé
  SELECT email INTO v_client_email FROM public.clients WHERE id = v_client_temp;
  PERFORM ok(v_client_email IS NULL, 'Scénario 12e : E-mail de contact du client purgé');
END $$;

-- =========================================================================
-- SCÉNARIO 13 : SÉCURITÉ - Attaque réelle sous SET ROLE authenticated
-- =========================================================================
DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_user_b UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_comp_b UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID;
  v_client_a UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_inv_a UUID := gen_random_uuid();
  v_pay_a UUID := gen_random_uuid();
  v_attack_tx UUID := gen_random_uuid();
  v_tampered_tx UUID := gen_random_uuid();
  v_rls_violation_code TEXT := '';
  v_rpc_err_msg TEXT := '';
  v_inv_a_status public.invoice_status;
  v_inv_a_paid NUMERIC;
BEGIN
  -- Setup de la victime (Entreprise A / Utilisateur A)
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_amount)
  VALUES (v_inv_a, v_comp_a, v_client_a, 'FAC-A-VICTIM', 'invoice', 'paid', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 800, 0, 800, 800);

  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source)
  VALUES (v_pay_a, v_inv_a, 800, 'transfer', CURRENT_TIMESTAMP, 'manual');

  -- 13a : Attaque d'insertion pirate sous rôle authenticated
  -- L'attaquant B tente d'insérer dans sa société B une transaction pointant vers la facture de A
  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_user_b::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    INSERT INTO public.bank_transactions (id, company_id, external_id, amount, currency, transaction_date, label, match_status, matched_invoice_id)
    VALUES (v_attack_tx, v_comp_b, 'ext_attack_rls_01', 800, 'EUR', CURRENT_DATE, 'Tentative Rapprochement Volé', 'manual_matched', v_inv_a);
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_rls_violation_code = RETURNED_SQLSTATE;
  END;

  RESET ROLE;

  PERFORM is(v_rls_violation_code, '42501', 'Scénario 13a : L''insertion pirate d''une facture d''autrui sous SET ROLE authenticated est bloquée par RLS WITH CHECK (code 42501)');

  -- 13b : Attaque par appel RPC sur transaction frauduleuse injectée
  -- Même si une transaction frauduleuse existait en base (ex: bug système),
  -- cancel_bank_transaction_match doit vérifier l'étanchéité société-facture
  INSERT INTO public.bank_transactions (id, company_id, external_id, amount, currency, transaction_date, label, match_status, matched_invoice_id)
  VALUES (v_tampered_tx, v_comp_b, 'ext_tampered_tx_01', 800, 'EUR', CURRENT_DATE, 'Transaction Frauduleuse', 'manual_matched', v_inv_a);

  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_user_b::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    PERFORM public.cancel_bank_transaction_match(v_tampered_tx);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_rpc_err_msg = MESSAGE_TEXT;
  END;

  RESET ROLE;

  PERFORM is(v_rpc_err_msg, 'Accès refusé : la facture rapprochée n''appartient pas à la même entreprise que la transaction.', 'Scénario 13b : cancel_bank_transaction_match bloque l''attaque avec exception stricte d''étanchéité');

  -- 13c : Vérification de l'intégrité de la victime A
  SELECT status, paid_amount INTO v_inv_a_status, v_inv_a_paid FROM public.invoices WHERE id = v_inv_a;
  PERFORM ok(v_inv_a_status = 'paid' AND v_inv_a_paid = 800, 'Scénario 13c : La facture et le paiement de la victime A sont restés 100% intacts');
END $$;

-- =========================================================================
-- SCÉNARIO 14 : Inaltérabilité des factures, lignes et transition de statut sous SET ROLE authenticated
-- =========================================================================
DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_client_a UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_inv_draft UUID := gen_random_uuid();
  v_line_draft UUID := gen_random_uuid();
  v_snapshot JSONB;
  v_status_to_draft_err TEXT := '';
  v_update_total_err TEXT := '';
  v_delete_inv_err TEXT := '';
  v_insert_line_err TEXT := '';
  v_update_line_err TEXT := '';
  v_delete_line_err TEXT := '';
  v_update_note_err TEXT := '';
  v_update_terms_err TEXT := '';
  v_direct_emit_err TEXT := '';
  v_draft_flow_ok BOOLEAN := false;
  v_allowed_update_ok BOOLEAN := false;
BEGIN
  -- Configuration de la session sous l'utilisateur authentifié propriétaire A
  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_user_a::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- 1. Flux normal brouillon : création facture draft -> ajout ligne -> émission via emit_invoice()
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, note)
  VALUES (v_inv_draft, v_comp_a, v_client_a, 'FAC-A-DRAFT-01', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, 'on_receipt', 200, 0, 200, 'Note brouillon');

  INSERT INTO public.invoice_lines (id, invoice_id, description, quantity, unit_price, nature, position, vat_rate)
  VALUES (v_line_draft, v_inv_draft, 'Ligne initiale brouillon', 1, 200, 'service', 1, 0);

  -- Modification autorisée tant que c'est un brouillon
  UPDATE public.invoice_lines SET quantity = 2, unit_price = 100 WHERE id = v_line_draft;

  -- Tentative de passage direct en pending sans passer par emit_invoice -> bloqué
  BEGIN
    UPDATE public.invoices SET status = 'pending' WHERE id = v_inv_draft;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_direct_emit_err = MESSAGE_TEXT;
  END;

  PERFORM is(
    v_direct_emit_err,
    'L''émission d''une facture doit obligatoirement passer par la fonction emit_invoice.',
    'Scénario 14a-1 : Transition directe draft vers pending interdite hors emit_invoice()'
  );

  -- Émission officielle via emit_invoice
  PERFORM public.emit_invoice(v_inv_draft);
  v_draft_flow_ok := true;

  PERFORM ok(v_draft_flow_ok, 'Scénario 14a : Le flux brouillon -> lignes -> émission via emit_invoice() fonctionne sous rôle authentifié');

  -- 2. Vérification du legal_snapshot complet enrichi à l'émission
  SELECT legal_snapshot INTO v_snapshot FROM public.invoices WHERE id = v_inv_draft;
  PERFORM ok(
    v_snapshot IS NOT NULL
    AND (v_snapshot->'seller'->>'legal_name') = 'Entreprise A EI'
    AND (v_snapshot->'seller'->>'penalty_mention') = 'Pénalités de retard : trois fois le taux d''intérêt légal. Indemnité forfaitaire de recouvrement : 40 €.'
    AND (v_snapshot->'seller'->>'vat_mention') = 'TVA non applicable, art. 293 B du CGI'
    AND (v_snapshot->'lines'->0->>'description') = 'Ligne initiale brouillon'
    AND (v_snapshot->'totals'->>'total_ttc')::numeric = 200,
    'Scénario 14b : legal_snapshot contient exactement B2B_LEGAL_PENALTY_MENTION et les mentions légales obligatoires'
  );

  -- 3. Attaque Point 1 : Facture pending, tentative de retour au statut 'draft'
  BEGIN
    UPDATE public.invoices SET status = 'draft' WHERE id = v_inv_draft;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_status_to_draft_err = MESSAGE_TEXT;
  END;

  PERFORM is(
    v_status_to_draft_err,
    'Inaltérabilité fiscale : une facture émise ne peut pas redevenir un brouillon.',
    'Scénario 14c : Interdiction absolue de transition d''un statut émis vers draft sous SET ROLE authenticated'
  );

  -- 4. Attaque Point 1 (suite) : tentative de modifier le montant puis de supprimer la facture
  BEGIN
    UPDATE public.invoices SET total_ttc = 50 WHERE id = v_inv_draft;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_update_total_err = MESSAGE_TEXT;
  END;

  BEGIN
    DELETE FROM public.invoices WHERE id = v_inv_draft;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_delete_inv_err = MESSAGE_TEXT;
  END;

  PERFORM is(
    v_update_total_err,
    'Inaltérabilité fiscale : modification interdite sur une facture émise en dehors des colonnes autorisées en liste blanche.',
    'Scénario 14d : Modification du montant d''une facture émise bloquée par liste blanche d''immutabilité'
  );

  PERFORM is(
    v_delete_inv_err,
    'Inaltérabilité fiscale : la suppression d''une facture émise est strictement interdite. Émettez un avoir pour annuler.',
    'Scénario 14e : Suppression d''une facture émise bloquée par trg_invoice_no_delete'
  );

  -- 5. Attaques Point 2 : invoice_lines sur facture émise (INSERT, UPDATE, DELETE)
  BEGIN
    INSERT INTO public.invoice_lines (invoice_id, description, quantity, unit_price, nature, position, vat_rate)
    VALUES (v_inv_draft, 'Ligne pirate après émission', 1, 999, 'service', 2, 0);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_insert_line_err = MESSAGE_TEXT;
  END;

  BEGIN
    UPDATE public.invoice_lines SET unit_price = 500 WHERE id = v_line_draft;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_update_line_err = MESSAGE_TEXT;
  END;

  BEGIN
    DELETE FROM public.invoice_lines WHERE id = v_line_draft;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_delete_line_err = MESSAGE_TEXT;
  END;

  PERFORM is(
    v_insert_line_err,
    'Inaltérabilité fiscale : les lignes d''une facture émise ne peuvent plus être créées, modifiées ni supprimées.',
    'Scénario 14f : INSERT de ligne sur facture émise bloqué par trigger'
  );
  PERFORM is(
    v_update_line_err,
    'Inaltérabilité fiscale : les lignes d''une facture émise ne peuvent plus être créées, modifiées ni supprimées.',
    'Scénario 14g : UPDATE de ligne sur facture émise bloqué par trigger'
  );
  PERFORM is(
    v_delete_line_err,
    'Inaltérabilité fiscale : les lignes d''une facture émise ne peuvent plus être créées, modifiées ni supprimées.',
    'Scénario 14h : DELETE de ligne sur facture émise bloqué par trigger'
  );

  -- 6. Attaques Point 3 : Colonnes hors liste blanche (note, payment_terms)
  BEGIN
    UPDATE public.invoices SET note = 'Tentative altération note' WHERE id = v_inv_draft;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_update_note_err = MESSAGE_TEXT;
  END;

  BEGIN
    UPDATE public.invoices SET payment_terms = '30d' WHERE id = v_inv_draft;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_update_terms_err = MESSAGE_TEXT;
  END;

  PERFORM is(
    v_update_note_err,
    'Inaltérabilité fiscale : modification interdite sur une facture émise en dehors des colonnes autorisées en liste blanche.',
    'Scénario 14i : Tentative d''altérer le champ note sur facture émise bloquée par liste blanche'
  );
  PERFORM is(
    v_update_terms_err,
    'Inaltérabilité fiscale : modification interdite sur une facture émise en dehors des colonnes autorisées en liste blanche.',
    'Scénario 14j : Tentative d''altérer le champ payment_terms sur facture émise bloquée par liste blanche'
  );

  -- 7. Modifications autorisées en liste blanche après émission
  UPDATE public.invoices
  SET status = 'paid',
      paid_amount = 200,
      paid_at = now(),
      payment_method = 'transfer',
      factpulse_ref = 'FP-REF-TEST-001',
      facturx_pdf_url = 'https://storage/facturx.pdf',
      stripe_payment_link = 'https://buy.stripe.com/test',
      auto_reminders_disabled = true,
      next_auto_reminder_at = '2026-11-01'
  WHERE id = v_inv_draft;

  v_allowed_update_ok := true;
  PERFORM ok(v_allowed_update_ok, 'Scénario 14k : Les colonnes de la liste blanche (status, paid_amount, relance, pdf, liens) sont modifiables');

  RESET ROLE;
END $$;

-- =========================================================================
-- SCÉNARIO 15 : Tests d'attaque sur les fonctions SECURITY DEFINER auditées
-- =========================================================================
DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_user_b UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_conn_a UUID := 'd1111111-1111-1111-1111-111111111111'::UUID;
  v_is_adm BOOLEAN;
  v_is_super_adm BOOLEAN;
  v_err_plan TEXT := '';
  v_err_trial TEXT := '';
  v_err_suspend TEXT := '';
  v_err_role TEXT := '';
  v_err_del_user TEXT := '';
  v_err_impersonate TEXT := '';
  v_err_end_imp TEXT := '';
  v_err_audit TEXT := '';
  v_pub_doc JSONB;
  v_err_sign_doc TEXT := '';
  v_err_disconnect TEXT := '';
  v_err_gdpr TEXT := '';
BEGIN
  -- Utilisateur attaquant B (non-admin, société B)
  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_user_b::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- 15a : is_platform_admin() renvoie false pour un non-admin
  SELECT public.is_platform_admin() INTO v_is_adm;
  PERFORM is(v_is_adm, false, 'Scénario 15a : is_platform_admin() renvoie false pour un utilisateur normal');

  -- 15b : is_platform_super_admin() renvoie false
  SELECT public.is_platform_super_admin() INTO v_is_super_adm;
  PERFORM is(v_is_super_adm, false, 'Scénario 15b : is_platform_super_admin() renvoie false pour un utilisateur normal');

  -- 15c : admin_set_user_plan tenté par B -> exception not authorized
  BEGIN
    PERFORM public.admin_set_user_plan(v_user_a, 'pro');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_plan = MESSAGE_TEXT;
  END;
  PERFORM is(v_err_plan, 'not authorized', 'Scénario 15c : admin_set_user_plan rejeté pour un non-admin');

  -- 15d : admin_grant_trial tenté par B -> not authorized
  BEGIN
    PERFORM public.admin_grant_trial(v_user_a, 30);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_trial = MESSAGE_TEXT;
  END;
  PERFORM is(v_err_trial, 'not authorized', 'Scénario 15d : admin_grant_trial rejeté pour un non-admin');

  -- 15e : admin_set_suspended tenté par B -> not authorized
  BEGIN
    PERFORM public.admin_set_suspended(v_user_a, true);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_suspend = MESSAGE_TEXT;
  END;
  PERFORM is(v_err_suspend, 'not authorized', 'Scénario 15e : admin_set_suspended rejeté pour un non-admin');

  -- 15f : admin_set_admin_role tenté par B -> not authorized
  BEGIN
    PERFORM public.admin_set_admin_role(v_user_b, true);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_role = MESSAGE_TEXT;
  END;
  PERFORM is(v_err_role, 'not authorized', 'Scénario 15f : admin_set_admin_role rejeté pour un non-admin');

  -- 15g : admin_delete_user tenté par B -> not authorized
  BEGIN
    PERFORM public.admin_delete_user(v_user_a);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_del_user = MESSAGE_TEXT;
  END;
  PERFORM is(v_err_del_user, 'not authorized', 'Scénario 15g : admin_delete_user rejeté pour un non-admin');

  -- 15h : admin_start_impersonation tenté par B -> not authorized
  BEGIN
    PERFORM public.admin_start_impersonation(v_user_a);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_impersonate = MESSAGE_TEXT;
  END;
  PERFORM is(v_err_impersonate, 'not authorized', 'Scénario 15h : admin_start_impersonation rejeté pour un non-admin');

  -- 15i : admin_end_impersonation tenté par B sur session arbitraire -> not authorized
  BEGIN
    PERFORM public.admin_end_impersonation(gen_random_uuid());
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_end_imp = MESSAGE_TEXT;
  END;
  PERFORM is(v_err_end_imp, 'not authorized', 'Scénario 15i : admin_end_impersonation rejeté pour un non-admin');

  -- 15j : write_audit_log tenté par B -> non-admin unauthorized
  BEGIN
    PERFORM public.write_audit_log('test_action', v_user_a, '{}'::jsonb);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_audit = MESSAGE_TEXT;
  END;
  PERFORM ok(v_err_audit <> '', 'Scénario 15j : write_audit_log rejeté pour un utilisateur standard');

  -- 15k : get_public_document avec faux token -> renvoie NULL
  SELECT public.get_public_document('00000000-0000-0000-0000-000000000000') INTO v_pub_doc;
  PERFORM is(v_pub_doc, NULL::jsonb, 'Scénario 15k : get_public_document refuse un token inexistant (renvoie NULL)');

  -- 15l : sign_public_document avec faux token -> document not found or already signed
  BEGIN
    PERFORM public.sign_public_document('00000000-0000-0000-0000-000000000000', 'Attaquant', 'hacker@bad.org', 'fake_sig');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_sign_doc = MESSAGE_TEXT;
  END;
  PERFORM is(v_err_sign_doc, 'document not found or already signed', 'Scénario 15l : sign_public_document refuse un faux token');

  -- 15m : disconnect_bank_connection tenté par B sur la banque de A -> accès refusé
  BEGIN
    PERFORM public.disconnect_bank_connection(v_conn_a);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_disconnect = MESSAGE_TEXT;
  END;
  PERFORM is(v_err_disconnect, 'Accès refusé : la connexion n''appartient pas à l''utilisateur connecté.', 'Scénario 15m : disconnect_bank_connection refuse la déconnexion d''une banque tierce');

  -- 15n : delete_company_gdpr tenté par B -> réservé service_role
  BEGIN
    PERFORM public.delete_company_gdpr(v_comp_a);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_gdpr = MESSAGE_TEXT;
  END;
  PERFORM ok(v_err_gdpr LIKE '%permission denied%' OR v_err_gdpr LIKE '%Action réservée%', 'Scénario 15n : delete_company_gdpr strictement réservé au service_role');

  RESET ROLE;
END $$;

-- =========================================================================
-- SCÉNARIO 16 : Numérotation séquentielle et RLS INSERT sous SET ROLE authenticated
-- =========================================================================
DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_user_b UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  v_comp_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
  v_comp_b UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID;
  v_client_a UUID := 'c1111111-1111-1111-1111-111111111111'::UUID;
  v_err_insert_pending TEXT := '';
  v_err_insert_paid TEXT := '';
  v_err_insert_other_comp TEXT := '';
  v_err_emit_other TEXT := '';
  v_inv_draft1 UUID := gen_random_uuid();
  v_inv_draft2 UUID := gen_random_uuid();
  v_emitted1 public.invoices%ROWTYPE;
  v_emitted2 public.invoices%ROWTYPE;
  v_num1_seq INT;
  v_num2_seq INT;
BEGIN
  -- 16a : Insertion directe avec statut pending rejetée par RLS WITH CHECK (status = 'draft')
  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_user_a::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    INSERT INTO public.invoices (company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
    VALUES (v_comp_a, v_client_a, 'FAC-PIRATE-PENDING', 'invoice', 'pending', CURRENT_DATE, CURRENT_DATE + 30, 'on_receipt', 100, 0, 100);
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_err_insert_pending = RETURNED_SQLSTATE;
  END;

  PERFORM is(v_err_insert_pending, '42501', 'Scénario 16a : Insertion directe d''une facture pending sous rôle authenticated rejetée par RLS WITH CHECK (code 42501)');

  -- 16b : Insertion directe avec statut paid rejetée par RLS
  BEGIN
    INSERT INTO public.invoices (company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
    VALUES (v_comp_a, v_client_a, 'FAC-PIRATE-PAID', 'invoice', 'paid', CURRENT_DATE, CURRENT_DATE + 30, 'on_receipt', 100, 0, 100);
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_err_insert_paid = RETURNED_SQLSTATE;
  END;

  PERFORM is(v_err_insert_paid, '42501', 'Scénario 16b : Insertion directe d''une facture paid sous rôle authenticated rejetée par RLS WITH CHECK (code 42501)');

  -- 16c : Insertion d'un brouillon sur la société d'autrui rejetée par RLS
  BEGIN
    INSERT INTO public.invoices (company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
    VALUES (v_comp_b, v_client_a, 'FAC-PIRATE-OTHER', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, 'on_receipt', 100, 0, 100);
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_err_insert_other_comp = RETURNED_SQLSTATE;
  END;

  PERFORM is(v_err_insert_other_comp, '42501', 'Scénario 16c : Insertion d''une facture sur l''entreprise d''autrui rejetée par RLS WITH CHECK (code 42501)');

  -- 16d : Tentative d'émission de la facture de A par un utilisateur B
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
  VALUES (v_inv_draft1, v_comp_a, v_client_a, 'DRAFT-0001', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, 'on_receipt', 150, 0, 150);

  PERFORM set_config('request.jwt.claim.sub', v_user_b::TEXT, true);
  BEGIN
    PERFORM public.emit_invoice(v_inv_draft1);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_emit_other = MESSAGE_TEXT;
  END;

  PERFORM is(v_err_emit_other, 'Accès refusé : vous n''êtes pas propriétaire de cette facture.', 'Scénario 16d : emit_invoice() refuse l''émission par un tiers (code 42501)');

  -- 16e : Émissions consécutives par le propriétaire légitime A
  PERFORM set_config('request.jwt.claim.sub', v_user_a::TEXT, true);

  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
  VALUES (v_inv_draft2, v_comp_a, v_client_a, 'DRAFT-0002', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, 'on_receipt', 250, 0, 250);

  SELECT * INTO v_emitted1 FROM public.emit_invoice(v_inv_draft1);
  SELECT * INTO v_emitted2 FROM public.emit_invoice(v_inv_draft2);

  v_num1_seq := substring(v_emitted1.number from '-([0-9]+)$')::integer;
  v_num2_seq := substring(v_emitted2.number from '-([0-9]+)$')::integer;

  PERFORM ok(
    v_emitted1.status = 'pending' 
    AND v_emitted2.status = 'pending'
    AND v_emitted1.issue_date = (clock_timestamp() AT TIME ZONE 'Europe/Paris')::date
    AND v_emitted2.issue_date = (clock_timestamp() AT TIME ZONE 'Europe/Paris')::date
    AND v_num2_seq = v_num1_seq + 1,
    'Scénario 16e : Deux émissions successives via emit_invoice() produisent des numéros consécutifs sans trou ni doublon'
  );

  -- 16f : Recalcul de due_date à l'émission : brouillon daté d'il y a 10 jours avec 30d
  DECLARE
    v_inv_old_draft UUID := gen_random_uuid();
    v_emitted_old public.invoices%ROWTYPE;
    v_today_paris DATE := (clock_timestamp() AT TIME ZONE 'Europe/Paris')::date;
  BEGIN
    INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
    VALUES (v_inv_old_draft, v_comp_a, v_client_a, 'DRAFT-OLD-10D', 'invoice', 'draft', v_today_paris - 10, v_today_paris + 20, '30d', 300, 0, 300);

    SELECT * INTO v_emitted_old FROM public.emit_invoice(v_inv_old_draft);

    PERFORM ok(
      v_emitted_old.issue_date = v_today_paris
      AND v_emitted_old.due_date = v_today_paris + 30,
      'Scénario 16f : due_date recalculée à l''émission selon payment_terms (aujourd''hui + 30j malgré un brouillon daté d''il y a 10j)'
    );
  END;

  -- 16g : Simulation de passage à la nouvelle année via remplacement dynamique de paris_today() et paris_year()
  DECLARE
    v_inv_reveillon UUID := gen_random_uuid();
    v_emitted_reveillon public.invoices%ROWTYPE;
  BEGIN
    EXECUTE 'RESET ROLE';
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION public.paris_today() RETURNS date LANGUAGE sql AS $body$ SELECT '2027-01-01'::date; $body$;
      CREATE OR REPLACE FUNCTION public.paris_year() RETURNS text LANGUAGE sql AS $body$ SELECT '2027'::text; $body$;
    $func$;
    EXECUTE 'SET ROLE authenticated';
    PERFORM set_config('request.jwt.claim.sub', v_user_a::TEXT, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
    VALUES (v_inv_reveillon, v_comp_a, v_client_a, 'DRAFT-REVEILLON', 'invoice', 'draft', '2026-12-31', '2027-01-30', '30d', 400, 0, 400);

    SELECT * INTO v_emitted_reveillon FROM public.emit_invoice(v_inv_reveillon);

    PERFORM ok(
      v_emitted_reveillon.issue_date = '2027-01-01'::date
      AND v_emitted_reveillon.number LIKE 'FAC-2027-%'
      AND v_emitted_reveillon.due_date = '2027-01-31'::date,
      'Scénario 16g : paris_today() au 01/01/2027 -> année 2027 utilisée pour la date, l''échéance et le numéro séquentiel'
    );

    -- Restauration des fonctions standard
    EXECUTE 'RESET ROLE';
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION public.paris_today() RETURNS date LANGUAGE sql STABLE SECURITY INVOKER AS $body$ SELECT (clock_timestamp() AT TIME ZONE 'Europe/Paris')::date; $body$;
      CREATE OR REPLACE FUNCTION public.paris_year() RETURNS text LANGUAGE sql STABLE SECURITY INVOKER AS $body$ SELECT to_char((clock_timestamp() AT TIME ZONE 'Europe/Paris')::date, 'YYYY'); $body$;
    $func$;
    EXECUTE 'SET ROLE authenticated';
    PERFORM set_config('request.jwt.claim.sub', v_user_a::TEXT, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  END;

  -- 16g-negatif : Tentative d'injection de date via app.simulated_timestamp ignorée
  DECLARE
    v_inv_negatif UUID := gen_random_uuid();
    v_emitted_negatif public.invoices%ROWTYPE;
    v_today_paris DATE := (clock_timestamp() AT TIME ZONE 'Europe/Paris')::date;
  BEGIN
    PERFORM set_config('app.simulated_timestamp', '2099-01-01 00:00:00+00', true);

    INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
    VALUES (v_inv_negatif, v_comp_a, v_client_a, 'DRAFT-NEGATIF', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, 'on_receipt', 100, 0, 100);

    SELECT * INTO v_emitted_negatif FROM public.emit_invoice(v_inv_negatif);

    PERFORM ok(
      v_emitted_negatif.issue_date = v_today_paris
      AND v_emitted_negatif.number LIKE ('FAC-' || to_char(v_today_paris, 'YYYY') || '-%'),
      'Scénario 16g-negatif : La tentative d''injection via app.simulated_timestamp est totalement ignorée (date du jour conservée)'
    );

    PERFORM set_config('app.simulated_timestamp', '', true);
  END;

  -- 16h : Double émission simultanée de la même facture -> message d'erreur clair
  DECLARE
    v_err_double_emit TEXT := '';
  BEGIN
    BEGIN
      PERFORM public.emit_invoice(v_inv_draft1);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err_double_emit = MESSAGE_TEXT;
    END;

    PERFORM is(
      v_err_double_emit,
      'Cette facture vient d''être émise.',
      'Scénario 16h : La tentative de ré-émission d''une même facture renvoie exactement "Cette facture vient d''être émise."'
    );
  END;

  RESET ROLE;
END $$;

-- =========================================================================
-- SCÉNARIO 17 : Mentions de TVA exhaustives dans legal_snapshot (4 cas)
-- =========================================================================
DO $$
DECLARE
  v_user_tva UUID := gen_random_uuid();
  v_comp_tva UUID := gen_random_uuid();
  v_client_tva UUID := gen_random_uuid();
  v_inv_tva UUID;
  v_snap JSONB;
BEGIN
  -- Setup utilisateur et client
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (id, email, aud, role) VALUES (v_user_tva, 'vat_user@test.local', 'authenticated', 'authenticated') ON CONFLICT (id) DO NOTHING;
  END IF;
  INSERT INTO public.profiles (id, email, plan) VALUES (v_user_tva, 'vat_user@test.local', 'solo') ON CONFLICT (id) DO UPDATE SET plan = 'solo';
  INSERT INTO public.companies (id, user_id, siret, siren, legal_name, address, activity_type, vat_regime, vat_option, structure, urssaf_frequency, accent_color, default_payment_terms, previous_ca)
  VALUES (v_comp_tva, v_user_tva, '88888888800088', '888888888', 'TVA Test SASU', '12 rue TVA', 'freelance_bnc', 'franchise', 'non_renseigne', 'micro', 'monthly', '#7C6FE0', 'on_receipt', 0);
  INSERT INTO public.clients (id, company_id, name, type, siren, email, address)
  VALUES (v_client_tva, v_comp_tva, 'Client TVA Pro', 'b2b', '777777777', 'contact@tva.pro', '15 rue Pro');

  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_user_tva::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- Cas 1 : Franchise en base
  v_inv_tva := gen_random_uuid();
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
  VALUES (v_inv_tva, v_comp_tva, v_client_tva, 'DRAFT-TVA-1', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, 'on_receipt', 100, 0, 100);
  PERFORM public.emit_invoice(v_inv_tva);
  SELECT legal_snapshot INTO v_snap FROM public.invoices WHERE id = v_inv_tva;
  PERFORM is(v_snap->'seller'->>'vat_mention', 'TVA non applicable, art. 293 B du CGI', 'Scénario 17a : Mention franchise en base exacte ("TVA non applicable, art. 293 B du CGI")');

  -- Cas 2 : Régime TVA avec option d'après les débits
  RESET ROLE;
  UPDATE public.companies SET vat_regime = 'vat', vat_option = 'debits' WHERE id = v_comp_tva;
  SET ROLE authenticated;
  v_inv_tva := gen_random_uuid();
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
  VALUES (v_inv_tva, v_comp_tva, v_client_tva, 'DRAFT-TVA-2', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, 'on_receipt', 100, 20, 120);
  PERFORM public.emit_invoice(v_inv_tva);
  SELECT legal_snapshot INTO v_snap FROM public.invoices WHERE id = v_inv_tva;
  PERFORM is(v_snap->'seller'->>'vat_mention', 'Option pour le paiement de la taxe d''après les débits', 'Scénario 17b : Mention TVA débits exacte ("Option pour le paiement de la taxe d''après les débits")');

  -- Cas 3 : Régime TVA avec option encaissements (aucune mention)
  RESET ROLE;
  UPDATE public.companies SET vat_regime = 'vat', vat_option = 'encaissements' WHERE id = v_comp_tva;
  SET ROLE authenticated;
  v_inv_tva := gen_random_uuid();
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
  VALUES (v_inv_tva, v_comp_tva, v_client_tva, 'DRAFT-TVA-3', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, 'on_receipt', 100, 20, 120);
  PERFORM public.emit_invoice(v_inv_tva);
  SELECT legal_snapshot INTO v_snap FROM public.invoices WHERE id = v_inv_tva;
  PERFORM is(v_snap->'seller'->>'vat_mention', NULL::text, 'Scénario 17c : Mention TVA encaissements est NULL (aucune mention obligatoire)');

  -- Cas 4 : Régime TVA avec option non_renseigne (aucune mention)
  RESET ROLE;
  UPDATE public.companies SET vat_regime = 'vat', vat_option = 'non_renseigne' WHERE id = v_comp_tva;
  SET ROLE authenticated;
  v_inv_tva := gen_random_uuid();
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
  VALUES (v_inv_tva, v_comp_tva, v_client_tva, 'DRAFT-TVA-4', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, 'on_receipt', 100, 20, 120);
  PERFORM public.emit_invoice(v_inv_tva);
  SELECT legal_snapshot INTO v_snap FROM public.invoices WHERE id = v_inv_tva;
  PERFORM is(v_snap->'seller'->>'vat_mention', NULL::text, 'Scénario 17d : Mention TVA non renseignée est NULL');

  RESET ROLE;
END $$;

-- =========================================================================
-- SCÉNARIO 18 : Protection admin_delete_user et procédure RGPD delete_user_account_gdpr
-- =========================================================================
DO $$
DECLARE
  v_super_admin UUID := gen_random_uuid();
  v_user_target UUID := gen_random_uuid();
  v_comp_target UUID := gen_random_uuid();
  v_client_target UUID := gen_random_uuid();
  v_inv_target UUID := gen_random_uuid();
  v_pay_target UUID := gen_random_uuid();
  v_err_admin_del TEXT := '';
  v_err_gdpr_auth TEXT := '';
  v_gdpr_result JSONB;
  v_banned_until TIMESTAMPTZ;
  v_prof_email TEXT;
  v_inv_count INT;
  v_pay_count INT;
BEGIN
  -- Setup Super Admin
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (id, email, aud, role) VALUES (v_super_admin, 'superadmin@bylz.fr', 'authenticated', 'authenticated') ON CONFLICT (id) DO NOTHING;
    INSERT INTO auth.users (id, email, aud, role) VALUES (v_user_target, 'victim_gdpr@test.fr', 'authenticated', 'authenticated') ON CONFLICT (id) DO NOTHING;
  END IF;
  INSERT INTO public.profiles (id, email, plan, is_admin, admin_role)
  VALUES (v_super_admin, 'superadmin@bylz.fr', 'pro', true, 'super_admin'::public.admin_role)
  ON CONFLICT (id) DO UPDATE SET is_admin = true, admin_role = 'super_admin'::public.admin_role;

  -- Setup Utilisateur cible avec factures et paiements
  INSERT INTO public.profiles (id, email, plan) VALUES (v_user_target, 'victim_gdpr@test.fr', 'solo') ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.companies (id, user_id, siret, siren, legal_name, address, activity_type, vat_regime, vat_option, structure, urssaf_frequency, accent_color, default_payment_terms, previous_ca, phone)
  VALUES (v_comp_target, v_user_target, '66666666600066', '666666666', 'Entreprise RGPD EI', '50 rue RGPD', 'freelance_bnc', 'franchise', 'non_renseigne', 'micro', 'monthly', '#7C6FE0', 'on_receipt', 0, '0699887766');
  INSERT INTO public.clients (id, company_id, name, type, siren, email, address)
  VALUES (v_client_target, v_comp_target, 'Client Facture Archive', 'b2b', '555555555', 'client@facture.fr', '55 rue Archive');

  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_amount)
  VALUES (v_inv_target, v_comp_target, v_client_target, 'FAC-2026-9999', 'invoice', 'paid', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 500, 0, 500, 500);

  INSERT INTO public.payments (id, invoice_id, amount, method, paid_at, source)
  VALUES (v_pay_target, v_inv_target, 500, 'transfer', CURRENT_TIMESTAMP, 'manual');

  -- 18a : Tentative admin_delete_user sur utilisateur avec factures émises -> échec propre avec message explicite
  SET ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_super_admin::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    PERFORM public.admin_delete_user(v_user_target);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_admin_del = MESSAGE_TEXT;
  END;

  PERFORM is(
    v_err_admin_del,
    'Suppression directe impossible : cet utilisateur possède des factures émises ou des paiements enregistrés. Utilisez la procédure de suppression de compte RGPD delete_user_account_gdpr(p_user_id) pour archiver les pièces comptables obligatoires.',
    'Scénario 18a-1 : admin_delete_user refusé avec message explicite d''orientation RGPD pour un utilisateur avec factures émises'
  );

  -- 18a-2 : admin_delete_user sur un utilisateur SANS facture émise ni paiement -> succès
  DECLARE
    v_user_empty UUID := gen_random_uuid();
    v_comp_empty UUID := gen_random_uuid();
    v_empty_deleted BOOLEAN := false;
  BEGIN
    RESET ROLE;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
      INSERT INTO auth.users (id, email, aud, role) VALUES (v_user_empty, 'empty_user@test.local', 'authenticated', 'authenticated') ON CONFLICT (id) DO NOTHING;
    END IF;
    INSERT INTO public.profiles (id, email, plan) VALUES (v_user_empty, 'empty_user@test.local', 'starter') ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.companies (id, user_id, siret, siren, legal_name, address, activity_type, vat_regime, vat_option, structure, urssaf_frequency, accent_color, default_payment_terms, previous_ca)
    VALUES (v_comp_empty, v_user_empty, '44444444400044', '444444444', 'Empty EI', '1 rue Sans Facture', 'freelance_bnc', 'franchise', 'non_renseigne', 'micro', 'monthly', '#7C6FE0', 'on_receipt', 0);
    
    -- Brouillon de travail non émis
    INSERT INTO public.invoices (company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
    VALUES (v_comp_empty, v_client_target, 'DRAFT-EMPTY-01', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE, 'on_receipt', 50, 0, 50);

    SET ROLE authenticated;
    PERFORM set_config('request.jwt.claim.sub', v_super_admin::TEXT, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    PERFORM public.admin_delete_user(v_user_empty);

    SELECT NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_user_empty) INTO v_empty_deleted;
    PERFORM ok(v_empty_deleted, 'Scénario 18a-2 : admin_delete_user autorisé et exécuté avec succès pour un compte sans facture émise');
  END;

  -- 18b : Tentative delete_user_account_gdpr sous rôle authenticated -> refusé
  BEGIN
    PERFORM public.delete_user_account_gdpr(v_user_target);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_gdpr_auth = MESSAGE_TEXT;
  END;

  PERFORM ok(
    v_err_gdpr_auth LIKE '%permission denied%' OR v_err_gdpr_auth LIKE '%Action réservée%',
    'Scénario 18b : delete_user_account_gdpr strictement refusé sous rôle authenticated'
  );

  -- 18c : Exécution de delete_user_account_gdpr sous rôle service_role
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  v_gdpr_result := public.delete_user_account_gdpr(v_user_target);

  PERFORM is((v_gdpr_result->>'anonymized')::text, 'true', 'Scénario 18c : delete_user_account_gdpr s''exécute avec succès sous service_role');

  -- 18d : Vérification de la désactivation du compte dans auth.users
  SELECT banned_until INTO v_banned_until FROM auth.users WHERE id = v_user_target;
  PERFORM ok(v_banned_until > CURRENT_TIMESTAMP, 'Scénario 18d : Le compte auth.users a été banni définitivement');

  -- 18e-1 : Vérification de l'anonymisation de l'e-mail dans auth.users
  DECLARE
    v_auth_email TEXT;
  BEGIN
    SELECT email INTO v_auth_email FROM auth.users WHERE id = v_user_target;
    PERFORM ok(v_auth_email LIKE 'anonymized-%@rgpd.invalid', 'Scénario 18e-1 : L''e-mail dans auth.users a été anonymisé');
  END;

  -- 18e-2 : Vérification de l'anonymisation du profil utilisateur
  SELECT email INTO v_prof_email FROM public.profiles WHERE id = v_user_target;
  PERFORM ok(v_prof_email LIKE 'anonymized-%@rgpd.invalid', 'Scénario 18e-2 : L''e-mail du profil utilisateur a été anonymisé');

  -- 18f : Vérification de la conservation intégrale des pièces comptables (10 ans)
  SELECT count(*) INTO v_inv_count FROM public.invoices WHERE id = v_inv_target;
  SELECT count(*) INTO v_pay_count FROM public.payments WHERE id = v_pay_target;
  PERFORM ok(v_inv_count = 1 AND v_pay_count = 1, 'Scénario 18f : Les factures et paiements émis restent 100% conservés et consultables');
END $$;

-- =========================================================================
-- SCÉNARIO 19 : Validation des UPDATEs webhooks et front sous le trigger d'inaltérabilité
-- =========================================================================
DO $$
DECLARE
  v_user_wh UUID := gen_random_uuid();
  v_comp_wh UUID := gen_random_uuid();
  v_client_wh UUID := gen_random_uuid();
  v_inv_wh UUID := gen_random_uuid();
  v_line_wh UUID := gen_random_uuid();
  v_stripe_ok BOOLEAN := false;
  v_gocardless_ok BOOLEAN := false;
  v_syncbank_ok BOOLEAN := false;
  v_ereporting_ok BOOLEAN := false;
  v_retrypa_ok BOOLEAN := false;
  v_reminder_ok BOOLEAN := false;
BEGIN
  -- Setup utilisateur et facture émise
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (id, email, aud, role) VALUES (v_user_wh, 'wh@test.local', 'authenticated', 'authenticated') ON CONFLICT (id) DO NOTHING;
  END IF;
  INSERT INTO public.profiles (id, email, plan) VALUES (v_user_wh, 'wh@test.local', 'solo') ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.companies (id, user_id, siret, siren, legal_name, address, activity_type, vat_regime, vat_option, structure, urssaf_frequency, accent_color, default_payment_terms, previous_ca)
  VALUES (v_comp_wh, v_user_wh, '33333333300033', '333333333', 'WH Test SASU', '1 rue Webhook', 'freelance_bnc', 'franchise', 'non_renseigne', 'micro', 'monthly', '#7C6FE0', '30d', 0);
  INSERT INTO public.clients (id, company_id, name, type, siren, email, address)
  VALUES (v_client_wh, v_comp_wh, 'Client Webhook', 'b2b', '222222222', 'wh@client.fr', '10 rue Client');

  -- Création brouillon + ligne
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
  VALUES (v_inv_wh, v_comp_wh, v_client_wh, 'DRAFT-WH-01', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, '30d', 100, 0, 100);
  INSERT INTO public.invoice_lines (id, invoice_id, description, quantity, unit_price, nature, position, vat_rate)
  VALUES (v_line_wh, v_inv_wh, 'Prestation Webhook', 1, 100, 'service', 1, 0);

  -- Émission via emit_invoice
  PERFORM set_config('request.jwt.claim.sub', v_user_wh::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM public.emit_invoice(v_inv_wh);

  -- 1. Simulation stripe-webhook : UPDATE status = 'paid', paid_at = now()
  UPDATE public.invoices 
  SET status = 'paid', paid_at = clock_timestamp() 
  WHERE id = v_inv_wh;
  v_stripe_ok := true;
  PERFORM ok(v_stripe_ok, 'Scénario 19a : stripe-webhook (status=paid, paid_at) passe sous le trigger');

  -- 2. Simulation gocardless-webhook : UPDATE status = 'paid', paid_at = now(), paid_amount = 100
  UPDATE public.invoices 
  SET status = 'paid', paid_at = clock_timestamp(), paid_amount = 100 
  WHERE id = v_inv_wh;
  v_gocardless_ok := true;
  PERFORM ok(v_gocardless_ok, 'Scénario 19b : gocardless-webhook (status, paid_at, paid_amount) passe sous le trigger');

  -- 3. Simulation sync-bank-transactions : UPDATE status = 'paid', paid_at = now()
  UPDATE public.invoices 
  SET status = 'paid', paid_at = clock_timestamp() 
  WHERE id = v_inv_wh;
  v_syncbank_ok := true;
  PERFORM ok(v_syncbank_ok, 'Scénario 19c : sync-bank-transactions (status=paid, paid_at) passe sous le trigger');

  -- 4. Simulation generate-ereporting : UPDATE ereporting_status = 'submitted'
  UPDATE public.invoices 
  SET ereporting_status = 'submitted' 
  WHERE id = v_inv_wh;
  v_ereporting_ok := true;
  PERFORM ok(v_ereporting_ok, 'Scénario 19d : generate-ereporting (ereporting_status) passe sous le trigger');

  -- 5. Simulation retry-pa-submissions : UPDATE factpulse_ref, pa_status, pa_rejection_reason
  UPDATE public.invoices 
  SET factpulse_ref = 'FP-RETRY-01', pa_status = 'submitted', pa_rejection_reason = NULL 
  WHERE id = v_inv_wh;
  v_retrypa_ok := true;
  PERFORM ok(v_retrypa_ok, 'Scénario 19e : retry-pa-submissions (factpulse_ref, pa_status, pa_rejection_reason) passe sous le trigger');

  -- 6. Simulation api.ts (gestion des relances) : UPDATE auto_reminders_disabled
  UPDATE public.invoices 
  SET auto_reminders_disabled = true, next_auto_reminder_at = CURRENT_DATE + 5 
  WHERE id = v_inv_wh;
  v_reminder_ok := true;
  PERFORM ok(v_reminder_ok, 'Scénario 19f : api.ts gestion des relances (auto_reminders_disabled) passe sous le trigger');
END $$;

-- =========================================================================
-- SCÉNARIO 20 : Quota Starter à l'émission via emit_invoice
-- =========================================================================
DO $$
DECLARE
  v_user_starter UUID := '55555555-5555-5555-5555-555555555555'::UUID;
  v_comp_starter UUID := '55555555-aaaa-5555-aaaa-555555555555'::UUID;
  v_client_starter UUID := '55555555-bbbb-5555-bbbb-555555555555'::UUID;
  v_inv1 UUID := gen_random_uuid();
  v_inv2 UUID := gen_random_uuid();
  v_inv3 UUID := gen_random_uuid();
  v_inv4 UUID := gen_random_uuid();
  v_emit1_ok BOOLEAN := false;
  v_emit2_ok BOOLEAN := false;
  v_emit3_ok BOOLEAN := false;
  v_err_quota TEXT := '';
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (id, email, aud, role) 
    VALUES (v_user_starter, 'starter@test.local', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  INSERT INTO public.profiles (id, email, plan)
  VALUES (v_user_starter, 'starter@test.local', 'starter')
  ON CONFLICT (id) DO UPDATE SET plan = 'starter';

  INSERT INTO public.companies (id, user_id, siret, siren, legal_name, address, activity_type, vat_regime, structure, urssaf_frequency, accent_color, default_payment_terms, previous_ca)
  VALUES (v_comp_starter, v_user_starter, '55555555500055', '555555555', 'Starter EI', '5 rue Starter', 'freelance_bnc', 'franchise', 'micro', 'quarterly', '#7C6FE0', '30d', 0)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.clients (id, company_id, name, type, siren)
  VALUES (v_client_starter, v_comp_starter, 'Client Starter', 'b2b', '555555555')
  ON CONFLICT (id) DO NOTHING;

  -- Création de 4 brouillons avec 1 ligne chacun
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
  VALUES 
    (v_inv1, v_comp_starter, v_client_starter, 'DRAFT-ST-01', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, '30d', 100, 0, 100),
    (v_inv2, v_comp_starter, v_client_starter, 'DRAFT-ST-02', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, '30d', 100, 0, 100),
    (v_inv3, v_comp_starter, v_client_starter, 'DRAFT-ST-03', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, '30d', 100, 0, 100),
    (v_inv4, v_comp_starter, v_client_starter, 'DRAFT-ST-04', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, '30d', 100, 0, 100);

  INSERT INTO public.invoice_lines (invoice_id, description, quantity, unit_price, nature, position, vat_rate)
  VALUES
    (v_inv1, 'Prestation 1', 1, 100, 'service', 1, 0),
    (v_inv2, 'Prestation 2', 1, 100, 'service', 1, 0),
    (v_inv3, 'Prestation 3', 1, 100, 'service', 1, 0),
    (v_inv4, 'Prestation 4', 1, 100, 'service', 1, 0);

  -- Contexte utilisateur starter sous rôle authenticated
  EXECUTE 'SET ROLE authenticated';
  PERFORM set_config('request.jwt.claim.sub', v_user_starter::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- Émission des factures 1, 2, 3
  PERFORM public.emit_invoice(v_inv1);
  v_emit1_ok := true;

  PERFORM public.emit_invoice(v_inv2);
  v_emit2_ok := true;

  PERFORM public.emit_invoice(v_inv3);
  v_emit3_ok := true;

  PERFORM ok(
    v_emit1_ok AND v_emit2_ok AND v_emit3_ok,
    'Scénario 20a : Les 3 premières factures du mois sont émises avec succès pour un compte Starter'
  );

  -- Tentative d'émission de la 4ème facture (dépassement du quota Starter de 3 factures/mois)
  BEGIN
    PERFORM public.emit_invoice(v_inv4);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_quota = MESSAGE_TEXT;
  END;

  PERFORM is(
    v_err_quota,
    'plan_invoice_limit_reached',
    'Scénario 20b : La tentative d''émettre une 4ème facture dans le mois sous plan Starter est bloquée avec plan_invoice_limit_reached'
  );

  EXECUTE 'RESET ROLE';
END $$;

-- =========================================================================
-- SCÉNARIO 21 : Masque de numérotation séquentielle à 3 chiffres (FAC-YYYY-XXX / AV-YYYY-XXX)
-- =========================================================================
DO $$
DECLARE
  v_user_pad UUID := gen_random_uuid();
  v_comp_pad UUID := gen_random_uuid();
  v_client_pad UUID := gen_random_uuid();
  v_inv_draft1 UUID := gen_random_uuid();
  v_inv_draft2 UUID := gen_random_uuid();
  v_inv_draft3 UUID := gen_random_uuid();
  v_inv_existing_4digits UUID := gen_random_uuid();
  v_emitted1 public.invoices%ROWTYPE;
  v_emitted2 public.invoices%ROWTYPE;
  v_emitted3 public.invoices%ROWTYPE;
  v_current_year TEXT := public.paris_year();
BEGIN
  -- Setup utilisateur et entreprise avec profil SOLO (illimité)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (id, email, aud, role) VALUES (v_user_pad, 'pad@test.local', 'authenticated', 'authenticated') ON CONFLICT (id) DO NOTHING;
  END IF;
  INSERT INTO public.profiles (id, email, plan) VALUES (v_user_pad, 'pad@test.local', 'solo')
  ON CONFLICT (id) DO UPDATE SET plan = 'solo';

  INSERT INTO public.companies (id, user_id, siret, siren, legal_name, address, activity_type, vat_regime, vat_option, structure, urssaf_frequency, accent_color, default_payment_terms, previous_ca)
  VALUES (v_comp_pad, v_user_pad, '44444444400044', '444444444', 'Padding Test SASU', '1 rue Du Chiffre', 'freelance_bnc', 'franchise', 'non_renseigne', 'micro', 'monthly', '#7C6FE0', '30d', 0);
  INSERT INTO public.clients (id, company_id, name, type, siren, email, address)
  VALUES (v_client_pad, v_comp_pad, 'Client Padding', 'b2b', '111111111', 'pad@client.fr', '2 rue Client');

  -- Contexte authentifié
  PERFORM set_config('request.jwt.claim.sub', v_user_pad::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- 1. Première émission : doit donner FAC-YYYY-001 (3 chiffres)
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
  VALUES (v_inv_draft1, v_comp_pad, v_client_pad, 'DRAFT-PAD-01', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, '30d', 100, 0, 100);
  INSERT INTO public.invoice_lines (id, invoice_id, description, quantity, unit_price, nature, position, vat_rate)
  VALUES (gen_random_uuid(), v_inv_draft1, 'Prestation 1', 1, 100, 'service', 1, 0);

  v_emitted1 := public.emit_invoice(v_inv_draft1);

  PERFORM is(
    v_emitted1.number,
    'FAC-' || v_current_year || '-001',
    'Scénario 21a : Première facture d''une société reçoit le masque à 3 chiffres FAC-YYYY-001'
  );

  -- 2. Simulation d'une facture existante à 4 chiffres (comme FAC-2026-0011 issue du lot 6)
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
  VALUES (v_inv_existing_4digits, v_comp_pad, v_client_pad, 'FAC-' || v_current_year || '-0011', 'invoice', 'pending', CURRENT_DATE, CURRENT_DATE + 30, '30d', 100, 0, 100);

  -- 3. Émission suivante : doit lire le max (11) et générer FAC-YYYY-012 sur 3 chiffres sans doublon ni saut
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc)
  VALUES (v_inv_draft2, v_comp_pad, v_client_pad, 'DRAFT-PAD-02', 'invoice', 'draft', CURRENT_DATE, CURRENT_DATE + 30, '30d', 100, 0, 100);
  INSERT INTO public.invoice_lines (id, invoice_id, description, quantity, unit_price, nature, position, vat_rate)
  VALUES (gen_random_uuid(), v_inv_draft2, 'Prestation 2', 1, 100, 'service', 1, 0);

  v_emitted2 := public.emit_invoice(v_inv_draft2);

  PERFORM is(
    v_emitted2.number,
    'FAC-' || v_current_year || '-012',
    'Scénario 21b : Émission après une facture 4 chiffres (0011) génère bien FAC-YYYY-012 sur 3 chiffres'
  );

  -- 4. Test note de crédit (avoir) : doit utiliser le préfixe AV et 3 chiffres (AV-YYYY-001)
  INSERT INTO public.invoices (id, company_id, client_id, number, type, status, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, credited_invoice_id)
  VALUES (v_inv_draft3, v_comp_pad, v_client_pad, 'DRAFT-PAD-03', 'credit_note', 'draft', CURRENT_DATE, CURRENT_DATE + 30, '30d', 50, 0, 50, v_emitted2.id);
  INSERT INTO public.invoice_lines (id, invoice_id, description, quantity, unit_price, nature, position, vat_rate)
  VALUES (gen_random_uuid(), v_inv_draft3, 'Avoir prestation', 1, -50, 'service', 1, 0);

  v_emitted3 := public.emit_invoice(v_inv_draft3);

  PERFORM is(
    v_emitted3.number,
    'AV-' || v_current_year || '-001',
    'Scénario 21c : Émission d''un avoir génère le préfixe AV-YYYY-001 sur 3 chiffres'
  );

  EXECUTE 'RESET ROLE';
END $$;


SELECT * FROM finish();
ROLLBACK;
