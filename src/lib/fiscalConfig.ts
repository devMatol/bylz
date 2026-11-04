/**
 * Configuration fiscale et sociale officielle pour les micro-entreprises (2026)
 * Sources : impots.gouv.fr (Art. 293 B CGI) & urssaf.fr / autoentrepreneur.urssaf.fr
 */
import type { ActivityType } from "../types/database";
import { VAT_THRESHOLDS_2026, URSSAF_RATES_2026 } from "./constants";

export const FISCAL_YEAR = 2026;

/**
 * Seuils de franchise en base de TVA (Art. 293 B du CGI - barème 2026)
 * - Activités de services (BNC et BIC) : 37 500 € (seuil de base) / 41 250 € (seuil majoré)
 * - Vente de marchandises / hébergement (BIC) : 85 000 € (seuil de base) / 93 500 € (seuil majoré)
 */
export const VAT_THRESHOLDS = {
  service: VAT_THRESHOLDS_2026.services.base,
  goods: VAT_THRESHOLDS_2026.sales.base,
  serviceMajored: VAT_THRESHOLDS_2026.services.majore,
  goodsMajored: VAT_THRESHOLDS_2026.sales.majore,
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
 * - Professions libérales BNC, régime SSI : 25,6 % (abattement 34 %)
 * - Professions libérales BNC, CIPAV : 23,2 % (abattement 34 %)
 * - Prestations de services (BIC) : 21,2 % (abattement 50 %)
 * - Vente de marchandises (BIC) : 12,3 % (abattement 71 %)
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
    rate: URSSAF_RATES_2026.bnc_ssi.rate,
    label: URSSAF_RATES_2026.bnc_ssi.labelPercent,
    abattement: URSSAF_RATES_2026.bnc_ssi.abattement,
    abattementLabel: "34 % (BNC)",
    description: "Professions libérales et prestations intellectuelles BNC (régime général SSI)",
  },
  liberal: {
    rate: URSSAF_RATES_2026.bnc_ssi.rate,
    label: URSSAF_RATES_2026.bnc_ssi.labelPercent,
    abattement: URSSAF_RATES_2026.bnc_ssi.abattement,
    abattementLabel: "34 % (BNC)",
    description: "Professions libérales BNC (SSI)",
  },
  artisan_bic: {
    rate: URSSAF_RATES_2026.bic_service.rate,
    label: URSSAF_RATES_2026.bic_service.labelPercent,
    abattement: URSSAF_RATES_2026.bic_service.abattement,
    abattementLabel: "50 % (BIC services)",
    description: "Prestations de services commerciales ou artisanales (BIC)",
  },
  commerce: {
    rate: URSSAF_RATES_2026.bic_vente.rate,
    label: URSSAF_RATES_2026.bic_vente.labelPercent,
    abattement: URSSAF_RATES_2026.bic_vente.abattement,
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
  return URSSAF_RATES[activityType]?.abattement ?? URSSAF_RATES_2026.bnc_ssi.abattement;
}

export function urssafRateFor(activityType: ActivityType): number {
  return URSSAF_RATES[activityType]?.rate ?? URSSAF_RATES_2026.bnc_ssi.rate;
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
