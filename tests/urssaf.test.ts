import test from 'node:test';
import assert from 'node:assert/strict';
import { URSSAF_RATES_2026, getUrssafConfig, calculateUrssafContribution } from '../src/lib/constants.ts';
import { computeUrssafPeriods } from '../src/lib/fiscal/urssafPeriods.ts';

test('Taux de cotisations URSSAF 2026 officiels', () => {
  // Vente de marchandises (BIC) : 12,3 %, abattement 71 %
  assert.equal(getUrssafConfig('bic_vente').rate, 0.123);
  assert.equal(getUrssafConfig('bic_vente').abattement, 0.71);
  assert.equal(URSSAF_RATES_2026.bic_vente.labelPercent, '12,3 %');
  assert.equal(URSSAF_RATES_2026.bic_vente.abattementLabel, '71 %');

  // Prestations de services (BIC) : 21,2 %, abattement 50 %
  assert.equal(getUrssafConfig('bic_service').rate, 0.212);
  assert.equal(getUrssafConfig('bic_service').abattement, 0.50);
  assert.equal(URSSAF_RATES_2026.bic_service.labelPercent, '21,2 %');
  assert.equal(URSSAF_RATES_2026.bic_service.abattementLabel, '50 %');

  // Professions libérales BNC, régime SSI : 25,6 %, abattement 34 %
  assert.equal(getUrssafConfig('bnc_ssi').rate, 0.256);
  assert.equal(getUrssafConfig('bnc_ssi').abattement, 0.34);
  assert.equal(URSSAF_RATES_2026.bnc_ssi.labelPercent, '25,6 %');
  assert.equal(URSSAF_RATES_2026.bnc_ssi.abattementLabel, '34 %');

  // Professions libérales BNC, CIPAV : 23,2 %, abattement 34 %
  assert.equal(getUrssafConfig('bnc_cipav').rate, 0.232);
  assert.equal(getUrssafConfig('bnc_cipav').abattement, 0.34);
  assert.equal(URSSAF_RATES_2026.bnc_cipav.labelPercent, '23,2 %');
  assert.equal(URSSAF_RATES_2026.bnc_cipav.abattementLabel, '34 %');
});

test('Calcul des cotisations : 1 000 € de CA en BNC SSI donne 256 € de cotisations', () => {
  const cotisations = calculateUrssafContribution(1000, 'bnc_ssi');
  assert.equal(cotisations, 256);
});

test('Calcul des cotisations pour les autres régimes sur 1 000 €', () => {
  assert.equal(calculateUrssafContribution(1000, 'bnc_cipav'), 232);
  assert.equal(calculateUrssafContribution(1000, 'bic_service'), 212);
  assert.equal(calculateUrssafContribution(1000, 'bic_vente'), 123);
});

test('A3 - Dates limites URSSAF : dernier jour du mois suivant la période', () => {
  // Test avec une entreprise créée au 1er janvier 2026
  const payments = [
    { id: '1', amount: 600, paid_at: '2026-07-15T10:00:00Z', invoice_id: 'inv1' },
    { id: '2', amount: 1000, paid_at: '2026-09-20T10:00:00Z', invoice_id: 'inv2' },
    { id: '3', amount: 0, paid_at: '2026-11-10T10:00:00Z', invoice_id: 'inv3' },
  ];

  const periods = computeUrssafPeriods(
    '2026-01-01T00:00:00Z',
    'monthly',
    payments as any,
    [],
    'bnc_ssi'
  );

  // Septembre (periodStart = 2026-09-01) -> date limite 31 octobre 2026
  const sept = periods.find((p) => p.periodStart === '2026-09-01');
  assert.ok(sept, 'Période de septembre trouvée');
  assert.equal(sept.dueDate, '2026-10-31');

  // Novembre (periodStart = 2026-11-01) -> date limite 31 décembre 2026
  const nov = periods.find((p) => p.periodStart === '2026-11-01');
  if (nov) {
    assert.equal(nov.dueDate, '2026-12-31');
  }

  // Juillet (periodStart = 2026-07-01) -> date limite 31 août 2026
  // CA 600 € en BNC SSI -> cotisations = 153,60 €
  const juil = periods.find((p) => p.periodStart === '2026-07-01');
  assert.ok(juil, 'Période de juillet trouvée');
  assert.equal(juil.dueDate, '2026-08-31');
  assert.equal(juil.revenue, 600);
  assert.equal(juil.estimatedAmount, 153.6);
});

test('A3 - Option trimestrielle URSSAF : dernier jour du mois suivant le trimestre', () => {
  const periodsQ = computeUrssafPeriods(
    '2026-01-01T00:00:00Z',
    'quarterly',
    [],
    [],
    'bnc_ssi'
  );

  // T1 (janvier à mars) -> date limite 30 avril
  const t1 = periodsQ.find((p) => p.periodStart === '2026-01-01');
  assert.ok(t1, 'Trimestre 1 trouvé');
  assert.equal(t1.dueDate, '2026-04-30');

  // T2 (avril à juin) -> date limite 31 juillet
  const t2 = periodsQ.find((p) => p.periodStart === '2026-04-01');
  assert.ok(t2, 'Trimestre 2 trouvé');
  assert.equal(t2.dueDate, '2026-07-31');

  // T3 (juillet à septembre) -> date limite 31 octobre
  const t3 = periodsQ.find((p) => p.periodStart === '2026-07-01');
  assert.ok(t3, 'Trimestre 3 trouvé');
  assert.equal(t3.dueDate, '2026-10-31');
});
