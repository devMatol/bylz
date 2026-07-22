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
} from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { HeroInvoiceMockup } from "../components/marketing/HeroInvoiceMockup";
import { TrustBadgesRow } from "../components/marketing/TrustBadgesRow";
import { InteractiveInvoiceBuilder } from "../components/marketing/InteractiveInvoiceBuilder";
import { InteractiveFiscalSimulator } from "../components/marketing/InteractiveFiscalSimulator";
import { Button } from "../components/ui/Button";

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
    <div className="min-h-screen bg-bg text-text selection:bg-primary/20 selection:text-primary relative">
      <SEO
        title="Bylz : Facturation et pilotage fiscal pour auto-entrepreneurs | Conforme 2026"
        description="Créez des factures conformes 2026, suivez votre CA et anticipez vos cotisations URSSAF en 2 min/jour. Gratuit sans carte bancaire."
        canonical="/"
        jsonLd={[softwareSchema, organizationSchema, faqSchema]}
      />

      <MarketingNavbar />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
          {/* Radial Primary Glow */}
          <div className="bylz-radial-primary" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Offer */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Regulatory Trust Badge */}
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-pill bg-primary/15 border border-primary/30 text-primary text-xs font-extrabold tracking-wide bylz-glow-primary">
                  <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                  <span>Prêt pour la Réforme Facturation Électronique 2026</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                  Vos factures.{" "}
                  <span className="bg-gradient-to-r from-primary via-primary-hover to-accent bg-clip-text text-transparent">
                    Votre fiscal.
                  </span>{" "}
                  Tout en un.
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                  Créez des factures conformes 2026, suivez votre CA en temps réel et anticipez vos cotisations URSSAF en 2 minutes par jour.
                </p>

                {/* CTAs */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link to="/essai" className="w-full sm:w-auto">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto bylz-glow-cta text-base py-4 px-8">
                      <span>Essayer gratuitement (sans carte bancaire)</span>
                      <ArrowRight className="w-5 h-5 ml-2 text-accent" />
                    </Button>
                  </Link>
                </div>

                {/* Ghost Anchor Link */}
                <div className="pt-2">
                  <a
                    href="#fonctionnalites"
                    className="inline-flex items-center text-xs font-bold text-muted hover:text-primary transition-colors"
                  >
                    Découvrir les simulateurs interactifs ↓
                  </a>
                </div>

                {/* Inline Trust Badges */}
                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold text-muted">
                  <span className="flex items-center text-success font-bold bg-success/10 px-3.5 py-1.5 rounded-pill border border-success/30">
                    ✓ Agréé DGFiP 2026
                  </span>
                  <span className="flex items-center bg-surface border border-border px-3.5 py-1.5 rounded-pill">
                    🔒 Données en France
                  </span>
                  <span className="flex items-center bg-surface border border-border px-3.5 py-1.5 rounded-pill">
                    ⚡ Prêt en 5 min
                  </span>
                </div>
              </div>

              {/* Right Column: Floating 3D CSS Mockup */}
              <div className="lg:col-span-5">
                <HeroInvoiceMockup />
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF / REGULATORY STRIP */}
        <section className="bg-primary/10 border-y border-border py-6 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-primary text-white text-xs font-bold flex items-center justify-center">
                JD
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-accent text-white text-xs font-bold flex items-center justify-center">
                ML
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-success text-white text-xs font-bold flex items-center justify-center">
                AB
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-warning text-white text-xs font-bold flex items-center justify-center">
                TR
              </div>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-text">
              100% conforme à la réforme de la facturation électronique et au E-Reporting DGFiP 2026.
            </p>
          </div>
        </section>

        {/* TWO PILLARS SECTION (WITH INTERACTIVE LIVE WIDGETS) */}
        <section id="fonctionnalites" className="py-28 space-y-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28">

            {/* Pillar 1: Facturation sans friction */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="w-12 h-12 rounded-card bg-primary/20 flex items-center justify-center text-primary bylz-glow-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
                  Facturation sans friction
                </h2>
                <p className="text-muted text-base leading-relaxed font-normal">
                  Créez des devis et factures d'aspect ultra-professionnel en quelques secondes. Bylz s'occupe du format légal et de la conformité sans que vous n'ayez à y penser.
                </p>
                <ul className="space-y-3.5 text-sm font-semibold text-text">
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Création de devis & factures en moins de 2 minutes</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Format Factur-X & télétransmission DGFiP automatique</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Relances automatiques des retards de paiement & Liens Stripe</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Recherche SIRET automatique pour remplir les clients B2B</span>
                  </li>
                </ul>
              </div>

              {/* Right Column: Interactive Live Invoice Builder */}
              <div className="lg:col-span-6">
                <InteractiveInvoiceBuilder />
              </div>
            </div>

            {/* Pillar 2: Pilotage fiscal en temps réel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Interactive Live Fiscal Simulator */}
              <div className="lg:col-span-6 order-2 lg:order-1">
                <InteractiveFiscalSimulator />
              </div>

              {/* Right Column: Pillar 2 Description */}
              <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
                <div className="w-12 h-12 rounded-card bg-accent/20 flex items-center justify-center text-accent bylz-glow-accent">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
                  Pilotage fiscal en temps réel
                </h2>
                <p className="text-muted text-base leading-relaxed font-normal">
                  Ne soyez plus jamais surpris par les plafonds de TVA ou les appels de cotisations URSSAF. Bylz calcule vos charges à chaque euro encaissé.
                </p>
                <ul className="space-y-3.5 text-sm font-semibold text-text">
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    <span>Calcul automatique de votre bénéfice net & des cotisations URSSAF</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    <span>Alerte visuelle à l'approche des seuils de franchise de TVA</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    <span>Assistant pour vos déclarations mensuelles ou trimestrielles</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    <span>Simulation de l'Impôt sur le Revenu selon votre TMI</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </section>

        {/* PRICING SECTION */}
        <section className="py-28 bg-surface-hover/40 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
                Des tarifs simples, transparents et sans surprise
              </h2>
              <p className="text-base text-muted font-medium">
                Commencez gratuitement. Évoluez quand votre activité grandit. Résiliable à tout moment.
              </p>
            </div>

            {/* 3 Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Starter Plan */}
              <div className="bg-surface border border-border rounded-card p-6 sm:p-8 space-y-6 card-shadow">
                <div>
                  <h3 className="text-xl font-bold text-text">Starter</h3>
                  <p className="text-xs text-muted mt-1 font-medium">Pour démarrer en toute sérénité</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-text font-mono">0 €</span>
                    <span className="text-xs text-muted">/ mois</span>
                  </div>
                </div>
                <ul className="space-y-3 text-xs text-text font-semibold">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>Jusqu'à 10 factures / mois</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>Jusqu'à 3 clients actifs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>Factur-X & Conformité 2026</span>
                  </li>
                </ul>
                <Link to="/signup?plan=starter" className="block w-full">
                  <Button variant="outline" className="w-full justify-center">
                    Créer mon compte gratuit
                  </Button>
                </Link>
              </div>

              {/* Solo Plan (Visually Dominant - Bylz Glow & Accent Badge) */}
              <div className="relative bg-surface border-2 border-primary rounded-card p-6 sm:p-8 space-y-6 bylz-glow-primary scale-100 md:scale-105 z-10">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white text-[11px] font-black uppercase tracking-wider px-4 py-1.5 rounded-pill shadow-lg">
                  ★ LE PLUS POPULAIRE
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text">Solo</h3>
                  <p className="text-xs text-muted mt-1 font-medium">Pour les indépendants actifs</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-primary font-mono">9 €</span>
                    <span className="text-xs text-muted">/ mois HT</span>
                  </div>
                </div>
                <ul className="space-y-3 text-xs text-text font-semibold">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Factures & Devis illimités</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Clients illimités</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Pilotage fiscal & Alertes TVA</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Relances automatiques</span>
                  </li>
                </ul>
                <Link to="/signup?plan=solo" className="block w-full">
                  <Button variant="primary" className="w-full justify-center bylz-glow-cta py-3.5">
                    Essayer Solo (14 jours offerts)
                  </Button>
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="bg-surface border border-border rounded-card p-6 sm:p-8 space-y-6 card-shadow">
                <div>
                  <h3 className="text-xl font-bold text-text">Pro</h3>
                  <p className="text-xs text-muted mt-1 font-medium">Pour maximiser votre activité</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-text font-mono">19 €</span>
                    <span className="text-xs text-muted">/ mois HT</span>
                  </div>
                </div>
                <ul className="space-y-3 text-xs text-text font-semibold">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>Tout le plan Solo</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>Paiement en ligne Stripe Connect</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span>Télétransmission Directe DGFiP</span>
                  </li>
                </ul>
                <Link to="/signup?plan=pro" className="block w-full">
                  <Button variant="outline" className="w-full justify-center">
                    Essayer Pro (14 jours offerts)
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
                Foire Aux Questions (FAQ)
              </h2>
              <p className="text-sm text-muted font-medium">
                Tout ce que vous devez savoir sur Bylz et la conformité 2026.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-surface border border-border hover:border-primary/40 rounded-card overflow-hidden transition-all card-shadow"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-bold text-text text-base hover:text-primary transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-muted flex-shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 pt-3 text-sm text-muted leading-relaxed font-normal border-t border-border/40">
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
        <section className="py-24 bg-gradient-to-r from-primary via-primary-hover to-accent text-white text-center relative overflow-hidden shadow-2xl">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Prêt à simplifier votre vie d'entrepreneur ?
            </h2>
            <p className="text-base sm:text-lg text-white/95 max-w-2xl mx-auto font-medium leading-relaxed">
              Testez Bylz gratuitement dès aujourd'hui. Aucune carte bancaire requise.
            </p>
            <div className="pt-4">
              <Link to="/essai">
                <Button variant="outline" size="lg" className="px-9 py-4 text-base font-black shadow-2xl hover:scale-105 bg-white text-primary border-white">
                  <span>Démarrer l'essai gratuit</span>
                  <ArrowRight className="w-5 h-5 ml-2 text-primary" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-white/80 font-semibold">Sans engagement • Résiliable à tout moment</p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
