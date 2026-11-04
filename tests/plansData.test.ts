import test from "node:test";
import assert from "node:assert/strict";
import { PLANS_DATA, FEATURE_MATRIX } from "../src/lib/plansData.ts";
import { DEFAULT_PLAN_LIMITS } from "../src/lib/planLimits.ts";

test("Cohérence Plan Starter avec DEFAULT_PLAN_LIMITS", () => {
  const starter = PLANS_DATA.starter;
  const limits = DEFAULT_PLAN_LIMITS.starter;

  // Quotas
  assert.equal(limits.invoicesPerMonth, 3);
  assert.equal(limits.maxClients, 3);

  // Aucune fonction payante débloquée
  assert.equal(limits.fiscalDashboard, false);
  assert.equal(limits.reminders, false);
  assert.equal(limits.exports, false);
  assert.equal(limits.paymentLinks, false);
  assert.equal(limits.multiCompany, false);

  // Vérifier qu'aucune fonction bloquée n'est promise dans les features Starter
  for (const f of starter.features) {
    assert.doesNotMatch(f, /URSSAF/i, "Starter ne doit pas promettre le calcul URSSAF");
    assert.doesNotMatch(f, /Livre.*recettes/i, "Starter ne doit pas promettre le livre des recettes");
    assert.doesNotMatch(f, /Relance/i, "Starter ne doit pas promettre les relances");
    assert.doesNotMatch(f, /Stripe/i, "Starter ne doit pas promettre Stripe Connect");
    assert.doesNotMatch(f, /Assistant.*IA/i, "Starter ne doit pas promettre l'assistant IA");
  }
});

test("Cohérence Plan Solo avec DEFAULT_PLAN_LIMITS", () => {
  const solo = PLANS_DATA.solo;
  const limits = DEFAULT_PLAN_LIMITS.solo;

  // Quotas illimités
  assert.equal(limits.invoicesPerMonth, null);
  assert.equal(limits.maxClients, null);

  // Fonctions débloquées
  assert.equal(limits.fiscalDashboard, true);
  assert.equal(limits.reminders, true);
  assert.equal(limits.exports, true);

  // Fonctions Pro strictement bloquées
  assert.equal(limits.paymentLinks, false);
  assert.equal(limits.multiCompany, false);

  // Vérifier qu'aucune fonction Pro n'est promise dans Solo
  for (const f of solo.features) {
    assert.doesNotMatch(f, /Stripe/i, "Solo ne doit pas promettre Stripe Connect");
    assert.doesNotMatch(f, /Assistant.*IA/i, "Solo ne doit pas promettre l'assistant IA");
    assert.doesNotMatch(f, /Multi-entreprises/i, "Solo ne doit pas promettre le multi-entreprises");
  }
});

test("Cohérence Plan Pro avec DEFAULT_PLAN_LIMITS", () => {
  const limits = DEFAULT_PLAN_LIMITS.pro;

  assert.equal(limits.invoicesPerMonth, null);
  assert.equal(limits.maxClients, null);
  assert.equal(limits.fiscalDashboard, true);
  assert.equal(limits.reminders, true);
  assert.equal(limits.exports, true);
  assert.equal(limits.paymentLinks, true);
  assert.equal(limits.multiCompany, true);
});

test("Calcul mathématique exact des badges de réduction", () => {
  const solo = PLANS_DATA.solo.pricing;
  const pro = PLANS_DATA.pro.pricing;

  // Solo : (8.90 * 12 - 50) / (8.90 * 12) = 53.18% -> arrondi 53%
  const expectedSoloDiscount = Math.round(((solo.monthlyPrice * 12 - solo.annualTotal) / (solo.monthlyPrice * 12)) * 100);
  assert.equal(expectedSoloDiscount, 53);
  assert.equal(solo.discountBadgePercent, 53);

  // Pro : (12.90 * 12 - 80) / (12.90 * 12) = 48.32% -> arrondi 48%
  const expectedProDiscount = Math.round(((pro.monthlyPrice * 12 - pro.annualTotal) / (pro.monthlyPrice * 12)) * 100);
  assert.equal(expectedProDiscount, 48);
  assert.equal(pro.discountBadgePercent, 48);
  assert.notEqual(pro.discountBadgePercent, 53, "Pro ne doit jamais afficher -53%");
});

test("Absence stricte d'affirmations non codées dans les fonctionnalités et la matrice", () => {
  const allJson = JSON.stringify(FEATURE_MATRIX) + JSON.stringify(PLANS_DATA);

  // Fonctions inexistantes dans le code à proscrire
  assert.doesNotMatch(allJson, /expert-comptable/i, "Aucun accès expert-comptable ne doit être mentionné");
  assert.doesNotMatch(allJson, /télétransmission.*e-reporting/i, "Aucune télétransmission e-reporting ne doit être promise");
  assert.doesNotMatch(allJson, /synchronisation bancaire/i, "La synchronisation bancaire doit être absente des plans");
  assert.doesNotMatch(allJson, /support prioritaire/i, "Le support prioritaire non outillé doit être absent des plans");

  // Factur-X doit TOUJOURS comporter la mention 'en préparation'
  const facturxMatches = allJson.match(/factur-x/gi) || [];
  for (const _ of facturxMatches) {
    assert.match(allJson, /Factur-X.*en.*préparation/i);
  }
});

test("FEATURE_MATRIX échoue si une fonction verrouillée dans DEFAULT_PLAN_LIMITS est annoncée disponible", () => {
  for (const cat of FEATURE_MATRIX) {
    for (const item of cat.features) {
      // Starter ne peut jamais avoir de fonction réservée à Solo/Pro
      if (
        item.name.includes("Tableau de bord") ||
        item.name.includes("URSSAF") ||
        item.name.includes("franchise de TVA") ||
        item.name.includes("Relances automatiques") ||
        item.name.includes("Livre des recettes") ||
        item.name.includes("Stripe Connect") ||
        item.name.includes("Multi-entreprises")
      ) {
        assert.equal(
          item.starter,
          false,
          `Starter ne doit JAMAIS débloquer '${item.name}' selon DEFAULT_PLAN_LIMITS`
        );
      }

      // Solo ne peut jamais débloquer les fonctions réservées à Pro (Stripe Connect, Multi-entreprises, IA)
      if (
        item.name.includes("Stripe Connect") ||
        item.name.includes("Multi-entreprises") ||
        item.name.includes("Assistant IA")
      ) {
        assert.equal(
          item.solo,
          false,
          `Solo ne doit JAMAIS débloquer '${item.name}' selon DEFAULT_PLAN_LIMITS`
        );
      }
    }
  }
});
