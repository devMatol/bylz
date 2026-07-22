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

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">1. Objet du service</h2>
          <p>Bylz fournit une plateforme SaaS de facturation conforme aux normes électroniques (Factur-X) et de suivi des cotisations sociales et fiscales pour les indépendants et micro-entrepreneurs.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">2. Accès et inscription</h2>
          <p>L'accès au service gratuit Starter ou aux versions payantes Solo et Pro nécessite la création d'un compte. L'utilisateur s'engage à fournir des informations réelles et valides lors de son inscription.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">3. Engagements & Résiliation</h2>
          <p>Les abonnements Solo et Pro sont sans engagement de durée. L'utilisateur peut mettre fin à son abonnement à tout moment sans frais supplémentaires depuis ses paramètres.</p>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
