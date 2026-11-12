import { useState, useEffect } from "react";
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
  Check,
  ArrowRight,
  Zap,
  Code,
  Palette,
  Briefcase,
  Wrench,
  GraduationCap,
  ShoppingBag,
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
import { trackScrollDepth, trackCtaClick } from "../lib/analytics";

export function LandingPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const forcePublic = searchParams.get("public") === "true";

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");

  useEffect(() => {
    const fired = { 25: false, 50: false, 75: false, 100: false };

    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrollPercent = (window.scrollY / docHeight) * 100;

      if (!fired[25] && scrollPercent >= 25) {
        fired[25] = true;
        trackScrollDepth(25);
      }
      if (!fired[50] && scrollPercent >= 50) {
        fired[50] = true;
        trackScrollDepth(50);
      }
      if (!fired[75] && scrollPercent >= 75) {
        fired[75] = true;
        trackScrollDepth(75);
      }
      if (!fired[100] && scrollPercent >= 99) {
        fired[100] = true;
        trackScrollDepth(100);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

                {/* Titre percutant H1 */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                  Vos factures en 3 clics,{" "}
                  <span className="text-blue-700">même si vous venez de vous lancer</span>
                </h1>

                {/* Sous-titre court en mots simples */}
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-xl">
                  Créez vos devis et factures conformes, suivez vos paiements et estimez vos cotisations sans prise de tête.
                </p>

                {/* 3 Promesses concrètes */}
                <ul className="space-y-2.5 pt-1 text-slate-800 text-sm sm:text-base font-medium">
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span>Factures conformes avec mentions légales automatiques</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span>Calcul automatique de vos cotisations URSSAF et de votre net</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span>Suivi en direct du seuil de TVA sans calculatrice</span>
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
                      <Link to="/signup" onClick={() => trackCtaClick("hero")} className="w-full sm:w-auto">
                        <button className={`${btnPrimary} py-3.5 px-8 text-base w-full sm:w-auto`}>
                          Créer mon compte gratuit
                        </button>
                      </Link>
                      <Link to="/essai" onClick={() => trackCtaClick("hero")} className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-base font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                          Voir Bylz en 30 secondes
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
                <span>Registre des encaissements exportable en CSV</span>
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
                Fini les heures passées sur les tableurs : devis transformés en factures en 1 clic, cotisations estimées en direct et registre des encaissements exportable.
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
        {/* 5. QUEL QUE SOIT VOTRE STATUT, BYLZ S'ADAPTE             */}
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

                <Link to="/signup?plan=starter" onClick={() => trackCtaClick("tarifs")} className="block w-full pt-2">
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

                <Link to={`/signup?plan=solo&billing=${billingCycle}`} onClick={() => trackCtaClick("tarifs")} className="block w-full pt-2">
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

                <Link to={`/signup?plan=pro&billing=${billingCycle}`} onClick={() => trackCtaClick("tarifs")} className="block w-full pt-2">
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
              <Link to="/signup" onClick={() => trackCtaClick("bas de page")} className={`${btnPrimary} py-3.5 px-8 text-sm`}>
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