/**
 * Source unique de vérité pour les plans tarifaires et fonctionnalités Bylz.
 * Utilisé par :
 * - LandingPage (/, sections tarifs et aperçu)
 * - PricingPage (/tarifs et matrice comparative)
 * - GuestEditorPage (/essai et modale de conversion)
 * - UpgradeModal (modale d'abonnement interne)
 * - Balises meta, JSON-LD et scripts de pré-rendu
 */

export interface PlanPricing {
  annualTotal: number;
  monthlyPrice: number;
  annualMonthlyEquiv: number;
  annualMonthlyEquivFormatted: string;
  discountBadgePercent: number;
  vatMention: string;
}

export interface PlanData {
  id: "starter" | "solo" | "pro";
  name: string;
  badge?: string;
  recommended?: boolean;
  description: string;
  pricing: PlanPricing;
  features: string[];
}

export interface FeatureMatrixItem {
  name: string;
  starter: string | boolean;
  solo: string | boolean;
  pro: string | boolean;
  hint?: string;
}

export interface FeatureMatrixCategory {
  category: string;
  features: FeatureMatrixItem[];
}

export const VAT_MENTION_FRANCHISE = "TVA non applicable, art. 293 B du CGI";

/**
 * Tarifs et caractéristiques des 3 formules Bylz
 */
export const PLANS_DATA: Record<"starter" | "solo" | "pro", PlanData> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Pour lancer votre activité en toute conformité",
    pricing: {
      annualTotal: 0,
      monthlyPrice: 0,
      annualMonthlyEquiv: 0,
      annualMonthlyEquivFormatted: "0 €",
      discountBadgePercent: 0,
      vatMention: VAT_MENTION_FRANCHISE,
    },
    features: [
      "Jusqu'à 3 factures et devis par mois",
      "Jusqu'à 3 clients actifs",
      "Export PDF avec mentions légales essentielles",
      "Facturation électronique en préparation",
      "Sans engagement, sans carte bancaire",
    ],
  },
  solo: {
    id: "solo",
    name: "Solo",
    badge: "RECOMMANDÉ INDÉPENDANTS",
    recommended: true,
    description: "Facturation et pilotage fiscal illimités pour les indépendants actifs",
    pricing: {
      annualTotal: 50,
      monthlyPrice: 8.9,
      annualMonthlyEquiv: 4.17,
      annualMonthlyEquivFormatted: "4,17 €",
      discountBadgePercent: 53, // (8.90 * 12 - 50) / (8.90 * 12) = 53.18%
      vatMention: VAT_MENTION_FRANCHISE,
    },
    features: [
      "Factures & Devis illimités",
      "Clients et catalogue illimités",
      "Tableau de bord fiscal en temps réel",
      "Calcul des cotisations URSSAF (BNC / BIC 2026)",
      "Alertes seuils de franchise de TVA (37 500 € / 85 000 €)",
      "Relances automatiques des factures par e-mail",
      "Livre chronologique des recettes & export CSV",
      "Facturation électronique en préparation",
      "Réponse sous 24 h ouvrées, du lundi au vendredi",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Tout Solo avec paiement en ligne, multi-entreprises et assistant IA",
    pricing: {
      annualTotal: 80,
      monthlyPrice: 12.9,
      annualMonthlyEquiv: 6.67,
      annualMonthlyEquivFormatted: "6,67 €",
      discountBadgePercent: 48, // (12.90 * 12 - 80) / (12.90 * 12) = 48.32%
      vatMention: VAT_MENTION_FRANCHISE,
    },
    features: [
      "Toutes les fonctionnalités Solo incluses",
      "Paiement en ligne par carte (Stripe Connect)",
      "Multi-entreprises sous un seul compte",
      "Assistant IA de facturation (Web & WhatsApp)",
      "Facturation électronique en préparation",
      "Réponse sous 24 h ouvrées, du lundi au vendredi",
    ],
  },
};

/**
 * Matrice comparative détaillée des fonctionnalités pour /tarifs
 */
export const FEATURE_MATRIX: FeatureMatrixCategory[] = [
  {
    category: "Facturation & Clients",
    features: [
      {
        name: "Factures & Devis mensuels",
        starter: "3 / mois",
        solo: "Illimités",
        pro: "Illimités",
      },
      {
        name: "Nombre de clients actifs",
        starter: "3 max",
        solo: "Illimités",
        pro: "Illimités",
      },
      {
        name: "Factures PDF avec mentions légales essentielles",
        starter: true,
        solo: true,
        pro: true,
      },
      {
        name: "Recherche SIRET automatique client",
        starter: true,
        solo: true,
        pro: true,
      },
      {
        name: "Personnalisation du logo & coordonnées",
        starter: true,
        solo: true,
        pro: true,
      },
      {
        name: "Avoirs & Notes de crédit",
        starter: true,
        solo: true,
        pro: true,
      },
      {
        name: "Facturation électronique (en préparation)",
        starter: true,
        solo: true,
        pro: true,
        hint: "Format Factur-X en cours de développement",
      },
    ],
  },
  {
    category: "Pilotage Fiscal & Cotisations",
    features: [
      {
        name: "Tableau de bord fiscal en temps réel",
        starter: false,
        solo: true,
        pro: true,
      },
      {
        name: "Alertes seuils de franchise de TVA (37 500 € / 85 000 €)",
        starter: false,
        solo: true,
        pro: true,
      },
      {
        name: "Calcul des cotisations URSSAF (barème officiel 2026)",
        starter: false,
        solo: true,
        pro: true,
      },
      {
        name: "Livre chronologique des recettes & export CSV",
        starter: false,
        solo: true,
        pro: true,
      },
      {
        name: "Saisie du Chiffre d'Affaires antérieur",
        starter: true,
        solo: true,
        pro: true,
      },
    ],
  },
  {
    category: "Automatisations & Productivité",
    features: [
      {
        name: "Relances automatiques par e-mail",
        starter: false,
        solo: true,
        pro: true,
      },
      {
        name: "Importation de factures PDF historiques",
        starter: true,
        solo: true,
        pro: true,
      },
      {
        name: "Paiement en ligne par carte (Stripe Connect)",
        starter: false,
        solo: false,
        pro: true,
      },
      {
        name: "Multi-entreprises sous un seul compte",
        starter: false,
        solo: false,
        pro: true,
      },
      {
        name: "Assistant IA de facturation (Web & WhatsApp)",
        starter: false,
        solo: false,
        pro: true,
      },
      {
        name: "Support par e-mail (du lundi au vendredi)",
        starter: "Sous 24h ouvrées",
        solo: "Sous 24h ouvrées",
        pro: "Sous 24h ouvrées",
      },
    ],
  },
];
