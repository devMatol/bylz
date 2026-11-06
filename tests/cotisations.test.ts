import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateCotisations } from "../src/lib/fiscal/cotisations.ts";
import { extractInvoiceVat, computeFiscalMetrics } from "../src/lib/fiscal.ts";

test("A2 - Calcul des cotisations en BNC SSI (taux 25,6 %)", () => {
  // Cas contractuel demandé : 600 € doit donner exactement 153,60 €
  const res600 = calculateCotisations(600, "bnc_ssi");
  assert.strictEqual(res600.cotisations, 153.6);
  assert.strictEqual(res600.netEstime, 446.4);
  assert.strictEqual(res600.ratePercent, 25.6);
  assert.strictEqual(res600.beneficeFiscal, 396.0); // 600 * (1 - 0.34) = 396 €

  // 1000 € doit donner 256,00 €
  const res1000 = calculateCotisations(1000, "bnc_ssi");
  assert.strictEqual(res1000.cotisations, 256.0);
  assert.strictEqual(res1000.netEstime, 744.0);

  // 0 € doit donner 0,00 €
  const res0 = calculateCotisations(0, "bnc_ssi");
  assert.strictEqual(res0.cotisations, 0);
  assert.strictEqual(res0.netEstime, 0);
});

test("A2 - Calcul des cotisations en BIC Services (taux 21,2 %)", () => {
  const res1000 = calculateCotisations(1000, "bic_service");
  assert.strictEqual(res1000.cotisations, 212.0);
  assert.strictEqual(res1000.netEstime, 788.0);
  assert.strictEqual(res1000.beneficeFiscal, 500.0); // 1000 * (1 - 0.50) = 500 €
});

test("A2 - Calcul des cotisations en BIC Vente (taux 12,3 %)", () => {
  const res1000 = calculateCotisations(1000, "bic_vente");
  assert.strictEqual(res1000.cotisations, 123.0);
  assert.strictEqual(res1000.netEstime, 877.0);
  assert.strictEqual(res1000.beneficeFiscal, 290.0); // 1000 * (1 - 0.71) = 290 €
});

test("A2 - Valeur par défaut quand l'activité n'est pas renseignée (repli BNC)", () => {
  const res = calculateCotisations(600, undefined);
  assert.strictEqual(res.cotisations, 153.6);
  assert.strictEqual(res.netEstime, 446.4);
});

test("A1 - extractInvoiceVat ne doit JAMAIS inventer 20% sur exonération ou taux 0", () => {
  // Facture avec total_vat = 0 explicite (exonération / autoliquidation / franchise)
  assert.strictEqual(extractInvoiceVat({ total_ttc: 500, total_ht: 500, total_vat: 0 }), 0);

  // Facture avec legal_snapshot.vat_rate = 0 et total_vat non renseigné
  assert.strictEqual(
    extractInvoiceVat({ total_ttc: 1000, total_ht: 1000, legal_snapshot: { vat_rate: 0 } }),
    0
  );

  // Facture avec legal_snapshot.vat_rate = 10 % réel
  assert.strictEqual(
    extractInvoiceVat({ total_ttc: 110, total_ht: 100, legal_snapshot: { vat_rate: 10 } }),
    10
  );

  // Facture sans aucun taux ni montant de TVA : ne doit jamais extrapoler 20 %
  assert.strictEqual(extractInvoiceVat({ total_ttc: 500, total_ht: 500 }), 0);

  // Facture avec total_vat réel = 40 €
  assert.strictEqual(extractInvoiceVat({ total_ttc: 240, total_ht: 200, total_vat: 40 }), 40);
});

test("A1 - computeFiscalMetrics hors franchise utilise les taux/montants réels sans inventer 20%", () => {
  const pendingInvoices = [
    { total_ttc: 1000, total_ht: 1000, total_vat: 0 }, // Facture exonérée
    { total_ttc: 600, total_ht: 500, total_vat: 100 },  // Facture avec 100 € de TVA réelle
    { total_ttc: 200, total_ht: 200, legal_snapshot: { vat_rate: 0 } }, // Taux 0 explicite
  ];

  const metrics = computeFiscalMetrics(
    "services",
    [],
    pendingInvoices,
    [],
    "reel_simplifie" // Hors franchise
  );

  // TVA collectée doit être exactement 100 € (et non pas 100 + 20% de 1000 ou 200)
  assert.strictEqual(metrics.tvaCollected, 100);
  assert.strictEqual(metrics.tvaNetToPay, 100);

  // En franchise en base, le montant doit obligatoirement être 0
  const metricsFranchise = computeFiscalMetrics(
    "services",
    [],
    pendingInvoices,
    [],
    "franchise"
  );
  assert.strictEqual(metricsFranchise.tvaCollected, 0);
  assert.strictEqual(metricsFranchise.tvaNetToPay, 0);
});
