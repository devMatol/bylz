import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";

export function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <SEO title="Politique de Confidentialité & RGPD | Bylz" canonical="/confidentialite" />
      <MarketingNavbar />
      <main className="pt-32 pb-24 max-w-3xl mx-auto px-4 space-y-6 text-xs sm:text-sm text-muted">
        <h1 className="text-3xl font-black text-text">Politique de Confidentialité & Protection des Données (RGPD)</h1>
        <p className="text-xs text-muted">Dernière mise à jour : 21 août 2026</p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">1. Collecte des données personnelles</h2>
          <p>Dans le cadre de la fourniture du service, Bylz collecte uniquement les données strictement nécessaires à l'émission de vos factures légales, au calcul de votre fiscalité (micro-entreprise/EI) et au bon fonctionnement de l'application :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Identité & Entreprise :</strong> Nom, prénom, dénomination sociale, adresse, numéro SIRET/SIREN, régime de TVA, email.</li>
            <li><strong>Données de facturation :</strong> Coordonnées clients, montants, détails des prestations, factures émises et devis.</li>
            <li><strong>Intégrations bancaires (Open Banking DSP2) :</strong> Historique de transactions et soldes en lecture seule lors de l'activation explicite par l'utilisateur.</li>
            <li><strong>Assistant IA WhatsApp :</strong> Interactions et commandes transmises par l'utilisateur pour la gestion autonome de son compte.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">2. Rapprochement Bancaire (Open Banking DSP2)</h2>
          <p>
            Lorsque vous activez la synchronisation bancaire, Bylz s'interface avec l'agrégateur certifié <strong>Enable Banking</strong> (conforme à la directive européenne DSP2 et régulé par l'ACPR / Banque de France).
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Lecture seule :</strong> Bylz accède uniquement aux données d'historique en lecture seule pour automatiser le rapprochement des factures. Bylz n'a aucun accès aux mouvements sortants et ne peut initier aucun virement.</li>
            <li><strong>Sécurité des identifiants :</strong> Vos identifiants de banque en ligne ne sont <strong>jamais collectés ni stockés par Bylz</strong>. L'authentification s'effectue directement sur le portail sécurisé de votre établissement bancaire via Strong Customer Authentication (SCA / 2FA).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">3. Sécurité, Chiffrement & Hébergement</h2>
          <p>
            Toutes les communications entre votre navigateur, nos serveurs et les partenaires tiers (Enable Banking, Stripe, Supabase) sont chiffrées à 100% via le protocole TLS/SSL (HTTPS). Les données sont stockées sur des infrastructures sécurisées et conformes aux exigences du RGPD situées dans l'Union Européenne (France / Allemagne).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">4. Services Tiers & Partenaires</h2>
          <p>Afin de garantir le fonctionnement du service, Bylz collabore avec des sous-traitants certifiés :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Stripe :</strong> Gestion des abonnements et encaissement sécurisé (conforme PCI-DSS).</li>
            <li><strong>Enable Banking :</strong> Agrégation et lecture des flux bancaires (DSP2).</li>
            <li><strong>Supabase / PostgreSQL :</strong> Hébergement et stockage sécurisé des données d'entreprise.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">5. Vos droits (RGPD)</h2>
          <p>
            Conformément à la réglementation RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et d'opposition au traitement de vos données personnelles. Vous pouvez exercer ces droits ou révoquer la synchronisation bancaire à tout moment depuis vos paramètres ou en nous contactant à <span className="font-mono text-text">dpo@bylz.fr</span>.
          </p>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
