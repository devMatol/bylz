import { Link } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Check,
} from "lucide-react";
import { SEO } from "../../components/seo/SEO";
import { SEO_METADATA } from "../../lib/seoMeta";
import { MarketingNavbar } from "../../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../../components/marketing/MarketingFooter";
import { TrustBadgesRow } from "../../components/marketing/TrustBadgesRow";
import { InvoiceModelConfigurator } from "../../components/tools/InvoiceModelConfigurator";
import { Button } from "../../components/ui/Button";

export function ModeleFacturePage() {
  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Modèle de Facture Gratuit PDF Bylz",
    applicationCategory: "BusinessApplication",
    description:
      "Générateur de modèle de facture conforme pour micro-entrepreneurs, indépendants et artisans.",
    url: "https://bylz.fr/outils/modele-facture-gratuit",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Quelles sont les mentions obligatoires sur une facture de micro-entrepreneur ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Une facture valide doit comporter : votre identité complète avec la mention « EI », votre SIRET, le numéro unique et chronologique, la date, l'identité du client, le détail des prestations en HT, la mention « TVA non applicable, art. 293 B du CGI », la date d'échéance, les pénalités de retard et l'indemnité forfaitaire de 40 €.",
        },
      },
      {
        "@type": "Question",
        name: "Puis-je facturer sur Word ou Excel ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Bien que toléré en micro-entreprise, Excel comporte des risques majeurs : erreurs de formules, ruptures de numérotation sanctionnées par le fisc, et incompatibilité totale avec la réforme de la facturation électronique 2026.",
        },
      },
      {
        "@type": "Question",
        name: "Ce modèle de facture PDF est-il gratuit ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, ce configurateur est 100% gratuit et sans engagement. Vous pouvez générer et télécharger vos factures en PDF directement depuis votre navigateur.",
        },
      },
      {
        "@type": "Question",
        name: "Comment passer à la facturation électronique 2026 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Bylz intègre aujourd'hui les mentions légales essentielles sur vos factures PDF et prépare activement l'intégration du standard Factur-X pour la facturation électronique.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <SEO
        title={SEO_METADATA["/outils/modele-facture-gratuit"].title}
        description={SEO_METADATA["/outils/modele-facture-gratuit"].description}
        canonical={SEO_METADATA["/outils/modele-facture-gratuit"].canonical}
        jsonLd={[toolSchema, faqSchema]}
      />

      <MarketingNavbar theme="light" />

      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Mentions Légales 2026 • Gratuit & Sans Inscription</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Modèle de Facture Gratuit
            </h1>
            <p className="text-base text-slate-600 leading-relaxed font-medium">
              Ne perdez plus de temps avec des fichiers Excel ou Word risqués. Personnalisez votre modèle de facture en 30 secondes et téléchargez immédiatement votre PDF officiel.
            </p>
          </div>

          {/* Interactive Invoice Configurator Widget */}
          <InvoiceModelConfigurator sourcePage="/outils/modele-facture-gratuit" />

          {/* Trust Badges */}
          <div className="pt-6 border-t border-slate-200">
            <TrustBadgesRow />
          </div>

          {/* Educational Content: Excel/Word vs Logiciel Conforme */}
          <div className="space-y-10 pt-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Pourquoi abandonner les modèles Word & Excel ?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Bien que très répandus, les tableurs Excel et traitements de texte Word exposent votre entreprise à des sanctions financières et à des pertes de temps considérables.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Word/Excel Risks */}
              <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-4">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <h3 className="font-bold text-base text-slate-900">Les risques d'un modèle Word / Excel</h3>
                </div>
                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">✕</span>
                    <span><strong>Numérotation manuelle à risque :</strong> Un doublon ou un trou dans vos numéros de facture expose à des pénalités fiscales (consultables sur impots.gouv.fr).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">✕</span>
                    <span><strong>Erreurs de calculs :</strong> Des formules Excel cassées ou un oubli d'arrondi faussent votre déclaration de chiffre d'affaires auprès de l'URSSAF.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">✕</span>
                    <span><strong>Incompatibilité Factur-X 2026 :</strong> Les factures papier et simples PDF créés sur Word ne contiennent pas les métadonnées XML exigées par la nouvelle réglementation.</span>
                  </li>
                </ul>
              </div>

              {/* Card Bylz Advantage */}
              <div className="p-6 rounded-2xl border border-blue-200 bg-blue-50/60 space-y-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <h3 className="font-bold text-base text-slate-900">Les atouts d'une facture générée sur Bylz</h3>
                </div>
                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <span><strong>Mentions légales essentielles :</strong> Génération de factures PDF avec mentions obligatoires (art. 293 B, pénalités, décennale).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <span><strong>Numérotation chronologique :</strong> Numérotation continue sans trou ni rupture manuelle.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <span><strong>Suivi en temps réel de vos cotisations :</strong> Vos factures alimentent directement le calcul de vos cotisations URSSAF et de vos seuils de TVA.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Legal Checklist Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-700" />
              <span>Checklist officielle : Les mentions obligatoires sur vos factures</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">1. Identité Émetteur</h4>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Nom et Prénom (ou Dénomination sociale)</li>
                  <li>Mention « EI » ou « Entrepreneur Individuel »</li>
                  <li>Numéro SIREN / SIRET (14 chiffres)</li>
                  <li>Adresse du siège ou de domiciliation</li>
                  <li>Numéro RCS ou RM (si commerçant/artisan)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">2. Données Client & Document</h4>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Nom ou raison sociale du client</li>
                  <li>Adresse de facturation (et livraison si différente)</li>
                  <li>Numéro de facture unique et chronologique</li>
                  <li>Date d'émission de la facture</li>
                  <li>Date limite de paiement (échéance)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">3. Fiscalité & Conditions</h4>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Détail en quantité et prix unitaire HT</li>
                  <li>Mention « TVA non applicable, art. 293 B du CGI »</li>
                  <li>Taux des pénalités de retard applicables</li>
                  <li>Indemnité forfaitaire de 40 € pour frais de recouvrement</li>
                  <li>Assurance décennale (nom, coordonnées) pour BTP</li>
                </ul>
              </div>
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Questions Fréquentes sur les Modèles de Facture
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {faqSchema.mainEntity.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-xs">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                    <span>{item.name}</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    {item.acceptedAnswer.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion CTA Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Passez à la vitesse supérieure</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 max-w-xl mx-auto">
              Gérez vos devis, factures et déclarations URSSAF en 1 clic
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              Moins de double saisie, moins de calculs à la main grâce au pilotage fiscal automatisé Bylz.
            </p>
            <div>
              <Link to="/signup">
                <Button variant="primary" className="py-3.5 px-8 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] shadow-md">
                  Créer mon compte gratuit Bylz
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
