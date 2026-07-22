import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";

export function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <SEO title="Politique de Confidentialité & RGPD — Bylz" canonical="/confidentialite" />
      <MarketingNavbar />
      <main className="pt-32 pb-24 max-w-3xl mx-auto px-4 space-y-6 text-xs sm:text-sm text-muted">
        <h1 className="text-3xl font-black text-text">Politique de Confidentialité & Protection des Données (RGPD)</h1>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">1. Collecte des données</h2>
          <p>Dans le cadre du service, Bylz collecte uniquement les données nécessaires à l'émission de vos factures et au calcul de votre fiscalité (nom, adresse, SIRET, adresses e-mail, données de ventes).</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">2. Sécurité & Chiffrement</h2>
          <p>Toutes les connexions sont chiffrées via TLS/SSL. Les bases de données sont sécurisées et hébergées sur des infrastructures conformes au RGPD situées en France.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">3. Vos droits</h2>
          <p>Conformément à la réglementation RGPD, vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression de vos données personnelles sur simple demande à <span className="font-mono text-text">dpo@bylz.fr</span>.</p>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
