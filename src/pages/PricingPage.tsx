import { useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { Check, X, Sparkles, ChevronDown } from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { SEO_METADATA } from "../lib/seoMeta";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { TrustBadgesRow } from "../components/marketing/TrustBadgesRow";
import { Button } from "../components/ui/Button";
import { BillingToggle } from "../components/shared/BillingToggle";
import {
  PLANS_DATA,
  FEATURE_MATRIX,
  VAT_MENTION_FRANCHISE,
} from "../lib/plansData";
import { FAQS_LIST } from "../data/faqData";

type BillingCycle = "annual" | "monthly";

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const productSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `Bylz ${PLANS_DATA.starter.name}`,
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
      "@type": "Product",
      name: `Bylz ${PLANS_DATA.solo.name}`,
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
      "@type": "Product",
      name: `Bylz ${PLANS_DATA.pro.name}`,
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
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <SEO
        title={SEO_METADATA["/tarifs"].title}
        description={SEO_METADATA["/tarifs"].description}
        canonical={SEO_METADATA["/tarifs"].canonical}
        jsonLd={productSchemas}
      />

      <MarketingNavbar theme="light" />

      <main id="main-content" className="pt-28 sm:pt-32 pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Transparence Totale • Sans engagement</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              Des tarifs simples, sans engagement
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Démarrez gratuitement avec le plan Starter ou libérez tout le potentiel de votre entreprise avec 14 jours d'essai offerts.
            </p>
            <p className="text-xs text-slate-500 font-normal">
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{PLANS_DATA.starter.name}</h2>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{PLANS_DATA.starter.description}</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-slate-900 font-mono">0 €</span>
                    <span className="text-xs text-slate-600">/ mois</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{VAT_MENTION_FRANCHISE}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-4 font-normal">
                  Idéal pour démarrer votre activité en toute conformité légale.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 font-medium pt-2">
                  {PLANS_DATA.starter.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link to="/signup?plan=starter" className="block w-full">
                  <Button variant="outline" className="w-full justify-center min-h-[44px] text-slate-800 border-slate-300 hover:bg-slate-50 font-bold">
                    Commencer gratuitement
                  </Button>
                </Link>
              </div>
            </div>

            {/* Solo */}
            <div className="relative bg-slate-50 border-2 border-blue-600 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-lg scale-100 md:scale-105 z-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                <span>★ {PLANS_DATA.solo.badge}</span>
              </div>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{PLANS_DATA.solo.name}</h2>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{PLANS_DATA.solo.description}</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-blue-700 font-mono">
                      {billingCycle === "annual"
                        ? `${PLANS_DATA.solo.pricing.annualTotal} €`
                        : `${PLANS_DATA.solo.pricing.monthlyPrice.toFixed(2).replace(".", ",")} €`}
                    </span>
                    <span className="text-xs text-slate-600">/ {billingCycle === "annual" ? "an" : "mois"}</span>
                  </div>
                  {billingCycle === "annual" ? (
                    <p className="text-xs font-bold text-emerald-800 mt-1.5">
                      (soit {PLANS_DATA.solo.pricing.annualMonthlyEquivFormatted} / mois • {PLANS_DATA.solo.pricing.annualSavingsFormatted} d'économie)
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-slate-600 mt-1">
                      facturé {PLANS_DATA.solo.pricing.monthlyPrice.toFixed(2).replace(".", ",")} € par mois sans engagement
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-4 font-normal">
                  Pour les indépendants qui veulent un suivi fiscal rigoureux et du temps libéré.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 font-medium pt-2">
                  {PLANS_DATA.solo.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link to={`/signup?plan=solo&billing=${billingCycle}`} className="block w-full">
                  <Button variant="primary" className="w-full justify-center min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md">
                    Commencer gratuitement
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pro */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{PLANS_DATA.pro.name}</h2>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{PLANS_DATA.pro.description}</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-slate-900 font-mono">
                      {billingCycle === "annual"
                        ? `${PLANS_DATA.pro.pricing.annualTotal} €`
                        : `${PLANS_DATA.pro.pricing.monthlyPrice.toFixed(2).replace(".", ",")} €`}
                    </span>
                    <span className="text-xs text-slate-600">/ {billingCycle === "annual" ? "an" : "mois"}</span>
                  </div>
                  {billingCycle === "annual" ? (
                    <p className="text-xs font-bold text-emerald-800 mt-1.5">
                      (soit {PLANS_DATA.pro.pricing.annualMonthlyEquivFormatted} / mois • {PLANS_DATA.pro.pricing.annualSavingsFormatted} d'économie)
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-slate-600 mt-1">
                      facturé {PLANS_DATA.pro.pricing.monthlyPrice.toFixed(2).replace(".", ",")} € par mois sans engagement
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-4 font-normal">
                  Pour les activités en forte croissance avec paiements en ligne et support VIP.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 font-medium pt-2">
                  {PLANS_DATA.pro.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-indigo-700 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link to={`/signup?plan=pro&billing=${billingCycle}`} className="block w-full">
                  <Button variant="primary" className="w-full justify-center min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    Commencer gratuitement
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Full Comparison Table with Touch Scroll */}
          <div className="pt-8 sm:pt-12 space-y-6 sm:space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Comparatif détaillé des fonctionnalités</h2>
              <p className="text-xs text-slate-600 font-medium">Glissez horizontalement pour comparer tous les plans</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto touch-pan-y">
                <table className="w-full min-w-[550px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-900 font-bold">
                      <th className="p-4">Fonctionnalité</th>
                      <th className="p-4 text-center w-28 text-slate-900">Starter</th>
                      <th className="p-4 text-center w-28 text-blue-700 font-extrabold">Solo</th>
                      <th className="p-4 text-center w-28 text-indigo-800 font-extrabold">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {FEATURE_MATRIX.map((cat, idx) => (
                      <Fragment key={idx}>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <td colSpan={4} className="p-3.5 font-bold text-blue-800 uppercase text-[11px] tracking-wider">
                            {cat.category}
                          </td>
                        </tr>
                        {cat.features.map((feat, fIdx) => (
                          <tr key={fIdx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 font-medium text-slate-900">{feat.name}</td>
                            <td className="p-4 text-center">
                              {typeof feat.starter === "boolean" ? (
                                feat.starter ? <Check className="w-4 h-4 text-emerald-700 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                              ) : (
                                <span className="font-bold text-slate-900">{feat.starter}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {typeof feat.solo === "boolean" ? (
                                feat.solo ? <Check className="w-4 h-4 text-blue-700 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                              ) : (
                                <span className="font-bold text-blue-700">{feat.solo}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {typeof feat.pro === "boolean" ? (
                                feat.pro ? <Check className="w-4 h-4 text-indigo-700 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                              ) : (
                                <span className="font-bold text-indigo-800">{feat.pro}</span>
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

          {/* FAQ Section */}
          <section id="faq" className="pt-12 sm:pt-16 space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Foire aux Questions
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-medium">
                Tout ce que vous devez savoir pour démarrer sereinement sur Bylz.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {FAQS_LIST.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shadow-xs transition-colors"
                  >
                    <button
                      type="button"
                      id={`pricing-faq-question-${idx}`}
                      aria-expanded={isOpen}
                      aria-controls={`pricing-faq-answer-${idx}`}
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full text-left px-5 py-4 min-h-[44px] flex items-center justify-between gap-3 font-bold text-slate-900 text-sm hover:text-blue-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded-lg"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-blue-700" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div
                        id={`pricing-faq-answer-${idx}`}
                        role="region"
                        aria-labelledby={`pricing-faq-question-${idx}`}
                        className="px-5 pb-5 pt-1 text-xs text-slate-700 leading-relaxed font-normal border-t border-slate-200"
                      >
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Final CTA Banner */}
          <section className="pt-8 sm:pt-12">
            <div className="rounded-3xl bg-[#011142] text-white p-10 sm:p-14 text-center space-y-6 shadow-xl border border-blue-900/40">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                Prêt à simplifier votre activité ?
              </h2>
              <p className="text-slate-200 text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-medium">
                Créez votre première facture PDF en 2 minutes. Sans carte bancaire et sans engagement.
              </p>
              <div className="pt-2">
                <Link to="/essai" className="inline-flex items-center justify-center min-h-[44px] py-3.5 px-8 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-colors">
                  Créer mon compte gratuitement
                </Link>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Gratuit pour toujours jusqu'à 3 factures/mois
              </p>
            </div>
          </section>
        </div>
      </main>

      <MarketingFooter theme="light" />
    </div>
  );
}
