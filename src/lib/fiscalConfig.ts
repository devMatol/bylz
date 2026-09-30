/**
 * Configuration fiscale et sociale officielle pour les micro-entreprises (2026)
 * Sources : impots.gouv.fr (Art. 293 B CGI) & urssaf.fr / autoentrepreneur.urssaf.fr
 */
import type { ActivityType } from "../types/database";

export const FISCAL_YEAR = 2026;

/**
 * Seuils de franchise en base de TVA (Art. 293 B du CGI)
 * - Activités de services (BNC et BIC) : 39 100 € (seuil de base) / 42 500 € (seuil majoré)
 * - Vente de marchandises / hébergement (BIC) : 101 000 € (seuil de base) / 110 000 € (seuil majoré)
 */
export const VAT_THRESHOLDS = {
  service: 39100,
  goods: 101000,
  serviceMajored: 42500,
  goodsMajored: 110000,
} as const;

/**
 * Plafonds de chiffre d'affaires du régime micro-entreprise
 */
export const MICRO_THRESHOLDS = {
  service: 77700,
  goods: 188700,
} as const;

/**
 * Taux de cotisations sociales URSSAF (Micro-entreprise taux plein 2026)
 * - BNC (Prestations libérales SSI / non réglementées) : 23,1 %
 * - BIC Prestations de services artisanales et commerciales : 21,2 %
 * - BIC Vente de marchandises / fournitures : 12,3 %
 */
export const URSSAF_RATES: Record<
  ActivityType,
  {
    rate: number;
    label: string;
    abattement: number;
    abattementLabel: string;
    description: string;
  }
> = {
  freelance_bnc: {
    rate: 0.231,
    label: "23,1 %",
    abattement: 0.34,
    abattementLabel: "34 % (BNC)",
    description: "Professions libérales et prestations intellectuelles (BNC)",
  },
  liberal: {
    rate: 0.231,
    label: "23,1 %",
    abattement: 0.34,
    abattementLabel: "34 % (BNC)",
    description: "Professions libérales (BNC)",
  },
  artisan_bic: {
    rate: 0.212,
    label: "21,2 %",
    abattement: 0.50,
    abattementLabel: "50 % (BIC services)",
    description: "Prestations de services commerciales ou artisanales (BIC)",
  },
  commerce: {
    rate: 0.123,
    label: "12,3 %",
    abattement: 0.71,
    abattementLabel: "71 % (BIC ventes)",
    description: "Ventes de marchandises et fournitures (BIC)",
  },
};

/**
 * Abattement forfaitaire pour frais professionnels (calcul du bénéfice fiscal net)
 * Micro-BNC : 34 % (Bénéfice fiscal = 66 % du CA)
 * Micro-BIC services : 50 % (Bénéfice fiscal = 50 % du CA)
 * Micro-BIC ventes : 71 % (Bénéfice fiscal = 29 % du CA)
 */
export function abattementFor(activityType: ActivityType): number {
  return URSSAF_RATES[activityType]?.abattement ?? 0.34;
}

export function urssafRateFor(activityType: ActivityType): number {
  return URSSAF_RATES[activityType]?.rate ?? 0.231;
}

/**
 * Calcul du bénéfice fiscal imposable
 */
export function computeTaxableBenefit(ca: number, activityType: ActivityType = "freelance_bnc"): number {
  const abattement = abattementFor(activityType);
  return Math.max(0, ca * (1 - abattement));
}

/**
 * Calcul des cotisations URSSAF
 */
export function computeUrssafContributions(ca: number, activityType: ActivityType = "freelance_bnc"): number {
  const rate = urssafRateFor(activityType);
  return ca * rate;
}
