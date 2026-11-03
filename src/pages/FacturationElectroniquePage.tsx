import { Link } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText,
  ShieldCheck,
  Building,
  HelpCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { SEO_METADATA } from "../lib/seoMeta";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";

export function FacturationElectroniquePage() {
  const faqItems = [
    {
      q: "Dois-je changer de logiciel ?",
      a: "Non, vous n'avez pas obligatoirement besoin de changer de logiciel dès aujourd'hui. Jusqu'au 1er septembre 2027, vous pouvez continuer à émettre vos factures de vente au format PDF classique avec les mentions légales essentielles. Pour la réception de factures dès le 1er septembre 2026, vous devrez disposer d'une adresse de réception sur une plateforme agréée de votre choix.",
    },
    {
      q: "Une facture PDF classique suffit-elle jusqu'en 2027 ?",
      a: "Oui. Pour les micro-entrepreneurs et les petites entreprises, l'obligation d'émission au format électronique structuré n'intervient qu'au 1er septembre 2027. Vos factures PDF actuelles restent valables jusqu'à cette date, à condition de comporter toutes les mentions légales essentielles (art. L441-9 et R123-237 du Code de commerce, art. 242 nonies A de l'annexe II au CGI).",
    },
    {
      q: "Qu'est-ce qu'une plateforme agréée ?",
      a: "Une plateforme agréée (PA, anciennement désignée plateforme de dématérialisation partenaire ou PDP) est un opérateur privé immatriculé par la Direction générale des Finances publiques (DGFiP). Elle assure l'émission, la transmission sécurisée et la réception des factures électroniques entre entreprises, ainsi que l'extraction des données fiscales transmises à l'administration.",
    },
    {
      q: "Que risque-t-on sans facture électronique ?",
      a: "L'administration fiscale prévoit des pénalités financières par facture ou par transmission omise, plafonnées par année civile (montants à vérifier auprès de l'administration selon les textes d'application en vigueur). Une dispense d'amende est prévue pour la première infraction en cas de régularisation spontanée ou dans les 30 jours.",
    },
    {
      q: "Mon client est un particulier, que faire ?",
      a: "Les ventes et prestations réalisées au profit de particuliers (B2C) ne relèvent pas de la facturation électronique inter-entreprises. Vous continuez à délivrer à votre client particulier une facture ou une note au format papier ou PDF. En revanche, les données globales de ces ventes devront être transmises périodiquement à l'administration fiscale dans le cadre du dispositif de e-reporting.",
    },
  ];

  const jsonLdData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Facturation électronique auto-entrepreneur 2026 et 2027",
      description:
        "Calendrier officiel, obligations B2B et démarches de facturation électronique pour auto-entrepreneurs en 2026 et 2027. Source : impots.gouv.fr.",
      url: "https://bylz.fr/facturation-electronique",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <SEO
        title={SEO_METADATA["/facturation-electronique"].title}
        description={SEO_METADATA["/facturation-electronique"].description}
        canonical={SEO_METADATA["/facturation-electronique"].canonical}
        jsonLd={jsonLdData}
      />
      <MarketingNavbar theme="light" />

      <main id="main-content" className="pt-28 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* En-tête et Titre H1 */}
        <header className="space-y-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Source : impots.gouv.fr</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Facturation électronique 2026 et 2027 : ce que doivent faire les auto-entrepreneurs
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
            Calendrier officiel, champ d'application légal et démarches concrètes pour les micro-entrepreneurs et indépendants en France.
          </p>
        </header>

        {/* 1. Résumé en 3 points */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-700" />
            <span>L'essentiel de la réforme en 3 points</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 space-y-3 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-blue-300 transition-all">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="font-bold text-base text-slate-900">1er septembre 2026 : Réception obligatoire</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Toutes les entreprises assujetties à la TVA, y compris les micro-entreprises, ont l'obligation de pouvoir recevoir des factures au format électronique.
              </p>
            </div>

            <div className="p-6 space-y-3 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-blue-300 transition-all">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="font-bold text-base text-slate-900">1er septembre 2027 : Émission pour micro-entreprises</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                L'obligation d'émettre des factures électroniques s'appliquera aux PME et micro-entrepreneurs à compter du 1er septembre 2027.
              </p>
            </div>

            <div className="p-6 space-y-3 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-blue-300 transition-all">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="font-bold text-base text-slate-900">Plateforme Agréée obligatoire</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                À terme, les factures électroniques B2B ne s'échangeront plus par simple e-mail : la réception est obligatoire dès le 1er septembre 2026 pour toutes les entreprises, et l'émission au 1er septembre 2027 pour les micro-entreprises via une Plateforme Agréée (PA).
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 text-center pt-2">
            Source officielle :{" "}
            <a
              href="https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline font-semibold hover:text-blue-900 inline-flex items-center gap-1"
            >
              <span>impots.gouv.fr, Je passe à la facturation électronique</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </section>

        {/* 2. Suis-je concerné ? */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-700" />
            <span>Suis-je concerné ?</span>
          </h2>

          <div className="p-6 sm:p-8 space-y-4 border border-slate-200 rounded-2xl bg-white shadow-sm">
            <p className="text-sm text-slate-900 leading-relaxed font-semibold">
              Oui, si vous vendez ou fournissez des prestations de services à d'autres professionnels en France.
            </p>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Même si vous êtes au régime de la franchise en base de TVA (article 293 B du Code général des impôts) et que vous ne facturez pas de TVA, vous restez fiscalement qualifié d'assujetti à la TVA au sens de l'article 256 A du CGI.
            </p>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Selon les règles publiées par la Direction générale des Finances publiques (DGFiP), l'obligation de facturation électronique concerne l'ensemble des opérations d'achats et de ventes de biens ou de prestations de services réalisées entre entreprises assujetties à la TVA établies sur le territoire français (transactions B2B domestiques).
            </p>

            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-800">
                <AlertCircle className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-blue-900">Règle officielle impots.gouv.fr :</span>
                  <p className="text-slate-700 leading-relaxed">
                    Les entreprises exonérées ou en franchise en base de TVA entrent dans le périmètre du dispositif pour leurs transactions inter-entreprises. Seules certaines opérations dispensées de facturation (comme certaines activités médicales ou financières expressément exonérées par le CGI) sont exclues du périmètre.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Qu'est-ce qui change concrètement ? */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-700" />
            <span>Qu'est-ce qui change concrètement ?</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 space-y-3 border border-slate-200 rounded-2xl bg-white shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Les 3 formats autorisés</h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Une facture électronique n'est pas un simple PDF scanné. Elle doit respecter une structure normée (norme européenne EN 16931). Trois formats sont validés :
              </p>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                <li><strong>Factur-X</strong> : format hybride composé d'un fichier PDF lisible et d'un fichier XML structuré embarqué.</li>
                <li><strong>UBL</strong> (Universal Business Language) : fichier de données structuré XML.</li>
                <li><strong>UN/CEFACT CII</strong> : format international structuré XML.</li>
              </ul>
            </div>

            <div className="p-6 space-y-3 border border-slate-200 rounded-2xl bg-white shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Le rôle de la Plateforme Agréée</h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Selon le calendrier officiel, la réception de factures électroniques via une Plateforme Agréée (PA) est obligatoire pour toutes les entreprises dès le 1er septembre 2026. L'obligation d'émission s'appliquera dès le 1er septembre 2026 pour les grandes entreprises et ETI, puis au 1er septembre 2027 pour les PME et micro-entreprises.
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                Pour les flux soumis à la réforme, les échanges de factures électroniques transiteront par une plateforme partenaire qui contrôle la validité du format et achemine les données réglementaires vers l'administration fiscale (fonctionnalité actuellement en préparation sur Bylz).
              </p>
            </div>

            <div className="p-6 space-y-3 border border-slate-200 rounded-2xl bg-white shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Le dispositif de e-reporting</h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Les opérations exclues de la facturation électronique inter-entreprises domestique font l'objet d'un e-reporting (article 290 du CGI).
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                Ce dispositif concerne les ventes à des particuliers (B2C) et les opérations avec des clients situés hors de France (Union européenne et international). Les données globales de ces transactions devront être transmises à l'administration selon une fréquence définie.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Où en est Bylz ? */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-700" />
            <span>Où en est Bylz ?</span>
          </h2>

          <div className="p-6 sm:p-8 space-y-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
            {/* Mention statut réel obligatoire */}
            <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Statut officiel de notre logiciel
              </span>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                Bylz produit aujourd'hui des factures PDF avec les mentions légales essentielles. La génération du format Factur-X et le raccordement à une plateforme agréée sont en préparation.
              </p>
              <p className="text-xs text-slate-700 leading-relaxed pt-1 border-t border-blue-200/60">
                Bylz ne propose pas encore la réception de factures électroniques. Pour recevoir des factures dès le 1er septembre 2026, vous devez disposer d'une adresse de réception sur une plateforme agréée de votre choix.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900">Ce que vous pouvez faire dès maintenant avec Bylz</h3>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Mentions légales essentielles intégrées :</strong> taux de pénalités de retard (trois fois le taux de l'intérêt légal en toutes lettres), indemnité forfaitaire pour frais de recouvrement de 40 €, mention "EI" automatique pour les entrepreneurs individuels, et date de vente ou de prestation.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Livre chronologique des recettes avec export CSV :</strong> enregistrement de vos encaissements et téléchargement de votre registre au format CSV.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Calcul automatique des cotisations URSSAF (plans Solo et Pro) :</strong> estimation instantanée de vos charges selon la nature de votre activité (BNC, prestations BIC, vente BIC).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Suivi du seuil de franchise en base de TVA (plans Solo et Pro) :</strong> alertes en direct avant d'atteindre le seuil légal de 37 500 € en services ou 85 000 € en vente (art. 293 B du CGI).
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 5. Foire Aux Questions (FAQ) */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-700" />
            <span>Foire aux questions</span>
          </h2>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div key={idx} className="p-6 space-y-2 border border-slate-200 rounded-2xl bg-slate-50 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 flex items-start gap-2">
                  <span className="text-blue-700 font-black text-sm">Q{idx + 1}.</span>
                  <span>{item.q}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-6">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Liens utiles vers le blog et la conformité */}
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-700" />
            <span>Guides et ressources utiles pour approfondir</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/blog/reforme-factur-x-2026-auto-entrepreneurs"
              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 shadow-sm transition-all space-y-1 group min-h-[44px] flex flex-col justify-center"
            >
              <span className="text-xs font-bold text-blue-700 group-hover:underline flex items-center gap-1">
                <span>Guide complet Factur-X 2026</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs text-slate-600">
                Détail des échéances légales et du fonctionnement du standard hybride Factur-X.
              </p>
            </Link>

            <Link
              to="/conformite"
              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 shadow-sm transition-all space-y-1 group min-h-[44px] flex flex-col justify-center"
            >
              <span className="text-xs font-bold text-blue-700 group-hover:underline flex items-center gap-1">
                <span>Sécurité et conformité fiscale</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs text-slate-600">
                Découvrez nos engagements sur le livre des recettes, les données figées et l'hébergement en Europe.
              </p>
            </Link>
          </div>
        </section>

        {/* 6. Section Appel à l'action (CTA) */}
        <section className="text-center p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200 space-y-6 shadow-sm">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Générez vos factures avec mentions légales dès aujourd'hui
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Créez votre compte en moins d'une minute, sans carte bancaire requise. Émettez des factures PDF avec toutes les mentions légales essentielles.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/signup?plan=starter"
              className="inline-flex items-center gap-2 px-8 py-3.5 min-h-[44px] rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all"
            >
              <span>Essayer gratuitement</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter theme="light" />
    </div>
  );
}
