import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  FileText,
  Calculator,
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Clock,
  Send,
  Zap,
} from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { TrustBadgesRow } from "../components/marketing/TrustBadgesRow";
import { Button } from "../components/ui/Button";
import { BillingToggle } from "../components/shared/BillingToggle";
import { type BillingCycle } from "../lib/constants";
import { useAuth } from "../contexts/AuthContext";

export function LandingPage() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const forcePublic = searchParams.get("public") === "true";

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");

  // State for AI Copilot section interactive selector
  const [activeAiTab, setActiveAiTab] = useState<number>(0);

  // State for Live Demo interactive box
  const [demoDescription, setDemoDescription] = useState("Développement Web Frontend - Application Mobile");
  const [demoTjm, setDemoTjm] = useState(550);
  const [demoDays, setDemoDays] = useState(10);

  const demoMontantHt = demoTjm * demoDays;
  const demoTva = demoMontantHt * 0.2;
  const demoTotalTtc = demoMontantHt + demoTva;

  if (!loading && user && !forcePublic) {
    const isStarter = profile?.plan === "starter";
    const defaultPath = isStarter ? "/invoices" : "/dashboard";
    return <Navigate to={defaultPath} replace />;
  }

  const faqs = [
    {
      q: "Bylz est-il conforme à la réforme de facturation 2026 ?",
      a: "Oui, Bylz est conçu dès le départ pour respecter les nouvelles normes de facturation électronique obligatoires en France, notamment le format structuré Factur-X et les télétransmissions réglementaires vers l'administration fiscale.",
    },
    {
      q: "Comment fonctionne le calcul des cotisations URSSAF ?",
      a: "Bylz applique automatiquement les taux de cotisations selon votre type d'activité (services BNC/BIC, vente de marchandises) et votre statut pour vous donner une estimation exacte et en temps réel de vos futures échéances.",
    },
    {
      q: "Puis-je importer mes anciennes factures ?",
      a: "Tout à fait ! Bylz dispose d'un outil d'import intelligent qui extrait automatiquement les données de vos anciennes factures PDF ou fichiers Excel pour que vous puissiez démarrer sans repartir de zéro.",
    },
    {
      q: "Y a-t-il un engagement de durée ?",
      a: "Aucun. Toutes nos offres sont 100% sans engagement. Vous pouvez suspendre, changer de forfait ou résilier votre abonnement à tout moment d'un simple clic depuis votre espace.",
    },
    {
      q: "Mes données sont-elles hébergées en France ?",
      a: "Oui, la totalité de vos données et factures sont chiffrées et hébergées exclusivement sur des serveurs sécurisés situés en France, dans le strict respect des normes européennes RGPD.",
    },
  ];

  const aiFeatures = [
    {
      id: "01",
      title: "Prévisions de trésorerie",
      tag: "Trésor",
      tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      description: "Visualisez votre solde futur calculé à partir de vos encaissements récurrents et de vos dates d'échéances prévues.",
    },
    {
      id: "02",
      title: "Optimisation fiscale intelligente",
      tag: "Recommandé",
      tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      description: "Sachez exactement quand votre plafond de franchise de TVA approche et optimisez vos charges déductibles intelligemment.",
    },
    {
      id: "03",
      title: "Anticipation proactive URSSAF",
      tag: "Alerte",
      tagColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      description: "Fini les mauvaises surprises. L'IA estime votre prochaine déclaration et vous rappelle les échéances clés à l'avance.",
    },
    {
      id: "04",
      title: "Analyse des tendances clients",
      tag: null,
      tagColor: "",
      description: "Identifiez vos meilleurs contributeurs de revenus et anticipez les retards récurrents avant d'émettre vos relances.",
    },
  ];

  // Schemas JSON-LD
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Bylz",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      { "@type": "Offer", price: "0.00", priceCurrency: "EUR", name: "Gratuit" },
      { "@type": "Offer", price: "4.17", priceCurrency: "EUR", name: "Solo" },
      { "@type": "Offer", price: "6.67", priceCurrency: "EUR", name: "Pro" },
    ],
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bylz",
    url: "https://bylz.fr",
    logo: "https://bylz.fr/og-image.png",
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
    <div className="min-h-screen bg-[#070913] text-slate-100 selection:bg-blue-600/30 selection:text-blue-300 relative overflow-x-hidden font-sans">
      <SEO
        title="Bylz — Facturation Factur-X & Pilotage Fiscal | Auto-Entrepreneurs"
        description="Créez des factures conformes 2026 (Factur-X), suivez votre CA et anticipez vos cotisations URSSAF & impôts en 2 min/jour. Essai gratuit sans carte bancaire."
        canonical="/"
        jsonLd={[softwareSchema, organizationSchema, faqSchema]}
      />

      {/* Ambient background glow layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-600/15 via-indigo-600/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[1600px] left-1/4 w-[600px] h-[500px] bg-blue-500/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-[800px] right-1/4 w-[700px] h-[500px] bg-indigo-500/10 blur-[140px] rounded-full" />
      </div>

      <MarketingNavbar />

      <main className="relative z-10">
        {/* ========================================================= */}
        {/* 1. HERO SECTION (Aéré, centré et vendeur) */}
        {/* ========================================================= */}
        <section className="pt-32 pb-20 md:pt-44 md:pb-28 text-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-7">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-400 text-xs font-semibold backdrop-blur-md shadow-lg shadow-blue-950/40">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Prêt pour la Réforme Facturation Électronique 2026</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
              Vos factures. Votre{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
                fiscalité
              </span>
              . Tout en un.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
              La plateforme de facturation française conçue spécialement pour les indépendants et TPE. Simplifiez vos devis, anticipez vos cotisations URSSAF et pilotez votre activité en toute sérénité.
            </p>

            {/* Actions / CTA Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto text-base py-4 px-8 font-extrabold rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02]"
                  >
                    <span>🚀 Accéder à mon Tableau de bord</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link to="/essai" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto text-base py-4 px-8 font-extrabold rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02]"
                  >
                    <span>Commencer gratuitement</span>
                  </Button>
                </Link>
              )}
              <a
                href="#demo"
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-semibold text-sm border border-slate-800 transition-all"
              >
                Voir la démo
              </a>
            </div>

            {/* Trust highlights */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Factur-X & E-Reporting DGFiP
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400" /> Essai gratuit sans CB
              </span>
              <span className="flex items-center gap-1.5">
                🔒 Données 100% hébergées en France
              </span>
            </div>

            {/* Hero Mockup Preview (Clean Browser Window from Figma) */}
            <div className="pt-8">
              <div className="max-w-4xl mx-auto rounded-2xl bg-[#0b101d]/90 border border-slate-800/90 shadow-2xl shadow-blue-950/40 overflow-hidden backdrop-blur-xl text-left">
                {/* Browser Top Chrome */}
                <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-[#080d19]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <div className="px-4 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 font-mono">
                    app.bylz.fr/tableau-de-bord
                  </div>
                  <div className="w-12" />
                </div>

                {/* Dashboard Body Mockup */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Chiffre d'affaires (Q1)
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-blue-400 font-mono mt-1">
                        14,250.00 €
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Cotisations estimées
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                        3,135.00 €
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-300">Prévisionnel URSSAF</span>
                        <span className="font-semibold text-emerald-400">Taux 22%</span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-400">Reste à payer</span>
                        <span className="font-bold text-white font-mono">1,240.00 €</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-[65%]" />
                      </div>
                      <p className="text-[10px] text-slate-400">Échéance mensuelle le 30/11</p>
                    </div>
                  </div>

                  {/* Last Invoices Table */}
                  <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Dernières Factures
                    </h4>
                    <div className="divide-y divide-slate-800/60 text-xs">
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-white">Alan SAS</p>
                          <p className="text-[11px] text-slate-400 font-mono">FAC-2024-0012</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-white">3,200.00 €</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Payée
                          </span>
                        </div>
                      </div>
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-white">Pennylane SAS</p>
                          <p className="text-[11px] text-slate-400 font-mono">FAC-2024-0011</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-white">1,500.00 €</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            En attente
                          </span>
                        </div>
                      </div>
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-white">Swile SA</p>
                          <p className="text-[11px] text-slate-400 font-mono">FAC-2024-0010</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-white">4,800.00 €</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Payée
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. SECTION BYLZ COPILOT IA (Un cerveau IA pour piloter)   */}
        {/* ========================================================= */}
        <section className="py-24 border-t border-slate-800/80 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
              {/* Left Column: Heading + 4 Stacked Interactive Feature Items */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-black tracking-wider text-blue-400 uppercase">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>BYLZ COPILOT IA</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Un cerveau IA pour piloter votre activité
                </h2>

                <p className="text-slate-400 text-base leading-relaxed font-normal">
                  Bylz analyse en temps réel vos flux de facturation, échéances fiscales et historiques pour générer de la visibilité et vous suggérer les meilleures décisions.
                </p>

                {/* 4 Interactive Feature Selector Cards */}
                <div className="space-y-3 pt-2">
                  {aiFeatures.map((feat, idx) => {
                    const isSelected = activeAiTab === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveAiTab(idx)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#0d1424] border-blue-500/50 shadow-lg shadow-blue-950/30"
                            : "bg-slate-900/40 border-slate-800/70 hover:border-slate-700 hover:bg-slate-900/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-slate-400">
                              {feat.id}
                            </span>
                            <h3 className="font-bold text-sm sm:text-base text-white">
                              {feat.title}
                            </h3>
                          </div>
                          {feat.tag && (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${feat.tagColor}`}>
                              {feat.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2 font-normal leading-relaxed pl-7">
                          {feat.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: AI Mockup with Curve Chart & Live Alerts */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl bg-[#0b101e] border border-slate-800/90 shadow-2xl shadow-blue-950/30 overflow-hidden backdrop-blur-xl">
                  {/* Mockup Header */}
                  <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between bg-[#080d19] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 text-slate-400 font-mono text-[11px]">
                        bylz.app/dashboard/intelligence
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Bylz Copilot Connecté</span>
                    </div>
                  </div>

                  {/* Mockup Inner Body */}
                  <div className="p-6 space-y-6">
                    {/* Forecasting Chart Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400 font-medium">
                          Trésorerie Prévisionnelle (Avril)
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                          +12 400 €{" "}
                          <span className="text-xs font-bold text-emerald-400 font-sans">
                            (+18.4% vs mars)
                          </span>
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900 border border-slate-800 text-slate-300">
                        Vue 30 jours
                      </span>
                    </div>

                    {/* Smooth SVG Curve Chart */}
                    <div className="relative h-32 w-full pt-2">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Area */}
                        <path
                          d="M 0,80 Q 80,60 160,65 T 280,35 T 400,20 L 400,100 L 0,100 Z"
                          fill="url(#chartGradient)"
                        />
                        {/* Line */}
                        <path
                          d="M 0,80 Q 80,60 160,65 T 280,35 T 400,20"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        {/* Active Point */}
                        <circle cx="330" cy="27" r="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
                      </svg>
                    </div>

                    {/* Stat Badges Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300">Cotisation URSSAF</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Échéance le 30
                          </span>
                        </div>
                        <p className="text-lg font-black text-white font-mono">2 430 € estimés</p>
                        <p className="text-[10px] text-slate-400">Calculé sur vos encaissements réels</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300">Retards de Paiement</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            2 En retard
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-black text-white font-mono">4 150 €</p>
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-600 text-white cursor-pointer hover:bg-blue-500 transition-colors">
                            Relancer
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">Acme Corp & Pixel Studio</p>
                      </div>
                    </div>

                    {/* Smart Suggestion Banner */}
                    <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-bold text-blue-300">Conseil Optimisation Bylz</p>
                        <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                          Vos charges actuelles justifient un passage imminent au régime réel. Simuler le gain fiscal (approx. +1 200 € / an).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. KEY FEATURES ("Pilotez votre activité sans maux de tête") */}
        {/* ========================================================= */}
        <section className="py-24 border-t border-slate-800/80 bg-[#060811]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>Fonctionnalités Clés</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Pilotez votre activité sans maux de tête
              </h2>
              <p className="text-slate-400 text-base sm:text-lg font-normal leading-relaxed">
                Plus qu'un simple outil de facturation, un véritable assistant de gestion pour optimiser votre trésorerie au quotidien.
              </p>
            </div>

            {/* 3 Large Clean Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="p-8 rounded-2xl bg-[#0b101e]/80 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 space-y-5 shadow-xl hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Personnalisation Facture & Devis CFE
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-normal">
                  Créez des documents professionnels à votre image en quelques secondes. Personnalisez les couleurs, le logo et les conditions de règlement en toute simplicité.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-8 rounded-2xl bg-[#0b101e]/80 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 space-y-5 shadow-xl hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Pilotage Réel & Cotisations URSSAF
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-normal">
                  Sachez exactement combien vous devez mettre de côté chaque mois. Notre algorithme calcule vos cotisations sociales en fonction de votre statut (Auto-entrepreneur, SASU).
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-8 rounded-2xl bg-[#0b101e]/80 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 space-y-5 shadow-xl hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Assistant IA WhatsApp & Synchro
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-normal">
                  Générez des factures en dictant un simple message vocal sur WhatsApp. Bylz s'occupe de la mise en forme et de la synchro bancaire en temps réel.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. LIVE INTERACTIVE DEMO (Testez la création en 1 clic)   */}
        {/* ========================================================= */}
        <section id="demo" className="py-24 border-t border-slate-800/80 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
              {/* Left Column: Demo Explanation */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Démo Interactive</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Testez la création de facture en 1 clic en direct
                </h2>

                <p className="text-slate-400 text-base leading-relaxed font-normal">
                  Pas besoin de créer un compte pour voir la magie opérer. Modifiez la description de la prestation ou changez le montant de la prestation directement sur la droite pour générer instantanément votre facture certifiée Factur-X.
                </p>

                {/* Bullets with shields */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Génération Factur-X instantanée</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Prête pour le dépôt sur le portail public de facturation.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Estimation Urssaf automatique</h4>
                      <p className="text-xs text-slate-400 mt-0.5">La part de vos cotisations calculée au centime près.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Interactive Invoice Editor Box */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl bg-[#0b101e] border border-slate-800/90 p-6 sm:p-8 space-y-6 shadow-2xl shadow-blue-950/40">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <h3 className="font-bold text-base text-white">Éditeur de facture</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                      Factur-X
                    </span>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5">
                        Description de la prestation
                      </label>
                      <input
                        type="text"
                        value={demoDescription}
                        onChange={(e) => setDemoDescription(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-medium focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1.5">
                          Tarif Journalier (TJM)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={demoTjm}
                            onChange={(e) => setDemoTjm(Number(e.target.value) || 0)}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono font-bold focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-[11px]">
                            €/j
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1.5">
                          Jours travaillés
                        </label>
                        <input
                          type="number"
                          value={demoDays}
                          onChange={(e) => setDemoDays(Number(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono font-bold focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculations Preview */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Montant H.T. ({demoDays} jours)</span>
                      <span className="font-mono font-bold text-white">
                        {demoMontantHt.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>TVA (20%)</span>
                      <span className="font-mono font-bold text-white">
                        {demoTva.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-white">Total TTC</span>
                      <span className="font-mono text-lg font-black text-blue-400">
                        {demoTotalTtc.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                      </span>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <Link to="/essai" className="block w-full">
                    <Button
                      variant="primary"
                      className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 justify-center"
                    >
                      <span>Télécharger le PDF certifié</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. PRICING SECTION ("Des tarifs simples, transparents")  */}
        {/* ========================================================= */}
        <section id="tarifs" className="py-28 border-t border-slate-800/80 bg-[#060811]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>Tarifs Simplifiés</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Des tarifs simples, transparents et sans surprise
              </h2>
              <p className="text-slate-400 text-base sm:text-lg font-normal leading-relaxed">
                Commencez gratuitement. Évoluez quand votre activité grandit. Résiliable ou modifiable à tout moment, sans engagement.
              </p>

              {/* Annual / Monthly Toggle */}
              <div className="pt-2 flex justify-center">
                <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />
              </div>
            </div>

            {/* 3 Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {/* Card 1: Gratuit */}
              <div className="p-8 rounded-2xl bg-[#0b101e] border border-slate-800 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">Gratuit</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white font-mono">0€</span>
                    <span className="text-xs text-slate-400">/mois</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pour tester et lancer votre activité en toute sérénité.
                  </p>
                  <hr className="border-slate-800" />
                  <ul className="space-y-3 text-xs text-slate-300 font-medium">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Jusqu'à 3 factures / mois</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Modèles de base</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Export PDF standard</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Calcul prévisionnel URSSAF</span>
                    </li>
                  </ul>
                </div>
                <Link to="/signup?plan=starter" className="block w-full pt-4">
                  <button className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs transition-colors">
                    Commencer gratuitement
                  </button>
                </Link>
              </div>

              {/* Card 2: Solo / Pro (Highlight & Recommandé) */}
              <div className="relative p-8 rounded-2xl bg-[#0e162b] border-2 border-blue-500 shadow-2xl shadow-blue-500/20 flex flex-col justify-between space-y-6 scale-[1.02]">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                  RECOMMANDÉ
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Solo</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-blue-400 font-mono">
                      {billingCycle === "annual" ? "4,17€" : "8,90€"}
                    </span>
                    <span className="text-xs text-slate-400">/mois</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Le plan parfait pour les freelances et indépendants actifs.
                  </p>
                  <hr className="border-slate-800" />
                  <ul className="space-y-3 text-xs text-slate-200 font-medium">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>Factures & Devis illimités</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>Personnalisation avancée</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>Génération Factur-X certifiée</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>Support prioritaire 7j/7</span>
                    </li>
                  </ul>
                </div>
                <Link to={`/signup?plan=solo&billing=${billingCycle}`} className="block w-full pt-4">
                  <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all">
                    Choisir ce forfait
                  </button>
                </Link>
              </div>

              {/* Card 3: Pro / Business */}
              <div className="p-8 rounded-2xl bg-[#0b101e] border border-slate-800 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">Pro</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white font-mono">
                      {billingCycle === "annual" ? "6,67€" : "12,90€"}
                    </span>
                    <span className="text-xs text-slate-400">/mois</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pour les petites entreprises et structures en forte croissance.
                  </p>
                  <hr className="border-slate-800" />
                  <ul className="space-y-3 text-xs text-slate-300 font-medium">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Tout le plan Solo inclus</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Intégration WhatsApp IA</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Accès expert-comptable</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Synchronisation bancaire</span>
                    </li>
                  </ul>
                </div>
                <Link to={`/signup?plan=pro&billing=${billingCycle}`} className="block w-full pt-4">
                  <button className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs transition-colors">
                    Choisir ce forfait
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. FAQ SECTION (Accordion design)                         */}
        {/* ========================================================= */}
        <section id="faq" className="py-24 border-t border-slate-800/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Foire aux Questions (FAQ)
              </h2>
              <p className="text-sm sm:text-base text-slate-400 font-medium">
                Tout ce que vous devez savoir pour démarrer sereinement sur Bylz.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#0b101e] border border-slate-800 hover:border-slate-700 overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-bold text-white text-base hover:text-blue-400 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-blue-400" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 pt-2 text-sm text-slate-400 leading-relaxed font-normal border-t border-slate-800/60">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* TRUST BADGES ROW (Avis clients & Certifications)          */}
        {/* ========================================================= */}
        <section className="py-12 border-t border-slate-800/80 bg-[#060811]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TrustBadgesRow />
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. FINAL CALL TO ACTION (Airy, centered, high converting) */}
        {/* ========================================================= */}
        <section className="py-28 text-center relative overflow-hidden border-t border-slate-800/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Prêt à simplifier votre vie d'entrepreneur ?
            </h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
              Rejoignez des milliers de professionnels français qui récoltent le fruit de leur travail sans s'encombrer de la paperasse.
            </p>
            <div className="pt-4">
              <Link to="/essai">
                <button className="px-9 py-4 text-base font-extrabold rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.03]">
                  Créer mon compte gratuitement
                </button>
              </Link>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Essai gratuit de 14 jours, sans carte bancaire
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
