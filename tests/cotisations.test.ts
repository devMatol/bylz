import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateCotisations } from "../src/lib/fiscal/cotisations.ts";

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
