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
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { Card } from "../components/ui/Card";

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
    <div className="min-h-screen bg-bg text-text">
      <SEO
        title="Facturation électronique auto-entrepreneur 2026 | Bylz"
        description="Calendrier officiel, obligations B2B et démarches de facturation électronique pour auto-entrepreneurs en 2026 et 2027. Source : impots.gouv.fr."
        canonical="/facturation-electronique"
        jsonLd={jsonLdData}
      />
      <MarketingNavbar />

      <main className="pt-28 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* En-tête et Titre H1 */}
        <header className="space-y-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Source : impots.gouv.fr</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text leading-tight">
            Facturation électronique 2026 et 2027 : ce que doivent faire les auto-entrepreneurs
          </h1>

          <p className="text-base sm:text-lg text-muted leading-relaxed">
            Calendrier officiel, champ d'application légal et démarches concrètes pour les micro-entrepreneurs et indépendants en France.
          </p>
        </header>

        {/* 1. Résumé en 3 points */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <span>L'essentiel de la réforme en 3 points</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-3 border border-border bg-surface/90">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="font-bold text-base text-text">1er septembre 2026 : Réception obligatoire</h3>
              <p className="text-xs text-muted leading-relaxed">
                Toutes les entreprises assujetties à la TVA, y compris les micro-entreprises, ont l'obligation de pouvoir recevoir des factures au format électronique.
              </p>
            </Card>

            <Card className="p-6 space-y-3 border border-border bg-surface/90">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="font-bold text-base text-text">1er septembre 2027 : Émission pour micro-entreprises</h3>
              <p className="text-xs text-muted leading-relaxed">
                L'obligation d'émettre des factures électroniques s'appliquera aux PME et micro-entrepreneurs à compter du 1er septembre 2027.
              </p>
            </Card>

            <Card className="p-6 space-y-3 border border-border bg-surface/90">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="font-bold text-base text-text">Plateforme Agréée obligatoire</h3>
              <p className="text-xs text-muted leading-relaxed">
                À terme, les factures électroniques B2B ne s'échangeront plus par simple e-mail : la réception est obligatoire dès le 1er septembre 2026 pour toutes les entreprises, et l'émission au 1er septembre 2027 pour les micro-entreprises via une Plateforme Agréée (PA).
              </p>
            </Card>
          </div>

          <p className="text-xs text-muted text-center pt-2">
            Source officielle :{" "}
            <a
              href="https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 inline-flex items-center gap-1"
            >
              <span>impots.gouv.fr, Je passe à la facturation électronique</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </section>

        {/* 2. Suis-je concerné ? */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text flex items-center gap-2">
            <Building className="w-6 h-6 text-primary" />
            <span>Suis-je concerné ?</span>
          </h2>

          <Card className="p-6 sm:p-8 space-y-4 border border-border bg-surface/90">
            <p className="text-sm text-text leading-relaxed font-medium">
              Oui, si vous vendez ou fournissez des prestations de services à d'autres professionnels en France.
            </p>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Même si vous êtes au régime de la franchise en base de TVA (article 293 B du Code général des impôts) et que vous ne facturez pas de TVA, vous restez fiscalement qualifié d'assujetti à la TVA au sens de l'article 256 A du CGI.
            </p>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Selon les règles publiées par la Direction générale des Finances publiques (DGFiP), l'obligation de facturation électronique concerne l'ensemble des opérations d'achats et de ventes de biens ou de prestations de services réalisées entre entreprises assujetties à la TVA établies sur le territoire français (transactions B2B domestiques).
            </p>

            <div className="pt-2 border-t border-border/60">
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-text">
                <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-blue-400">Règle officielle impots.gouv.fr :</span>
                  <p className="text-muted leading-relaxed">
                    Les entreprises exonérées ou en franchise en base de TVA entrent dans le périmètre du dispositif pour leurs transactions inter-entreprises. Seules certaines opérations dispensées de facturation (comme certaines activités médicales ou financières expressément exonérées par le CGI) sont exclues du périmètre.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. Qu'est-ce qui change concrètement ? */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            <span>Qu'est-ce qui change concrètement ?</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-3 border border-border bg-surface/90">
              <h3 className="text-base font-bold text-text">Les 3 formats autorisés</h3>
              <p className="text-xs text-muted leading-relaxed">
                Une facture électronique n'est pas un simple PDF scanné. Elle doit respecter une structure normée (norme européenne EN 16931). Trois formats sont validés :
              </p>
              <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
                <li><strong>Factur-X</strong> : format hybride composé d'un fichier PDF lisible et d'un fichier XML structuré embarqué.</li>
                <li><strong>UBL</strong> (Universal Business Language) : fichier de données structuré XML.</li>
                <li><strong>UN/CEFACT CII</strong> : format international structuré XML.</li>
              </ul>
            </Card>

            <Card className="p-6 space-y-3 border border-border bg-surface/90">
              <h3 className="text-base font-bold text-text">Le rôle de la Plateforme Agréée</h3>
              <p className="text-xs text-muted leading-relaxed">
                Selon le calendrier officiel, la réception de factures électroniques via une Plateforme Agréée (PA) est obligatoire pour toutes les entreprises dès le 1er septembre 2026. L'obligation d'émission s'appliquera dès le 1er septembre 2026 pour les grandes entreprises et ETI, puis au 1er septembre 2027 pour les PME et micro-entreprises.
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Pour les flux soumis à la réforme, les échanges de factures électroniques transiteront par une plateforme partenaire qui contrôle la validité du format et achemine les données réglementaires vers l'administration fiscale (fonctionnalité actuellement en préparation sur Bylz).
              </p>
            </Card>

            <Card className="p-6 space-y-3 border border-border bg-surface/90">
              <h3 className="text-base font-bold text-text">Le dispositif de e-reporting</h3>
              <p className="text-xs text-muted leading-relaxed">
                Les opérations exclues de la facturation électronique inter-entreprises domestique font l'objet d'un e-reporting (article 290 du CGI).
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Ce dispositif concerne les ventes à des particuliers (B2C) et les opérations avec des clients situés hors de France (Union européenne et international). Les données globales de ces transactions devront être transmises à l'administration selon une fréquence définie.
              </p>
            </Card>
          </div>
        </section>

        {/* 4. Où en est Bylz ? */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span>Où en est Bylz ?</span>
          </h2>

          <Card className="p-6 sm:p-8 space-y-6 border border-primary/30 bg-surface/90">
            {/* Mention statut réel obligatoire */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Statut officiel de notre logiciel
              </span>
              <p className="text-sm font-semibold text-text leading-relaxed">
                Bylz produit aujourd'hui des factures PDF avec les mentions légales essentielles. La génération du format Factur-X et le raccordement à une plateforme agréée sont en préparation.
              </p>
              <p className="text-xs text-muted leading-relaxed pt-1 border-t border-border/40">
                Bylz ne propose pas encore la réception de factures électroniques. Pour recevoir des factures dès le 1er septembre 2026, vous devez disposer d'une adresse de réception sur une plateforme agréée de votre choix.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-text">Ce que vous pouvez faire dès maintenant avec Bylz</h3>
              <ul className="text-xs sm:text-sm text-muted space-y-2">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Mentions légales essentielles intégrées :</strong> taux de pénalités de retard (trois fois le taux de l'intérêt légal en toutes lettres), indemnité forfaitaire pour frais de recouvrement de 40 €, mention "EI" automatique pour les entrepreneurs individuels, et date de vente ou de prestation.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Livre chronologique des recettes avec export CSV :</strong> enregistrement de vos encaissements et téléchargement de votre registre au format CSV.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Calcul automatique des cotisations URSSAF (plans Solo et Pro) :</strong> estimation instantanée de vos charges selon la nature de votre activité (BNC, prestations BIC, vente BIC).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Suivi du seuil de franchise en base de TVA (plans Solo et Pro) :</strong> alertes en direct avant d'atteindre le seuil légal de 37 500 € en services ou 85 000 € en vente (art. 293 B du CGI).
                  </span>
                </li>
              </ul>
            </div>
          </Card>
        </section>

        {/* 5. Foire Aux Questions (FAQ) */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            <span>Foire aux questions</span>
          </h2>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <Card key={idx} className="p-6 space-y-2 border border-border bg-surface/90">
                <h3 className="text-base font-bold text-text flex items-start gap-2">
                  <span className="text-primary font-black text-sm">Q{idx + 1}.</span>
                  <span>{item.q}</span>
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed pl-6">
                  {item.a}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Liens utiles vers le blog et la conformité */}
        <section className="space-y-4 pt-4 border-t border-border/50">
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Guides et ressources utiles pour approfondir</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/blog/reforme-factur-x-2026-auto-entrepreneurs"
              className="p-4 rounded-xl border border-border bg-surface/60 hover:border-primary/50 transition-colors space-y-1 group"
            >
              <span className="text-xs font-bold text-primary group-hover:underline flex items-center gap-1">
                <span>Guide complet Factur-X 2026</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs text-muted">
                Détail des échéances légales et du fonctionnement du standard hybride Factur-X.
              </p>
            </Link>

            <Link
              to="/conformite"
              className="p-4 rounded-xl border border-border bg-surface/60 hover:border-primary/50 transition-colors space-y-1 group"
            >
              <span className="text-xs font-bold text-primary group-hover:underline flex items-center gap-1">
                <span>Sécurité et conformité fiscale</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs text-muted">
                Découvrez nos engagements sur le livre des recettes, les données figées et l'hébergement en Europe.
              </p>
            </Link>
          </div>
        </section>

        {/* 6. Section Appel à l'action (CTA) */}
        <section className="text-center p-8 sm:p-12 rounded-2xl bg-gradient-to-b from-surface/90 to-surface border border-border space-y-6">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-text tracking-tight">
              Générez vos factures avec mentions légales dès aujourd'hui
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Créez votre compte en moins d'une minute, sans carte bancaire requise. Émettez des factures PDF avec toutes les mentions légales essentielles.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/signup?plan=starter"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all"
            >
              <span>Essayer gratuitement</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
