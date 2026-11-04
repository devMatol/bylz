import { getUrssafConfig } from "../constants.ts";

export interface CotisationsCalculation {
  ca: number;
  rate: number;
  ratePercent: number;
  labelPercent: string;
  cotisations: number;
  netEstime: number;
  beneficeFiscal: number;
  abattement: number;
  abattementPercent: number;
}

/**
 * Fonction unique et partagée pour le calcul des cotisations sociales et du net estimé en micro-entreprise.
 *
 * Règle fiscale officielle :
 * - Cotisations sociales micro-entrepreneur = Chiffre d'Affaires encaissé sur la période × Taux légal
 *   (arrondi au centime d'euro le plus proche).
 * - Net estimé = Chiffre d'Affaires encaissé sur la période - Cotisations sociales (avant impôt sur le revenu).
 * - Bénéfice fiscal estimé = Chiffre d'Affaires encaissé sur la période × (1 - Abattement forfaitaire).
 *
 * Exemple vérifié : 600,00 € en BNC SSI (taux 25,6 %) donne exactement 153,60 € de cotisations et 446,40 € de net avant impôt.
 */
export function calculateCotisations(
  caAmount: number,
  activityType?: string
): CotisationsCalculation {
  const safeCa = Math.max(0, Number(caAmount) || 0);
  const config = getUrssafConfig(activityType);

  const rate = config.rate;
  const abattement = config.abattement;

  // Calcul au centime d'euro
  const cotisations = Math.round(safeCa * rate * 100) / 100;
  const netEstime = Math.round((safeCa - cotisations) * 100) / 100;
  const beneficeFiscal = Math.round(safeCa * (1 - abattement) * 100) / 100;

  return {
    ca: safeCa,
    rate,
    ratePercent: config.ratePercent,
    labelPercent: config.labelPercent,
    cotisations,
    netEstime,
    beneficeFiscal,
    abattement,
    abattementPercent: config.abattementPercent,
  };
}
