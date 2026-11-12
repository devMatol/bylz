import { useState, useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  FileCheck,
  Check,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Calculator,
  Bell,
  Search,
  Download,
} from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { SEO_METADATA } from "../lib/seoMeta";
import { PLANS_DATA } from "../lib/plansData";
import { isWhatsAppStarterEnabled } from "../lib/planLimits";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && !forcePublic) {
    const isStarter = !profile?.plan || profile.plan === "starter";
    const defaultPath = isStarter ? "/invoices" : "/dashboard";
    return <Navigate to={defaultPath} replace />;
  }

  const threeSteps = [
    {
      num: "1",
      title: "Créez votre devis ou facture",
      desc: "Saisissez votre client et vos prestations en quelques secondes. Toutes les mentions obligatoires s'appliquent automatiquement.",
    },
    {
      num: "2",
      title: "Envoyez et encaissez en direct",
      desc: "Téléchargez le PDF officiel ou partagez un lien direct pour vous faire payer rapidement par virement ou carte.",
    },
    {
      num: "3",
      title: "Suivez vos cotisations URSSAF",
      desc: "Vos cotisations et votre revenu net disponible se calculent automatiquement à chaque encaissement sans calculatrice.",
    },
  ];

  const keyFeatures = [
    {
      title: "Factures & Devis conformes",
      desc: "Format Factur-X officiel avec mentions obligatoires adaptées à votre activité.",
      icon: FileCheck,
    },
    {
      title: "Calcul des cotisations URSSAF",
      desc: "Estimation automatique de vos cotisations sociales et de votre revenu net réel.",
      icon: Calculator,
    },
    {
      title: "Suivi du seuil de TVA",
      desc: "Jauge visuelle de franchise en base pour anticiper le dépassement en toute sérénité.",
      icon: ShieldCheck,
    },
    {
      title: "Relances d'impayés automatiques",
      desc: "Suivez les échéances en un coup d'œil et déclenchez des rappels cordiaux en un clic.",
      icon: Bell,
    },
    {
      title: "Recherche SIRET automatique",
      desc: "Remplissage instantané des coordonnées de vos clients professionnels depuis la base officielle.",
      icon: Search,
    },
    {
      title: "Registre des encaissements & export",
      desc: "Historique chronologique complet exportable en CSV pour faciliter vos déclarations.",
      icon: Download,
    },
  ];

  const faqs = [
    {
      q: "Comment Bylz prépare la facturation électronique ?",
      a: "Factures Factur-X générées et validées, transmission via partenaire en cours d'activation.",
    },
    {
      q: "Puis-je utiliser Bylz gratuitement ?",
      a: "Absolument. Notre formule gratuite Starter est permanente jusqu'à 3 factures par mois. Vous n'avez pas besoin de renseigner de carte bancaire pour démarrer.",
    },
    {
      q: "Comment fonctionne l'assistant WhatsApp ?",
      a: isWhatsAppStarterEnabled()
        ? "Vous pouvez dicter ou écrire un message pour créer un brouillon de facture en direct. L'offre gratuite Starter inclut jusqu'à 3 factures créées par WhatsApp par mois, et le Plan Pro offre un usage illimité."
        : "Vous pouvez dicter ou écrire un message pour créer un brouillon de facture en direct. Cette fonctionnalité est disponible avec le Plan Pro pour piloter l'ensemble de votre facturation à la voix.",
    },
    {
      q: "Comment fonctionne le calcul des cotisations URSSAF ?",
      a: "Bylz applique les barèmes officiels 2026 selon la nature de votre activité (services BNC, prestations BIC ou vente) pour calculer votre charge sociale réelle au centime près.",
    },
    {
      q: "Où sont hébergées mes données ?",
      a: "Vos données et factures sont hébergées exclusivement au sein de l'Union Européenne (serveurs certifiés ISO 27001 et conformes RGPD). Vos documents sont sauvegardés quotidiennement.",
    },
    {
      q: "Puis-je résilier mon abonnement à tout moment ?",
      a: "Oui, sans aucun engagement. Vous pouvez suspendre ou résilier votre abonnement payant en un clic depuis les paramètres de votre compte. Vous conservez toujours l'accès à vos factures.",
    },
  ];

  const btnPrimary =
    "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 bg-blue-700 hover:bg-blue-800 text-white shadow-sm hover:shadow";

  return (
    <>
      <SEO {...SEO_METADATA.home} />

      <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
        <MarketingNavbar />

        {/* ========================================================= */}
        {/* 1. HERO                                                   */}
        {/* ========================================================= */}
        <section className="pt-24 pb-10 md:pt-40 md:pb-20 bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-5 md:space-y-6">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Vos factures en 3 clics,{" "}
              <span className="text-blue-700">même si vous venez de vous lancer</span>
            </h1>

            <p className="text-sm sm:text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto">
              Créez vos devis et factures conformes, suivez vos paiements et estimez vos cotisations sans prise de tête.
            </p>

            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 pt-1 text-slate-800 text-xs sm:text-sm font-medium">
              <li className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-blue-700 stroke-[3]" />
                <span>Factures conformes avec mentions légales automatiques</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-blue-700 stroke-[3]" />
                <span>Calcul automatique cotisations URSSAF & net</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-blue-700 stroke-[3]" />
                <span>Suivi en direct du seuil de TVA</span>
              </li>
            </ul>

            <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
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

            <div className="pt-3 flex flex-wrap items-center justify-center gap-y-1.5 gap-x-5 text-xs text-slate-700 font-semibold border-t border-slate-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Gratuit jusqu'à 3 factures/mois
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Sans carte bancaire
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Sans engagement
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. APERÇU PRODUIT                                         */}
        {/* ========================================================= */}
        <section className="py-6 md:py-18 bg-slate-50 border-b border-slate-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
            <div className="text-center space-y-1.5 max-w-2xl mx-auto">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                Aperçu en direct
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Une interface claire conçue pour aller vite
              </h2>
              <p className="text-xs sm:text-base text-slate-600">
                Pilotez votre chiffre d'affaires, vos cotisations et vos factures en un coup d'œil.
              </p>
            </div>

            {/* Mock Dashboard Card */}
            <div className="max-w-3xl mx-auto rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 p-4 sm:p-7 shadow-xl space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] sm:text-xs font-mono font-medium text-slate-500 ml-1.5">app.bylz.fr</span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 bg-slate-100 px-2 sm:px-2.5 py-0.5 rounded-full">
                  Micro-entreprise BNC
                </span>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-blue-50/70 border border-blue-100 space-y-0.5 sm:space-y-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-blue-900">CA Encaissé 2026</span>
                  <p className="text-lg sm:text-xl font-extrabold text-blue-950 font-mono">31 400 €</p>
                  <p className="text-[10px] text-blue-800 font-semibold">+18% ce trimestre</p>
                </div>
                <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-100/80 border border-slate-200 space-y-0.5 sm:space-y-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">Cotisations URSSAF</span>
                  <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">8 038 €</p>
                  <p className="text-[10px] text-slate-600 font-semibold">Taux officiel 25,6 %</p>
                </div>
                <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-100 space-y-0.5 sm:space-y-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800">Net après cotisations</span>
                  <p className="text-lg sm:text-xl font-extrabold text-emerald-950 font-mono">23 362 €</p>
                  <p className="text-[10px] text-emerald-800 font-semibold">Revenu disponible réel</p>
                </div>
              </div>

              {/* Seuil TVA Bar */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                    Seuil franchise TVA (37 500 €)
                  </span>
                  <span className="text-emerald-700 font-mono font-extrabold text-[11px] sm:text-xs">83,7 %</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: "83.7%" }} />
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-600">
                  Marge restante de 6 100 € avant assujettissement à la TVA.
                </p>
              </div>

              {/* Facture Factur-X prête */}
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">FAC-2026-012 · Acme Studio SARL</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500">Facture Factur-X avec mentions obligatoires</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Payée : 3 200,00 €
                </span>
              </div>

              <div className="text-center pt-1">
                <Link
                  to="/essai"
                  onClick={() => trackCtaClick("hero")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
                >
                  <span>Tester l'interface en direct sans créer de compte</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. 3 ÉTAPES                                               */}
        {/* ========================================================= */}
        <section className="py-10 md:py-20 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-2 md:space-y-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                Comment ça marche
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                3 étapes simples pour facturer
              </h2>
              <p className="text-slate-700 text-sm sm:text-lg">
                Fini les heures passées sur les tableurs : devis transformés en factures en un clic, cotisations estimées et registre tenu à jour.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-6 max-w-5xl mx-auto">
              {threeSteps.map((step) => (
                <div
                  key={step.num}
                  className="p-3.5 sm:p-6 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 sm:block sm:space-y-3 text-left hover:border-blue-400 transition-colors"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-700 text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0">
                    {step.num}
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <h3 className="font-bold text-xs sm:text-base text-slate-900">{step.title}</h3>
                    <p className="text-[11px] sm:text-sm text-slate-700 leading-snug sm:leading-relaxed font-normal">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-1">
              <Link
                to="/signup"
                onClick={() => trackCtaClick("milieu")}
                className={`${btnPrimary} py-2.5 sm:py-3 px-6 text-sm`}
              >
                Créer mon compte gratuit
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. SECTION DÉBUTANTS : VOUS VENEZ DE VOUS LANCER ?         */}
        {/* ========================================================= */}
        <section className="py-8 md:py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 md:space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-1.5 md:space-y-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                Guide débutant
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Vous venez de vous lancer ?
              </h2>
              <p className="text-slate-700 text-xs sm:text-lg">
                Démarrer son activité apporte son lot de doutes administratifs. Bylz vous évite les erreurs courantes dès le premier jour.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-6 max-w-5xl mx-auto">
              <div className="p-3.5 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-start gap-2">
                  <span className="text-blue-600 font-extrabold text-sm sm:text-base">?</span>
                  <span>Quelles mentions obligatoires sur mes factures ?</span>
                </p>
                <p className="text-[11px] sm:text-sm text-slate-700 leading-snug sm:leading-relaxed pl-4 sm:pl-5">
                  Bylz renseigne automatiquement toutes les mentions légales requises selon votre statut pour des factures 100 % conformes.
                </p>
              </div>

              <div className="p-3.5 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-start gap-2">
                  <span className="text-blue-600 font-extrabold text-sm sm:text-base">?</span>
                  <span>Combien mettre de côté pour mes cotisations ?</span>
                </p>
                <p className="text-[11px] sm:text-sm text-slate-700 leading-snug sm:leading-relaxed pl-4 sm:pl-5">
                  Vos cotisations et votre revenu net disponible sont calculés en temps réel dès l'émission de chaque facture.
                </p>
              </div>

              <div className="p-3.5 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-start gap-2">
                  <span className="text-blue-600 font-extrabold text-sm sm:text-base">?</span>
                  <span>À quel moment commencer à facturer la TVA ?</span>
                </p>
                <p className="text-[11px] sm:text-sm text-slate-700 leading-snug sm:leading-relaxed pl-4 sm:pl-5">
                  Une jauge visuelle suit votre chiffre d'affaires cumulé et vous alerte bien avant d'atteindre le plafond d'exonération.
                </p>
              </div>

              <div className="p-3.5 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-start gap-2">
                  <span className="text-blue-600 font-extrabold text-sm sm:text-base">?</span>
                  <span>Comment relancer un retard sans paraître agressif ?</span>
                </p>
                <p className="text-[11px] sm:text-sm text-slate-700 leading-snug sm:leading-relaxed pl-4 sm:pl-5">
                  Vous suivez les échéances en un coup d'œil et déclenchez des rappels clairs et courtois en un clic.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. FONCTIONS CLÉS                                         */}
        {/* ========================================================= */}
        <section className="py-8 md:py-20 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 md:space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-1.5 md:space-y-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                Fonctionnalités
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Tout ce dont vous avez besoin au quotidien
              </h2>
              <p className="text-slate-700 text-xs sm:text-lg">
                Des outils conçus pour les indépendants et micro-entreprises, sans complication inutile.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 max-w-6xl mx-auto">
              {keyFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 sm:block sm:space-y-3 text-left hover:border-blue-400 transition-colors"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <h3 className="font-bold text-xs sm:text-base text-slate-900">{feat.title}</h3>
                      <p className="text-[11px] sm:text-sm text-slate-700 leading-snug sm:leading-relaxed font-normal">{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. ASSISTANT WHATSAPP                                     */}
        {/* ========================================================= */}
        <section className="py-8 md:py-20 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 items-center">
              <div className="lg:col-span-6 space-y-4 md:space-y-5 text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <MessageSquare className="w-3.5 h-3.5" /> Nouveauté WhatsApp
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Facturez directement depuis WhatsApp
                </h2>
                <p className="text-slate-300 text-sm sm:text-lg leading-relaxed">
                  Pas besoin d'ouvrir votre ordinateur entre deux rendez-vous : dictez ou tapez un simple message pour préparer vos devis et factures.
                </p>
                <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5 sm:space-y-2 text-xs">
                  <p className="font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      {isWhatsAppStarterEnabled()
                        ? "Inclus dans l'offre gratuite Starter : 3 factures par mois créées par WhatsApp."
                        : "Disponible avec le Plan Pro : facturez directement depuis WhatsApp à la voix ou par texte."}
                    </span>
                  </p>
                  <p className="text-slate-400 text-[11px] sm:text-xs">
                    {isWhatsAppStarterEnabled()
                      ? "Disponible en illimité dans le Plan Pro pour piloter l'ensemble de votre facturation à la voix."
                      : "Génération automatique de factures conformes Factur-X sans ouvrir votre ordinateur."}
                  </p>
                </div>
                <div className="pt-1">
                  <Link
                    to="/signup"
                    onClick={() => trackCtaClick("hero")}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors shadow-lg"
                  >
                    Créer mon compte gratuit
                  </Link>
                </div>
              </div>

              {/* Chat simulation */}
              <div className="lg:col-span-6">
                <div className="max-w-md mx-auto rounded-2xl sm:rounded-3xl bg-[#0b141a] p-3.5 sm:p-6 border border-slate-800 shadow-2xl space-y-3 font-sans text-xs">
                  <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                        B
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">Assistant Bylz</p>
                        <p className="text-[10px] text-emerald-400 font-semibold">En ligne • WhatsApp</p>
                      </div>
                    </div>
                  </div>

                  {/* Outgoing user message */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[#005c4b] text-white p-2.5 sm:p-3 space-y-1">
                      <p className="text-xs">Crée une facture de 1 200 € pour Acme Studio : création de site vitrine</p>
                      <span className="text-[10px] text-emerald-200 block text-right">10:42 ✓✓</span>
                    </div>
                  </div>

                  {/* Incoming bot response */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-xs bg-[#202c33] text-white p-2.5 sm:p-3 space-y-1.5 border border-slate-700/60">
                      <p className="font-bold text-emerald-300 text-[11px]">⚡ Facture prête pour validation</p>
                      <p className="text-xs text-slate-200">
                        • <strong>Client :</strong> Acme Studio SARL<br />
                        • <strong>Montant TTC :</strong> 1 200,00 €<br />
                        • <strong>Mentions légales :</strong> ajoutées automatiquement<br />
                        • <strong>Cotisations estimées :</strong> 307,20 €
                      </p>
                      <p className="text-[11px] text-slate-300 italic">
                        Répondez <strong>VALIDER</strong> pour générer votre PDF officiel Factur-X.
                      </p>
                      <span className="text-[10px] text-slate-400 block text-right">10:42</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. GRILLE TARIFAIRE (Starter, Solo, Pro)                  */}
        {/* ========================================================= */}
        <section id="tarifs" className="py-6 md:py-20 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 md:space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-2 md:space-y-4">
              <h2 className="text-2xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                Des tarifs simples et transparents
              </h2>
              <p className="text-slate-700 text-xs sm:text-lg">
                Démarrez sans carte bancaire sur le plan gratuit permanent. Évoluez quand votre activité grandit.
              </p>

              <div className="pt-1 flex justify-center">
                <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />
              </div>
            </div>

            {/* 3 Colonnes Tarifaires */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-stretch max-w-5xl mx-auto">
              {/* 1. Starter (Gratuit) */}
              <div className="p-4 sm:p-7 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-4 sm:space-y-6 text-left shadow-sm">
                <div className="space-y-2.5 sm:space-y-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Starter</h3>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">0 €</span>
                    <span className="text-xs text-slate-600 font-medium">/mois</span>
                  </div>

                  <hr className="border-slate-100" />

                  <ul className="space-y-1.5 sm:space-y-3 text-xs text-slate-800 font-medium">
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Jusqu'à 3 factures par mois</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Jusqu'à 3 clients actifs</span>
                    </li>
                    {isWhatsAppStarterEnabled() && (
                      <li className="flex items-center gap-2 sm:gap-2.5">
                        <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                        <span>3 factures créées par WhatsApp par mois</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Export PDF avec mentions légales</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Recherche SIRET automatique</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Sans engagement, sans carte bancaire</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <Link to="/signup?plan=starter" onClick={() => trackCtaClick("tarifs")} className="block w-full pt-1">
                    <button className={`${btnPrimary} w-full py-2.5 sm:py-3 text-sm`}>
                      Créer mon compte gratuit
                    </button>
                  </Link>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 text-center mt-1.5 sm:mt-2">
                    Inscription immédiate sans carte bancaire, accès direct à votre espace.
                  </p>
                </div>
              </div>

              {/* 2. Solo (Formule Recommandée) */}
              <div className="p-4 sm:p-7 rounded-2xl bg-blue-50/50 border-2 border-blue-600 flex flex-col justify-between space-y-4 sm:space-y-6 text-left relative shadow-md">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-blue-700 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                  <span>★ {PLANS_DATA.solo.badge}</span>
                </div>

                <div className="space-y-2.5 sm:space-y-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Solo</h3>
                    <p className="text-[11px] sm:text-xs text-slate-700 font-medium mt-0.5">
                      Facturation illimitée et pilotage fiscal complet
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-blue-700 font-mono">
                        {billingCycle === "annual" ? "50 €" : "8,90 €"}
                      </span>
                      <span className="text-xs text-slate-700 font-medium">/ {billingCycle === "annual" ? "an" : "mois"}</span>
                    </div>
                    {billingCycle === "annual" ? (
                      <p className="text-[11px] sm:text-xs font-bold text-emerald-700 mt-0.5 sm:mt-1">
                        (soit {PLANS_DATA.solo.pricing.annualMonthlyEquivFormatted} / mois • {PLANS_DATA.solo.pricing.annualSavingsFormatted} d'économie)
                      </p>
                    ) : (
                      <p className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5 sm:mt-1">
                        Facturé 8,90 € / mois sans engagement
                      </p>
                    )}
                  </div>

                  <hr className="border-blue-200" />

                  <ul className="space-y-1.5 sm:space-y-3 text-xs text-slate-900 font-medium">
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span><strong>Factures & Devis illimités</strong></span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Clients et catalogue illimités</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Tableau fiscal & seuils TVA temps réel</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Calcul des cotisations URSSAF</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Livre des recettes chronologique & export CSV</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Relances impayés automatiques</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Réponse sous 24 h ouvrées</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <Link to={`/signup?plan=solo&billing=${billingCycle}`} onClick={() => trackCtaClick("tarifs")} className="block w-full pt-1">
                    <button className={`${btnPrimary} w-full py-2.5 sm:py-3.5 text-sm sm:text-base`}>
                      Choisir Solo
                    </button>
                  </Link>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 text-center mt-1.5 sm:mt-2">
                    Redirection vers le paiement sécurisé Stripe après inscription, résiliable à tout moment en 1 clic.
                  </p>
                </div>
              </div>

              {/* 3. Pro */}
              <div className="p-4 sm:p-7 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-4 sm:space-y-6 text-left shadow-sm">
                <div className="space-y-2.5 sm:space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">Pro</h3>
                      {billingCycle === "annual" && (
                        <span className="bg-blue-50 text-blue-700 font-bold text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full border border-blue-200">
                          -48%
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5">
                      Paiement en ligne par carte et multi-entreprises
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">
                        {billingCycle === "annual" ? "80 €" : "12,90 €"}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">/ {billingCycle === "annual" ? "an" : "mois"}</span>
                    </div>
                    {billingCycle === "annual" ? (
                      <p className="text-[11px] sm:text-xs font-bold text-emerald-700 mt-0.5 sm:mt-1">
                        (soit {PLANS_DATA.pro.pricing.annualMonthlyEquivFormatted} / mois • {PLANS_DATA.pro.pricing.annualSavingsFormatted} d'économie)
                      </p>
                    ) : (
                      <p className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5 sm:mt-1">
                        Facturé 12,90 € / mois sans engagement
                      </p>
                    )}
                  </div>

                  <hr className="border-slate-100" />

                  <ul className="space-y-1.5 sm:space-y-3 text-xs text-slate-800 font-medium">
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span><strong>Toutes les fonctionnalités Solo incluses</strong></span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Paiement en ligne par carte (Stripe Connect)</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Multi-entreprises sous un seul compte</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Assistant IA de facturation (Web & WhatsApp)</span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-2.5">
                      <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span>Réponse sous 24 h ouvrées</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <Link to={`/signup?plan=pro&billing=${billingCycle}`} onClick={() => trackCtaClick("tarifs")} className="block w-full pt-1">
                    <button className={`${btnPrimary} w-full py-2.5 sm:py-3.5 text-sm sm:text-base`}>
                      Choisir Pro
                    </button>
                  </Link>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 text-center mt-1.5 sm:mt-2">
                    Redirection vers le paiement sécurisé Stripe après inscription, résiliable à tout moment en 1 clic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 8. FACTURATION ÉLECTRONIQUE (2 lignes concises)           */}
        {/* ========================================================= */}
        <section className="py-6 sm:py-8 bg-blue-900 text-white border-y border-blue-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1.5 sm:space-y-2">
            <p className="text-xs sm:text-base font-bold text-white flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300 flex-shrink-0" />
              <span>Facturation électronique 2026 : vos factures Factur-X sont générées et validées selon les formats officiels.</span>
            </p>
            <p className="text-[11px] sm:text-sm text-blue-200">
              La transmission via partenaire est en cours d'activation pour l'entrée en vigueur de la réforme. Bylz n'est pas une plateforme agréée.{" "}
              <Link to="/conformite" className="underline hover:text-white font-medium ml-1">
                En savoir plus sur la réforme →
              </Link>
            </p>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 9. FAQ                                                    */}
        {/* ========================================================= */}
        <section id="faq" className="py-8 md:py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 md:space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-2 md:space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Questions fréquentes
              </h2>
              <p className="text-slate-700 text-xs sm:text-base">
                Tout ce que vous devez savoir pour démarrer sereinement sur Bylz.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full py-3.5 px-4 sm:py-4 sm:px-6 text-left flex items-center justify-between gap-3 sm:gap-4 font-bold text-slate-900 text-xs sm:text-base hover:bg-slate-50 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-600 transition-transform duration-200 flex-shrink-0 ${
                          isOpen ? "rotate-180 text-blue-700" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-1 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-1">
              <p className="text-xs text-slate-600">
                Une question spécifique ?{" "}
                <Link to="/contact" className="text-blue-700 hover:text-blue-900 font-bold underline">
                  Contactez notre support par e-mail
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 10. APPEL FINAL                                           */}
        {/* ========================================================= */}
        <section className="py-8 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto rounded-2xl sm:rounded-3xl bg-[#011142] text-white p-6 sm:p-14 text-center space-y-4 sm:space-y-6 shadow-xl border border-blue-900/40">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Prêt à simplifier votre facturation ?
            </h2>
            <p className="text-slate-200 text-xs sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Créez vos factures en 3 clics avec toutes les mentions légales. Sans carte bancaire et sans engagement.
            </p>
            <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link to="/signup" onClick={() => trackCtaClick("bas de page")} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-blue-500/25 transition-all">
                  Créer mon compte gratuit
                </button>
              </Link>
              <Link to="/essai" onClick={() => trackCtaClick("bas de page")} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base border border-white/20 transition-all">
                  Tester sans compte
                </button>
              </Link>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Formule Starter gratuite jusqu'à 3 factures/mois • Sans carte bancaire • Résiliable à tout moment
            </p>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </>
  );
}