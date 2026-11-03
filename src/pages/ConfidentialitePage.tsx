import { SEO } from "../components/seo/SEO";
import { SEO_METADATA } from "../lib/seoMeta";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";

export function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <SEO
        title={SEO_METADATA["/confidentialite"].title}
        description={SEO_METADATA["/confidentialite"].description}
        canonical={SEO_METADATA["/confidentialite"].canonical}
      />
      <MarketingNavbar theme="light" />
      <main id="main-content" className="pt-32 pb-24 max-w-3xl mx-auto px-4 space-y-6 text-xs sm:text-sm text-slate-700">
        <h1 className="text-3xl font-black text-slate-900">Politique de Confidentialité & Protection des Données (RGPD)</h1>
        <p className="text-xs text-slate-500">Dernière mise à jour : 21 août 2026</p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">1. Responsable du traitement & Données collectées</h2>
          <p>
            Le responsable du traitement des données personnelles collectées sur le site et l'application Bylz.fr est la société <strong>ARABACI HOLDING</strong>, SASU au capital de 1 000 €, immatriculée au RCS de Bordeaux sous le numéro 908 662 950 (SIREN 908 662 950, SIRET 908 662 950 00017), dont le siège social est situé 21 B rue Général de Castelnau, 33700 Mérignac, représentée par son représentant légal, Irfan Arabaci.
          </p>
          <p>Dans le cadre de la fourniture du service, Bylz collecte uniquement les données strictement nécessaires à l'émission de vos factures, au calcul indicatif de vos cotisations et au bon fonctionnement de l'application :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Identité & Entreprise :</strong> Nom, prénom, dénomination sociale, adresse, numéro SIRET/SIREN, régime fiscal, e-mail.</li>
            <li><strong>Données de facturation :</strong> Coordonnées des clients, montants, désignation des prestations, devis et factures émis.</li>
            <li><strong>Intégrations bancaires :</strong> Historique des encaissements en lecture seule en cas d'activation explicite par l'utilisateur.</li>
            <li><strong>Assistant IA WhatsApp :</strong> Commandes et textes transmis par l'utilisateur pour la gestion de son compte.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">2. Flux bancaires en lecture seule</h2>
          <p>
            En cas d'activation optionnelle de la synchronisation bancaire, celle-ci s'effectue via notre partenaire <strong>Enable Banking Oy</strong> (Finlande, Union européenne).
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Lecture seule :</strong> Bylz accède uniquement aux données d'historique en lecture seule pour pointer les encaissements. Bylz n'a aucun accès aux mouvements sortants et ne peut ordonner aucun virement.</li>
            <li><strong>Sécurité des identifiants :</strong> Vos identifiants de banque en ligne ne sont <strong>jamais collectés ni stockés par Bylz</strong>. L'authentification s'effectue directement sur le portail sécurisé de votre établissement bancaire via authentification forte (SCA / 2FA).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">3. Sécurité, Chiffrement & Hébergement</h2>
          <p>
            Toutes les communications entre votre navigateur, nos serveurs et les partenaires tiers sont chiffrées via le protocole TLS/SSL (HTTPS). La base de données principale est hébergée en Europe chez Supabase (datacenter situé dans l'Union Européenne), avec sauvegardes régulières.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">4. Services Tiers & Sous-traitants</h2>
          <p>Afin d'assurer le fonctionnement du service, Bylz fait appel à des prestataires spécialisés :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Netlify, Inc. (États-Unis) :</strong> Hébergement du frontend et réseau de distribution de contenu CDN.</li>
            <li><strong>Supabase Inc. / AWS (Union Européenne) :</strong> Hébergement de la base de données PostgreSQL et du stockage.</li>
            <li><strong>Stripe Payments Europe Ltd / Stripe, Inc. (Irlande / États-Unis) :</strong> Encaissement sécurisé par carte bancaire et gestion des abonnements.</li>
            <li><strong>Resend, Inc. (États-Unis) :</strong> Acheminement et délivrabilité des e-mails transactionnels (factures, reçus, alertes).</li>
            <li><strong>Meta Platforms Ireland Ltd / Meta Platforms Inc. (Irlande / États-Unis) :</strong> Acheminement des messages via l'API WhatsApp Cloud pour l'assistant.</li>
            <li><strong>Enable Banking Oy (Finlande) :</strong> Agrégation bancaire en lecture seule (si activée).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">5. Vos droits (RGPD)</h2>
          <p>
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression de vos données personnelles. Vous pouvez exercer ces droits à tout moment en écrivant à <span className="font-mono text-slate-900 font-bold">contact@bylz.fr</span>.
          </p>
        </section>
      </main>
      <MarketingFooter theme="light" />
    </div>
  );
}
