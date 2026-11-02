import { useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { Check, X, Sparkles } from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { TrustBadgesRow } from "../components/marketing/TrustBadgesRow";
import { Button } from "../components/ui/Button";
import { BillingToggle } from "../components/shared/BillingToggle";
import { type BillingCycle } from "../lib/constants";
import { PLANS_DATA, FEATURE_MATRIX, VAT_MENTION_FRANCHISE } from "../lib/plansData";

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");

  const productSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `Bylz ${PLANS_DATA.starter.name}`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: PLANS_DATA.starter.description,
      offers: {
        "@type": "Offer",
        price: "0.00",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        priceValidUntil: "2026-12-31",
        url: "https://bylz.fr/tarifs",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `Bylz ${PLANS_DATA.solo.name}`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: PLANS_DATA.solo.description,
      offers: {
        "@type": "Offer",
        price:
          billingCycle === "annual"
            ? PLANS_DATA.solo.pricing.annualTotal.toFixed(2)
            : PLANS_DATA.solo.pricing.monthlyPrice.toFixed(2),
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        priceValidUntil: "2026-12-31",
        url: "https://bylz.fr/tarifs",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `Bylz ${PLANS_DATA.pro.name}`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: PLANS_DATA.pro.description,
      offers: {
        "@type": "Offer",
        price:
          billingCycle === "annual"
            ? PLANS_DATA.pro.pricing.annualTotal.toFixed(2)
            : PLANS_DATA.pro.pricing.monthlyPrice.toFixed(2),
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        priceValidUntil: "2026-12-31",
        url: "https://bylz.fr/tarifs",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary/20 selection:text-primary">
      <SEO
        title="Tarifs Bylz : Logiciel de Facturation et Pilotage Fiscal pour Micro-Entrepreneurs"
        description="Découvrez nos tarifs simples et sans engagement : Solo 50€/an (ou 8,90€/mois) et Pro 80€/an (ou 12,90€/mois). 14 jours d'essai offerts."
        canonical="/tarifs"
        jsonLd={productSchemas}
      />

      <MarketingNavbar />

      <main className="pt-28 sm:pt-32 pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-pill bg-primary/10 text-primary text-xs font-bold border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparence Totale • Sans engagement</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text">
              Des tarifs simples pour booster votre activité
            </h1>
            <p className="text-sm sm:text-base text-muted font-medium">
              Démarrez gratuitement avec le plan Starter ou libérez tout le potentiel de votre entreprise avec 14 jours d'essai offerts.
            </p>
            <p className="text-xs text-muted font-normal">
              {VAT_MENTION_FRANCHISE}
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="pt-4">
              <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {/* Starter */}
            <div className="bg-surface border border-border rounded-card p-6 sm:p-8 flex flex-col justify-between card-shadow">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-text">{PLANS_DATA.starter.name}</h2>
                  <p className="text-xs text-muted mt-1 font-medium">{PLANS_DATA.starter.description}</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-text font-mono">0 €</span>
                    <span className="text-xs text-muted">/ mois</span>
                  </div>
                  <p className="text-[11px] text-muted mt-1">{VAT_MENTION_FRANCHISE}</p>
                </div>
                <p className="text-xs text-muted leading-relaxed border-t border-border pt-4 font-normal">
                  Idéal pour démarrer votre activité en toute conformité légale.
                </p>
                <ul className="space-y-2 text-xs text-muted font-medium pt-2">
                  {PLANS_DATA.starter.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link to="/signup?plan=starter" className="block w-full">
                  <Button variant="outline" className="w-full justify-center">
                    Créer un compte gratuit
                  </Button>
                </Link>
              </div>
            </div>

            {/* Solo */}
            <div className="relative bg-surface border-2 border-primary rounded-card p-6 sm:p-8 flex flex-col justify-between bylz-glow-primary scale-100 md:scale-105 z-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-pill shadow-md flex items-center gap-1.5">
                <span>★ LE PLUS POPULAIRE</span>
                {billingCycle === "annual" && (
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                    -{PLANS_DATA.solo.pricing.discountBadgePercent}%
                  </span>
                )}
              </div>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-text">{PLANS_DATA.solo.name}</h2>
                  <p className="text-xs text-muted mt-1 font-medium">{PLANS_DATA.solo.description}</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-primary font-mono">
                      {billingCycle === "annual"
                        ? `${PLANS_DATA.solo.pricing.annualMonthlyEquivFormatted} €`
                        : `${PLANS_DATA.solo.pricing.monthlyPrice.toFixed(2).replace(".", ",")} €`}
                    </span>
                    <span className="text-xs text-muted">/ mois</span>
                  </div>
                  {billingCycle === "annual" ? (
                    <p className="text-[11px] font-bold text-emerald-500 mt-1">
                      soit {PLANS_DATA.solo.pricing.annualTotal} € / an ({VAT_MENTION_FRANCHISE})
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-muted mt-1">
                      facturé {PLANS_DATA.solo.pricing.monthlyPrice.toFixed(2).replace(".", ",")} € par mois sans engagement
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted leading-relaxed border-t border-border pt-4 font-normal">
                  Pour les indépendants qui veulent un suivi fiscal rigoureux et du temps libéré.
                </p>
                <ul className="space-y-2 text-xs text-muted font-medium pt-2">
                  {PLANS_DATA.solo.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link to={`/signup?plan=solo&billing=${billingCycle}`} className="block w-full">
                  <Button variant="primary" className="w-full justify-center bylz-glow-cta py-3.5">
                    Essayer Solo (14 jours offerts)
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pro */}
            <div className="bg-surface border border-border rounded-card p-6 sm:p-8 flex flex-col justify-between card-shadow">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-text">{PLANS_DATA.pro.name}</h2>
                    {billingCycle === "annual" && (
                      <span className="bg-accent/10 text-accent font-bold text-[11px] px-2 py-0.5 rounded-full border border-accent/20">
                        -{PLANS_DATA.pro.pricing.discountBadgePercent}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-1 font-medium">{PLANS_DATA.pro.description}</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-text font-mono">
                      {billingCycle === "annual"
                        ? `${PLANS_DATA.pro.pricing.annualMonthlyEquivFormatted} €`
                        : `${PLANS_DATA.pro.pricing.monthlyPrice.toFixed(2).replace(".", ",")} €`}
                    </span>
                    <span className="text-xs text-muted">/ mois</span>
                  </div>
                  {billingCycle === "annual" ? (
                    <p className="text-[11px] font-bold text-emerald-500 mt-1">
                      soit {PLANS_DATA.pro.pricing.annualTotal} € / an ({VAT_MENTION_FRANCHISE})
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-muted mt-1">
                      facturé {PLANS_DATA.pro.pricing.monthlyPrice.toFixed(2).replace(".", ",")} € par mois sans engagement
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted leading-relaxed border-t border-border pt-4 font-normal">
                  Pour encaisser par carte, gérer plusieurs structures et piloter par IA.
                </p>
                <ul className="space-y-2 text-xs text-muted font-medium pt-2">
                  {PLANS_DATA.pro.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link to={`/signup?plan=pro&billing=${billingCycle}`} className="block w-full">
                  <Button variant="outline" className="w-full justify-center">
                    Essayer Pro (14 jours offerts)
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Full Comparison Table with Touch Scroll */}
          <div className="pt-8 sm:pt-12 space-y-6 sm:space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-text">Comparatif détaillé des fonctionnalités</h2>
              <p className="text-xs text-muted font-medium">Glissez horizontalement pour comparer tous les plans</p>
            </div>

            <div className="bg-surface border border-border rounded-card overflow-hidden card-shadow">
              <div className="overflow-x-auto touch-pan-y">
                <table className="w-full min-w-[550px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-hover border-b border-border text-text font-bold">
                      <th className="p-4">Fonctionnalité</th>
                      <th className="p-4 text-center w-28">Starter</th>
                      <th className="p-4 text-center w-28 text-primary font-extrabold">Solo</th>
                      <th className="p-4 text-center w-28 text-accent font-extrabold">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {FEATURE_MATRIX.map((cat, idx) => (
                      <Fragment key={idx}>
                        <tr className="bg-surface-hover/50">
                          <td colSpan={4} className="p-3.5 font-bold text-primary uppercase text-[11px] tracking-wider">
                            {cat.category}
                          </td>
                        </tr>
                        {cat.features.map((feat, fIdx) => (
                          <tr key={fIdx} className="hover:bg-surface-hover/30 transition-colors">
                            <td className="p-4 font-medium text-text">{feat.name}</td>
                            <td className="p-4 text-center">
                              {typeof feat.starter === "boolean" ? (
                                feat.starter ? <Check className="w-4 h-4 text-success mx-auto" /> : <X className="w-4 h-4 text-muted/40 mx-auto" />
                              ) : (
                                <span className="font-bold text-text">{feat.starter}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {typeof feat.solo === "boolean" ? (
                                feat.solo ? <Check className="w-4 h-4 text-primary mx-auto" /> : <X className="w-4 h-4 text-muted/40 mx-auto" />
                              ) : (
                                <span className="font-bold text-primary">{feat.solo}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {typeof feat.pro === "boolean" ? (
                                feat.pro ? <Check className="w-4 h-4 text-accent mx-auto" /> : <X className="w-4 h-4 text-muted/40 mx-auto" />
                              ) : (
                                <span className="font-bold text-accent">{feat.pro}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <TrustBadgesRow />
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
