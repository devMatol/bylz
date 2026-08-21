import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";

export function CGUPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <SEO title="Conditions Générales d'Utilisation (CGU) | Bylz" canonical="/cgu" />
      <MarketingNavbar />
      <main className="pt-32 pb-24 max-w-3xl mx-auto px-4 space-y-6 text-xs sm:text-sm text-muted">
        <h1 className="text-3xl font-black text-text">Conditions Générales d'Utilisation (CGU)</h1>
        <p className="text-xs text-muted">Dernière mise à jour : 21 août 2026</p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">1. Objet du service</h2>
          <p>
            Bylz fournit une plateforme SaaS de facturation électronique (Factur-X), de devis, de calcul automatisé des cotisations sociales (URSSAF / TVA) et de rapprochement bancaire pour les indépendants, freelances et micro-entrepreneurs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">2. Accès et inscription</h2>
          <p>
            L'accès aux offres Starter (Gratuit), Solo et Pro nécessite la création d'un compte utilisateur. L'utilisateur s'engage à fournir des informations réelles, exactes et légales (numéro SIRET, identité) lors de son inscription.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">3. Rapprochement Bancaire (DSP2)</h2>
          <p>
            L'accès aux fonctionnalités de synchronisation et de rapprochement bancaire automatique repose sur l'intégration d'Enable Banking, partenaire d'agrégation d'informations sur les comptes (AIS) agréé conformément à la réglementation européenne DSP2.
          </p>
          <p>
            L'utilisateur conserve le contrôle total et peut connecter ou déconnecter ses comptes bancaires professionnels à tout moment depuis les paramètres de l'application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">4. Assistant IA & Messagerie Instantanée</h2>
          <p>
            Bylz met à disposition un assistant IA accessible via WhatsApp permettant d'exécuter des actions à la demande de l'utilisateur (génération de factures, consultation du chiffre d'affaires, envoi de rappels). L'assistant opère strictement sous le contrôle et les droits d'accès du compte de l'utilisateur.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">5. Abonnements & Résiliation</h2>
          <p>
            Les abonnements payants sont souscrits sans engagement de durée. L'utilisateur peut interrompre ou modifier son abonnement à tout moment sans aucun frais depuis son espace de gestion Stripe Customer Portal.
          </p>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
