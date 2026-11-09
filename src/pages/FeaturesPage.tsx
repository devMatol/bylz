import { Link } from "react-router-dom";
import {
  FileText,
  TrendingUp,
  Building,
  Upload,
  RefreshCw,
  Layers,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { SEO_METADATA } from "../lib/seoMeta";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { TrustBadgesRow } from "../components/marketing/TrustBadgesRow";
import { Button } from "../components/ui/Button";

export function FeaturesPage() {
  const featuresList = [
    {
      icon: FileText,
      color: "text-blue-700",
      bgColor: "bg-blue-50 border border-blue-200",
      title: "Éditeur de factures PDF",
      description:
        "Générez des factures et devis professionnels en PDF intégrant les mentions légales essentielles (EI, mentions de TVA, pénalités).",
      bullets: [
        "Numérotation séquentielle automatique sans trou",
        "Mentions légales obligatoires insérées dynamiquement",
        "Export PDF haute qualité et impression en 1 clic",
      ],
    },
    {
      icon: TrendingUp,
      color: "text-blue-700",
      bgColor: "bg-blue-50 border border-blue-200",
      title: "Pilotage fiscal & Santé financière",
      description:
        "Consultez à tout moment votre chiffre d'affaires cumulé, votre bénéfice net estimé et le montant exact de vos cotisations sociales.",
      bullets: [
        "Jauge visuelle d'approche du seuil de TVA 2026 (37 500 € en services, 85 000 € en vente)",
        "Calcul des cotisations URSSAF (mensuel ou trimestriel)",
        "Simulation de l'impôt selon votre Tranche Marginale d'Imposition (TMI)",
      ],
    },
    {
      icon: Upload,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50 border border-emerald-200",
      title: "Importation intelligente de factures historiques PDF",
      description:
        "Importez vos anciennes factures de l'année en glisser-déposer. L'analyseur local (zéro frais d'API) extrait automatiquement le SIRET, les dates et montants pour mettre à jour votre historique fiscal.",
      bullets: [
        "Traitement 100% local directement dans le navigateur",
        "Prévisualisation split-screen avec document PDF côte à côte",
        "Détection et création automatique des fiches clients",
      ],
    },
    {
      icon: Building,
      color: "text-amber-700",
      bgColor: "bg-amber-50 border border-amber-200",
      title: "Annuaire client & Recherche SIRET API",
      description:
        "Entrez simplement le numéro SIRET d'une entreprise client. Bylz interroge les bases officielles pour remplir instantanément la raison sociale et l'adresse.",
      bullets: [
        "Fiches clients B2B et B2C détaillées",
        "Historique complet des factures validées par client",
        "Statistiques d'encaissement et délai moyen de paiement",
      ],
    },
    {
      icon: RefreshCw,
      color: "text-blue-700",
      bgColor: "bg-blue-50 border border-blue-200",
      title: "Relances automatiques & Liens de paiement Stripe",
      description:
        "Ne courez plus après les impayés. Bylz envoie des relances automatiques bienveillantes avant et après la date d'échéance et intègre un lien de règlement par carte bancaire.",
      bullets: [
        "Liens de paiement Stripe Connect intégrés aux factures",
        "Encaissement direct sur votre compte bancaire pro",
        "Confirmation automatique du paiement et passage en statut 'Payée'",
      ],
    },
    {
      icon: Layers,
      color: "text-blue-700",
      bgColor: "bg-blue-50 border border-blue-200",
      title: "Support Multi-activités (BNC / BIC)",
      description:
        "Que vous soyez développeur freelance, consultant (BNC), artisan ou commerçant (BIC), Bylz applique les taux d'abattement et de cotisations exacts pour votre catégorie.",
      bullets: [
        "Ventilation automatique des lignes d'articles par nature",
        "Calcul combiné pour activités mixtes (Vente + Prestation)",
        "Suivi du Chiffre d'Affaires antérieur pour intégration en cours d'année",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <SEO
        title={SEO_METADATA["/fonctionnalites"].title}
        description={SEO_METADATA["/fonctionnalites"].description}
        canonical={SEO_METADATA["/fonctionnalites"].canonical}
      />

      <MarketingNavbar theme="light" />

      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              <Zap className="w-3.5 h-3.5 text-blue-700" />
              <span>Conçu pour gagner du temps au quotidien</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
              Toutes les fonctionnalités dont votre micro-entreprise a besoin
            </h1>
            <p className="text-base text-slate-600 font-medium">
              Bylz combine un outil de facturation légal ultra-rapide et un véritable copilote fiscal automatisé.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center ${item.color}`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{item.description}</p>
                  <ul className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-800 font-medium">
                    {item.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <TrustBadgesRow />

          {/* CTA Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center space-y-6 shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Prêt à tester l'éditeur de factures par vous-même ?
            </h2>
            <p className="text-sm text-slate-600 font-medium max-w-xl mx-auto">
              Créez votre première facture en mode invité sans inscription ou démarrez avec votre compte gratuit.
            </p>
            <div>
              <Link to="/essai">
                <Button variant="primary" size="lg" className="min-h-[44px] px-8 py-3.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                  <span>Essayer le générateur gratuit</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter theme="light" />
    </div>
  );
}
