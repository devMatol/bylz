import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sbwbjkzustnlnnilkogm.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2Jqa3p1c3RubG5uaWxrb2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTk5MzYsImV4cCI6MjEwMDAzNTkzNn0.OjKjWTdgWiGyecOsvIu_OjCwOExiDKR74eow-Lleo40";

const supabase = createClient(supabaseUrl, anonKey);
const SITE_URL = "https://bylz.fr";
const DEFAULT_OG_IMAGE = "https://bylz.fr/og-image.png";

// Base static blog articles
const STATIC_BLOG_ARTICLES = [
  {
    slug: "reforme-factur-x-2026-auto-entrepreneurs",
    title: "Réforme Factur-X 2026 : Ce qui change pour les auto-entrepreneurs et micro-entreprises",
    excerpt: "La réforme de la facturation électronique entre en vigueur en France. Découvrez les obligations du format Factur-X et du E-Reporting pour les indépendants.",
    date: "2026-07-15T10:00:00.000Z",
    readTime: "5 min de lecture",
    author: "Équipe Fiscale Bylz",
    category: "Législation & Conformité",
    content: `
      <h2>Qu'est-ce que la réforme de la facturation électronique 2026 ?</h2>
      <p>À partir de 2026, la réglementation française impose l'abandon progressif des simples factures PDF transmises par e-mail au profit de factures électroniques certifiées et structurées dites <strong>Factur-X</strong>.</p>
      <p>Cette réforme s'applique à l'ensemble des assujettis à la TVA en France, y compris les micro-entrepreneurs réalisant des prestations ou ventes B2B (Business to Business).</p>
      <h3>Les 2 volets fondamentaux de la réforme :</h3>
      <ul>
        <li><strong>Le E-Invoicing (Facturation électronique B2B) :</strong> Transmission des factures inter-entreprises dans un format hybride contenant des données lisibles par l'homme (PDF) et un fichier XML structuré pour les ordinateurs.</li>
        <li><strong>Le E-Reporting (Transmission des données de ventes) :</strong> Transmission à l'administration fiscale des données relatives aux ventes B2C ou aux transactions internationales.</li>
      </ul>
      <h3>Quelles sanctions en cas de non-conformité ?</h3>
      <p>L'administration fiscale prévoit des amendes forfaitaires (jusqu'à 15 € par facture non conforme). Utiliser un outil compatible Factur-X comme Bylz vous garantit une conformité sans coût supplémentaire.</p>
    `
  },
  {
    slug: "franchise-tva-2026-seuils-et-regles",
    title: "Franchise en base de TVA 2026 : Nouveaux seuils, tolérance et règles de dépassement",
    excerpt: "Tout savoir sur les plafonds de TVA en micro-entreprise : seuil de base, seuil majoré, facturation de la TVA et basculement du régime.",
    date: "2026-07-10T10:00:00.000Z",
    readTime: "6 min de lecture",
    author: "Équipe Fiscale Bylz",
    category: "Fiscalité Micro-entreprise",
    content: `
      <h2>Comprendre la franchise en base de TVA</h2>
      <p>Par défaut, un auto-entrepreneur bénéficie du système de la <strong>franchise en base de TVA</strong> (article 293 B du CGI). Cela signifie qu'il ne facture pas la TVA à ses clients et ne la récupère pas sur ses achats.</p>
      <h3>Les plafonds actuels de TVA :</h3>
      <ul>
        <li><strong>Prestations de services (BNC / BIC) :</strong> Seuil de base à 39 100 € (seuil majoré à 42 500 €).</li>
        <li><strong>Vente de marchandises (BIC) :</strong> Seuil de base à 101 000 € (seuil majoré à 110 000 €).</li>
      </ul>
      <h3>Que se passe-t-il en cas de dépassement ?</h3>
      <p>Si vous dépassez le seuil de base mais restez sous le seuil majoré, vous conservez la franchise jusqu'à la fin de l'année. En revanche, si vous dépassez le seuil majoré, vous devenez redevable de la TVA dès le premier jour du mois de dépassement.</p>
      <p>Le module de pilotage fiscal de Bylz inclut une jauge en temps réel qui vous alerte automatiquement à l'approche de ces plafonds.</p>
    `
  },
  {
    slug: "calcul-cotisations-urssaf-bnc-bic",
    title: "Comment calculer ses cotisations URSSAF et son bénéfice net en BNC et BIC en 2026",
    excerpt: "Apprenez à calculer exactement le montant de vos cotisations sociales et votre résultat net après impôt en micro-entreprise.",
    date: "2026-07-02T10:00:00.000Z",
    readTime: "4 min de lecture",
    author: "Équipe Fiscale Bylz",
    category: "Gestion & Cotisations",
    content: `
      <h2>Les taux de cotisations sociales URSSAF</h2>
      <p>Les cotisations sociales en micro-entreprise sont calculées en appliquant un pourcentage fixe sur le chiffre d'affaires brut encaissé (et non sur le bénéfice) :</p>
      <ul>
        <li><strong>Professions libérales (BNC) & Prestations de services :</strong> Taux de cotisation à 23,1% (ou taux ACRE réduit la 1ère année).</li>
        <li><strong>Vente de marchandises (BIC) :</strong> Taux de cotisation à 12,3%.</li>
      </ul>
      <h2>L'abattement forfaitaire pour le calcul de l'impôt</h2>
      <p>Pour déterminer votre revenu imposable (bénéfice net), les impôts appliquent un abattement forfaitaire représentatif de vos charges :</p>
      <ul>
        <li>34% d'abattement pour les activités BNC (libérales).</li>
        <li>50% d'abattement pour les prestations de service BIC.</li>
        <li>71% d'abattement pour les ventes de marchandises BIC.</li>
      </ul>
      <p>Bylz intègre ces moteurs de calcul et simule instantanément votre reste à vivre net après cotisations et impôt estimé.</p>
    `
  },
  {
    slug: "modele-facture-auto-entrepreneur-gratuit",
    title: "Modèle de Facture Auto-Entrepreneur Gratuit 2026 : Exemples Word, Excel et Format Conforme",
    excerpt: "Téléchargez un modèle de facture officiel pour micro-entrepreneur. Mentions obligatoires, franchise en base de TVA (art. 293 B) et pourquoi éviter les modèles Word et Excel en 2026.",
    date: "2026-09-04T10:00:00.000Z",
    readTime: "6 min de lecture",
    author: "Équipe Fiscale Bylz",
    category: "Devis & Facturation",
    content: `
      <h2>Quelles sont les obligations de facturation pour un auto-entrepreneur ?</h2>
      <p>En tant qu'auto-entrepreneur, vous devez émettre une facture conforme pour vos clients B2B et B2C comportant l'ensemble des mentions légales obligatoires 2026.</p>
    `
  }
];

// Static pages metadata and JSON-LD schemas with exact matching prices
const staticPages = [
  {
    path: "", // Home
    title: "Bylz — Facturation Factur-X & Pilotage Fiscal | Auto-Entrepreneurs",
    description: "Créez des factures conformes 2026 (Factur-X), suivez votre CA et anticipez vos cotisations URSSAF & impôts en 2 min/jour. Essai gratuit sans carte bancaire.",
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Bylz",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": [
          { "@type": "Offer", "price": "0.00", "priceCurrency": "EUR", "name": "Starter" },
          { "@type": "Offer", "price": "8.90", "priceCurrency": "EUR", "name": "Solo" },
          { "@type": "Offer", "price": "12.90", "priceCurrency": "EUR", "name": "Pro" }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Bylz",
        "url": "https://bylz.fr",
        "logo": "https://bylz.fr/og-image.png"
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Bylz est-il conforme à la réforme de la facturation électronique 2026 ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui, Bylz génère nativement des factures au format hybride Factur-X certifié conforme aux exigences fiscales françaises 2026."
            }
          },
          {
            "@type": "Question",
            "name": "Puis-je utiliser Bylz gratuitement ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui, le plan Starter gratuit permet de créer vos factures sans carte bancaire requise."
            }
          }
        ]
      }
    ]
  },
  {
    path: "tarifs",
    title: "Tarifs Bylz : Logiciel de Facturation et Pilotage Fiscal pour Micro-Entrepreneurs",
    description: "Découvrez nos tarifs simples et sans engagement : Solo 50€/an (ou 8,90€/mois) et Pro 80€/an (ou 12,90€/mois). 14 jours d'essai offerts.",
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Bylz Starter",
        "description": "Plan gratuit de démarrage pour créer des factures conformes Factur-X.",
        "offers": { "@type": "Offer", "price": "0.00", "priceCurrency": "EUR" }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Bylz Solo",
        "description": "Plan complet pour indépendant avec facturation illimitée et pilotage fiscal.",
        "offers": { "@type": "Offer", "price": "8.90", "priceCurrency": "EUR" }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Bylz Pro",
        "description": "Plan premium avec paiement en ligne Stripe Connect et télétransmission DGFiP.",
        "offers": { "@type": "Offer", "price": "12.90", "priceCurrency": "EUR" }
      }
    ]
  },
  {
    path: "fonctionnalites",
    title: "Fonctionnalités Bylz : Facturation, TVA et Cotisations URSSAF",
    description: "Découvrez l'ensemble des fonctionnalités de Bylz : édition Factur-X, suivi des plafonds de TVA, calcul URSSAF, relances et import PDF historique.",
    ogType: "website"
  },
  {
    path: "conformite",
    title: "Conformité Légale & Sécurité des Données | Bylz",
    description: "Conformité légale Bylz : Factur-X certifié EN 16931, anti-fraude TVA art. 286 CGI, agrégateur bancaire DSP2 et hébergement sécurisé des données en France.",
    ogType: "website"
  },
  {
    path: "outils/simulateur-urssaf",
    title: "Simulateur Cotisations URSSAF 2026 Gratuit : Micro-Entreprise BNC & BIC",
    description: "Calculez gratuitement et en direct vos cotisations sociales URSSAF et votre revenu net après impôt en micro-entreprise (BNC, BIC Service, BIC Vente).",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Simulateur Cotisations URSSAF 2026 | Bylz",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0.00", "priceCurrency": "EUR" }
    }
  },
  {
    path: "outils/simulateur-seuil-tva",
    title: "Simulateur Seuil de Franchise TVA 2026 : Plafonds Micro-Entreprise",
    description: "Calculez votre positionnement par rapport au seuil de franchise de TVA (39 100 € et 42 500 €) et découvrez quand vous devenez redevable de la TVA.",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Simulateur Seuil de Franchise de TVA 2026 | Bylz",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0.00", "priceCurrency": "EUR" }
    }
  },
  {
    path: "outils/modele-facture-gratuit",
    title: "Modèle de Facture Gratuit 2026 : Auto-Entrepreneur, Artisan & Freelance (PDF)",
    description: "Créez et téléchargez votre modèle de facture conforme 2026 (Factur-X, franchise TVA art. 293 B, mentions obligatoires). Prêt en PDF en 30 secondes.",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Générateur de Modèle de Facture Gratuit Conforme 2026 | Bylz",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0.00", "priceCurrency": "EUR" }
    }
  },
  {
    path: "blog",
    title: "Le Blog de Bylz | Conseils Fiscaux & Facturation pour Indépendants",
    description: "Retrouvez tous nos guides pratiques, conseils fiscaux et actualités réglementaires pour gérer sereinement votre micro-entreprise.",
    ogType: "website"
  },
  {
    path: "contact",
    title: "Contactez l'Équipe Bylz | Support & Assistance",
    description: "Une question sur Bylz, la facturation électronique 2026 ou votre abonnement ? Notre équipe support vous répond rapidement par email et WhatsApp.",
    ogType: "website"
  },
  {
    path: "mentions-legales",
    title: "Mentions Légales | Bylz",
    description: "Consultez les mentions légales de la plateforme Bylz : éditeur, hébergeurs Vercel et Supabase, propriété intellectuelle et conformité réglementaire.",
    ogType: "website"
  },
  {
    path: "cgu",
    title: "Conditions Générales d'Utilisation (CGU) | Bylz",
    description: "Consultez les Conditions Générales d'Utilisation régissant les services de facturation électronique, devis et calculs automatisés de la plateforme Bylz.",
    ogType: "website"
  },
  {
    path: "confidentialite",
    title: "Politique de Confidentialité & RGPD | Bylz",
    description: "Découvrez notre politique de confidentialité et protection des données personnelles (RGPD) : sécurité, chiffrement TLS et droits d'accès sur Bylz.",
    ogType: "website"
  }
];

function renderNav() {
  return `
    <header style="border-bottom: 1px solid #1e293b; background: rgba(1, 17, 66, 0.85); backdrop-filter: blur(12px); padding: 1rem 1.5rem; position: sticky; top: 0; z-index: 50;">
      <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;">
        <a href="/" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: #fff; font-weight: 900; font-size: 1.25rem;">
          <img src="/bylz-logo-gradient.svg" alt="Bylz" style="height: 32px;" />
        </a>
        <nav style="display: flex; gap: 1.5rem; font-size: 0.875rem; font-weight: 600;">
          <a href="/fonctionnalites" style="color: #94a3b8; text-decoration: none;">Fonctionnalités</a>
          <a href="/tarifs" style="color: #94a3b8; text-decoration: none;">Tarifs</a>
          <a href="/conformite" style="color: #94a3b8; text-decoration: none;">Conformité 2026</a>
          <a href="/outils/simulateur-urssaf" style="color: #94a3b8; text-decoration: none;">Simulateurs</a>
          <a href="/blog" style="color: #94a3b8; text-decoration: none;">Blog</a>
        </nav>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <a href="/login" style="color: #94a3b8; text-decoration: none; font-size: 0.875rem; font-weight: 600;">Connexion</a>
          <a href="/signup" style="background: #7c6fe0; color: #fff; padding: 0.5rem 1rem; border-radius: 9999px; text-decoration: none; font-size: 0.875rem; font-weight: 700;">Essai gratuit</a>
        </div>
      </div>
    </header>
  `;
}

function renderFooter() {
  return `
    <footer style="border-top: 1px solid #1e293b; background: #010e33; padding: 3rem 1.5rem 2rem; margin-top: 4rem; color: #94a3b8; font-size: 0.875rem;">
      <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem;">
        <div>
          <h3 style="color: #fff; font-weight: 700; margin-bottom: 0.75rem;">Solution Bylz</h3>
          <p style="font-size: 0.8rem; line-height: 1.5;">La plateforme de devis, facturation électronique Factur-X et pilotage fiscal pensée pour les auto-entrepreneurs.</p>
        </div>
        <div>
          <h3 style="color: #fff; font-weight: 700; margin-bottom: 0.75rem;">Produit</h3>
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8rem;">
            <li><a href="/fonctionnalites" style="color: #94a3b8; text-decoration: none;">Fonctionnalités</a></li>
            <li><a href="/tarifs" style="color: #94a3b8; text-decoration: none;">Tarifs</a></li>
            <li><a href="/conformite" style="color: #94a3b8; text-decoration: none;">Conformité Réforme 2026</a></li>
            <li><a href="/blog" style="color: #94a3b8; text-decoration: none;">Blog Fiscalité</a></li>
          </ul>
        </div>
        <div>
          <h3 style="color: #fff; font-weight: 700; margin-bottom: 0.75rem;">Simulateurs Gratuits</h3>
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8rem;">
            <li><a href="/outils/simulateur-urssaf" style="color: #94a3b8; text-decoration: none;">Simulateur Cotisations URSSAF</a></li>
            <li><a href="/outils/simulateur-seuil-tva" style="color: #94a3b8; text-decoration: none;">Simulateur Seuil Franchise TVA</a></li>
            <li><a href="/outils/modele-facture-gratuit" style="color: #94a3b8; text-decoration: none;">Modèle de Facture Gratuit PDF</a></li>
          </ul>
        </div>
        <div>
          <h3 style="color: #fff; font-weight: 700; margin-bottom: 0.75rem;">Informations Légales</h3>
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8rem;">
            <li><a href="/mentions-legales" style="color: #94a3b8; text-decoration: none;">Mentions Légales</a></li>
            <li><a href="/cgu" style="color: #94a3b8; text-decoration: none;">Conditions Générales d'Utilisation</a></li>
            <li><a href="/confidentialite" style="color: #94a3b8; text-decoration: none;">Politique de Confidentialité (RGPD)</a></li>
            <li><a href="/contact" style="color: #94a3b8; text-decoration: none;">Contact & Support</a></li>
          </ul>
        </div>
      </div>
      <div style="max-width: 1200px; margin: 2rem auto 0; padding-top: 1.5rem; border-top: 1px solid #1e293b; text-align: center; font-size: 0.75rem;">
        © ${new Date().getFullYear()} Bylz Technologies. Tous droits réservés. Hébergé en France / UE.
      </div>
    </footer>
  `;
}

function renderPageBody(routePath, meta) {
  const nav = renderNav();
  const footer = renderFooter();

  if (routePath === "") {
    // Home
    return `
      <div style="min-height: 100vh; background: #011142; color: #f8fafc; font-family: Inter, system-ui, sans-serif;">
        ${nav}
        <main style="max-width: 1200px; margin: 0 auto; padding: 4rem 1.5rem;">
          <section style="text-align: center; max-width: 800px; margin: 0 auto 5rem;">
            <span style="display: inline-block; padding: 0.35rem 1rem; border-radius: 9999px; background: rgba(124, 111, 224, 0.15); border: 1px solid rgba(124, 111, 224, 0.3); color: #a59bf0; font-size: 0.8rem; font-weight: 800; margin-bottom: 1.5rem;">
              Prêt pour la Réforme Facturation Électronique 2026
            </span>
            <h1 style="font-size: 3rem; line-height: 1.1; font-weight: 900; margin-bottom: 1.5rem; color: #ffffff;">
              Vos factures. Votre fiscalité. <span style="color: #7c6fe0;">Tout en un.</span>
            </h1>
            <p style="font-size: 1.15rem; color: #94a3b8; line-height: 1.6; margin-bottom: 2rem;">
              Créez des factures conformes 2026 (Factur-X), suivez votre CA en temps réel et anticipez vos cotisations URSSAF en 2 minutes par jour.
            </p>
            <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
              <a href="/signup" style="background: #7c6fe0; color: #fff; padding: 0.85rem 2rem; border-radius: 9999px; font-weight: 800; text-decoration: none; font-size: 1rem;">
                Commencer gratuitement (sans carte bancaire)
              </a>
              <a href="/tarifs" style="border: 1px solid #334155; color: #fff; padding: 0.85rem 1.5rem; border-radius: 9999px; font-weight: 700; text-decoration: none; font-size: 1rem;">
                Voir les tarifs
              </a>
            </div>
          </section>

          <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-bottom: 5rem;">
            <div style="background: #010e33; border: 1px solid #1e293b; border-radius: 1rem; padding: 2rem;">
              <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: #fff;">100% Conforme Factur-X 2026</h2>
              <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.5;">Générez vos factures au format hybride officiel avec métadonnées XML certifiées et télétransmission DGFiP automatisée.</p>
            </div>
            <div style="background: #010e33; border: 1px solid #1e293b; border-radius: 1rem; padding: 2rem;">
              <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: #fff;">Pilotage URSSAF & TVA en direct</h2>
              <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.5;">Calcul au centime près de vos cotisations sociales (BNC, BIC) et alertes en direct à l'approche des plafonds de TVA.</p>
            </div>
            <div style="background: #010e33; border: 1px solid #1e293b; border-radius: 1rem; padding: 2rem;">
              <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: #fff;">Pilote IA WhatsApp & Rapprochement Bancaire</h2>
              <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.5;">Commandez vos devis et factures par simple message ou vocal sur WhatsApp et synchronisez vos comptes bancaires en toute sécurité.</p>
            </div>
          </section>

          <section style="background: #010e33; border: 1px solid #1e293b; border-radius: 1.5rem; padding: 3rem; text-align: center;">
            <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 1rem; color: #fff;">Passez à la vitesse supérieure dès aujourd'hui</h2>
            <p style="color: #94a3b8; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto;">Rejoignez les auto-entrepreneurs qui sécurisent leur gestion fiscale et automatisent leurs devis et factures avec Bylz.</p>
            <a href="/signup" style="background: #7c6fe0; color: #fff; padding: 0.85rem 2rem; border-radius: 9999px; font-weight: 800; text-decoration: none; font-size: 1rem; display: inline-block;">
              Créer mon compte gratuit
            </a>
          </section>
        </main>
        ${footer}
      </div>
    `;
  }

  if (routePath === "tarifs") {
    return `
      <div style="min-height: 100vh; background: #011142; color: #f8fafc; font-family: Inter, system-ui, sans-serif;">
        ${nav}
        <main style="max-width: 1200px; margin: 0 auto; padding: 4rem 1.5rem;">
          <header style="text-align: center; margin-bottom: 4rem;">
            <h1 style="font-size: 2.75rem; font-weight: 900; margin-bottom: 1rem; color: #fff;">Tarifs Simples & Transparents</h1>
            <p style="font-size: 1.15rem; color: #94a3b8; max-width: 650px; margin: 0 auto;">Tout ce dont votre micro-entreprise a besoin pour être conforme 2026, sans frais cachés ni engagement.</p>
          </header>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 4rem;">
            <div style="background: #010e33; border: 1px solid #1e293b; border-radius: 1.25rem; padding: 2.5rem;">
              <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">Starter</h2>
              <p style="font-size: 2rem; font-weight: 900; color: #7c6fe0; margin-bottom: 1.5rem;">0 € <span style="font-size: 0.9rem; color: #94a3b8; font-weight: 400;">/ toujours gratuit</span></p>
              <ul style="list-style: none; padding: 0; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem; color: #cbd5e1;">
                <li>✓ Jusqu'à 3 factures par mois</li>
                <li>✓ Devis & Factures conformes Factur-X</li>
                <li>✓ Téléchargement PDF certifié</li>
                <li>✓ Sans carte bancaire requise</li>
              </ul>
              <a href="/signup" style="display: block; text-align: center; border: 1px solid #334155; color: #fff; padding: 0.75rem 1rem; border-radius: 9999px; text-decoration: none; font-weight: 700;">Commencer</a>
            </div>
            <div style="background: #010e33; border: 2px solid #7c6fe0; border-radius: 1.25rem; padding: 2.5rem; position: relative;">
              <span style="position: absolute; top: -12px; right: 24px; background: #7c6fe0; color: #fff; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.75rem; border-radius: 9999px;">LE PLUS POPULAIRE</span>
              <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">Solo</h2>
              <p style="font-size: 2rem; font-weight: 900; color: #7c6fe0; margin-bottom: 1.5rem;">50 € <span style="font-size: 0.9rem; color: #94a3b8; font-weight: 400;">/ an (soit 4,17 €/mois)</span></p>
              <ul style="list-style: none; padding: 0; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem; color: #cbd5e1;">
                <li>✓ Factures et devis illimités</li>
                <li>✓ Conforme Réforme Factur-X 2026</li>
                <li>✓ Tableau de bord fiscal & calcul URSSAF</li>
                <li>✓ Suivi des plafonds de TVA en direct</li>
                <li>✓ Relances automatiques d'impayés</li>
              </ul>
              <a href="/signup" style="display: block; text-align: center; background: #7c6fe0; color: #fff; padding: 0.75rem 1rem; border-radius: 9999px; text-decoration: none; font-weight: 800;">Essai 14 jours offerts</a>
            </div>
            <div style="background: #010e33; border: 1px solid #1e293b; border-radius: 1.25rem; padding: 2.5rem;">
              <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">Pro</h2>
              <p style="font-size: 2rem; font-weight: 900; color: #7c6fe0; margin-bottom: 1.5rem;">80 € <span style="font-size: 0.9rem; color: #94a3b8; font-weight: 400;">/ an (soit 6,67 €/mois)</span></p>
              <ul style="list-style: none; padding: 0; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem; color: #cbd5e1;">
                <li>✓ Tout le forfait Solo en illimité</li>
                <li>✓ Pilote IA & Assistant vocal sur WhatsApp</li>
                <li>✓ Synchronisation bancaire DSP2</li>
                <li>✓ Paiement en ligne Stripe Connect</li>
                <li>✓ Support prioritaire 7j/7</li>
              </ul>
              <a href="/signup" style="display: block; text-align: center; border: 1px solid #334155; color: #fff; padding: 0.75rem 1rem; border-radius: 9999px; text-decoration: none; font-weight: 700;">Essai 14 jours offerts</a>
            </div>
          </div>
        </main>
        ${footer}
      </div>
    `;
  }

  // Generic static page fallback with H1
  return `
    <div style="min-height: 100vh; background: #011142; color: #f8fafc; font-family: Inter, system-ui, sans-serif;">
      ${nav}
      <main style="max-width: 900px; margin: 0 auto; padding: 4rem 1.5rem;">
        <h1 style="font-size: 2.5rem; font-weight: 900; margin-bottom: 1.5rem; color: #fff;">${meta.title.split(" | ")[0].split(" — ")[0]}</h1>
        <p style="font-size: 1.1rem; color: #94a3b8; line-height: 1.6; margin-bottom: 3rem;">${meta.description}</p>
        <div style="line-height: 1.7; color: #cbd5e1; font-size: 1rem;">
          <p>Pour en savoir plus et découvrir la plateforme de facturation Factur-X Bylz, créez votre compte gratuitement en moins de 2 minutes.</p>
          <div style="margin-top: 2rem;">
            <a href="/signup" style="background: #7c6fe0; color: #fff; padding: 0.75rem 1.5rem; border-radius: 9999px; text-decoration: none; font-weight: 700; display: inline-block;">Découvrir Bylz Gratuitement</a>
          </div>
        </div>
      </main>
      ${footer}
    </div>
  `;
}

function renderBlogBody(post) {
  const nav = renderNav();
  const footer = renderFooter();

  return `
    <div style="min-height: 100vh; background: #011142; color: #f8fafc; font-family: Inter, system-ui, sans-serif;">
      ${nav}
      <main style="max-width: 850px; margin: 0 auto; padding: 4rem 1.5rem;">
        <article>
          <header style="margin-bottom: 2.5rem; border-bottom: 1px solid #1e293b; padding-bottom: 2rem;">
            <a href="/blog" style="color: #7c6fe0; text-decoration: none; font-size: 0.875rem; font-weight: 700; display: inline-block; margin-bottom: 1rem;">← Retour au blog</a>
            <div style="margin-bottom: 1rem;">
              <span style="background: rgba(124, 111, 224, 0.15); color: #a59bf0; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.75rem; border-radius: 9999px;">${post.category || "Fiscalité & Facturation"}</span>
            </div>
            <h1 style="font-size: 2.5rem; line-height: 1.2; font-weight: 900; color: #fff; margin-bottom: 1rem;">
              ${post.title}
            </h1>
            <div style="display: flex; gap: 1rem; color: #94a3b8; font-size: 0.85rem; font-weight: 500;">
              <span>Auteur : <strong style="color: #fff;">${post.author || "Équipe Fiscale Bylz"}</strong></span>
              <span>•</span>
              <span>${post.date ? post.date.slice(0, 10) : "2026"}</span>
              <span>•</span>
              <span>${post.readTime || "5 min de lecture"}</span>
            </div>
          </header>
          <div style="line-height: 1.8; color: #cbd5e1; font-size: 1.05rem;" class="blog-content">
            ${post.content || `<p>${post.excerpt}</p>`}
          </div>
          <div style="margin-top: 4rem; padding: 2.5rem; background: #010e33; border: 1px solid #1e293b; border-radius: 1.25rem; text-align: center;">
            <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 0.75rem;">Mettez vos factures aux normes 2026 avec Bylz</h2>
            <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.5rem; max-width: 550px; margin-left: auto; margin-right: auto;">Générez vos factures au format officiel Factur-X et pilotez vos cotisations sociales en direct.</p>
            <a href="/signup" style="background: #7c6fe0; color: #fff; padding: 0.75rem 1.75rem; border-radius: 9999px; text-decoration: none; font-weight: 800; font-size: 0.95rem; display: inline-block;">
              Tester gratuitement sans carte bancaire
            </a>
          </div>
        </article>
      </main>
      ${footer}
    </div>
  `;
}

async function prerender() {
  console.log("Starting SEO prerendering...");

  const distDir = path.join(process.cwd(), "dist");
  const templatePath = path.join(distDir, "index.html");

  if (!fs.existsSync(templatePath)) {
    console.error("Error: dist/index.html not found! Run 'vite build' first.");
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(templatePath, "utf8");

  // Helper to generate a pre-rendered HTML file
  const generateFile = (routePath, meta) => {
    let html = templateHtml;

    // Clean up all existing dynamic head tags to ensure completely fresh, unique injection
    html = html.replace(/<title>.*?<\/title>/gi, "");
    html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, "");
    html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/gi, "");
    html = html.replace(/<meta\s+property="og:.*?"\s+content=".*?"\s*\/?>/gi, "");
    html = html.replace(/<meta\s+name="twitter:.*?"\s+content=".*?"\s*\/?>/gi, "");
    html = html.replace(/<script\s+type="application\/ld\+json">.*?<\/script>/gis, "");

    const url = routePath === "" ? `${SITE_URL}/` : `${SITE_URL}/${routePath}`;
    const title = meta.title;
    const description = meta.description;
    const ogImage = meta.ogImage || DEFAULT_OG_IMAGE;
    const ogType = meta.ogType || "website";

    // Build the SEO tags
    let seoTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:site_name" content="Bylz" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />`;

    // Add JSON-LD if present
    if (meta.jsonLd) {
      seoTags += `\n    <script type="application/ld+json">\n      ${JSON.stringify(meta.jsonLd, null, 2)}\n    </script>`;
    }

    // Inject SEO tags into head
    html = html.replace("</head>", `${seoTags}\n  </head>`);

    // Inject rich static HTML body into root for crawlers and bots!
    const bodyContent = meta.bodyHtml || renderPageBody(routePath, meta);
    if (bodyContent) {
      html = html.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`);
    }

    // Target path in dist/
    const targetDir = path.join(distDir, routePath);
    if (routePath !== "") {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetFile = routePath === "" ? templatePath : path.join(targetDir, "index.html");

    fs.writeFileSync(targetFile, html, "utf8");

    if (routePath !== "") {
      const cleanHtmlFile = path.join(distDir, `${routePath}.html`);
      fs.mkdirSync(path.dirname(cleanHtmlFile), { recursive: true });
      fs.writeFileSync(cleanHtmlFile, html, "utf8");
    }

    console.log(`Prerendered: /${routePath}`);
  };

  // 1. Process static pages
  for (const page of staticPages) {
    generateFile(page.path, page);
  }

  // 2. Aggregate all blog articles (Static default articles + Dynamic DB articles)
  const allArticlesMap = new Map();

  for (const art of STATIC_BLOG_ARTICLES) {
    allArticlesMap.set(art.slug, art);
  }

  try {
    const fetchPromise = supabase
      .from("blog_posts")
      .select("slug, title, excerpt, content, cover_image_url, author, published_at, meta_description")
      .eq("status", "published");
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase query timeout")), 4000)
    );
    const { data: posts } = await Promise.race([fetchPromise, timeoutPromise]);

    if (posts && posts.length > 0) {
      for (const p of posts) {
        allArticlesMap.set(p.slug, {
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt || p.meta_description || "Article sur le blog de Bylz.",
          metaDescription: p.meta_description || p.excerpt,
          content: p.content,
          author: p.author || "Équipe Bylz",
          date: p.published_at || new Date().toISOString(),
          coverImageUrl: p.cover_image_url || DEFAULT_OG_IMAGE,
        });
      }
    }
  } catch (err) {
    console.warn("Notice: could not query dynamic DB blog posts for prerender:", err);
  }

  // Generate each blog article page
  for (const [slug, post] of allArticlesMap.entries()) {
    const blogPath = `blog/${slug}`;
    const excerpt = post.metaDescription || post.excerpt || "Découvrez notre article sur le blog de Bylz.";
    const schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": excerpt,
      "image": post.coverImageUrl || DEFAULT_OG_IMAGE,
      "datePublished": post.date || new Date().toISOString(),
      "dateModified": post.date || new Date().toISOString(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${SITE_URL}/blog/${slug}`
      },
      "author": {
        "@type": "Person",
        "name": post.author || "Équipe Bylz"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Bylz",
        "logo": {
          "@type": "ImageObject",
          "url": DEFAULT_OG_IMAGE
        }
      }
    };

    generateFile(blogPath, {
      title: `${post.title} | Blog Bylz`,
      description: excerpt,
      ogType: "article",
      ogImage: post.coverImageUrl || DEFAULT_OG_IMAGE,
      jsonLd: schema,
      bodyHtml: renderBlogBody(post),
    });
  }

  console.log("SEO Prerendering completed successfully!");
}

prerender();
