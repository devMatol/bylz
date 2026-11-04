import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  BookOpen,
  Landmark,
  Settings,
  BookMarked,
  Bot,
  BellRing,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  requiredPlan?: "solo" | "pro";
  badge?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", path: "/dashboard", icon: LayoutDashboard },
  { label: "Devis", path: "/quotes", icon: FileText },
  { label: "Factures", path: "/invoices", icon: Receipt },
  { label: "Assistant IA", path: "/assistant", icon: Bot, requiredPlan: "pro", badge: "PRO" },
  { label: "Banque", path: "/bank", icon: Landmark, requiredPlan: "pro", badge: "PRO" },
  { label: "Relances", path: "/reminders", icon: BellRing, requiredPlan: "solo", badge: "SOLO" },
  { label: "Livre des recettes", path: "/livre-recettes", icon: BookMarked },
  { label: "Clients", path: "/clients", icon: Users },
  { label: "Catalogue", path: "/catalog", icon: BookOpen },
  { label: "Déclarations", path: "/urssaf", icon: Landmark, requiredPlan: "solo", badge: "SOLO" },
  { label: "Paramètres", path: "/settings", icon: Settings },
];

export const PLAN_LABELS: Record<string, string> = {
  starter: "STARTER",
  solo: "SOLO ⚡",
  pro: "PRO",
};

export type BillingCycle = "annual" | "monthly";

export const STRIPE_PRICE_SOLO_ANNUAL = "price_SOLO_ANNUAL_50";
export const STRIPE_PRICE_SOLO_MONTHLY = "price_SOLO_MONTHLY_890";
export const STRIPE_PRICE_PRO_ANNUAL = "price_PRO_ANNUAL_75";
export const STRIPE_PRICE_PRO_MONTHLY = "price_PRO_MONTHLY_1290";

export const STRIPE_PRICE_SOLO = STRIPE_PRICE_SOLO_ANNUAL;
export const STRIPE_PRICE_PRO = STRIPE_PRICE_PRO_ANNUAL;

export const PRICE_TO_PLAN: Record<string, "solo" | "pro"> = {
  [STRIPE_PRICE_SOLO_ANNUAL]: "solo",
  [STRIPE_PRICE_SOLO_MONTHLY]: "solo",
  [STRIPE_PRICE_PRO_ANNUAL]: "pro",
  [STRIPE_PRICE_PRO_MONTHLY]: "pro",
  price_1TvYmr2X0yCzQQsNrPbSS9NC: "solo",
  price_1TvYnW2X0yCzQQsN930PPkgJ: "pro",
};

export const PLAN_PRICES = {
  starter: { annual: 0, monthly: 0, annualMonthlyEquiv: "0 €" },
  solo: { annual: 50, monthly: 8.9, annualMonthlyEquiv: "4,17 €" },
  pro: { annual: 80, monthly: 12.9, annualMonthlyEquiv: "6,67 €" },
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  refused: "Refusé",
  pending: "En attente",
  late: "En retard",
  paid: "Payé",
  partially_paid: "Partiellement payée",
  rejected: "Rejeté",
  none: "Aucun",
  submitted: "Soumis",
  delivered: "Livré",
  received: "Reçu",
  confirmed: "Confirmé",
  error: "Erreur",
};

const envBotNumber =
  (typeof import.meta !== "undefined" && (import.meta as Record<string, any>)?.env?.VITE_WHATSAPP_BOT_NUMBER) ||
  (typeof globalThis !== "undefined" && (globalThis as Record<string, any>)?.process?.env?.VITE_WHATSAPP_BOT_NUMBER) ||
  "33939202435";
export const WHATSAPP_BOT_NUMBER = String(envBotNumber).replace(/\D/g, "");
export const WHATSAPP_BOT_LINK = `https://wa.me/${WHATSAPP_BOT_NUMBER}?text=Bonjour%20Bylz%20Copilot`;

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
 * Retourne la configuration URSSAF 2026 pour une clé d'activité ou un activity_type de base de données
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
  // Par défaut en libéral / freelance BNC (SSI)
  return URSSAF_RATES_2026.bnc_ssi;
}

/**
 * Calcule le montant des cotisations URSSAF 2026
 */
export function calculateUrssafContribution(ca: number, activity?: string): number {
  const config = getUrssafConfig(activity);
  return Math.round(ca * config.rate);
}
