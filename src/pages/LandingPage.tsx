import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  FileText,
  TrendingUp,
  ChevronDown,
  CheckCircle2,
  Lock,
  CreditCard,
  Bell,
  Layers,
  Calculator,
} from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { HeroInvoiceMockup } from "../components/marketing/HeroInvoiceMockup";
import { TrustBadgesRow } from "../components/marketing/TrustBadgesRow";

export function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Est-ce vraiment conforme à la réforme 2026 ?",
      a: "Oui, à 100%. Bylz génère automatiquement vos factures au format hybride norme Factur-X et assure la télétransmission réglementaire (e-reporting) vers l'administration fiscale via les passerelles agréées.",
    },
    {
      q: "Qu'est-ce qu'une Plateforme Agréée ?",
      a: "C'est une plateforme partenaire (PDP ou PPF) habilitée par l'État pour transmettre vos factures et rapports de ventes à la DGFiP. Bylz s'interface directement avec ces flux pour vous libérer de toute démarche manuelle.",
    },
    {
      q: "Puis-je annuler à tout moment ?",
      a: "Absolument. Tous nos abonnements sont sans engagement de durée. Vous pouvez suspendre, changer de formule ou résilier votre compte en 1 clic depuis votre espace Paramètres.",
    },
    {
      q: "Faut-il une carte bancaire pour commencer ?",
      a: "Non ! Vous pouvez tester l'éditeur de factures gratuitement en mode invité sur /essai ou créer votre compte Starter 100% gratuit sans saisir votre carte bancaire.",
    },
    {
      q: "Mes données sont-elles en sécurité ?",
      a: "Vos données et justificatifs sont chiffrés et hébergés exclusivement sur des serveurs sécurisés situés en France. Nous garantissons une confidentialité totale et le respect strict du RGPD.",
    },
  ];

  // JSON-LD Schemas
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Bylz",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "EUR", name: "Starter" },
      { "@type": "Offer", price: "9.00", priceCurrency: "EUR", name: "Solo" },
      { "@type": "Offer", price: "19.00", priceCurrency: "EUR", name: "Pro" },
    ],
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bylz",
    url: "https://bylz.fr",
    logo: "https://bylz.fr/logo.png",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-brand-primary/20 selection:text-brand-primary">
      <SEO
        title="Bylz — Facturation et pilotage fiscal pour auto-entrepreneurs | Conforme 2026"
        description="Créez des factures conformes 2026, suivez votre CA et anticipez vos cotisations URSSAF en 2 min/jour. Gratuit sans carte bancaire."
        canonical="/"
        jsonLd={[softwareSchema, organizationSchema, faqSchema]}
      />

      <MarketingNavbar />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Offer */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Regulatory Trust Badge */}
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs font-bold tracking-wide shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
                  <span>Prêt pour la Réforme Facturation Électronique 2026</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                  Vos factures.{" "}
                  <span className="bg-gradient-to-r from-brand-primary via-indigo-500 to-brand-accent bg-clip-text text-transparent">
                    Votre fiscal.
                  </span>{" "}
                  Tout en un.
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-text/80 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                  Créez des factures conformes 2026, suivez votre CA en temps réel et anticipez vos cotisations URSSAF — en 2 minutes par jour.
                </p>

                {/* CTAs */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    to="/essai"
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 text-base font-black text-white bg-gradient-to-r from-brand-primary via-indigo-600 to-brand-primary hover:from-indigo-600 hover:to-brand-primary px-8 py-4 rounded-full shadow-xl shadow-brand-primary/30 hover:shadow-brand-primary/50 transition-all duration-300 hover:-translate-y-1 border border-brand-primary/20"
                  >
                    <span>Essayer gratuitement — sans carte bancaire</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>

                {/* Ghost Anchor Link */}
                <div className="pt-2">
                  <a
                    href="#fonctionnalites"
                    className="inline-flex items-center text-xs font-bold text-text/80 hover:text-brand-primary transition-colors"
                  >
                    Voir comment ça marche ↓
                  </a>
                </div>

                {/* Inline Trust Badges */}
                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-text/80">
                  <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30">
                    ✓ Agréé DGFiP 2026
                  </span>
                  <span className="flex items-center bg-surface border border-border px-3 py-1.5 rounded-full">
                    🔒 Données en France
                  </span>
                  <span className="flex items-center bg-surface border border-border px-3 py-1.5 rounded-full">
                    ⚡ Prêt en 5 min
                  </span>
                </div>
              </div>

              {/* Right Column: Floating CSS Mockup */}
              <div className="lg:col-span-5">
                <HeroInvoiceMockup />
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF / REGULATORY STRIP */}
        <section className="bg-brand-primary/5 border-y border-border py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                JD
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
                ML
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                AB
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                TR
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
                CP
              </div>
            </div>
            <p className="text-xs sm:text-sm font-bold text-text">
              100% conforme à la réforme de la facturation électronique et au E-Reporting DGFiP 2026.
            </p>
          </div>
        </section>

        {/* TWO PILLARS SECTION (Alternating Layout) */}
        <section id="fonctionnalites" className="py-24 space-y-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">

            {/* Pillar 1: Facturation sans friction */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
                  Facturation sans friction
                </h2>
                <p className="text-text/80 text-base leading-relaxed">
                  Créez des devis et factures d'aspect ultra-professionnel en quelques secondes. Bylz s'occupe du format légal et de la conformité sans que vous n'ayez à y penser.
                </p>
                <ul className="space-y-3.5 text-sm font-semibold text-text">
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0" />
                    <span>Création de devis & factures en moins de 2 minutes</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0" />
                    <span>Format Factur-X & télétransmission DGFiP automatique</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0" />
                    <span>Relances automatiques des retards de paiement & Liens Stripe</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0" />
                    <span>Recherche SIRET automatique pour remplir les clients B2B</span>
                  </li>
                </ul>
              </div>

              {/* Right Mini CSS Mockup */}
              <div className="lg:col-span-6">
                <div className="bg-surface border border-border/80 rounded-2xl p-6 shadow-xl card-shadow">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-4">
                    <span className="text-xs font-bold text-text uppercase tracking-wider">Création Devis & Facture</span>
                    <span className="text-xs font-mono text-brand-primary font-bold">Prêt à émettre</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-surface-hover/80 border border-border flex items-center justify-between">
                      <div>
                        <p className="font-bold text-text">Client B2B sélectionné</p>
                        <p className="text-text/70 text-[11px]">Acme Studio SAS — SIRET 892 019 203</p>
                      </div>
                      <span className="text-emerald-500 text-[11px] font-bold">✓ Validé</span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-hover/80 border border-border space-y-2">
                      <div className="flex justify-between font-bold text-text">
                        <span>Prestation Conseil & Dev</span>
                        <span>1 200,00 €</span>
                      </div>
                      <p className="text-[11px] text-text/70">Mention légale : Franchise de TVA art. 293 B du CGI</p>
                    </div>
                    <div className="p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-between font-bold text-brand-primary">
                      <span>Génération Factur-X & Lien Stripe</span>
                      <span>1 200,00 € TTC</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 2: Pilotage fiscal en temps réel (Alternated) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Mini CSS Mockup */}
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="bg-surface border border-border/80 rounded-2xl p-6 shadow-xl card-shadow space-y-4">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <span className="text-xs font-bold text-text uppercase tracking-wider">Santé Fiscale & Cotisations</span>
                    <span className="text-xs font-bold text-emerald-500">Année en cours</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-surface-hover/80 border border-border">
                      <p className="text-text/70 text-[11px]">Chiffre d'Affaires</p>
                      <p className="text-base font-bold text-text font-mono">28 450,00 €</p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-hover/80 border border-border">
                      <p className="text-text/70 text-[11px]">URSSAF estimé</p>
                      <p className="text-base font-bold text-brand-primary font-mono">6 002,95 €</p>
                    </div>
                  </div>
                  {/* Gauge */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-amber-800 dark:text-amber-200">Seuil de franchise TVA (39 100 €)</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400">72%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                      <div className="bg-amber-500 h-2.5 rounded-full w-[72%]" />
                    </div>
                    <p className="text-[11px] text-text/80 font-medium">Il vous reste 10 650 € avant le passage à la TVA.</p>
                  </div>
                </div>
              </div>

              {/* Right Description */}
              <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
                <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
                  Pilotage fiscal en temps réel
                </h2>
                <p className="text-text/80 text-base leading-relaxed">
                  Ne soyez plus jamais surpris par les plafonds de TVA ou les appels de cotisations URSSAF. Bylz calcule vos charges à chaque euro encaissé.
                </p>
                <ul className="space-y-3.5 text-sm font-semibold text-text">
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-accent flex-shrink-0" />
                    <span>Calcul automatique de votre bénéfice net & des cotisations URSSAF</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-accent flex-shrink-0" />
                    <span>Alerte visuelle à l'approche des seuils de franchise de TVA</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-accent flex-shrink-0" />
                    <span>Assistant pour vos déclarations mensuelles ou trimestrielles</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-accent flex-shrink-0" />
                    <span>Simulation de l'Impôt sur le Revenu selon votre TMI</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </section>

        {/* PRICING SECTION */}
        <section className="py-24 bg-surface-hover/30 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
                Des tarifs simples, transparents et sans surprise
              </h2>
              <p className="text-base text-text/80">
                Commencez gratuitement. Évoluez quand votre activité grandit. Résiliable à tout moment.
              </p>
            </div>

            {/* 3 Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Starter Plan */}
              <div className="bg-surface border border-border/80 rounded-2xl p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-xl font-bold text-text">Starter</h3>
                  <p className="text-xs text-text/70 mt-1 font-medium">Pour démarrer en toute sérénité</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-text font-mono">0 €</span>
                    <span className="text-xs text-text/70">/ mois</span>
                  </div>
                </div>
                <ul className="space-y-3 text-xs text-text font-semibold">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Jusqu'à 10 factures / mois</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Jusqu'à 3 clients actifs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Factur-X & Conformité 2026</span>
                  </li>
                </ul>
                <Link
                  to="/signup?plan=starter"
                  className="block w-full text-center text-sm font-bold text-text bg-surface-hover hover:bg-border/80 border border-border/80 py-3 rounded-xl transition-all shadow-sm hover:text-brand-primary"
                >
                  Créer mon compte gratuit
                </Link>
              </div>

              {/* Solo Plan (Visually Dominant - 10% larger, Glow border, Badge) */}
              <div className="relative bg-surface border-2 border-brand-primary rounded-2xl p-8 space-y-6 shadow-2xl scale-105 z-10">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                  ★ LE PLUS POPULAIRE
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text">Solo</h3>
                  <p className="text-xs text-text/70 mt-1 font-medium">Pour les indépendants actifs</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-brand-primary font-mono">9 €</span>
                    <span className="text-xs text-text/70">/ mois HT</span>
                  </div>
                </div>
                <ul className="space-y-3 text-xs text-text font-semibold">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                    <span>Factures & Devis illimités</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                    <span>Clients illimités</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                    <span>Pilotage fiscal & Alertes TVA</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                    <span>Relances automatiques</span>
                  </li>
                </ul>
                <Link
                  to="/signup?plan=solo"
                  className="block w-full text-center text-sm font-black text-white bg-gradient-to-r from-brand-primary via-indigo-600 to-brand-primary hover:from-indigo-600 hover:to-brand-primary py-3.5 rounded-xl shadow-lg shadow-brand-primary/30 transition-all duration-300"
                >
                  Essayer Solo — 14 jours offerts
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="bg-surface border border-border/80 rounded-2xl p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-xl font-bold text-text">Pro</h3>
                  <p className="text-xs text-text/70 mt-1 font-medium">Pour maximiser votre activité</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-text font-mono">19 €</span>
                    <span className="text-xs text-text/70">/ mois HT</span>
                  </div>
                </div>
                <ul className="space-y-3 text-xs text-text font-semibold">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent" />
                    <span>Tout le plan Solo</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent" />
                    <span>Paiement en ligne Stripe Connect</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent" />
                    <span>Télétransmission Directe DGFiP</span>
                  </li>
                </ul>
                <Link
                  to="/signup?plan=pro"
                  className="block w-full text-center text-sm font-bold text-text bg-surface-hover hover:bg-border/80 border border-border/80 py-3 rounded-xl transition-all shadow-sm hover:text-brand-primary"
                >
                  Essayer Pro — 14 jours offerts
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION (ENHANCED MARGINS & CONTRAST) */}
        <section id="faq" className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
                Foire Aux Questions (FAQ)
              </h2>
              <p className="text-sm text-text/80">
                Tout ce que vous devez savoir sur Bylz et la conformité 2026.
              </p>
            </div>

            <div className="space-y-5">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-surface border border-border/80 hover:border-brand-primary/40 rounded-2xl overflow-hidden transition-all shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-bold text-text text-base hover:text-brand-primary transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-text/70 flex-shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-brand-primary" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 pt-3 text-sm text-text/80 leading-relaxed font-normal border-t border-border/40">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* TRUST BADGES ROW */}
        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TrustBadgesRow />
          </div>
        </section>

        {/* FOOTER CTA BANNER */}
        <section className="py-20 bg-gradient-to-r from-brand-primary via-indigo-600 to-brand-accent text-white text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Prêt à simplifier votre vie d'entrepreneur ?
            </h2>
            <p className="text-base sm:text-lg text-white/95 max-w-2xl mx-auto font-medium">
              Testez Bylz gratuitement dès aujourd'hui. Aucune carte bancaire requise.
            </p>
            <div className="pt-4">
              <Link
                to="/essai"
                className="inline-flex items-center space-x-3 text-base font-black text-brand-primary bg-white hover:bg-slate-100 px-8 py-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <span>Démarrer l'essai gratuit</span>
                <ArrowRight className="w-5 h-5 text-brand-primary" />
              </Link>
            </div>
            <p className="text-xs text-white/80 font-medium">Sans engagement — Résiliable à tout moment</p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
