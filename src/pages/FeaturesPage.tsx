import { Link } from "react-router-dom";
import {
  FileText,
  TrendingUp,
  ShieldCheck,
  Zap,
  Building,
  Upload,
  RefreshCw,
  CreditCard,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { TrustBadgesRow } from "../components/marketing/TrustBadgesRow";

export function FeaturesPage() {
  const featuresList = [
    {
      icon: FileText,
      color: "text-brand-primary",
      bgColor: "bg-brand-primary/10",
      title: "Éditeur de factures conforme Factur-X",
      description:
        "Générez des factures et devis légaux au format hybride Factur-X (PDF + XML structuré) répondant à la norme européenne de facturation électronique.",
      bullets: [
        "Numérotation séquentielle automatique sans trou",
        "Mentions légales obligatoires insérées dynamiquement",
        "Export PDF haute qualité et impression en 1 clic",
      ],
    },
    {
      icon: TrendingUp,
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10",
      title: "Pilotage fiscal & Santé financière",
      description:
        "Consultez à tout moment votre chiffre d'affaires cumulé, votre bénéfice net estimé et le montant exact de vos cotisations sociales.",
      bullets: [
        "Jauge visuelle d'approche du seuil de TVA (39 100 €)",
        "Calcul des cotisations URSSAF (mensuel ou trimestriel)",
        "Simulation de l'impôt selon votre Tranche Marginale d'Imposition (TMI)",
      ],
    },
    {
      icon: Upload,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
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
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      title: "Annuaire client & Recherche SIRET API",
      description:
        "Entrez simplement le numéro SIRET d'une entreprise client. Bylz interroge les bases officielles pour remplir instantanément la raison sociale et l'adresse.",
      bullets: [
        "Fiches clients B2B et B2C détaillées",
        "Historique complet des factures émises par client",
        "Statistiques d'encaissement et délai moyen de paiement",
      ],
    },
    {
      icon: RefreshCw,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      title: "Relances automatiques & Liens de paiement Stripe",
      description:
        "Ne courez plus après les impayés. Bylz envoie des relances automatiques bienveillantes avant et après la date d'échéance et intègre un lien de règlement par carte bancaire.",
      bullets: [
        "Liens de paiement Stripe Connect intégrés aux factures",
        "Encaissement direct sur votre compte bancaire pro",
        "Rapprochement et passage automatique en statut 'Payée'",
      ],
    },
    {
      icon: Layers,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
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
    <div className="min-h-screen bg-bg text-text selection:bg-brand-primary/20 selection:text-brand-primary">
      <SEO
        title="Fonctionnalités Bylz — Facturation, TVA et Cotisations URSSAF"
        description="Découvrez l'ensemble des fonctionnalités de Bylz : édition Factur-X, suivi des plafonds de TVA, calcul URSSAF, relances et import PDF historique."
        canonical="/fonctionnalites"
      />

      <MarketingNavbar />

      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Conçu pour gagner du temps au quotidien</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-text">
              Toutes les fonctionnalités dont votre micro-entreprise a besoin
            </h1>
            <p className="text-base text-muted">
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
                  className="bg-surface border border-border rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center ${item.color}`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-text">{item.title}</h2>
                  <p className="text-xs text-muted leading-relaxed">{item.description}</p>
                  <ul className="space-y-2 pt-2 border-t border-border/50 text-xs text-text font-medium">
                    {item.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
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
          <div className="bg-surface border border-border rounded-3xl p-10 text-center space-y-6 shadow-xl card-shadow">
            <h2 className="text-2xl sm:text-3xl font-black text-text">
              Prêt à tester l'éditeur de factures par vous-même ?
            </h2>
            <p className="text-sm text-muted max-w-xl mx-auto">
              Créez votre première facture en mode invité sans inscription ou démarrez avec votre compte gratuit.
            </p>
            <div>
              <Link
                to="/essai"
                className="inline-flex items-center space-x-2 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary/90 px-6 py-3 rounded-full shadow-lg"
              >
                <span>Essayer le générateur gratuit</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
