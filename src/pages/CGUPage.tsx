import { SEO } from "../components/seo/SEO";
import { SEO_METADATA } from "../lib/seoMeta";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";

export function CGUPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <SEO
        title={SEO_METADATA["/cgu"].title}
        description={SEO_METADATA["/cgu"].description}
        canonical={SEO_METADATA["/cgu"].canonical}
      />
      <MarketingNavbar theme="light" />
      <main id="main-content" className="pt-32 pb-24 max-w-3xl mx-auto px-4 space-y-6 text-xs sm:text-sm text-slate-700">
        <h1 className="text-3xl font-black text-slate-900">Conditions Générales d'Utilisation (CGU)</h1>
        <p className="text-xs text-slate-500">Dernière mise à jour : 21 août 2026</p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">1. Objet du service & Prestataire</h2>
          <p>
            Le service en ligne Bylz.fr est édité et fourni par la société <strong>ARABACI HOLDING</strong>, Société par Actions Simplifiée Unipersonnelle (SASU) au capital de 1 000 €, immatriculée au RCS de Bordeaux sous le numéro 908 662 950 (SIREN 908 662 950, SIRET 908 662 950 00017), dont le siège social est situé 21 B rue Général de Castelnau, 33700 Mérignac, représentée par son représentant légal, Irfan Arabaci.
          </p>
          <p>
            Bylz fournit une plateforme SaaS d'édition de factures PDF avec mentions légales obligatoires, de devis, d'aide au calcul indicatif des cotisations sociales et de suivi des seuils de franchise en base de TVA pour les indépendants et micro-entrepreneurs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">2. Accès et inscription</h2>
          <p>
            L'accès aux offres Starter (Gratuit), Solo et Pro nécessite la création d'un compte utilisateur. L'utilisateur s'engage à fournir des informations réelles, exactes et légales (numéro SIRET, identité) lors de son inscription.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">3. Rapprochement Bancaire (DSP2)</h2>
          <p>
            L'accès aux fonctionnalités de synchronisation et de rapprochement bancaire automatique repose sur l'intégration d'Enable Banking, partenaire d'agrégation d'informations sur les comptes (AIS) agréé conformément à la réglementation européenne DSP2.
          </p>
          <p>
            L'utilisateur conserve le contrôle total et peut connecter ou déconnecter ses comptes bancaires professionnels à tout moment depuis les paramètres de l'application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">4. Assistant IA & Messagerie Instantanée</h2>
          <p>
            Bylz met à disposition un assistant IA accessible via WhatsApp permettant d'exécuter des actions à la demande de l'utilisateur (génération de factures, consultation du chiffre d'affaires, envoi de rappels). L'assistant opère strictement sous le contrôle et les droits d'accès du compte de l'utilisateur.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">5. Abonnements & Résiliation</h2>
          <p>
            Les abonnements payants sont souscrits sans engagement de durée. L'utilisateur peut interrompre ou modifier son abonnement à tout moment sans aucun frais depuis son espace de gestion Stripe Customer Portal.
          </p>
        </section>
      </main>
      <MarketingFooter theme="light" />
    </div>
  );
}
