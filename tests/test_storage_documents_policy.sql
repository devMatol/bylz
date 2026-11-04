-- Test réel de la politique RLS du bucket 'documents' sur PostgreSQL
-- Vérifie l'isolation étanche entre sociétés pour les fichiers Factur-X

SELECT plan(6);

-- 1. Configuration des utilisateurs A et B et de leurs sociétés
DO $$
DECLARE
  v_user_a uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_user_b uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_comp_a uuid := '11111111-1111-1111-1111-111111111111';
  v_comp_b uuid := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- Nettoyage préalable
  DELETE FROM storage.objects WHERE bucket_id = 'documents';
  DELETE FROM public.companies WHERE id IN (v_comp_a, v_comp_b);
  DELETE FROM auth.users WHERE id IN (v_user_a, v_user_b);

  -- Création utilisateurs auth
  INSERT INTO auth.users (id, email, role) VALUES 
    (v_user_a, 'userA@bylz.fr', 'authenticated'),
    (v_user_b, 'userB@bylz.fr', 'authenticated');

  -- Création sociétés respectives
  INSERT INTO public.companies (id, user_id, legal_name, siren, siret, address, activity_type, vat_regime, structure, urssaf_frequency, default_payment_terms) VALUES
    (v_comp_a, v_user_a, 'Société A', '111111111', '11111111100011', '10 Rue A 75001 Paris', 'freelance_bnc', 'franchise', 'micro', 'monthly', '30d'),
    (v_comp_b, v_user_b, 'Société B', '222222222', '22222222200022', '20 Rue B 69001 Lyon', 'freelance_bnc', 'vat', 'micro', 'monthly', '30d');

  -- Création du bucket documents s'il n'existe pas
  INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- 2. Activation RLS sur storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Test sous identité Utilisateur A
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

-- Test 1 : Utilisateur A insère son propre fichier Factur-X dans son dossier société
DO $$
BEGIN
  INSERT INTO storage.objects (id, bucket_id, name, owner)
  VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'documents',
    '11111111-1111-1111-1111-111111111111/facturx/FAC-A-001.pdf',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
  );
  PERFORM ok(true, 'Test 1 : Utilisateur A dépose son Factur-X dans le dossier de sa société');
EXCEPTION WHEN OTHERS THEN
  PERFORM ok(false, 'Test 1 ÉCHEC : ' || SQLERRM);
END $$;

-- Test 2 : Utilisateur A peut lire son propre fichier Factur-X
SELECT is(
  (SELECT count(*)::int FROM storage.objects WHERE name = '11111111-1111-1111-1111-111111111111/facturx/FAC-A-001.pdf'),
  1,
  'Test 2 : Utilisateur A a accès en lecture à son propre Factur-X'
);

-- Test 3 : Utilisateur A tente d''écrire dans le dossier de la Société B (Rejet attendu)
DO $$
BEGIN
  INSERT INTO storage.objects (id, bucket_id, name, owner)
  VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'documents',
    '22222222-2222-2222-2222-222222222222/facturx/FAC-MALICIEUX.pdf',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
  );
  PERFORM ok(false, 'Test 3 ÉCHEC : Utilisateur A a réussi à écrire dans le dossier de Société B');
EXCEPTION WHEN OTHERS THEN
  PERFORM ok(true, 'Test 3 : Attaque rejetée - Utilisateur A ne peut pas écrire dans le dossier de Société B (RLS check)');
END $$;

-- 4. Test sous identité Utilisateur B (l'attaquant)
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

-- Test 4 : Utilisateur B tente d''accéder au fichier Factur-X de la Société A (Zéro ligne visible)
SELECT is(
  (SELECT count(*)::int FROM storage.objects WHERE name = '11111111-1111-1111-1111-111111111111/facturx/FAC-A-001.pdf'),
  0,
  'Test 4 : Attaque rejetée - Utilisateur B ne peut pas voir le Factur-X de Société A (RLS read isolation)'
);

-- Test 5 : Utilisateur B tente d''insérer dans le dossier de Société A (Rejet attendu)
DO $$
BEGIN
  INSERT INTO storage.objects (id, bucket_id, name, owner)
  VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'documents',
    '11111111-1111-1111-1111-111111111111/facturx/FAC-INTRUSION.pdf',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  );
  PERFORM ok(false, 'Test 5 ÉCHEC : Utilisateur B a réussi à injecter un fichier chez Société A');
EXCEPTION WHEN OTHERS THEN
  PERFORM ok(true, 'Test 5 : Attaque rejetée - Utilisateur B ne peut pas injecter de fichier dans Société A');
END $$;

-- Test 6 : Utilisateur B dépose dans son propre dossier
DO $$
BEGIN
  INSERT INTO storage.objects (id, bucket_id, name, owner)
  VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'documents',
    '22222222-2222-2222-2222-222222222222/facturx/FAC-B-001.pdf',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  );
  PERFORM ok(true, 'Test 6 : Utilisateur B dépose avec succès son propre Factur-X');
EXCEPTION WHEN OTHERS THEN
  PERFORM ok(false, 'Test 6 ÉCHEC : ' || SQLERRM);
END $$;

SELECT finish();
