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

function renderNavbar() {
  return `
    <header class="fixed top-0 left-0 right-0 z-50 bg-[#141c38]/95 backdrop-blur-xl border-b border-[#25325c] shadow-lg py-3.5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2">
          <img src="/bylz-logo-gradient.svg" alt="Bylz" class="h-8" />
        </a>
        <nav class="hidden md:flex items-center space-x-8 text-sm font-semibold text-[#8e9bbf]">
          <a href="/fonctionnalites" class="hover:text-white transition-colors">Fonctionnalités</a>
          <a href="/conformite" class="hover:text-white transition-colors">Conformité & Sécurité</a>
          <a href="/tarifs" class="hover:text-white transition-colors">Tarifs</a>
          <a href="/blog" class="hover:text-white transition-colors">Blog</a>
          <a href="/contact" class="hover:text-white transition-colors">Contact</a>
        </nav>
        <div class="flex items-center space-x-3">
          <a href="/login" class="text-sm font-semibold text-[#8e9bbf] hover:text-white px-3 py-2 transition-colors">Se connecter</a>
          <a href="/essai" class="bg-[#6e7cf0] hover:bg-[#5b69e0] text-white text-sm font-bold px-4 py-2 rounded-full shadow-md transition-all">Essayer gratuitement</a>
        </div>
      </div>
    </header>
  `;
}

function renderFooter() {
  const currentYear = new Date().getFullYear();
  return `
    <footer class="bg-[#141c38]/95 border-t border-[#25325c] pt-16 pb-12 text-sm text-[#8e9bbf] mt-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#25325c]">
          <div class="md:col-span-2 space-y-4">
            <img src="/bylz-logo-gradient.svg" alt="Bylz" class="h-8" />
            <p class="text-xs text-white/70 max-w-sm leading-relaxed font-normal">
              La solution intégrée de facturation conforme Factur-X et de pilotage fiscal automatisé pour les indépendants et micro-entreprises en France.
            </p>
            <div class="flex items-center space-x-2 text-xs text-emerald-400 font-bold">
              <span>✓ Conforme à la réforme DGFiP 2026 & E-Reporting</span>
            </div>
          </div>
          <div class="space-y-3">
            <h4 class="font-bold text-white text-xs uppercase tracking-wider">Produit</h4>
            <ul class="space-y-2 text-xs font-medium">
              <li><a href="/fonctionnalites" class="text-white/80 hover:text-[#6e7cf0] transition-colors">Fonctionnalités</a></li>
              <li><a href="/tarifs" class="text-white/80 hover:text-[#6e7cf0] transition-colors">Tarifs & Abonnements</a></li>
              <li><a href="/essai" class="text-[#6e7cf0] font-bold hover:underline">Mode Essai Gratuit</a></li>
            </ul>
          </div>
          <div class="space-y-3">
            <h4 class="font-bold text-white text-xs uppercase tracking-wider">Outils & Guides</h4>
            <ul class="space-y-2 text-xs font-medium">
              <li><a href="/outils/simulateur-urssaf" class="text-white/80 hover:text-[#6e7cf0] transition-colors font-bold">Simulateur URSSAF 2026</a></li>
              <li><a href="/outils/simulateur-seuil-tva" class="text-white/80 hover:text-[#6e7cf0] transition-colors font-bold">Calculateur Seuil TVA</a></li>
              <li><a href="/outils/modele-facture-gratuit" class="text-white/80 hover:text-[#6e7cf0] transition-colors font-bold text-emerald-400">Modèle Facture Gratuit</a></li>
              <li><a href="/blog" class="text-white/80 hover:text-[#6e7cf0] transition-colors">Blog & Guides Fiscaux</a></li>
            </ul>
          </div>
          <div class="space-y-3">
            <h4 class="font-bold text-white text-xs uppercase tracking-wider">Informations</h4>
            <ul class="space-y-2 text-xs font-medium">
              <li><a href="/contact" class="text-white/80 hover:text-[#6e7cf0] transition-colors">Contact & Support</a></li>
              <li><a href="/mentions-legales" class="text-white/80 hover:text-[#6e7cf0] transition-colors">Mentions Légales</a></li>
              <li><a href="/cgu" class="text-white/80 hover:text-[#6e7cf0] transition-colors">Conditions Générales (CGU)</a></li>
              <li><a href="/confidentialite" class="text-white/80 hover:text-[#6e7cf0] transition-colors">Politique de Confidentialité</a></li>
            </ul>
          </div>
        </div>
        <div class="pt-8 text-center text-xs text-[#8e9bbf]">
          © ${currentYear} Bylz Technologies. Tous droits réservés. Hébergé en France / UE.
        </div>
      </div>
    </footer>
  `;
}

function renderPageBody(routePath, meta, articles) {
  const navbar = renderNavbar();
  const footer = renderFooter();

  let mainContent = "";

  if (routePath === "") {
    // 1. Home Page
    mainContent = `
      <section class="text-center max-w-4xl mx-auto space-y-6 pt-8 pb-16">
        <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#6e7cf0]/10 text-[#6e7cf0] text-xs font-bold border border-[#6e7cf0]/20">
          <span>Prêt pour la Réforme Facturation Électronique 2026</span>
        </div>
        <h1 class="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Vos factures. Votre fiscalité. <span class="text-[#6e7cf0]">Tout en un.</span>
        </h1>
        <p class="text-lg sm:text-xl text-[#8e9bbf] max-w-2xl mx-auto leading-relaxed">
          Créez des factures conformes 2026 (Factur-X), suivez votre CA en temps réel et anticipez vos cotisations URSSAF & impôts en 2 minutes par jour.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a href="/essai" class="w-full sm:w-auto px-8 py-4 rounded-full bg-[#6e7cf0] hover:bg-[#5b69e0] text-white font-bold text-base shadow-xl shadow-[#6e7cf0]/25 transition-all text-center">
            Tester gratuitement sans carte bancaire
          </a>
          <a href="/tarifs" class="w-full sm:w-auto px-8 py-4 rounded-full border border-[#25325c] hover:bg-[#1c274c] text-white font-bold text-base transition-all text-center">
            Voir les tarifs (dès 0 €)
          </a>
        </div>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <div class="w-12 h-12 rounded-xl bg-[#6e7cf0]/10 flex items-center justify-center text-[#6e7cf0] text-2xl font-bold">⚡</div>
          <h2 class="text-xl font-bold text-white">100% Conforme Factur-X 2026</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Générez vos factures au format hybride officiel avec métadonnées XML certifiées et télétransmission DGFiP automatisée.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <div class="w-12 h-12 rounded-xl bg-[#6e7cf0]/10 flex items-center justify-center text-[#6e7cf0] text-2xl font-bold">📊</div>
          <h2 class="text-xl font-bold text-white">Pilotage URSSAF & TVA en direct</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Calcul au centime près de vos cotisations sociales (BNC, BIC) et alertes en direct à l'approche du seuil de TVA de 39 100 €.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <div class="w-12 h-12 rounded-xl bg-[#6e7cf0]/10 flex items-center justify-center text-[#6e7cf0] text-2xl font-bold">🤖</div>
          <h2 class="text-xl font-bold text-white">Pilote IA & Rapprochement Bancaire</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Commandez vos factures par simple message WhatsApp et connectez vos comptes bancaires pour un pointage instantané.</p>
        </div>
      </section>
    `;
  } else if (routePath === "tarifs") {
    // 2. Tarifs Page
    mainContent = `
      <section class="text-center max-w-3xl mx-auto space-y-4 pt-8 pb-12">
        <div class="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#6e7cf0]/10 text-[#6e7cf0] text-xs font-bold border border-[#6e7cf0]/20">
          <span>Tarifs Simples & Sans Engagement</span>
        </div>
        <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Un tarif transparent pour piloter votre activité en toute conformité
        </h1>
        <p class="text-base sm:text-lg text-[#8e9bbf]">
          Tout ce dont votre micro-entreprise a besoin pour être conforme 2026, sans frais cachés ni engagement.
        </p>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 flex flex-col justify-between space-y-6">
          <div class="space-y-4">
            <h2 class="text-xl font-bold text-white">Starter</h2>
            <p class="text-3xl font-black text-white">0 € <span class="text-sm font-normal text-[#8e9bbf]">/ toujours gratuit</span></p>
            <p class="text-xs text-[#8e9bbf]">Parfait pour démarrer et tester la conformité Factur-X.</p>
            <ul class="space-y-3 text-sm text-white/90 pt-4 border-t border-[#25325c]">
              <li>✓ Jusqu'à 3 factures et devis par mois</li>
              <li>✓ Format officiel Factur-X conforme 2026</li>
              <li>✓ Recherche SIRET automatique</li>
              <li>✓ Sans carte bancaire requise</li>
            </ul>
          </div>
          <a href="/essai" class="w-full py-3 rounded-full border border-[#25325c] hover:bg-[#1c274c] text-white font-bold text-sm text-center transition-all">
            Commencer gratuitement
          </a>
        </div>

        <div class="bg-[#141c38] border-2 border-[#6e7cf0] rounded-2xl p-8 flex flex-col justify-between space-y-6 relative shadow-xl shadow-[#6e7cf0]/10">
          <span class="absolute -top-3 right-6 bg-[#6e7cf0] text-white text-[11px] font-black uppercase px-3 py-0.5 rounded-full">Le Plus Populaire</span>
          <div class="space-y-4">
            <h2 class="text-xl font-bold text-white">Solo</h2>
            <p class="text-3xl font-black text-[#6e7cf0]">50 € <span class="text-sm font-normal text-[#8e9bbf]">/ an (ou 8,90 €/mois)</span></p>
            <p class="text-xs text-[#8e9bbf]">L'essentiel pour les indépendants qui veulent automatiser leur fiscalité.</p>
            <ul class="space-y-3 text-sm text-white/90 pt-4 border-t border-[#25325c]">
              <li>✓ Factures et devis illimités</li>
              <li>✓ Tableau de bord fiscal & calcul URSSAF</li>
              <li>✓ Alerte seuil de franchise TVA (39 100 €)</li>
              <li>✓ Relances automatiques d'impayés</li>
              <li>✓ Importation de factures PDF historiques</li>
            </ul>
          </div>
          <a href="/essai" class="w-full py-3 rounded-full bg-[#6e7cf0] hover:bg-[#5b69e0] text-white font-bold text-sm text-center shadow-lg transition-all">
            Essai 14 jours offerts
          </a>
        </div>

        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 flex flex-col justify-between space-y-6">
          <div class="space-y-4">
            <h2 class="text-xl font-bold text-white">Pro</h2>
            <p class="text-3xl font-black text-white">80 € <span class="text-sm font-normal text-[#8e9bbf]">/ an (ou 12,90 €/mois)</span></p>
            <p class="text-xs text-[#8e9bbf]">Puissance maximale avec IA WhatsApp et rapprochement bancaire.</p>
            <ul class="space-y-3 text-sm text-white/90 pt-4 border-t border-[#25325c]">
              <li>✓ Tout le forfait Solo en illimité</li>
              <li>✓ Pilote IA & Assistant vocal WhatsApp</li>
              <li>✓ Synchronisation bancaire sécurisée DSP2</li>
              <li>✓ Paiement en ligne Stripe Connect</li>
              <li>✓ Télétransmission DGFiP automatisée</li>
            </ul>
          </div>
          <a href="/essai" class="w-full py-3 rounded-full border border-[#25325c] hover:bg-[#1c274c] text-white font-bold text-sm text-center transition-all">
            Essai 14 jours offerts
          </a>
        </div>
      </section>
    `;
  } else if (routePath === "fonctionnalites") {
    // 3. Fonctionnalités Page
    mainContent = `
      <section class="text-center max-w-3xl mx-auto space-y-4 pt-8 pb-12">
        <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Toutes les Fonctionnalités pour Piloter votre Micro-Entreprise
        </h1>
        <p class="text-base sm:text-lg text-[#8e9bbf]">
          De l'édition de factures électroniques conformes au calcul au centime près de vos cotisations URSSAF.
        </p>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-3">
          <h2 class="text-xl font-bold text-white">Facturation Factur-X 2026</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Émettez des devis et factures conformes à la norme européenne EN 16931 au format hybride PDF/A-3 avec métadonnées XML intégrées.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-3">
          <h2 class="text-xl font-bold text-white">Pilotage Fiscal & Cotisations URSSAF</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Estimation automatique de vos cotisations sociales (BNC, BIC) et de votre impôt sur le revenu. Déclarations trimestrielles ou mensuelles prêtes en 1 clic.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-3">
          <h2 class="text-xl font-bold text-white">Suivi des Plafonds de Franchise TVA</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Jauge intelligente qui vous avertit lorsque votre chiffre d'affaires approche du seuil de base (39 100 €) ou du seuil majoré (42 500 €).</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-3">
          <h2 class="text-xl font-bold text-white">Pilote IA sur WhatsApp</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Dictez ou écrivez simplement un message pour créer un devis ou une facture. L'IA extrait les lignes, applique les taux et génère le document.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-3">
          <h2 class="text-xl font-bold text-white">Synchronisation Bancaire DSP2</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Connectez votre compte bancaire professionnel pour rapprocher automatiquement vos encaissements et pointer vos factures payées.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-3">
          <h2 class="text-xl font-bold text-white">Relances Automatiques d'Impayés</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Programmez des relances polies et professionnelles par e-mail avant et après l'échéance pour réduire drastiquement vos délais de paiement.</p>
        </div>
      </section>
    `;
  } else if (routePath === "conformite") {
    // 4. Conformité & Sécurité Page
    mainContent = `
      <section class="text-center max-w-3xl mx-auto space-y-4 pt-8 pb-12">
        <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Conformité Fiscale 2026 & Sécurité des Données
        </h1>
        <p class="text-base sm:text-lg text-[#8e9bbf]">
          Bylz est conçu dès le premier jour pour répondre aux exigences strictes de la réforme française de facturation électronique.
        </p>
      </section>

      <section class="max-w-4xl mx-auto space-y-8 pb-20">
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <h2 class="text-xl font-bold text-white">Norme Européenne EN 16931 & Format Factur-X</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Chaque facture émise sur Bylz respecte le profil Basic ou Comfort de Factur-X, associant un PDF lisible par l'humain et un fichier XML structuré pour le traitement automatisé des entreprises et de l'État.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <h2 class="text-xl font-bold text-white">Article 286 du Code Général des Impôts (CGI)</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Notre moteur d'inviolabilité garantit l'intégrité, la conformité chronologique, la numérotation séquentielle sans rupture et la conservation sécurisée de vos justificatifs comptables pendant 10 ans.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <h2 class="text-xl font-bold text-white">Agrément Bancaire Européen DSP2</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">La synchronisation bancaire s'effectue via des passerelles agréées par l'ACPR et la Banque de France, avec chiffrement de niveau bancaire (TLS 1.3 et AES-256).</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <h2 class="text-xl font-bold text-white">Hébergement Sécurisé en France & Respect du RGPD</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Toutes vos données sont stockées sur des infrastructures souveraines en France et dans l'Union Européenne, sans revente de données ni transfert hors UE.</p>
        </div>
      </section>
    `;
  } else if (routePath === "blog") {
    // 5. Blog Listing
    const articleCards = articles.map(art => `
      <article class="bg-[#141c38] border border-[#25325c] rounded-2xl p-6 sm:p-8 space-y-4 flex flex-col justify-between hover:border-[#6e7cf0]/50 transition-all">
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-xs text-[#8e9bbf]">
            <span class="px-2.5 py-0.5 rounded-full bg-[#6e7cf0]/10 text-[#6e7cf0] font-bold">${art.category || "Fiscalité"}</span>
            <span>•</span>
            <span>${art.readTime || "5 min de lecture"}</span>
          </div>
          <h2 class="text-xl font-bold text-white leading-snug hover:text-[#6e7cf0] transition-colors">
            <a href="/blog/${art.slug}">${art.title}</a>
          </h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed line-clamp-3">${art.excerpt}</p>
        </div>
        <a href="/blog/${art.slug}" class="text-sm font-bold text-[#6e7cf0] hover:underline inline-flex items-center gap-1 pt-2">
          Lire l'article complet →
        </a>
      </article>
    `).join("");

    mainContent = `
      <section class="text-center max-w-3xl mx-auto space-y-4 pt-8 pb-12">
        <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Le Blog de Bylz : Conseils Fiscaux & Facturation
        </h1>
        <p class="text-base sm:text-lg text-[#8e9bbf]">
          Retrouvez nos guides d'experts pour optimiser vos cotisations, maîtriser la réforme 2026 et gérer sereinement votre micro-entreprise.
        </p>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
        ${articleCards}
      </section>
    `;
  } else if (routePath.startsWith("blog/")) {
    // 6. Individual Blog Article
    const slug = routePath.replace("blog/", "");
    const art = articles.find(a => a.slug === slug) || {
      title: meta.title.replace(" | Blog Bylz", ""),
      excerpt: meta.description,
      content: `<p>${meta.description}</p>`,
      author: "Équipe Fiscale Bylz",
      category: "Fiscalité & Facturation",
      readTime: "5 min de lecture",
      date: "2026"
    };

    mainContent = `
      <article class="max-w-3xl mx-auto space-y-8 pt-8 pb-20">
        <header class="space-y-4 border-b border-[#25325c] pb-8">
          <a href="/blog" class="text-xs font-bold text-[#6e7cf0] hover:underline inline-flex items-center gap-1">← Retour aux articles</a>
          <div>
            <span class="px-3 py-1 rounded-full bg-[#6e7cf0]/10 text-[#6e7cf0] text-xs font-bold">${art.category || "Fiscalité"}</span>
          </div>
          <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            ${art.title}
          </h1>
          <div class="flex items-center gap-3 text-xs text-[#8e9bbf]">
            <span>Par <strong class="text-white">${art.author || "Équipe Bylz"}</strong></span>
            <span>•</span>
            <span>${art.readTime || "5 min"}</span>
          </div>
        </header>

        <div class="prose prose-invert max-w-none text-[#8e9bbf] leading-relaxed space-y-6 text-base [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-white [&>ul]:list-disc [&>ul]:pl-5 [&>p]:leading-relaxed [&>strong]:text-white">
          ${art.content}
        </div>

        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 text-center space-y-4 mt-12">
          <h2 class="text-2xl font-bold text-white">Mettez vos factures aux normes 2026 dès aujourd'hui</h2>
          <p class="text-sm text-[#8e9bbf] max-w-lg mx-auto">Créez vos devis et factures conformes Factur-X en 30 secondes et pilotez vos cotisations URSSAF sans stress.</p>
          <a href="/essai" class="inline-block px-8 py-3.5 rounded-full bg-[#6e7cf0] hover:bg-[#5b69e0] text-white font-bold text-sm shadow-lg transition-all">
            Créer mon compte gratuit (sans carte bancaire)
          </a>
        </div>
      </article>
    `;
  } else {
    // 7. Generic pages (outils, contact, mentions légales)
    mainContent = `
      <section class="max-w-4xl mx-auto space-y-8 pt-8 pb-20">
        <header class="space-y-4">
          <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">
            ${meta.title.split(" | ")[0].split(" — ")[0]}
          </h1>
          <p class="text-base sm:text-lg text-[#8e9bbf]">
            ${meta.description}
          </p>
        </header>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-6 text-sm text-[#8e9bbf] leading-relaxed">
          <p>Bylz est la plateforme tout-en-un de facturation conforme Factur-X et de pilotage fiscal conçue spécifiquement pour les auto-entrepreneurs et micro-entreprises françaises.</p>
          <div class="pt-4">
            <a href="/essai" class="px-6 py-3 rounded-full bg-[#6e7cf0] hover:bg-[#5b69e0] text-white font-bold text-sm shadow-md transition-all inline-block">
              Découvrir Bylz Gratuitement
            </a>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <div class="min-h-screen bg-[#0a0e1a] text-white font-sans pt-20">
      ${navbar}
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        ${mainContent}
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

  const rawHtml = fs.readFileSync(templatePath, "utf8");
  // Always normalize templateHtml so <div id="root"> is cleanly empty
  const templateHtml = rawHtml.replace(/<div id="root">[\s\S]*?<\/div>/i, '<div id="root"></div>');

  // 1. Create a pristine app.html shell for all private SPA routes (/dashboard, /invoices, /settings, etc.)
  // This guarantees that ANY internal route will NEVER flash the landing page!
  const appShellPath = path.join(distDir, "app.html");
  fs.writeFileSync(appShellPath, templateHtml, "utf8");
  console.log("Created pristine SPA app shell: dist/app.html");

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

  const allArticles = Array.from(allArticlesMap.values());

  // Helper to generate a pre-rendered HTML file with route-specific SEO tags and tailored body
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

    // Inject rich, tailored HTML body matching the exact route design
    const bodyContent = renderPageBody(routePath, meta, allArticles);
    if (bodyContent) {
      html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${bodyContent}</div>`);
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

  // 3. Process static pages
  for (const page of staticPages) {
    generateFile(page.path, page);
  }

  // 4. Generate each blog article page
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
    });
  }

  console.log("SEO Prerendering completed successfully!");
}

prerender();
