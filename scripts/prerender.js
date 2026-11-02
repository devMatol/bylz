import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { SEO_METADATA } from "../src/lib/seoMeta.ts";
import { BLOG_SLUG_REDIRECTS } from "../src/lib/blogSlugs.ts";
import { BLOG_ARTICLES } from "../src/data/blogArticles.ts";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
if (!process.env.NETLIFY) {
  loadEnv();
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = anonKey ? createClient(supabaseUrl, anonKey) : null;
const SITE_URL = "https://bylz.fr";
const DEFAULT_OG_IMAGE = "https://bylz.fr/og-image.png";

// Base static blog articles read from single source of truth
const STATIC_BLOG_ARTICLES = BLOG_ARTICLES.map(art => ({
  ...art,
  date: art.date.includes("T") ? art.date : "2026-07-15T10:00:00.000Z",
}));

function getSeo(p) {
  const key = p === "" ? "/" : (p.startsWith("/") ? p : `/${p}`);
  const m = SEO_METADATA[key] || {};
  return { title: m.title, description: m.description, ogType: m.ogType || "website" };
}

// Static pages metadata and JSON-LD schemas with exact matching prices
const staticPages = [
  {
    path: "", // Home
    ...getSeo(""),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Bylz",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "Logiciel de facturation PDF et de gestion des cotisations URSSAF pour auto-entrepreneurs et micro-entreprises.",
        "offers": [
          { "@type": "Offer", "price": "0.00", "priceCurrency": "EUR", "name": "Starter", "availability": "https://schema.org/InStock", "url": "https://bylz.fr/tarifs" },
          { "@type": "Offer", "price": "8.90", "priceCurrency": "EUR", "name": "Solo", "availability": "https://schema.org/InStock", "url": "https://bylz.fr/tarifs" },
          { "@type": "Offer", "price": "12.90", "priceCurrency": "EUR", "name": "Pro", "availability": "https://schema.org/InStock", "url": "https://bylz.fr/tarifs" }
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
              "text": "Bylz intègre toutes les mentions légales obligatoires sur vos factures PDF et prépare activement l'intégration du standard Factur-X pour la facturation électronique."
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
    ...getSeo("tarifs"),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Bylz Starter",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "Plan gratuit de démarrage pour créer des factures PDF avec les mentions légales essentielles.",
        "offers": {
          "@type": "Offer",
          "price": "0.00",
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock",
          "url": "https://bylz.fr/tarifs"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Bylz Solo",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "Plan complet pour indépendant avec facturation illimitée et pilotage fiscal.",
        "offers": {
          "@type": "Offer",
          "price": "8.90",
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock",
          "url": "https://bylz.fr/tarifs"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Bylz Pro",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "Plan premium avec paiement en ligne Stripe Connect et support dédié.",
        "offers": {
          "@type": "Offer",
          "price": "12.90",
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock",
          "url": "https://bylz.fr/tarifs"
        }
      }
    ]
  },
  {
    path: "fonctionnalites",
    ...getSeo("fonctionnalites"),
  },
  {
    path: "conformite",
    ...getSeo("conformite"),
  },
  {
    path: "outils/simulateur-urssaf",
    ...getSeo("outils/simulateur-urssaf"),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Simulateur Cotisations URSSAF 2026 | Bylz",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock"
      }
    }
  },
  {
    path: "outils/simulateur-seuil-tva",
    ...getSeo("outils/simulateur-seuil-tva"),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Simulateur Seuil de Franchise de TVA 2026 | Bylz",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock"
      }
    }
  },
  {
    path: "outils/modele-facture-gratuit",
    ...getSeo("outils/modele-facture-gratuit"),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Générateur de Modèle de Facture Gratuit | Bylz",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock"
      }
    }
  },
  {
    path: "blog",
    ...getSeo("blog"),
  },
  {
    path: "contact",
    ...getSeo("contact"),
  },
  {
    path: "mentions-legales",
    ...getSeo("mentions-legales"),
  },
  {
    path: "cgu",
    ...getSeo("cgu"),
  },
  {
    path: "facturation-electronique",
    ...getSeo("facturation-electronique"),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Facturation électronique auto-entrepreneur 2026 et 2027",
        "description": "Calendrier officiel, obligations B2B et démarches de facturation électronique pour auto-entrepreneurs en 2026 et 2027. Source : impots.gouv.fr.",
        "url": "https://bylz.fr/facturation-electronique"
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Dois-je changer de logiciel ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Non, vous n'avez pas obligatoirement besoin de changer de logiciel dès aujourd'hui. Jusqu'au 1er septembre 2027, vous pouvez continuer à émettre vos factures de vente au format PDF classique avec les mentions légales essentielles. Pour la réception de factures dès le 1er septembre 2026, vous devrez disposer d'une adresse de réception sur une plateforme agréée de votre choix."
            }
          },
          {
            "@type": "Question",
            "name": "Une facture PDF classique suffit-elle jusqu'en 2027 ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui. Pour les micro-entrepreneurs et les petites entreprises, l'obligation d'émission au format électronique structuré n'intervient qu'au 1er septembre 2027. Vos factures PDF actuelles restent valables jusqu'à cette date, à condition de comporter toutes les mentions légales essentielles (art. L441-9 et R123-237 du Code de commerce, art. 242 nonies A de l'annexe II au CGI)."
            }
          },
          {
            "@type": "Question",
            "name": "Qu'est-ce qu'une plateforme agréée ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Une plateforme agréée (PA, anciennement désignée plateforme de dématérialisation partenaire ou PDP) est un opérateur privé immatriculé par la Direction générale des Finances publiques (DGFiP). Elle assure l'émission, la transmission sécurisée et la réception des factures électroniques entre entreprises, ainsi que l'extraction des données fiscales transmises à l'administration."
            }
          },
          {
            "@type": "Question",
            "name": "Que risque-t-on sans facture électronique ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "L'administration fiscale prévoit des pénalités financières par facture ou par transmission omise, plafonnées par année civile (montants à vérifier auprès de l'administration selon les textes d'application en vigueur). Une dispense d'amende est prévue pour la première infraction en cas de régularisation spontanée ou dans les 30 jours."
            }
          },
          {
            "@type": "Question",
            "name": "Mon client est un particulier, que faire ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Les ventes et prestations réalisées au profit de particuliers (B2C) ne relèvent pas de la facturation électronique inter-entreprises. Vous continuez à délivrer à votre client particulier une facture ou une note au format papier ou PDF. En revanche, les données globales de ces ventes devront être transmises périodiquement à l'administration fiscale dans le cadre du dispositif de e-reporting."
            }
          }
        ]
      }
    ]
  },
  {
    path: "confidentialite",
    ...getSeo("confidentialite"),
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
          <a href="/facturation-electronique" class="hover:text-white transition-colors">Facturation 2026</a>
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
              La solution intégrée de facturation PDF et de pilotage fiscal automatisé pour les indépendants et micro-entreprises en France.
            </p>
            <div class="flex items-center space-x-2 text-xs text-emerald-400 font-bold">
              <span>✓ Facturation électronique en préparation</span>
            </div>
          </div>
          <div class="space-y-3">
            <h4 class="font-bold text-white text-xs uppercase tracking-wider">Produit</h4>
            <ul class="space-y-2 text-xs font-medium">
              <li><a href="/fonctionnalites" class="text-white/80 hover:text-[#6e7cf0] transition-colors">Fonctionnalités</a></li>
              <li><a href="/conformite" class="text-white/80 hover:text-[#6e7cf0] transition-colors">Conformité & Sécurité</a></li>
              <li><a href="/facturation-electronique" class="text-white/80 hover:text-[#6e7cf0] transition-colors font-bold">Facturation 2026</a></li>
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
          © ${currentYear} ARABACI HOLDING. Tous droits réservés. Base de données hébergée en Europe.
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
          Créez vos factures PDF avec les mentions légales essentielles, suivez votre CA en temps réel et anticipez vos cotisations URSSAF & impôts en 2 minutes par jour.
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
          <h2 class="text-xl font-bold text-white">Facturation PDF</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Générez vos factures PDF avec les mentions légales essentielles et préparez la facturation électronique.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <div class="w-12 h-12 rounded-xl bg-[#6e7cf0]/10 flex items-center justify-center text-[#6e7cf0] text-2xl font-bold">📊</div>
          <h2 class="text-xl font-bold text-white">Pilotage URSSAF & TVA en direct</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Calcul au centime près de vos cotisations sociales (BNC, BIC) et alertes en direct à l'approche du seuil de TVA de 37 500 € (ou 85 000 € en vente).</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <div class="w-12 h-12 rounded-xl bg-[#6e7cf0]/10 flex items-center justify-center text-[#6e7cf0] text-2xl font-bold">🤖</div>
          <h2 class="text-xl font-bold text-white">Pilote IA & Encaissement en ligne</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Commandez vos factures par message WhatsApp et encaissez par carte bancaire avec Stripe Connect.</p>
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
            <p class="text-xs text-[#8e9bbf]">Parfait pour démarrer et créer vos premières factures PDF.</p>
            <ul class="space-y-3 text-sm text-white/90 pt-4 border-t border-[#25325c]">
              <li>✓ Jusqu'à 3 factures et devis par mois</li>
              <li>✓ Factures PDF avec mentions légales</li>
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
              <li>✓ Alerte seuil de franchise TVA (37 500 € / 85 000 €)</li>
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
            <p class="text-xs text-[#8e9bbf]">Puissance maximale avec IA WhatsApp, multi-entreprises et encaissement en ligne.</p>
            <ul class="space-y-3 text-sm text-white/90 pt-4 border-t border-[#25325c]">
              <li>✓ Tout le forfait Solo en illimité</li>
              <li>✓ Pilote IA & Assistant vocal WhatsApp</li>
              <li>✓ Gestion multi-entreprises (plusieurs SIRET)</li>
              <li>✓ Paiement en ligne Stripe Connect</li>
              <li>✓ Factures PDF avec mentions légales</li>
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
          De l'édition de factures PDF avec mentions légales obligatoires au calcul au centime près de vos cotisations URSSAF.
        </p>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-3">
          <h2 class="text-xl font-bold text-white">Facturation PDF</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Émettez des devis et factures PDF avec les mentions légales obligatoires et préparez l'arrivée de la facturation électronique.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-3">
          <h2 class="text-xl font-bold text-white">Pilotage Fiscal & Cotisations URSSAF</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Estimation automatique de vos cotisations sociales (BNC, BIC) et de votre impôt sur le revenu. Déclarations trimestrielles ou mensuelles prêtes en 1 clic.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-3">
          <h2 class="text-xl font-bold text-white">Suivi des Plafonds de Franchise TVA</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Jauge intelligente qui vous avertit lorsque votre chiffre d'affaires approche du seuil de base (37 500 € en services, 85 000 € en vente) ou du seuil majoré (41 250 € / 93 500 €).</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-3">
          <h2 class="text-xl font-bold text-white">Pilote IA sur WhatsApp</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Dictez ou écrivez simplement un message pour créer un devis ou une facture. L'IA extrait les lignes, applique les taux et génère le document.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-3">
          <h2 class="text-xl font-bold text-white">Paiement en ligne par carte (Stripe Connect)</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Permettez à vos clients de régler leurs factures en un clic par carte bancaire avec confirmation automatique des encaissements.</p>
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
          <h2 class="text-xl font-bold text-white">Facturation électronique en préparation</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Bylz intègre les mentions légales obligatoires sur vos documents PDF et prépare activement l'intégration du standard Factur-X pour les échanges inter-entreprises.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <h2 class="text-xl font-bold text-white">Livre chronologique des recettes</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Numérotation séquentielle continue sans rupture et données légales figées dans le document à l'émission pour le suivi de votre livre des recettes.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <h2 class="text-xl font-bold text-white">Paiement par carte sécurisé via Stripe</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Les encaissements par carte bancaire sont directement traités par Stripe Connect (certifié PCI-DSS Level 1) avec protocole 3D-Secure 2.0.</p>
        </div>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <h2 class="text-xl font-bold text-white">Base de données hébergée en Europe & Respect du RGPD</h2>
          <p class="text-sm text-[#8e9bbf] leading-relaxed">Vos données d'entreprise et factures sont stockées sur une base de données PostgreSQL gérée par Supabase en Europe, avec sauvegardes régulières et chiffrement complet.</p>
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
        <a href="/blog/${art.slug}" class="text-sm font-bold text-[#6e7cf0] hover:underline inline-flex items-center gap-1 pt-2 min-h-[44px]">
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
          <p class="text-sm text-[#8e9bbf] max-w-lg mx-auto">Créez vos devis et factures PDF en 30 secondes et pilotez vos cotisations URSSAF sans stress.</p>
          <a href="/essai" class="inline-block px-8 py-3.5 rounded-full bg-[#6e7cf0] hover:bg-[#5b69e0] text-white font-bold text-sm shadow-lg transition-all">
            Créer mon compte gratuit (sans carte bancaire)
          </a>
        </div>
      </article>
    `;
  } else if (routePath === "facturation-electronique") {
    mainContent = `
      <section class="text-center max-w-3xl mx-auto space-y-6 pt-8 pb-12">
        <div class="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#6e7cf0]/10 text-[#6e7cf0] text-xs font-bold border border-[#6e7cf0]/20">
          <span>Source : impots.gouv.fr</span>
        </div>
        <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Facturation électronique 2026 et 2027 : ce que doivent faire les auto-entrepreneurs
        </h1>
        <p class="text-base sm:text-lg text-[#8e9bbf] leading-relaxed">
          Calendrier officiel, champ d'application légal et démarches concrètes pour les micro-entrepreneurs et indépendants en France.
        </p>
      </section>

      <section class="max-w-4xl mx-auto space-y-8 pb-12">
        <h2 class="text-xl sm:text-2xl font-bold text-white">L'essentiel de la réforme en 3 points</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-6 space-y-3">
            <div class="w-8 h-8 rounded-lg bg-[#6e7cf0]/10 text-[#6e7cf0] flex items-center justify-center font-bold">1</div>
            <h3 class="text-base font-bold text-white">1er septembre 2026 : Réception obligatoire</h3>
            <p class="text-xs text-[#8e9bbf] leading-relaxed">Toutes les entreprises assujetties à la TVA, y compris les micro-entreprises, ont l'obligation de pouvoir recevoir des factures au format électronique.</p>
          </div>
          <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-6 space-y-3">
            <div class="w-8 h-8 rounded-lg bg-[#6e7cf0]/10 text-[#6e7cf0] flex items-center justify-center font-bold">2</div>
            <h3 class="text-base font-bold text-white">1er septembre 2027 : Émission pour micro-entreprises</h3>
            <p class="text-xs text-[#8e9bbf] leading-relaxed">L'obligation d'émettre des factures électroniques s'appliquera aux PME et micro-entrepreneurs à compter du 1er septembre 2027.</p>
          </div>
          <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-6 space-y-3">
            <div class="w-8 h-8 rounded-lg bg-[#6e7cf0]/10 text-[#6e7cf0] flex items-center justify-center font-bold">3</div>
            <h3 class="text-base font-bold text-white">Plateforme Agréée obligatoire</h3>
            <p class="text-xs text-[#8e9bbf] leading-relaxed">À terme, les factures électroniques B2B ne s'échangeront plus par simple e-mail : la réception est obligatoire dès le 1er septembre 2026 pour toutes les entreprises, et l'émission au 1er septembre 2027 pour les micro-entreprises via une Plateforme Agréée (PA).</p>
          </div>
        </div>
        <p class="text-xs text-[#8e9bbf]">Source officielle : impots.gouv.fr (https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique)</p>
      </section>

      <section class="max-w-4xl mx-auto space-y-4 pb-12">
        <h2 class="text-xl sm:text-2xl font-bold text-white">Suis-je concerné ?</h2>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <p class="text-sm text-white font-medium">Oui, si vous vendez ou fournissez des prestations de services à d'autres professionnels en France.</p>
          <p class="text-xs sm:text-sm text-[#8e9bbf] leading-relaxed">Même si vous êtes au régime de la franchise en base de TVA (article 293 B du Code général des impôts) et que vous ne facturez pas de TVA, vous restez fiscalement qualifié d'assujetti à la TVA au sens de l'article 256 A du CGI. L'obligation concerne toutes les opérations B2B domestiques.</p>
        </div>
      </section>

      <section class="max-w-4xl mx-auto space-y-6 pb-12">
        <h2 class="text-xl sm:text-2xl font-bold text-white">Qu'est-ce qui change concrètement ?</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-6 space-y-3">
            <h3 class="text-base font-bold text-white">Les 3 formats autorisés</h3>
            <p class="text-xs text-[#8e9bbf] leading-relaxed">Factur-X (format hybride PDF et XML structuré), UBL et UN/CEFACT CII.</p>
          </div>
          <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-6 space-y-3">
            <h3 class="text-base font-bold text-white">Le rôle de la Plateforme Agréée</h3>
            <p class="text-xs text-[#8e9bbf] leading-relaxed">Acheminement sécurisé des factures et transmission automatique des données fiscales exigées à la DGFiP.</p>
          </div>
          <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-6 space-y-3">
            <h3 class="text-base font-bold text-white">Le e-reporting</h3>
            <p class="text-xs text-[#8e9bbf] leading-relaxed">Transmission des données de ventes pour les clients particuliers (B2C) et les opérations internationales (art. 290 du CGI).</p>
          </div>
        </div>
      </section>

      <section class="max-w-4xl mx-auto space-y-6 pb-12">
        <h2 class="text-xl sm:text-2xl font-bold text-white">Où en est Bylz ?</h2>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
          <div class="p-4 rounded-xl bg-[#6e7cf0]/10 border border-[#6e7cf0]/30 space-y-3">
            <p class="text-sm font-semibold text-white leading-relaxed">Bylz produit aujourd'hui des factures PDF avec les mentions légales essentielles. La génération du format Factur-X et le raccordement à une plateforme agréée sont en préparation.</p>
            <p class="text-xs text-[#8e9bbf] leading-relaxed pt-1 border-t border-[#25325c]">Bylz ne propose pas encore la réception de factures électroniques. Pour recevoir des factures dès le 1er septembre 2026, vous devez disposer d'une adresse de réception sur une plateforme agréée de votre choix.</p>
          </div>
          <p class="text-xs sm:text-sm text-[#8e9bbf] leading-relaxed">Bylz intègre dès aujourd'hui les mentions légales essentielles (taux de pénalités de retard, indemnité de 40 €, mention EI, date de vente ou de prestation), le livre chronologique des recettes avec export CSV, le calcul des cotisations URSSAF (plans Solo et Pro) et le suivi des seuils de TVA (plans Solo et Pro).</p>
        </div>
      </section>

      <section class="max-w-4xl mx-auto space-y-6 pb-12">
        <h2 class="text-xl sm:text-2xl font-bold text-white">Foire aux questions</h2>
        <div class="space-y-4">
          <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-6 space-y-2">
            <h3 class="text-base font-bold text-white">Dois-je changer de logiciel ?</h3>
            <p class="text-xs sm:text-sm text-[#8e9bbf] leading-relaxed">Non, vous n'avez pas obligatoirement besoin de changer de logiciel dès aujourd'hui. Jusqu'au 1er septembre 2027, vous pouvez continuer à émettre vos factures de vente au format PDF classique avec les mentions légales essentielles. Pour la réception de factures dès le 1er septembre 2026, vous devrez disposer d'une adresse de réception sur une plateforme agréée de votre choix.</p>
          </div>
          <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-6 space-y-2">
            <h3 class="text-base font-bold text-white">Une facture PDF classique suffit-elle jusqu'en 2027 ?</h3>
            <p class="text-xs sm:text-sm text-[#8e9bbf] leading-relaxed">Oui. Pour les micro-entrepreneurs et les petites entreprises, l'obligation d'émission au format électronique structuré n'intervient qu'au 1er septembre 2027. Vos factures PDF actuelles restent valables jusqu'à cette date, à condition de comporter toutes les mentions légales essentielles (art. L441-9 et R123-237 du Code de commerce, art. 242 nonies A de l'annexe II au CGI).</p>
          </div>
          <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-6 space-y-2">
            <h3 class="text-base font-bold text-white">Qu'est-ce qu'une plateforme agréée ?</h3>
            <p class="text-xs sm:text-sm text-[#8e9bbf] leading-relaxed">Une plateforme agréée (PA, anciennement désignée plateforme de dématérialisation partenaire ou PDP) est un opérateur privé immatriculé par la Direction générale des Finances publiques (DGFiP). Elle assure l'émission, la transmission sécurisée et la réception des factures électroniques entre entreprises, ainsi que l'extraction des données fiscales transmises à l'administration.</p>
          </div>
          <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-6 space-y-2">
            <h3 class="text-base font-bold text-white">Que risque-t-on sans facture électronique ?</h3>
            <p class="text-xs sm:text-sm text-[#8e9bbf] leading-relaxed">L'administration fiscale prévoit des pénalités financières par facture ou par transmission omise, plafonnées par année civile (montants à vérifier auprès de l'administration selon les textes d'application en vigueur). Une dispense d'amende est prévue pour la première infraction en cas de régularisation spontanée ou dans les 30 jours.</p>
          </div>
          <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-6 space-y-2">
            <h3 class="text-base font-bold text-white">Mon client est un particulier, que faire ?</h3>
            <p class="text-xs sm:text-sm text-[#8e9bbf] leading-relaxed">Les ventes et prestations réalisées au profit de particuliers (B2C) ne relèvent pas de la facturation électronique inter-entreprises. Vous continuez à délivrer à votre client particulier une facture ou une note au format papier ou PDF. En revanche, les données globales de ces ventes devront être transmises périodiquement à l'administration fiscale dans le cadre du dispositif de e-reporting.</p>
          </div>
        </div>
      </section>

      <section class="text-center max-w-xl mx-auto space-y-6 pb-20">
        <h2 class="text-2xl font-bold text-white">Prêt à tester Bylz ?</h2>
        <a href="/signup?plan=starter" class="inline-block px-8 py-4 rounded-full bg-[#6e7cf0] hover:bg-[#5b69e0] text-white font-bold text-base shadow-xl shadow-[#6e7cf0]/25 transition-all">
          Essayer gratuitement
        </a>
      </section>
    `;
  } else if (routePath === "mentions-legales") {
    mainContent = `
      <section class="max-w-4xl mx-auto space-y-8 pt-8 pb-20">
        <header class="space-y-4">
          <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Mentions Légales
          </h1>
          <p class="text-base sm:text-lg text-[#8e9bbf]">
            Conformément aux dispositions des articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l'Économie Numérique (LCEN).
          </p>
        </header>
        <div class="space-y-6 text-sm text-[#8e9bbf] leading-relaxed">
          <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
            <h2 class="text-xl font-bold text-white">1. Éditeur de la plateforme</h2>
            <p>Le site internet et service en ligne Bylz.fr est édité par :</p>
            <ul class="list-disc pl-5 space-y-1">
              <li><strong>Dénomination sociale :</strong> ARABACI HOLDING (SASU, capital 1 000 €)</li>
              <li><strong>Directeur de la publication :</strong> Irfan Arabaci, représentant légal</li>
              <li><strong>SIREN / RCS :</strong> 908 662 950 RCS Bordeaux • SIRET : 908 662 950 00017</li>
              <li><strong>Siège social :</strong> 21 B rue Général de Castelnau, 33700 Mérignac, France</li>
              <li><strong>Numéro de TVA :</strong> FR93908662950</li>
              <li><strong>Email de contact :</strong> contact@bylz.fr</li>
            </ul>
          </div>
          <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-4">
            <h2 class="text-xl font-bold text-white">2. Hébergement de la plateforme</h2>
            <div class="space-y-3">
              <div class="p-4 rounded-xl bg-[#0a0e1a] border border-[#25325c]">
                <p class="font-bold text-white">Hébergement Applicatif & Interface Web :</p>
                <p><strong>Netlify, Inc.</strong> : 512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis.</p>
                <p class="text-xs text-[#8e9bbf]">Infrastructure Edge CDN mondiale avec points de présence en Union Européenne.</p>
              </div>
              <div class="p-4 rounded-xl bg-[#0a0e1a] border border-[#25325c]">
                <p class="font-bold text-white">Base de données, Stockage & API :</p>
                <p><strong>Supabase Inc. / Amazon Web Services (AWS)</strong> : Datacenter situé dans l'Union Européenne (Région Europe).</p>
                <p class="text-xs text-[#8e9bbf]">Hébergement chiffré TLS 1.3, sauvegardes quotidiennes et conformité totale RGPD.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  } else {
    // 7. Generic pages (outils, contact, mentions légales)
    mainContent = `
      <section class="max-w-4xl mx-auto space-y-8 pt-8 pb-20">
        <header class="space-y-4">
          <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">
            ${meta.title.split(" | ")[0].split(" : ")[0].split(" : ")[0]}
          </h1>
          <p class="text-base sm:text-lg text-[#8e9bbf]">
            ${meta.description}
          </p>
        </header>
        <div class="bg-[#141c38] border border-[#25325c] rounded-2xl p-8 space-y-6 text-sm text-[#8e9bbf] leading-relaxed">
          <p>Bylz est la plateforme tout-en-un de facturation PDF et de pilotage fiscal conçue spécifiquement pour les auto-entrepreneurs et micro-entreprises françaises.</p>
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

  const isNetlifyProduction = (process.env.NETLIFY === 'true' || process.env.NETLIFY === true) && process.env.CONTEXT === 'production';

  if (isNetlifyProduction && (!anonKey || !supabaseUrl || supabaseUrl.includes("placeholder"))) {
    console.error("FATAL [prerender]: En contexte de production Netlify (CONTEXT=production), les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont obligatoires.");
    process.exit(1);
  }

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

  // 2. Aggregate all blog articles (Remote DB first, static fallback copy second)
  const allArticlesMap = new Map();

  if (supabase) {
    try {
      const fetchPromise = supabase
        .from("blog_posts")
        .select("slug, title, excerpt, content, cover_image_url, author, published_at, meta_description")
        .eq("status", "published");
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase query timeout")), 4000)
      );
      const { data: posts, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        throw new Error(error.message);
      }

      if (posts && posts.length > 0) {
        for (const p of posts) {
          const canonicalSlug = BLOG_SLUG_REDIRECTS[p.slug] || p.slug;
          allArticlesMap.set(canonicalSlug, {
            slug: canonicalSlug,
            title: p.title,
            excerpt: p.excerpt || p.meta_description || "Article sur le blog de Bylz.",
            metaDescription: p.meta_description || p.excerpt,
            content: p.content,
            author: p.author || "Équipe Bylz",
            date: p.published_at || new Date().toISOString(),
            coverImageUrl: p.cover_image_url || DEFAULT_OG_IMAGE,
          });
        }
      } else if (isNetlifyProduction) {
        console.error("FATAL [prerender]: En contexte de production Netlify (CONTEXT=production), la table blog_posts n'a renvoyé aucun article publié.");
        process.exit(1);
      }
    } catch (err) {
      if (isNetlifyProduction) {
        console.error("FATAL [prerender]: En contexte de production Netlify (CONTEXT=production), la requête sur la table blog_posts a échoué :", err.message);
        process.exit(1);
      }
      console.warn("AVERTISSEMENT [prerender]: Impossible de joindre la base distante (" + (process.env.CONTEXT || 'local') + "). Repli sur src/data/blogArticles.ts :", err.message);
    }
  } else if (!isNetlifyProduction) {
    console.warn("AVERTISSEMENT [prerender]: Supabase non configuré en contexte (" + (process.env.CONTEXT || 'local') + "). Repli sur la copie statique src/data/blogArticles.ts.");
  }

  // Fallback to static articles for any article not found in remote DB
  for (const art of STATIC_BLOG_ARTICLES) {
    if (!allArticlesMap.has(art.slug)) {
      allArticlesMap.set(art.slug, art);
    }
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
