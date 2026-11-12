import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  FileText,
  Calculator,
  TrendingUp,
  Lock,
  Building2,
  FileCheck,
  Receipt,
  Layers, BellRing,
  Check,
  ArrowRight,
  Zap,
  Code,
  Palette,
  Briefcase,
  Wrench,
  GraduationCap,
  ShoppingBag,
  X,
  Clock,
  MessageSquare,
  Bot,
  Sparkles,
} from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { SEO_METADATA } from "../lib/seoMeta";
import { PLANS_DATA } from "../lib/plansData";
import { FAQS_LIST } from "../data/faqData";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { BillingToggle } from "../components/shared/BillingToggle";
import { type BillingCycle } from "../lib/constants";
import { useAuth } from "../contexts/AuthContext";

export function LandingPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const forcePublic = searchParams.get("public") === "true";

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");

  if (!loading && user && !forcePublic) {
    const isStarter = profile?.plan === "starter";
    const defaultPath = isStarter ? "/invoices" : "/dashboard";
    return <Navigate to={defaultPath} replace />;
  }

  const workflowSteps = [
    {
      num: "1",
      title: "Créez vos devis",
      desc: "Édition en 1 minute, prestations enregistrées et conversion en facture d'un simple clic dès l'accord client.",
    },
    {
      num: "2",
      title: "Facturez simplement",
      desc: "Factures Factur-X générées et validées, transmission via partenaire en cours d'activation.",
    },
    {
      num: "3",
      title: "Suivez vos encaissements",
      desc: "Statut des règlements en direct, relances types en 1 clic et synchronisation de trésorerie.",
    },
    {
      num: "4",
      title: "Déclarez l'URSSAF",
      desc: "Calcul au centime près selon votre taux officiel selon votre activité (vente, services ou libéral) et rappel automatique des échéances.",
    },
  ];

  const featuresList = [
    {
      title: "Factures & Devis avec mentions obligatoires",
      desc: "Personnalisation complète avec votre logo et couleurs. Toutes les mentions légales obligatoires sont insérées automatiquement.",
      icon: FileText,
    },
    {
      title: "Suivi de la Franchise de TVA",
      desc: "Jauge de progression en temps réel vers le plafond légal 2026 (37 500 € en services, 85 000 € en vente) pour anticiper le passage à la TVA sans mauvaise surprise.",
      icon: TrendingUp,
    },
    {
      title: "Calcul URSSAF & Abattement fiscal",
      desc: "Application automatique de l'abattement forfaitaire (34% en BNC, 50% en BIC) pour estimer précisément votre revenu net imposable.",
      icon: Calculator,
    },
    {
      title: "Livre chronologique des recettes",
      desc: "Livre chronologique des recettes, exportable en CSV pour vos déclarations.",
      icon: Layers,
    },
    {
      title: "Annuaire SIRET & Gestion clients",
      desc: "Remplissage instantané des informations de vos clients grâce à la connexion directe avec la base légale de l'INSEE.",
      icon: Building2,
    },
    {
      title: "Livre des recettes & Exports CSV",
      desc: "Suivez vos encaissements et exportez facilement vos données et votre livre des recettes au format CSV.",
      icon: Receipt,
    },
  ];

  const personas = [
    {
      role: "Développeurs & Tech",
      icon: Code,
      highlight: "Gestion au TJM",
      details: "Facturation mensuelle récurrente, calcul de la franchise TVA et exports comptables en direct.",
    },
    {
      role: "Designers & Créatifs",
      icon: Palette,
      highlight: "Devis & Factures",
      details: "Modèles de devis soignés, conversion en facture en un clic et suivi des règlements.",
    },
    {
      role: "Consultants & Coachs",
      icon: Briefcase,
      highlight: "Facturation B2B",
      details: "Mentions contractuelles spécifiques, délais de paiement 30/60 jours et suivi des relances.",
    },
    {
      role: "Artisans & BTP",
      icon: Wrench,
      highlight: "Mentions Légales",
      details: "Pied de page personnalisable pour vos mentions d'assurance et devis détaillés clairs.",
    },
    {
      role: "Formateurs & Enseignants",
      icon: GraduationCap,
      highlight: "Franchise en base",
      details: "Mention légale de TVA automatique, gestion des devis et ventilation des cotisations BNC.",
    },
    {
      role: "Vente & E-commerce",
      icon: ShoppingBag,
      highlight: "Régime Vente BIC",
      details: "Suivi des encaissements chronologique, registre des dépenses et calcul du taux spécifique de 12,3 %.",
    },
  ];

  const faqs = [
    {
      q: "Comment Bylz prépare la facturation électronique ?",
      a: "Factures Factur-X générées et validées, transmission via partenaire en cours d'activation.",
    },
    {
      q: "Puis-je utiliser Bylz gratuitement ?",
      a: "Absolument. Notre formule gratuite est permanente jusqu'à 3 factures par mois. Vous n'avez pas besoin de renseigner de carte bancaire pour démarrer.",
    },
    {
      q: "Comment fonctionne le calcul des cotisations URSSAF ?",
      a: "Bylz applique les barèmes officiels 2026 selon la nature de votre activité (services BNC, prestations BIC ou vente) pour calculer votre charge sociale réelle au centime près.",
    },
    {
      q: "Où sont hébergées mes données ?",
      a: "Votre base de données et vos factures sont hébergées en Europe chez Supabase (infrastructure AWS), avec sauvegardes quotidiennes.",
    },
    {
      q: "Puis-je importer mes anciennes factures ?",
      a: "Tout à fait. Bylz dispose d'un outil d'import qui analyse vos anciens fichiers PDF ou tableurs pour reconstituer votre historique sans repartir de zéro.",
    },
    {
      q: "Que se passe-t-il si je dépasse le seuil de franchise de TVA ?",
      a: "Une alerte vous prévient dès que vous approchez des seuils légaux 2026 (37 500 € en services, 85 000 € en vente). L'application vous guide ensuite pour basculer facilement en facturation avec TVA sans risque de pénalité fiscale.",
    },
    {
      q: "Y a-t-il un engagement de durée ?",
      a: "Aucun. Toutes nos offres payantes sont sans engagement. Vous pouvez changer de formule ou résilier à tout moment d'un simple clic depuis vos paramètres.",
    },
    {
      q: "Mes factures sont-elles valables en cas de contrôle fiscal ?",
      a: "Oui. Bylz génère des pièces avec numérotation chronologique séquentielle sans rupture et tient votre livre chronologique des recettes.",
    },
  ];

  // Primary Button unified styling class
  const btnPrimary =
    "inline-flex items-center justify-center font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors min-h-[44px]";

  // Schemas JSON-LD
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Bylz",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Logiciel de facturation PDF et de gestion des cotisations URSSAF pour auto-entrepreneurs et micro-entreprises.",
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "0.00",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        priceValidUntil: "2026-12-31",
        url: "https://bylz.fr/tarifs",
      },
      {
        "@type": "Offer",
        name: "Solo",
        price: billingCycle === "annual" ? "4.17" : "8.90",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        priceValidUntil: "2026-12-31",
        url: "https://bylz.fr/tarifs",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: billingCycle === "annual" ? "6.67" : "12.90",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        priceValidUntil: "2026-12-31",
        url: "https://bylz.fr/tarifs",
      },
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
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 relative overflow-x-hidden font-sans">
      <SEO
        title={SEO_METADATA["/"].title}
        description={SEO_METADATA["/"].description}
        canonical={SEO_METADATA["/"].canonical}
        jsonLd={[softwareSchema, organizationSchema, faqSchema]}
      />

      <MarketingNavbar theme="light" />

      <main className="relative z-10">
        {/* ========================================================= */}
        {/* 1. HERO SECTION                                           */}
        {/* ========================================================= */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column : Valeur, arguments et CTA */}
              <div className="lg:col-span-7 space-y-6 text-left">

                {/* Titre percutant H1 optimisé SEO */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                  Facturation & gestion pour les{" "}
                  <span className="text-blue-700">indépendants</span>.
                </h1>

                {/* 4 Promesses claires à cocher */}
                <ul className="space-y-3 pt-1 text-slate-800 text-sm sm:text-base font-medium">
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span>Factures PDF avec <strong>les mentions légales essentielles</strong></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span>Calcul automatique de vos <strong>cotisations URSSAF</strong> et abattement fiscal</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span>Suivi en direct du <strong>seuil de TVA</strong> (Franchise Art. 293 B du CGI)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span><strong>Assistant IA utilisable depuis WhatsApp</strong> <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 ml-1">Option Pro</span> pour dicter vos devis et facturer</span>
                  </li>
                </ul>

                {/* Boutons d'action */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  {user ? (
                    <Link to="/dashboard" className="w-full sm:w-auto">
                      <button className={`${btnPrimary} py-3.5 px-8 text-base w-full sm:w-auto`}>
                        Accéder à mon tableau de bord
                      </button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/signup" className="w-full sm:w-auto">
                        <button className={`${btnPrimary} py-3.5 px-8 text-base w-full sm:w-auto`}>
                          Créer mon compte gratuit
                        </button>
                      </Link>
                      <Link to="/tarifs" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-base font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                          Consulter les tarifs
                        </button>
                      </Link>
                    </>
                  )}
                </div>

                {/* Garanties objectives */}
                <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-700 font-semibold border-t border-slate-200">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Gratuit jusqu'à 3 factures/mois
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-700" /> Base de données hébergée en Europe
                  </span>
                </div>
              </div>

              {/* Right Column : Aperçu Visuel Produit Fidèle */}
              <div className="hidden lg:block lg:col-span-5">
                <div className="relative mx-auto max-w-lg lg:max-w-none">
                  {/* Carte Principale : Dashboard d'activité */}
                  <div className="rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-700 inline-block" />
                        <span className="font-bold text-xs text-slate-900">Bylz : Pilotage Micro-Entreprise</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300 uppercase tracking-wider">
                          Exemple
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                          Exercice 2026
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-4 text-left">
                      {/* Metric Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                          <p className="text-[11px] font-semibold text-slate-600">Chiffre d'affaires Q4</p>
                          <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">14 250,00 €</p>
                          <p className="text-[11px] text-emerald-700 font-semibold mt-1">+15% vs Q3</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                          <p className="text-[11px] font-semibold text-blue-900">Part URSSAF estimée</p>
                          <p className="text-xl font-bold text-blue-900 font-mono mt-0.5">3 648,00 €</p>
                          <p className="text-[11px] text-blue-800 font-semibold mt-1">Taux officiel 25,6 % (BNC SSI)</p>
                        </div>
                      </div>

                      {/* Jauge TVA */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">Seuil de Franchise TVA (Services)</span>
                          <span className="font-mono text-slate-700 text-xs font-semibold">31 400 / 37 500 €</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full w-[83.7%]" />
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Marge restante de 6 100 € avant assujettissement
                        </p>
                      </div>

                      {/* Assistant IA Copilot row avec mention WhatsApp */}
                      <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/70 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">Assistant IA Bylz</span>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                                WhatsApp & Web
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-700 font-medium">
                              « Facture envoyée et URSSAF calculé à 25,6 % »
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-800 whitespace-nowrap pl-2">
                          Sur WhatsApp
                        </span>
                      </div>

                      {/* Facture Factur-X prête */}
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                            PDF/A
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">FAC-2026-012</p>
                            <p className="text-[11px] text-slate-600 font-medium">Facture PDF</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100/70 text-emerald-800 border border-emerald-300">
                          Payée : 3 200 €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. BANDEAU DE RÉASSURANCE & LABELS LÉGAUX                  */}
        {/* ========================================================= */}
        <section className="py-6 bg-slate-100 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-bold text-slate-800">
              <div className="inline-flex items-center gap-2 min-h-[44px] py-2 px-1">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Mentions légales obligatoires conformes</span>
              </div>
              <div className="inline-flex items-center gap-2 min-h-[44px] py-2 px-1">
                <FileCheck className="w-4 h-4 text-blue-700" />
                <span>Livre chronologique des recettes, exportable en CSV</span>
              </div>
              <div className="inline-flex items-center gap-2 min-h-[44px] py-2 px-1">
                <Lock className="w-4 h-4 text-slate-700" />
                <span>Base de données hébergée en Europe</span>
              </div>
              <div className="inline-flex items-center gap-2 min-h-[44px] py-2 px-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Taux de cotisations 2026 à jour</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. WORKFLOW : DU DEVIS À L'URSSAF                         */}
        {/* ========================================================= */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Du devis à la déclaration URSSAF, tout est connecté
              </h2>
              <p className="text-slate-700 text-base sm:text-lg">
                Moins de double saisie, moins de calculs à la main pour votre gestion au quotidien.
              </p>
            </div>

            {/* 4 Colonnes horizontales numérotées */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {workflowSteps.map((step) => (
                <div
                  key={step.num}
                  className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-left hover:border-blue-400 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-bold text-sm flex items-center justify-center">
                    {step.num}
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{step.title}</h3>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <Link to="/signup" className={`${btnPrimary} py-3 px-6 text-sm`}>
                Créer mon compte gratuit
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. BANDEAU DE RUPTURE SOMBRE : RÉFORME 2026               */}
        {/* ========================================================= */}
        <section className="py-20 bg-[#011142] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Colonne gauche : Explications réforme */}
              <div className="lg:col-span-6 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 text-blue-200 text-xs font-bold border border-blue-400/40">
                  <ShieldCheck className="w-4 h-4 text-blue-300" />
                  <span>Obligation Légale 2026</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Factures Factur-X générées et validées, transmission via partenaire en cours d'activation
                </h2>
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                  Bylz génère des factures conformes Factur-X validées selon les schémas officiels. La transmission via notre plateforme partenaire est en cours d'activation pour la réforme. Bylz n'est pas une plateforme agréée.
                </p>
                <div className="pt-2">
                  <Link
                    to="/conformite"
                    className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 hover:text-white transition-colors min-h-[44px] py-2"
                  >
                    <span>Comprendre la réforme et les obligations de votre statut</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Colonne droite : 3 Cartes de conformité vérifiées */}
              <div className="lg:col-span-6 space-y-3">
                <div className="p-4 rounded-xl bg-white/10 border border-white/15 flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Facturation électronique Factur-X</h3>
                    <p className="text-xs text-slate-200 mt-0.5">
                      Factures Factur-X générées et validées, transmission via partenaire en cours d'activation.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/10 border border-white/15 flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Conformité fiscale & Mentions obligatoires</h3>
                    <p className="text-xs text-slate-200 mt-0.5">
                      Mentions légales indispensables générées automatiquement selon votre statut juridique.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/10 border border-white/15 flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Conservation de vos documents</h3>
                    <p className="text-xs text-slate-200 mt-0.5">
                      Stockage sécurisé sur une base de données chiffrée en Europe avec sauvegardes régulières.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. FONCTIONNALITÉS : TOUT CE DONT VOUS AVEZ BESOIN        */}
        {/* ========================================================= */}
        <section className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Titre ancré à gauche */}
              <div className="lg:col-span-4 space-y-4 text-left">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Tout ce dont vous avez besoin pour gérer votre activité
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Bylz regroupe les outils essentiels à la gestion d'un indépendant, sans fonctions superflues qui alourdissent votre quotidien.
                </p>
                <div className="pt-2 hidden lg:block">
                  <Link to="/signup">
                    <button className={`${btnPrimary} py-2.5 px-5 text-sm`}>
                      Créer mon compte gratuit
                    </button>
                  </Link>
                </div>
              </div>

              {/* Grille 2 colonnes de fonctionnalités détaillées à droite */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {featuresList.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={i}
                      className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5 text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-base text-slate-900">{f.title}</h3>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. COMPARATIF & IMPACT : BYLZ VS TABLEURS (STYLE ABBY / INDY) */}
        {/* ========================================================= */}
        <section id="comparatif" className="py-20 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Titre de section */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>Pourquoi quitter les tableurs traditionnels</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Fini les dimanches soirs passés sur vos factures
              </h2>
              <p className="text-slate-700 text-base sm:text-lg">
                La gestion d'une micro-entreprise ne devrait pas être une source de stress fiscal.
                Découvrez ce qui change concrètement au quotidien.
              </p>
            </div>

            {/* 3 Métriques d'impact (Inspiré Abby & Indy) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5 text-blue-700" />
                </div>
                <p className="text-xl font-black text-slate-900 tracking-tight">Moins de saisie</p>
                <p className="text-xs font-bold text-slate-800">Moins de calculs à la main</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Devis transformés en factures en un clic, relances automatiques et synchronisation de vos justificatifs.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5 text-emerald-700" />
                </div>
                <p className="text-xl font-black text-slate-900 tracking-tight">Zéro surprise</p>
                <p className="text-xs font-bold text-slate-800">Sur vos cotisations URSSAF & TVA</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Vos charges sociales sont estimées dès l'encaissement avec alertes de seuils en direct.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <FileCheck className="w-5 h-5 text-blue-700" />
                </div>
                <p className="text-xl font-black text-slate-900 tracking-tight">Facturation claire</p>
                <p className="text-xs font-bold text-slate-800">Mentions légales obligatoires incluses</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Génération de factures PDF propres avec les mentions indispensables (EI, franchise TVA, pénalités).
                </p>
              </div>
            </div>

            {/* Tableau comparatif côte à côte : Tableur vs Bylz (Inspiré Indy) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* Colonne Tableurs / Ancienne méthode */}
              <div className="p-7 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 text-left flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Méthode traditionnelle
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-1">Excel, Word ou papier</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                      Dépassé en 2026
                    </span>
                  </div>

                  <ul className="space-y-4 text-xs sm:text-sm text-slate-700">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>
                        <strong className="text-slate-900 font-semibold">Format non structuré :</strong> les PDF simples et tableurs ne respectent pas les exigences attendues pour la facturation électronique.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>
                        <strong className="text-slate-900 font-semibold">Calculs URSSAF manuels :</strong> formules complexes à ajuster soi-même selon les taux révisés chaque année.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>
                        <strong className="text-slate-900 font-semibold">Aucun suivi des seuils de TVA :</strong> risque d'assujettissement imprévu et de rattrapage fiscal en cas de dépassement.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>
                        <strong className="text-slate-900 font-semibold">Livre des recettes fastidieux :</strong> obligation légale de tenir un registre chronologique des encaissements, pénible à la main.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>
                        <strong className="text-slate-900 font-semibold">Heures perdues :</strong> double saisie des devis, factures et exports récapitulatifs pour la déclaration.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Colonne Bylz / Moderne */}
              <div className="p-7 sm:p-8 rounded-2xl bg-blue-50/50 border-2 border-blue-600 text-left flex flex-col justify-between shadow-lg relative">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-blue-200">
                    <div>
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Gestion moderne
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-1">Avec Bylz</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                      Recommandé
                    </span>
                  </div>

                  <ul className="space-y-4 text-xs sm:text-sm text-slate-800">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>
                        <strong className="text-slate-900 font-semibold">Facturation instantanée :</strong>{" "}
                        Factures Factur-X générées et validées, transmission via partenaire en cours d'activation.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>
                        <strong className="text-slate-900 font-semibold">Cotisations calculées en direct :</strong>{" "}
                        barèmes officiels 2026 appliqués automatiquement selon votre catégorie d'activité.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>
                        <strong className="text-slate-900 font-semibold">Jauge de TVA & alertes proactives :</strong>{" "}
                        suivi en temps réel de votre progression vers le seuil de franchise (Art. 293 B).
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>
                        <strong className="text-slate-900 font-semibold">Livre des recettes :</strong>{" "}
                        tient votre livre chronologique des recettes, exportable en CSV.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>
                        <strong className="text-slate-900 font-semibold">Simplicité en 1 clic :</strong> conversion de devis, numérotation séquentielle automatique et export PDF immédiat.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-blue-200">
                  <Link to="/signup" className={`${btnPrimary} w-full py-3.5 text-sm`}>
                    Créer mon compte gratuit
                  </Link>
                  <p className="text-[11px] text-center text-slate-600 font-medium mt-2">
                    Gratuit jusqu'à 3 factures/mois : Sans carte bancaire : Sans engagement
                  </p>
                </div>
              </div>
            </div>

            {/* Encart Assistance & Support humain (Inspiré Abby & Indy) */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-blue-700" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    Un doute sur vos cotisations ou vos factures ?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 max-w-2xl leading-relaxed">
                    Une question ? Écrivez-nous, nous répondons du lundi au vendredi.
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 w-full md:w-auto">
                <Link to="/contact" className="inline-flex items-center justify-center min-h-[44px] w-full md:w-auto px-5 py-2.5 rounded-lg border-2 border-blue-600 text-blue-700 hover:bg-blue-50 font-bold text-xs transition-colors">
                  Poser une question
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. QUEL QUE SOIT VOTRE STATUT, BYLZ S'ADAPTE             */}
        {/* ========================================================= */}
        <section className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Quel que soit votre statut, Bylz s'adapte
              </h2>
              <p className="text-slate-700 text-sm sm:text-base">
                Chaque métier indépendant possède ses propres contraintes juridiques et fiscales. Bylz applique les règles adaptées à votre activité.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {personas.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div
                    key={i}
                    className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                        {p.highlight}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900">{p.role}</h3>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">{p.details}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 8. GRILLE TARIFAIRE (3 Offres Réelles : Starter, Solo, Pro) */}
        {/* ========================================================= */}
        <section id="tarifs" className="py-24 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                Des tarifs simples et transparents
              </h2>
              <p className="text-slate-700 text-base sm:text-lg">
                Démarrez sans carte bancaire sur le plan gratuit permanent. Évoluez quand votre activité grandit. Résiliable à tout moment.
              </p>

              <div className="pt-2 flex justify-center">
                <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />
              </div>
            </div>

            {/* 3 Colonnes Tarifaires Réelles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
              {/* 1. Starter (Gratuit) */}
              <div className="p-7 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-6 text-left shadow-sm">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Starter</h3>
                    
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 font-mono">0 €</span>
                    <span className="text-xs text-slate-600 font-medium">/mois</span>
                  </div>
                  

                  <hr className="border-slate-100" />

                  <ul className="space-y-3 text-xs text-slate-800 font-medium">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Jusqu'à 3 factures par mois</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Jusqu'à 3 clients actifs</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Export PDF avec mentions légales essentielles</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Recherche SIRET automatique client</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Sans engagement, sans carte bancaire</span>
                    </li>
                  </ul>
                </div>

                <Link to="/signup?plan=starter" className="block w-full pt-2">
                  <button className={`${btnPrimary} w-full py-3`}>
                    Créer mon compte gratuit
                  </button>
                </Link>
              </div>

              {/* 2. Solo (Formule Recommandée) */}
              <div className="p-7 rounded-2xl bg-blue-50/50 border-2 border-blue-600 flex flex-col justify-between space-y-6 text-left relative shadow-md">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <span>★ {PLANS_DATA.solo.badge}</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Solo</h3>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">
                      Facturation illimitée et pilotage fiscal complet
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-blue-700 font-mono">
                        {billingCycle === "annual" ? "50 €" : "8,90 €"}
                      </span>
                      <span className="text-xs text-slate-700 font-medium">/ {billingCycle === "annual" ? "an" : "mois"}</span>
                    </div>
                    {billingCycle === "annual" ? (
                      <p className="text-xs font-bold text-emerald-700 mt-1">
                        (soit {PLANS_DATA.solo.pricing.annualMonthlyEquivFormatted} / mois • {PLANS_DATA.solo.pricing.annualSavingsFormatted} d'économie)
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-600 mt-1">
                        Facturé 8,90 € / mois sans engagement
                      </p>
                    )}
                  </div>

                  <hr className="border-blue-200" />

                  <ul className="space-y-3 text-xs text-slate-900 font-medium">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span><strong>Factures & Devis illimités</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Clients et catalogue illimités</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Tableau de bord fiscal & seuils de TVA en temps réel</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Calcul des cotisations URSSAF</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Livre des recettes chronologique & export CSV</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Relances automatiques des impayés par e-mail</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Réponse sous 24 h ouvrées, du lundi au vendredi</span>
                    </li>
                  </ul>
                </div>

                <Link to={`/signup?plan=solo&billing=${billingCycle}`} className="block w-full pt-2">
                  <button className={`${btnPrimary} w-full py-3.5 text-base`}>
                    Choisir Solo
                  </button>
                </Link>
              </div>

              {/* 3. Pro */}
              <div className="p-7 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-6 text-left shadow-sm">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900">Pro</h3>
                      {billingCycle === "annual" && (
                        <span className="bg-blue-50 text-blue-700 font-bold text-[11px] px-2 py-0.5 rounded-full border border-blue-200">
                          -48%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Paiement en ligne par carte et pilotage multi-entreprises
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-900 font-mono">
                        {billingCycle === "annual" ? "80 €" : "12,90 €"}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">/ {billingCycle === "annual" ? "an" : "mois"}</span>
                    </div>
                    {billingCycle === "annual" ? (
                      <p className="text-xs font-bold text-emerald-700 mt-1">
                        (soit {PLANS_DATA.pro.pricing.annualMonthlyEquivFormatted} / mois • {PLANS_DATA.pro.pricing.annualSavingsFormatted} d'économie)
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-600 mt-1">
                        Facturé 12,90 € / mois sans engagement
                      </p>
                    )}
                  </div>

                  <hr className="border-slate-100" />

                  <ul className="space-y-3 text-xs text-slate-800 font-medium">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span><strong>Toutes les fonctionnalités Solo incluses</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Paiement en ligne par carte (Stripe Connect)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Gestion multi-entreprises (plusieurs SIRET)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Assistant IA de facturation & WhatsApp</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Réponse sous 24 h ouvrées, du lundi au vendredi</span>
                    </li>
                  </ul>
                </div>

                <Link to={`/signup?plan=pro&billing=${billingCycle}`} className="block w-full pt-2">
                  <button className={`${btnPrimary} w-full py-3`}>
                    Choisir Pro
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 9. FAQ EN 2 COLONNES                                      */}
        {/* ========================================================= */}
        <section id="faq" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Foire aux Questions
              </h2>
              <p className="text-sm sm:text-base text-slate-700">
                Tout ce que vous devez savoir pour démarrer sereinement sur Bylz.
              </p>
            </div>

            {/* 2 Colonnes de FAQ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm"
                  >
                    <button
                      type="button"
                      id={`faq-question-${idx}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${idx}`}
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full text-left px-5 py-4 min-h-[44px] flex items-center justify-between gap-3 font-bold text-slate-900 text-sm hover:text-blue-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded-lg"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-700 flex-shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-blue-700" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div
                        id={`faq-answer-${idx}`}
                        role="region"
                        aria-labelledby={`faq-question-${idx}`}
                        className="px-5 pb-5 pt-1 text-xs text-slate-700 leading-relaxed font-normal border-t border-slate-100"
                      >
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
        {/* 10. BANNIÈRE FINALE CTA                                   */}
        {/* ========================================================= */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto rounded-3xl bg-[#011142] text-white p-10 sm:p-14 text-center space-y-6 shadow-xl border border-blue-900/40">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Prêt à simplifier votre activité ?
            </h2>
            <p className="text-slate-200 text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-medium">
              Créez votre première facture PDF en 2 minutes. Sans carte bancaire et sans engagement.
            </p>
            <div className="pt-2">
              <Link to="/signup" className={`${btnPrimary} py-3.5 px-8 text-sm`}>
                Créer mon compte gratuit
              </Link>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Gratuit pour toujours jusqu'à 3 factures/mois
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}