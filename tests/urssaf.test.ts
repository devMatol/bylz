import test from 'node:test';
import assert from 'node:assert/strict';
import { URSSAF_RATES_2026, getUrssafConfig, calculateUrssafContribution } from '../src/lib/constants.ts';

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
