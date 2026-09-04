import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Download,
  Clock,
  Laptop,
  Check
} from "lucide-react";
import { SEO } from "../../components/seo/SEO";
import { MarketingNavbar } from "../../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../../components/marketing/MarketingFooter";
import { TrustBadgesRow } from "../../components/marketing/TrustBadgesRow";
import { InvoiceModelConfigurator } from "../../components/tools/InvoiceModelConfigurator";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function ModeleFacturePage() {
  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Générateur de Modèle de Facture Gratuit Conforme 2026 | Bylz",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Quelle est la mention obligatoire sur une facture d'auto-entrepreneur sans TVA ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si vous bénéficiez de la franchise en base de TVA, la mention obligatoire à faire figurer est : « TVA non applicable, art. 293 B du CGI ». Elle doit obligatoirement apparaître sur toutes vos factures et devis.",
        },
      },
      {
        "@type": "Question",
        name: "Pourquoi abandonner les modèles de facture sur Word ou Excel en 2026 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Les fichiers Excel et Word présentent des risques majeurs : erreurs de formules de calcul, numérotation discontinue (passible de 15 € d'amende par facture) et surtout incompatibilité avec le format Factur-X imposé par la réforme de la facturation électronique 2026.",
        },
      },
      {
        "@type": "Question",
        name: "Quelles sont les mentions légales obligatoires sur une facture en France ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Toute facture doit comporter : la dénomination sociale et l'adresse de l'émetteur et du client, les numéros SIRET/SIREN, le numéro unique chronologique, la date d'émission et d'échéance, le détail des prestations (quantité, prix unitaire HT), le taux ou la franchise de TVA, ainsi que les pénalités de retard et l'indemnité forfaitaire de 40 €.",
        },
      },
      {
        "@type": "Question",
        name: "Ce générateur de facture en ligne est-il gratuit ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, ce configurateur est 100% gratuit et sans engagement. Vous pouvez générer et télécharger votre facture immédiatement au format PDF conforme.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-bg text-text bg-grid-pattern selection:bg-brand-primary/20 selection:text-brand-primary">
      <SEO
        title="Modèle de Facture Gratuit 2026 : Auto-Entrepreneur, Artisan & Freelance (PDF)"
        description="Créez et téléchargez votre modèle de facture gratuit conforme aux obligations 2026 (Factur-X, franchise TVA art. 293 B, mentions obligatoires). Prêt en 30 secondes."
        canonical="/outils/modele-facture-gratuit"
        jsonLd={[toolSchema, faqSchema]}
      />

      <MarketingNavbar />

      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Conforme Réforme 2026 • Gratuit & Sans Inscription</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-text leading-tight">
              Modèle de Facture Gratuit Conforme 2026
            </h1>
            <p className="text-base text-text/80 leading-relaxed font-normal">
              Ne perdez plus de temps avec des fichiers Excel ou Word risqués. Personnalisez votre modèle de facture en 30 secondes et téléchargez immédiatement votre PDF officiel.
            </p>
          </div>

          {/* Interactive Invoice Configurator Widget */}
          <InvoiceModelConfigurator sourcePage="/outils/modele-facture-gratuit" />

          {/* Trust Badges */}
          <div className="pt-6 border-t border-border">
            <TrustBadgesRow />
          </div>

          {/* Educational Content: Excel/Word vs Logiciel Conforme */}
          <div className="space-y-10 pt-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-text">
                Pourquoi abandonner les modèles Word & Excel ?
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Bien que très répandus, les tableurs Excel et traitements de texte Word exposent votre entreprise à des sanctions financières et à des pertes de temps considérables.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Word/Excel Risks */}
              <Card className="p-6 border-danger/30 bg-danger/5 space-y-4">
                <div className="flex items-center gap-2 text-danger">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <h3 className="font-bold text-base text-text">Les risques d'un modèle Word / Excel</h3>
                </div>
                <ul className="space-y-3 text-xs text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-danger font-bold">✕</span>
                    <span><strong>Numérotation manuelle à risque :</strong> Un doublon ou un trou dans vos numéros de facture est passible d'une amende de 15 € par mention erronée par l'administration fiscale.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger font-bold">✕</span>
                    <span><strong>Erreurs de calculs :</strong> Des formules Excel cassées ou un oubli d'arrondi faussent votre déclaration de chiffre d'affaires auprès de l'URSSAF.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger font-bold">✕</span>
                    <span><strong>Incompatibilité Factur-X 2026 :</strong> Les factures papier et simples PDF créés sur Word ne contiennent pas les métadonnées XML exigées par la nouvelle réglementation.</span>
                  </li>
                </ul>
              </Card>

              {/* Card Bylz Advantage */}
              <Card className="p-6 border-primary/30 bg-primary/5 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <h3 className="font-bold text-base text-text">Les garanties d'une facture générée sur Bylz</h3>
                </div>
                <ul className="space-y-3 text-xs text-muted">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>100% Conforme DGFiP 2026 :</strong> Génération hybride Factur-X avec mentions légales automatiques (art. 293 B, pénalités, décennale).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Sécurisation juridique sans faille :</strong> Numérotation infalsifiable et chronologique garantie sans intervention manuelle.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Suivi en temps réel de vos cotisations :</strong> Vos factures alimentent directement le calcul de vos cotisations URSSAF et de vos seuils de TVA.</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Legal Checklist Section */}
          <Card className="p-8 space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-text flex items-center gap-2">
              <FileText className="w-6 h-6 text-brand-primary" />
              <span>Checklist officielle : Les mentions obligatoires sur vos factures</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-muted">
              <div className="space-y-2">
                <h4 className="font-bold text-text uppercase tracking-wider text-[11px]">1. Identité Émetteur</h4>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Nom et Prénom (ou Dénomination sociale)</li>
                  <li>Mention « EI » ou « Entrepreneur Individuel »</li>
                  <li>Numéro SIREN / SIRET (14 chiffres)</li>
                  <li>Adresse du siège ou de domiciliation</li>
                  <li>Numéro RCS ou RM (si commerçant/artisan)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-text uppercase tracking-wider text-[11px]">2. Données Client & Document</h4>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Nom ou raison sociale du client</li>
                  <li>Adresse de facturation (et livraison si différente)</li>
                  <li>Numéro de facture unique et chronologique</li>
                  <li>Date d'émission de la facture</li>
                  <li>Date limite de paiement (échéance)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-text uppercase tracking-wider text-[11px]">3. Fiscalité & Conditions</h4>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Détail en quantité et prix unitaire HT</li>
                  <li>Mention « TVA non applicable, art. 293 B du CGI »</li>
                  <li>Taux des pénalités de retard applicables</li>
                  <li>Indemnité forfaitaire de 40 € pour frais de recouvrement</li>
                  <li>Assurance décennale (nom, coordonnées) pour BTP</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* FAQ Accordion Section */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-text">
                Questions Fréquentes sur les Modèles de Facture
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {faqSchema.mainEntity.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-surface border border-border space-y-2">
                  <h3 className="font-bold text-xs sm:text-sm text-text flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span>{item.name}</span>
                  </h3>
                  <p className="text-xs text-muted leading-relaxed pl-6">
                    {item.acceptedAnswer.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion CTA Box */}
          <div className="bg-gradient-to-r from-brand-primary/15 via-primary/10 to-accent/15 border border-brand-primary/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Passez à la vitesse supérieure</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-text max-w-xl mx-auto">
              Gérez vos devis, factures et déclarations URSSAF en 1 clic
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto">
              Rejoignez les milliers d'indépendants qui gagnent 4 heures chaque mois grâce au pilotage fiscal automatisé Bylz.
            </p>
            <div>
              <Link to="/signup">
                <Button variant="primary" className="py-4 px-8 text-sm font-black bylz-glow-cta">
                  Créer mon compte gratuit Bylz
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
