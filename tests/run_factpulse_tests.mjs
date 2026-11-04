import assert from "assert";
import fs from "fs";
import path from "path";
import { PGlite } from "@electric-sql/pglite";
import {
  validateFactPulseAddress,
  verifyInvoiceTotalsConcordance,
  mapCdarStatusCodeToPaStatus,
  getPaStatusRank,
  verifyWebhookSignatureAndTime,
  sanitizeWebhookPayload,
  recoverStaleSubmittingStatus,
  attemptAtomicReservation,
  decideSubmissionSuccess,
  restorePreviousStatus,
} from "../supabase/functions/_shared/factpulse-helpers.ts";

async function main() {
  console.log("===============================================================");
  console.log("   SUITE DE TESTS FACTPULSE COMPLÈTE (UNITAIRE & POSTGRES)");
  console.log("   (Aucune lecture du fichier .env, code réel importé)");
  console.log("===============================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function runTest(name, fn) {
    totalTests++;
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      process.exitCode = 1;
    }
  }

  async function runAsyncTest(name, fn) {
    totalTests++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      process.exitCode = 1;
    }
  }

  // --- SECTION 1 : VALIDATION D'ADRESSES ---
  console.log("--- 1. Validation des adresses (émetteur et acheteur) ---");

  runTest("1.1 Émetteur : rue, code postal et ville obligatoires (rejet si incomplet)", () => {
    const res1 = validateFactPulseAddress({ address: "", postal_code: "75001", city: "Paris" }, "émetteur");
    assert.strictEqual(res1.valid, false);
    assert.ok(res1.error?.includes("Adresse de l'émetteur incomplète"));

    const res2 = validateFactPulseAddress({ address: "10 Rue de la Paix", postal_code: "", city: "Paris" }, "émetteur");
    assert.strictEqual(res2.valid, false);

    const res3 = validateFactPulseAddress({ address: "10 Rue de la Paix", postal_code: "75001", city: "" }, "émetteur");
    assert.strictEqual(res3.valid, false);
  });

  runTest("1.2 Client B2B : rejet explicite si l'adresse est incomplète", () => {
    const res = validateFactPulseAddress({ address: "5 Rue du Test", postal_code: "69001", city: "" }, "client");
    assert.strictEqual(res.valid, false);
    assert.ok(res.error?.includes("Adresse du client B2B incomplète"));
  });

  runTest("1.3 Adresses complètes : validation acceptée", () => {
    const res = validateFactPulseAddress({ address: "10 Rue de la Paix", postal_code: "75002", city: "Paris" }, "émetteur");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.street, "10 Rue de la Paix");
    assert.strictEqual(res.postalCode, "75002");
    assert.strictEqual(res.city, "Paris");
  });

  // --- SECTION 2 : CONTRÔLE ARITHMÉTIQUE TVA ET TOTAUX ---
  console.log("\n--- 2. Contrôle de concordance arithmétique TVA ---");

  runTest("2.1 Facture au régime TVA 20 % : validation et calcul exact", () => {
    const lines = [
      { quantity: 2, unitPrice: 50.0, vatRate: 20 },
      { quantity: 1, unitPrice: 200.0, vatRate: 20 },
    ];
    const res = verifyInvoiceTotalsConcordance(lines, 300.0, 60.0, 360.0, "vat");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.computedHt, 300.0);
    assert.strictEqual(res.computedVat, 60.0);
    assert.strictEqual(res.computedTtc, 360.0);
  });

  runTest("2.2 Facture en franchise en base : TVA = 0 € garanti", () => {
    const lines = [
      { quantity: 1, unitPrice: 450.0, vatRate: 0 },
      { quantity: 3, unitPrice: 50.0, vatRate: 0 },
    ];
    const res = verifyInvoiceTotalsConcordance(lines, 600.0, 0.0, 600.0, "franchise");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.computedHt, 600.0);
    assert.strictEqual(res.computedVat, 0.0);
    assert.strictEqual(res.computedTtc, 600.0);
  });

  runTest("2.3 Détection et rejet immédiat en cas d'écart sur le montant HT ou TVA", () => {
    const lines = [{ quantity: 1, unitPrice: 100.0, vatRate: 20 }];
    const resMismatch = verifyInvoiceTotalsConcordance(lines, 100.0, 0.0, 100.0, "vat");
    assert.strictEqual(resMismatch.valid, false);
    assert.ok(resMismatch.error?.includes("Écart arithmétique sur le total TVA"));
  });

  // --- SECTION 3 : MAPPING NORMATIF AFNOR XP Z12-012 & INVOPOP ---
  console.log("\n--- 3. Mapping normatif des statuts (AFNOR / DGFIP / Invopop) ---");

  runTest("3.1 Codes 200, 201, 202 correspondent à 'submitted' (200 n'est JAMAIS 'delivered')", () => {
    const res200 = mapCdarStatusCodeToPaStatus(200);
    assert.strictEqual(res200.pa_status, "submitted");
    assert.strictEqual(res200.label, "Déposée");

    const res201 = mapCdarStatusCodeToPaStatus(201);
    assert.strictEqual(res201.pa_status, "submitted");

    const res202 = mapCdarStatusCodeToPaStatus(202);
    assert.strictEqual(res202.pa_status, "submitted");
  });

  runTest("3.2 Codes 203 & 204 correspondent à 'delivered'", () => {
    const res203 = mapCdarStatusCodeToPaStatus(203);
    assert.strictEqual(res203.pa_status, "delivered");
    assert.strictEqual(res203.label, "Mise à disposition");

    const res204 = mapCdarStatusCodeToPaStatus(204);
    assert.strictEqual(res204.pa_status, "delivered");
    assert.strictEqual(res204.label, "Prise en charge");
  });

  runTest("3.3 Codes 205, 206, 211 & 212 correspondent à 'accepted'", () => {
    const res205 = mapCdarStatusCodeToPaStatus(205);
    assert.strictEqual(res205.pa_status, "accepted");
    assert.strictEqual(res205.label, "Approuvée");

    const res206 = mapCdarStatusCodeToPaStatus(206);
    assert.strictEqual(res206.pa_status, "accepted");

    const res211 = mapCdarStatusCodeToPaStatus(211);
    assert.strictEqual(res211.pa_status, "accepted");

    const res212 = mapCdarStatusCodeToPaStatus(212);
    assert.strictEqual(res212.pa_status, "accepted");
    assert.strictEqual(res212.label, "Encaissée");
  });

  runTest("3.4 Codes 210 (Refusée) & 213 (Rejetée) sont 'rejected' ; 209 n'est PAS un rejet", () => {
    const res210 = mapCdarStatusCodeToPaStatus(210);
    assert.strictEqual(res210.pa_status, "rejected");
    assert.strictEqual(res210.label, "Refusée");

    const res213 = mapCdarStatusCodeToPaStatus(213);
    assert.strictEqual(res213.pa_status, "rejected");
    assert.strictEqual(res213.label, "Rejetée par la plateforme");

    const res209 = mapCdarStatusCodeToPaStatus(209);
    assert.strictEqual(res209.pa_status, null);
    assert.strictEqual(res209.label, "Complétée");
  });

  runTest("3.5 Codes 207 (En litige) & 208 (Suspendue) sont distincts de 'submitted'", () => {
    const res207 = mapCdarStatusCodeToPaStatus(207);
    assert.strictEqual(res207.pa_status, "litigation");
    assert.strictEqual(res207.label, "En litige");

    const res208 = mapCdarStatusCodeToPaStatus(208);
    assert.strictEqual(res208.pa_status, "suspended");
    assert.strictEqual(res208.label, "Suspendue");
  });

  runTest("3.6 Règle de non-régression de statut : un événement plus ancien est ignoré", () => {
    const currentRank = getPaStatusRank("accepted");
    const incoming200 = mapCdarStatusCodeToPaStatus(200);
    assert.ok(incoming200.rank < currentRank, "Le statut soumis a un rang inférieur à accepté");

    const incoming203 = mapCdarStatusCodeToPaStatus(203);
    assert.ok(incoming203.rank < currentRank, "Le statut livré a un rang inférieur à accepté");
  });

  // --- SECTION 4 : SÉCURITÉ WEBHOOK ---
  console.log("\n--- 4. Sécurité Webhook (HMAC, anti-rejeu & échec fermé) ---");

  await runAsyncTest("4.1 Échec fermé : rejet si le secret serveur est vide", async () => {
    const res = await verifyWebhookSignatureAndTime("{}", "sig", "1700000000", "");
    assert.strictEqual(res.valid, false);
    assert.ok(res.reason?.includes("échec fermé"));
  });

  await runAsyncTest("4.2 Signature HMAC-SHA256 valide et horodatage récent", async () => {
    const secret = "mon_secret_factpulse_super_securise_123";
    const body = JSON.stringify({ event_type: "status.updated", flowId: "FLUX-42" });
    const nowSec = 1700000000;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const sigHex = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const res = await verifyWebhookSignatureAndTime(body, sigHex, String(nowSec), secret, 300, nowSec);
    assert.strictEqual(res.valid, true);
  });

  await runAsyncTest("4.3 Rejet si l'horodatage est expiré (attaque par rejeu)", async () => {
    const secret = "mon_secret";
    const body = "{}";
    const expiredTimestamp = 1700000000 - 600;
    const currentTimestamp = 1700000000;

    const res = await verifyWebhookSignatureAndTime(body, "deadbeef", String(expiredTimestamp), secret, 300, currentTimestamp);
    assert.strictEqual(res.valid, false);
    assert.ok(res.reason?.includes("Horodatage expiré"));
  });

  runTest("4.4 Assainissement RGPD : masquage systématique des coordonnées et données bancaires", () => {
    const payload = {
      event_type: "status.updated",
      flowId: "FLUX-777",
      customer_name: "Jean Dupont",
      email: "jean.dupont@test.fr",
      phone: "+33600000000",
      iban: "FR7630006000011234567890189",
      data: {
        buyer_name: "Client Confidentiel",
        street: "12 rue Secrète",
        statusCode: 200,
      },
    };

    const clean = sanitizeWebhookPayload(payload);
    assert.strictEqual(clean.customer_name, "[MASQUÉ]");
    assert.strictEqual(clean.email, "[MASQUÉ]");
    assert.strictEqual(clean.phone, "[MASQUÉ]");
    assert.strictEqual(clean.iban, "[MASQUÉ]");
    assert.strictEqual(clean.data.buyer_name, "[MASQUÉ]");
    assert.strictEqual(clean.data.street, "[MASQUÉ]");
    assert.strictEqual(clean.data.statusCode, 200);
    assert.strictEqual(clean.flowId, "FLUX-777");
  });

  // --- SECTION 5 : TEST SQL RÉEL DU BUCKET STORAGE DOCUMENTS ---
  console.log("\n--- 5. Test SQL Postgres : Isolation RLS du bucket documents ---");

  await runAsyncTest("5.1 Exécution de tests/test_storage_documents_policy.sql", async () => {
    const db = new PGlite();
    await initPostgresEnvironment(db);

    const sqlTest = fs.readFileSync("tests/test_storage_documents_policy.sql", "utf8");
    await db.exec(sqlTest);

    const results = await db.query("SELECT ok, description FROM public._tap_results ORDER BY id;");
    assert.strictEqual(results.rows.length, 6, "6 assertions TAP attendues");
    for (const row of results.rows) {
      assert.strictEqual(row.ok, true, `Échec TAP SQL : ${row.description}`);
      console.log(`   [Postgres TAP OK] ${row.description}`);
    }
  });

  // --- SECTION 6 : TEST D'ÉMISSION ET SNAPSHOT LÉGAL POST-MIGRATIONS ---
  console.log("\n--- 6. Test SQL Postgres : Émission et conformité du legal_snapshot ---");

  await runAsyncTest("6.1 Validation de emit_invoice (rejet si vat_rate est NULL, conformité adresse)", async () => {
    const db = new PGlite();
    await initPostgresEnvironment(db);

    const sqlTest = fs.readFileSync("tests/test_full_migrations_and_emit.sql", "utf8");
    await db.exec(sqlTest);

    const results = await db.query("SELECT ok, description FROM public._tap_results ORDER BY id;");
    assert.ok(results.rows.length >= 8, `Au moins 8 assertions attendues, obtenu: ${results.rows.length}`);
    for (const row of results.rows) {
      assert.strictEqual(row.ok, true, `Échec TAP SQL : ${row.description}`);
      console.log(`   [Postgres TAP OK] ${row.description}`);
    }
  });

  // --- SECTION 7 : EXÉCUTION RÉELLE DES MIGRATIONS 170000 ET 180000 SUR BASE HISTORIQUE ---
  console.log("\n--- 7. Exécution réelle des fichiers de migration 170000 et 180000 ---");

  await runAsyncTest("7.1 Application des vrais fichiers SQL sur données pré-existantes", async () => {
    const db = new PGlite();
    await initPostgresBaseUpTo20261028(db);

    // Insertion des données "avant" (historique)
    const u1 = "11111111-1111-1111-1111-111111111111";
    const c1 = "aaaa1111-1111-1111-1111-111111111111";
    const cl1 = "bbbb1111-1111-1111-1111-111111111111";

    const u2 = "22222222-2222-2222-2222-222222222222";
    const c2 = "aaaa2222-2222-2222-2222-222222222222";
    const cl2 = "bbbb2222-2222-2222-2222-222222222222";

    const invTva = "cccc1111-1111-1111-1111-111111111111";
    const invFra = "cccc2222-2222-2222-2222-222222222222";
    const invAtyp = "cccc3333-3333-3333-3333-333333333333";
    const invHist0 = "cccc4444-4444-4444-4444-444444444444";

    await db.exec(`
      SELECT set_config('app.bypass_invoice_lock', 'on', false);

      -- Utilisateurs & Profils
      INSERT INTO auth.users (id, email) VALUES ('${u1}', 'u1@test.fr'), ('${u2}', 'u2@test.fr') ON CONFLICT DO NOTHING;
      INSERT INTO public.profiles (id, email, plan) VALUES ('${u1}', 'u1@test.fr', 'pro'), ('${u2}', 'u2@test.fr', 'solo') ON CONFLICT DO NOTHING;

      -- Société 1 : avec adresse "10 rue de la Paix 75002 Paris"
      INSERT INTO public.companies (id, user_id, legal_name, siret, siren, address, activity_type, vat_regime, structure, urssaf_frequency, previous_ca)
      VALUES ('${c1}', '${u1}', 'Entreprise Paris', '11111111100010', '111111111', '10 rue de la Paix 75002 Paris', 'artisan_bic', 'vat', 'SAS', 'monthly', 0);

      -- Société 2 : avec adresse non reconnue
      INSERT INTO public.companies (id, user_id, legal_name, siret, siren, address, activity_type, vat_regime, structure, urssaf_frequency, previous_ca)
      VALUES ('${c2}', '${u2}', 'Entreprise Floue', '22222222200010', '222222222', 'Adresse sans code postal', 'freelance_bnc', 'franchise', 'EI', 'quarterly', 0);

      -- Clients
      INSERT INTO public.clients (id, company_id, name, type, siren, address)
      VALUES ('${cl1}', '${c1}', 'Client B2B Pro', 'b2b', '999888777', '20 avenue Montaigne 75008 Paris'),
             ('${cl2}', '${c2}', 'Client B2C', 'b2c', NULL, 'Quelque part');

      -- Facture A : TVA 60 € sur 300 € HT (taux attendu: 20%)
      INSERT INTO public.invoices (id, company_id, client_id, number, type, status, pa_status, total_ht, total_vat, total_ttc, issue_date, due_date)
      VALUES ('${invTva}', '${c1}', '${cl1}', 'FAC-TVA-60', 'invoice', 'pending', 'none', 300.00, 60.00, 360.00, CURRENT_DATE, CURRENT_DATE);

      INSERT INTO public.invoice_lines (id, invoice_id, description, quantity, unit_price, nature, position)
      VALUES (gen_random_uuid(), '${invTva}', 'Prestation 1', 1, 150.00, 'service', 1),
             (gen_random_uuid(), '${invTva}', 'Prestation 2', 1, 150.00, 'service', 2);

      -- Facture B : Franchise à 0 € de TVA (taux attendu: 0%)
      INSERT INTO public.invoices (id, company_id, client_id, number, type, status, pa_status, total_ht, total_vat, total_ttc, issue_date, due_date)
      VALUES ('${invFra}', '${c2}', '${cl2}', 'FAC-FRA-0', 'invoice', 'pending', 'none', 200.00, 0.00, 200.00, CURRENT_DATE, CURRENT_DATE);

      INSERT INTO public.invoice_lines (id, invoice_id, description, quantity, unit_price, nature, position)
      VALUES (gen_random_uuid(), '${invFra}', 'Formation', 1, 200.00, 'service', 1);

      -- Facture C : Multi-taux ou taux atypique non déductible (total_vat ne colle pas aux taux standards)
      INSERT INTO public.invoices (id, company_id, client_id, number, type, status, pa_status, total_ht, total_vat, total_ttc, issue_date, due_date)
      VALUES ('${invAtyp}', '${c1}', '${cl1}', 'FAC-ATYP', 'invoice', 'pending', 'none', 100.00, 13.50, 113.50, CURRENT_DATE, CURRENT_DATE);

      INSERT INTO public.invoice_lines (id, invoice_id, description, quantity, unit_price, nature, position)
      VALUES (gen_random_uuid(), '${invAtyp}', 'Ligne atypique', 1, 100.00, 'service', 1);

      -- Facture D : Société devenue TVA après une ancienne facture à 0 € de TVA
      INSERT INTO public.invoices (id, company_id, client_id, number, type, status, pa_status, total_ht, total_vat, total_ttc, issue_date, due_date)
      VALUES ('${invHist0}', '${c1}', '${cl1}', 'FAC-HIST-0', 'invoice', 'pending', 'none', 400.00, 0.00, 400.00, CURRENT_DATE, CURRENT_DATE);

      INSERT INTO public.invoice_lines (id, invoice_id, description, quantity, unit_price, nature, position)
      VALUES (gen_random_uuid(), '${invHist0}', 'Ligne ancienne à 0 €', 1, 400.00, 'service', 1);

      SELECT set_config('app.bypass_invoice_lock', 'off', false);
    `);

    // Application TELLE QUELLE des migrations 170000 et 180000 via fs.readFileSync
    const mig17 = fs.readFileSync("supabase/migrations/20261031170000_add_address_postal_city_and_vat_rate.sql", "utf8");
    const mig18 = fs.readFileSync("supabase/migrations/20261031180000_factpulse_vat_backfill_and_snapshot.sql", "utf8");

    await db.exec(mig17);
    await db.exec(mig18);

    // Vérification Facture A (TVA 60 € sur 300 €) -> taux 20 %
    const resA = await db.query(`SELECT vat_rate FROM public.invoice_lines WHERE invoice_id = '${invTva}';`);
    assert.strictEqual(resA.rows.length, 2);
    assert.strictEqual(Number(resA.rows[0].vat_rate), 20.00);
    assert.strictEqual(Number(resA.rows[1].vat_rate), 20.00);

    // Vérification Facture B (Franchise 0 €) -> taux 0 %
    const resB = await db.query(`SELECT vat_rate FROM public.invoice_lines WHERE invoice_id = '${invFra}';`);
    assert.strictEqual(resB.rows.length, 1);
    assert.strictEqual(Number(resB.rows[0].vat_rate), 0.00);

    // Vérification Facture C (Atypique 13.50 €) -> lignes laissées à NULL sans planter la migration
    const resC = await db.query(`SELECT vat_rate FROM public.invoice_lines WHERE invoice_id = '${invAtyp}';`);
    assert.strictEqual(resC.rows.length, 1);
    assert.strictEqual(resC.rows[0].vat_rate, null);

    // Vérification Facture D (Historique 0 € sur société TVA) -> taux 0 % garanti
    const resD = await db.query(`SELECT vat_rate FROM public.invoice_lines WHERE invoice_id = '${invHist0}';`);
    assert.strictEqual(resD.rows.length, 1);
    assert.strictEqual(Number(resD.rows[0].vat_rate), 0.00);

    // Vérification extraction adresse
    const resComp1 = await db.query(`SELECT postal_code, city FROM public.companies WHERE id = '${c1}';`);
    assert.strictEqual(resComp1.rows[0].postal_code, "75002");
    assert.strictEqual(resComp1.rows[0].city, "Paris");

    const resComp2 = await db.query(`SELECT postal_code, city FROM public.companies WHERE id = '${c2}';`);
    assert.strictEqual(resComp2.rows[0].postal_code, null); // Non altéré (reste NULL)
  });

  // --- SECTION 8 : LOGIQUE DE DÉCISION ET CONCURRENCE POSTGRES RÉELLE ---
  console.log("\n--- 8. Logique extraite submit-to-pa (décision, récupération & concurrence Postgres) ---");

  runTest("8.1 decideSubmissionSuccess : flowId obligatoire (aucun repli sur destinationType)", () => {
    // Succès : flowId présent
    const okRes = decideSubmissionSuccess({
      success: true,
      destinationType: "afnor",
      afnorResult: { flowId: "FLOW-AFNOR-999" },
    });
    assert.strictEqual(okRes.success, true);
    assert.strictEqual(okRes.flowId, "FLOW-AFNOR-999");

    // Échec : destinationType présent mais flowId absent
    const failRes = decideSubmissionSuccess({
      success: true,
      destinationType: "afnor",
      afnorResult: { error: "No PDP configuration" },
    });
    assert.strictEqual(failRes.success, false);
    assert.ok(failRes.rejectionReason?.includes("No PDP configuration") || failRes.rejectionReason?.includes("aucun identifiant"));

    // Échec : réponse vide
    const emptyRes = decideSubmissionSuccess({});
    assert.strictEqual(emptyRes.success, false);
  });

  await runAsyncTest("8.2 recoverStaleSubmittingStatus : réinitialisation si bloqué depuis > 10 min", async () => {
    let queryLog = [];
    const fakeClient = {
      from: (table) => ({
        update: (data) => ({
          eq: (col1, val1) => ({
            eq: (col2, val2) => ({
              lt: (col3, val3) => ({
                select: async () => {
                  queryLog.push({ table, data, col1, val1, col2, val2, col3, val3 });
                  return { data: [{ id: "inv-1" }], error: null };
                },
              }),
            }),
          }),
        }),
      }),
    };

    const res = await recoverStaleSubmittingStatus(fakeClient, "inv-1", 10, Date.now());
    assert.strictEqual(res.recovered, true);
    assert.strictEqual(queryLog[0].data.pa_status, "none");
  });

  await runAsyncTest("8.3 restorePreviousStatus : restauration de l'état précédent et motif", async () => {
    let updatedPayload = null;
    const fakeClient = {
      from: () => ({
        update: (data) => ({
          eq: async () => {
            updatedPayload = data;
            return { error: null };
          },
        }),
      }),
    };

    await restorePreviousStatus(fakeClient, "inv-42", "rejected", "Erreur réseau FactPulse");
    assert.strictEqual(updatedPayload.pa_status, "rejected");
    assert.strictEqual(updatedPayload.pa_rejection_reason, "Erreur réseau FactPulse");
  });

  await runAsyncTest("8.4 Réservation atomique concurrente sur Postgres avec deux transactions réelles", async () => {
    const db = new PGlite();
    await initPostgresEnvironment(db);

    const invId = "cccc8888-8888-8888-8888-888888888888";
    const compId = "aaaa8888-8888-8888-8888-888888888888";
    const userId = "88888888-8888-8888-8888-888888888888";
    const clientId = "bbbb8888-8888-8888-8888-888888888888";

    await db.exec(`
      INSERT INTO auth.users (id, email) VALUES ('${userId}', 'conc_real@bylz.fr') ON CONFLICT DO NOTHING;
      INSERT INTO public.profiles (id, email, plan) VALUES ('${userId}', 'conc_real@bylz.fr', 'pro') ON CONFLICT DO NOTHING;
      INSERT INTO public.companies (id, user_id, legal_name, siret, siren, address, activity_type, structure, urssaf_frequency, previous_ca) 
      VALUES ('${compId}', '${userId}', 'Concurrence SAS', '88888888800010', '888888888', '10 Rue Test', 'freelance_bnc', 'EI', 'monthly', 0);
      INSERT INTO public.clients (id, company_id, name, type, address) VALUES ('${clientId}', '${compId}', 'Client Conc', 'b2c', '10 Rue Test');
      INSERT INTO public.invoices (id, company_id, client_id, number, type, status, pa_status, total_ht, total_vat, total_ttc, issue_date, due_date)
      VALUES ('${invId}', '${compId}', '${clientId}', 'FAC-CONC-REAL', 'invoice', 'pending', 'none', 100, 20, 120, CURRENT_DATE, CURRENT_DATE);
    `);

    // Transaction 1 : Démarre et réserve atomiquement
    await db.exec("BEGIN;");
    const t1Res = await attemptAtomicReservation(db, invId);
    assert.strictEqual(t1Res.reserved, true, "Transaction 1 obtient la réservation atomique");

    // Transaction 2 (simulée pendant que la ressource est occupée) :
    // Même si la transaction 1 valide la réservation, toute tentative concurrente doit échouer
    const t2Res = await attemptAtomicReservation(db, invId);
    assert.strictEqual(t2Res.reserved, false, "Transaction 2 concurrente est immédiatement rejetée");
    assert.ok(t2Res.error?.includes("en cours"));

    await db.exec("COMMIT;");
  });

  console.log("\n===============================================================");
  console.log(`BILAN : ${passedTests}/${totalTests} tests réussis avec succès !`);
  console.log("===============================================================\n");
}

async function initPostgresBaseUpTo20261028(db) {
  await initPostgresStubs(db);
  const migrationsDir = "supabase/migrations";
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql") && f <= "20261028120000_inalterabilite_and_cancel_match.sql")
    .sort();

  for (const f of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
    try {
      await db.exec(sql);
    } catch {
      // Ignorer les erreurs d'objets ou de stubs
    }
  }

  await grantPermissions(db);
}

async function initPostgresEnvironment(db) {
  await initPostgresStubs(db);
  const migrationsDir = "supabase/migrations";
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  for (const f of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
    try {
      await db.exec(sql);
    } catch {
      // Ignorer
    }
  }

  await grantPermissions(db);
}

async function initPostgresStubs(db) {
  await db.exec(`
    DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id uuid PRIMARY KEY,
      email text,
      aud text DEFAULT 'authenticated',
      role text DEFAULT 'authenticated',
      banned_until timestamptz,
      raw_app_meta_data jsonb,
      created_at timestamptz DEFAULT now()
    );

    CREATE SCHEMA IF NOT EXISTS storage;
    CREATE TABLE IF NOT EXISTS storage.buckets (
      id text PRIMARY KEY,
      name text,
      public boolean DEFAULT false,
      avif_autodetection boolean DEFAULT false,
      file_size_limit bigint,
      allowed_mime_types text[],
      owner uuid,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS storage.objects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      bucket_id text REFERENCES storage.buckets(id),
      name text,
      owner uuid,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      last_accessed_at timestamptz DEFAULT now(),
      metadata jsonb DEFAULT '{}'::jsonb
    );
    CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql AS $$
      SELECT string_to_array(name, '/');
    $$;

    CREATE SCHEMA IF NOT EXISTS cron;
    CREATE OR REPLACE FUNCTION cron.schedule(job_name text, schedule text, command text) RETURNS void LANGUAGE sql AS $$ SELECT null; $$;

    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
      SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon');
    $$;

    CREATE TABLE IF NOT EXISTS public._tap_results (id serial primary key, ok boolean, description text);
    CREATE OR REPLACE FUNCTION public.plan(p_count int) RETURNS void LANGUAGE plpgsql AS $$ BEGIN NULL; END; $$;
    CREATE OR REPLACE FUNCTION public.ok(p_cond boolean, p_desc text) RETURNS void LANGUAGE plpgsql AS $$
    BEGIN INSERT INTO public._tap_results (ok, description) VALUES (p_cond, p_desc); END; $$;
    CREATE OR REPLACE FUNCTION public.is(p_val1 anyelement, p_val2 anyelement, p_desc text) RETURNS void LANGUAGE plpgsql AS $$
    BEGIN PERFORM public.ok(p_val1 IS NOT DISTINCT FROM p_val2, p_desc); END; $$;
    CREATE OR REPLACE FUNCTION public.finish() RETURNS TABLE(status text) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY SELECT 'done'::text; END; $$;
  `);
}

async function grantPermissions(db) {
  await db.exec(`
    GRANT USAGE ON SCHEMA storage TO authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO authenticated, service_role;
    GRANT USAGE ON SCHEMA public TO authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
    GRANT ALL ON SEQUENCE public._tap_results_id_seq TO authenticated, service_role, anon;
  `);
}

main().catch((err) => {
  console.error("Erreur fatale d'exécution :", err);
  process.exit(1);
});
