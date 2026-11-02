/**
 * Source unique de vérité pour les métadonnées SEO (titres, descriptions, canoniques)
 * partagée entre le composant client React (SEO.tsx) et le script de prérendu statique (scripts/prerender.js).
 */
export interface SeoRouteMeta {
  path: string;
  title: string;
  description: string;
  canonical: string;
  ogType?: "website" | "article" | "product";
}

export const SEO_METADATA: Record<string, SeoRouteMeta> = {
  "/": {
    path: "",
    title: "Bylz : Facturation & Pilotage Fiscal pour Micro-Entrepreneurs",
    description: "Créez vos factures PDF avec les mentions légales essentielles, suivez votre CA et anticipez vos cotisations URSSAF en 2 min/jour. Essai gratuit sans carte bancaire.",
    canonical: "/",
    ogType: "website"
  },
  "/tarifs": {
    path: "tarifs",
    title: "Tarifs Bylz : Logiciel de Facturation et Pilotage Fiscal pour Micro-Entrepreneurs",
    description: "Découvrez nos tarifs simples et sans engagement : Solo 50€/an (ou 8,90€/mois) et Pro 80€/an (ou 12,90€/mois). 14 jours d'essai offerts.",
    canonical: "/tarifs",
    ogType: "website"
  },
  "/fonctionnalites": {
    path: "fonctionnalites",
    title: "Fonctionnalités Bylz : Facturation, TVA et Cotisations URSSAF",
    description: "Découvrez l'ensemble des fonctionnalités de Bylz : édition de factures PDF, suivi des plafonds de TVA, calcul URSSAF, relances et import PDF historique.",
    canonical: "/fonctionnalites",
    ogType: "website"
  },
  "/conformite": {
    path: "conformite",
    title: "Conformité Légale & Sécurité des Données | Bylz",
    description: "Sécurité Bylz : tenue du livre chronologique des recettes, paiements sécurisés Stripe et base de données hébergée en Europe.",
    canonical: "/conformite",
    ogType: "website"
  },
  "/outils/simulateur-urssaf": {
    path: "outils/simulateur-urssaf",
    title: "Simulateur Cotisations URSSAF 2026 Gratuit : Micro-Entreprise BNC & BIC",
    description: "Calculez gratuitement et en direct vos cotisations sociales URSSAF et votre revenu net après impôt en micro-entreprise (BNC, BIC Service, BIC Vente).",
    canonical: "/outils/simulateur-urssaf",
    ogType: "website"
  },
  "/outils/simulateur-seuil-tva": {
    path: "outils/simulateur-seuil-tva",
    title: "Simulateur Seuil de Franchise TVA 2026 : Plafonds Micro-Entreprise",
    description: "Calculez votre positionnement par rapport au seuil de franchise de TVA (37 500 € et 41 250 €) et découvrez quand vous devenez redevable de la TVA.",
    canonical: "/outils/simulateur-seuil-tva",
    ogType: "website"
  },
  "/outils/modele-facture-gratuit": {
    path: "outils/modele-facture-gratuit",
    title: "Modèle de Facture Gratuit 2026 : Auto-Entrepreneur, Artisan & Freelance (PDF)",
    description: "Créez et téléchargez votre modèle de facture gratuit avec les mentions légales essentielles (franchise TVA art. 293 B, mentions obligatoires). Prêt en PDF en 30 secondes.",
    canonical: "/outils/modele-facture-gratuit",
    ogType: "website"
  },
  "/blog": {
    path: "blog",
    title: "Le Blog de Bylz | Conseils Fiscaux & Facturation pour Indépendants",
    description: "Retrouvez tous nos guides pratiques, conseils fiscaux et actualités réglementaires pour gérer sereinement votre micro-entreprise.",
    canonical: "/blog",
    ogType: "website"
  },
  "/contact": {
    path: "contact",
    title: "Contactez l'Équipe Bylz | Support & Assistance",
    description: "Une question sur Bylz, la facturation électronique 2026 ou votre abonnement ? Notre équipe support vous répond rapidement par email et WhatsApp.",
    canonical: "/contact",
    ogType: "website"
  },
  "/mentions-legales": {
    path: "mentions-legales",
    title: "Mentions Légales | Bylz",
    description: "Consultez les mentions légales de la plateforme Bylz : éditeur, hébergeurs Netlify et Supabase, propriété intellectuelle et conformité réglementaire.",
    canonical: "/mentions-legales",
    ogType: "website"
  },
  "/cgu": {
    path: "cgu",
    title: "Conditions Générales d'Utilisation (CGU) | Bylz",
    description: "Consultez les Conditions Générales d'Utilisation régissant les services de facturation électronique, devis et calculs automatisés de la plateforme Bylz.",
    canonical: "/cgu",
    ogType: "website"
  },
  "/facturation-electronique": {
    path: "facturation-electronique",
    title: "Facturation électronique auto-entrepreneur 2026 | Bylz",
    description: "Calendrier officiel, obligations B2B et démarches de facturation électronique pour auto-entrepreneurs en 2026 et 2027. Source : impots.gouv.fr.",
    canonical: "/facturation-electronique",
    ogType: "website"
  },
  "/confidentialite": {
    path: "confidentialite",
    title: "Politique de Confidentialité & RGPD | Bylz",
    description: "Découvrez notre politique de confidentialité et protection des données personnelles (RGPD) : sécurité, chiffrement TLS et droits d'accès sur Bylz.",
    canonical: "/confidentialite",
    ogType: "website"
  }
};
