import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";

export function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <SEO title="Mentions Légales | Bylz" canonical="/mentions-legales" />
      <MarketingNavbar />
      <main className="pt-32 pb-24 max-w-3xl mx-auto px-4 space-y-6 text-xs sm:text-sm text-muted">
        <h1 className="text-3xl font-black text-text">Mentions Légales</h1>
        
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">1. Éditeur du site</h2>
          <p>Le site internet <strong>Bylz.fr</strong> est édité par la société Bylz Technologies SAS, au capital de 10 000 €, immatriculée au RCS de Paris sous le numéro 892 419 203.</p>
          <p>Siège social : 12 Rue de la Paix, 75002 Paris, France.</p>
          <p>Directeur de la publication : Équipe de Direction Bylz.</p>
          <p>Email de contact : <span className="font-mono text-text">contact@bylz.fr</span></p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">2. Hébergement</h2>
          <p>Le site et les données applicatives sont hébergés sur des serveurs hautement sécurisés situés au sein de l'Union Européenne (France), conformes aux normes ISO 27001 et RGPD.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">3. Propriété intellectuelle</h2>
          <p>L'ensemble des contenus, marques, logos, visuels et architectures logiciels présents sur le site Bylz sont la propriété exclusive de Bylz Technologies. Toute reproduction non autorisée est strictement interdite.</p>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
