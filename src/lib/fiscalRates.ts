/**
 * Constantes fiscales publiques et taux de cotisations 2026
 * Fichier autonome destiné aux simulateurs et outils de la vitrine Bylz
 * Indépendant de la base de données et des types applicatifs
 */

/**
 * Seuils officiels de franchise en base de TVA 2026 (Art. 293 B du CGI)
 * - Prestations de services (BNC / BIC) : 37 500 € (base) / 41 250 € (majoré)
 * - Vente de marchandises / hébergement (BIC) : 85 000 € (base) / 93 500 € (majoré)
 */
export const VAT_THRESHOLDS_2026 = {
  services: {
    base: 37500,
    majore: 41250,
    label: "Prestations de services (BNC / BIC)",
  },
  sales: {
    base: 85000,
    majore: 93500,
    label: "Ventes de marchandises (BIC)",
  },
} as const;

export type VatActivityType = keyof typeof VAT_THRESHOLDS_2026;

/**
 * Retourne les seuils de TVA 2026 selon la nature de l'activité
 */
export function getVatThresholds(activity?: string): {
  base: number;
  majore: number;
  label: string;
} {
  if (
    activity === "sales" ||
    activity === "goods" ||
    activity === "vente" ||
    activity === "commercant" ||
    activity === "artisan_bic" ||
    activity === "bic_vente"
  ) {
    return VAT_THRESHOLDS_2026.sales;
  }
  return VAT_THRESHOLDS_2026.services;
}

/**
 * Taux officiels de cotisations sociales URSSAF 2026 et abattements forfaitaires
 * Sources : urssaf.fr / autoentrepreneur.urssaf.fr (Barème officiel 2026)
 * - Vente de marchandises (BIC) : 12,3 %, abattement 71 %
 * - Prestations de services (BIC) : 21,2 %, abattement 50 %
 * - Professions libérales BNC, régime SSI : 25,6 %, abattement 34 %
 * - Professions libérales BNC, CIPAV : 23,2 %, abattement 34 %
 */
export const URSSAF_RATES_2026 = {
  bic_vente: {
    rate: 0.123,
    ratePercent: 12.3,
    labelPercent: "12,3 %",
    abattement: 0.71,
    abattementPercent: 71,
    abattementLabel: "71 %",
    label: "Vente de marchandises (BIC)",
    description: "Commerce et fourniture de logement (BIC)",
  },
  bic_service: {
    rate: 0.212,
    ratePercent: 21.2,
    labelPercent: "21,2 %",
    abattement: 0.50,
    abattementPercent: 50,
    abattementLabel: "50 %",
    label: "Prestations de services (BIC)",
    description: "Services commerciaux et artisanaux (BIC)",
  },
  bnc_ssi: {
    rate: 0.256,
    ratePercent: 25.6,
    labelPercent: "25,6 %",
    abattement: 0.34,
    abattementPercent: 34,
    abattementLabel: "34 %",
    label: "Professions libérales BNC (SSI)",
    description: "Activités libérales non réglementées rattachées au régime général / SSI",
  },
  bnc_cipav: {
    rate: 0.232,
    ratePercent: 23.2,
    labelPercent: "23,2 %",
    abattement: 0.34,
    abattementPercent: 34,
    abattementLabel: "34 %",
    label: "Professions libérales BNC (CIPAV)",
    description: "Activités libérales réglementées rattachées à la CIPAV (architectes, psychologues, etc.)",
  },
} as const;

export type UrssafActivityKey = keyof typeof URSSAF_RATES_2026;

/**
 * Retourne la configuration URSSAF 2026 pour une clé d'activité
 */
export function getUrssafConfig(activity?: string): (typeof URSSAF_RATES_2026)[UrssafActivityKey] {
  if (!activity) return URSSAF_RATES_2026.bnc_ssi;
  
  if (activity === "bic_vente" || activity === "commerce" || activity === "sales" || activity === "goods" || activity === "vente") {
    return URSSAF_RATES_2026.bic_vente;
  }
  if (activity === "bic_service" || activity === "artisan_bic" || activity === "services_bic") {
    return URSSAF_RATES_2026.bic_service;
  }
  if (activity === "bnc_cipav" || activity === "cipav") {
    return URSSAF_RATES_2026.bnc_cipav;
  }
  return URSSAF_RATES_2026.bnc_ssi;
}

/**
 * Calcule le montant des cotisations URSSAF 2026
 */
export function calculateUrssafContribution(ca: number, activity?: string): number {
  const config = getUrssafConfig(activity);
  return Math.round(ca * config.rate);
}
