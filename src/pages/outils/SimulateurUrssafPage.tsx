import { useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, ArrowRight, CheckCircle2, Sparkles, Info } from "lucide-react";
import { SEO } from "../../components/seo/SEO";
import { SEO_METADATA } from "../../lib/seoMeta";
import { MarketingNavbar } from "../../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../../components/marketing/MarketingFooter";
import { TrustBadgesRow } from "../../components/marketing/TrustBadgesRow";
import { URSSAF_RATES_2026, type UrssafActivityKey } from "../../lib/fiscalRates";

export function SimulateurUrssafPage() {
  const [ca, setCa] = useState<number>(32000);
  const [activity, setActivity] = useState<UrssafActivityKey>("bnc_ssi");
  const [acacre, setAcacre] = useState<boolean>(false);
  const [tmi, setTmi] = useState<number>(11); // 0%, 11%, 30%

  // Activity rates & abattements officiels 2026
  const rates: Record<
    UrssafActivityKey,
    {
      normal: number;
      acacre: number;
      abattement: number;
      label: string;
      labelPercent: string;
      abattementLabel: string;
    }
  > = {
    bnc_ssi: {
      normal: URSSAF_RATES_2026.bnc_ssi.rate,
      acacre: 0.128,
      abattement: URSSAF_RATES_2026.bnc_ssi.abattement,
      label: "BNC (SSI)",
      labelPercent: URSSAF_RATES_2026.bnc_ssi.labelPercent,
      abattementLabel: URSSAF_RATES_2026.bnc_ssi.abattementLabel,
    },
    bnc_cipav: {
      normal: URSSAF_RATES_2026.bnc_cipav.rate,
      acacre: 0.116,
      abattement: URSSAF_RATES_2026.bnc_cipav.abattement,
      label: "BNC (CIPAV)",
      labelPercent: URSSAF_RATES_2026.bnc_cipav.labelPercent,
      abattementLabel: URSSAF_RATES_2026.bnc_cipav.abattementLabel,
    },
    bic_service: {
      normal: URSSAF_RATES_2026.bic_service.rate,
      acacre: 0.106,
      abattement: URSSAF_RATES_2026.bic_service.abattement,
      label: "Prestations de Services (BIC)",
      labelPercent: URSSAF_RATES_2026.bic_service.labelPercent,
      abattementLabel: URSSAF_RATES_2026.bic_service.abattementLabel,
    },
    bic_vente: {
      normal: URSSAF_RATES_2026.bic_vente.rate,
      acacre: 0.062,
      abattement: URSSAF_RATES_2026.bic_vente.abattement,
      label: "Vente de Marchandises (BIC)",
      labelPercent: URSSAF_RATES_2026.bic_vente.labelPercent,
      abattementLabel: URSSAF_RATES_2026.bic_vente.abattementLabel,
    },
  };

  const selectedRate = rates[activity];
  const effectiveRate = acacre ? selectedRate.acacre : selectedRate.normal;

  // Calculs financiers
  const urssafAmount = Math.round(ca * effectiveRate);
  const taxableBase = Math.round(ca * (1 - selectedRate.abattement));
  const estimatedTax = Math.round(taxableBase * (tmi / 100));
  const finalNet = Math.round(ca - urssafAmount - estimatedTax);

  const calculatorSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Simulateur Cotisations URSSAF 2026 Bylz",
    applicationCategory: "BusinessApplication",
    description:
      "Calculateur gratuit des cotisations sociales et de l'impôt sur le revenu pour auto-entrepreneurs et micro-entreprises.",
    url: "https://bylz.fr/outils/simulateur-urssaf",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <SEO
        title={SEO_METADATA["/outils/simulateur-urssaf"].title}
        description={SEO_METADATA["/outils/simulateur-urssaf"].description}
        canonical={SEO_METADATA["/outils/simulateur-urssaf"].canonical}
        jsonLd={calculatorSchema}
      />

      <MarketingNavbar theme="light" />

      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold shadow-xs">
              <Calculator className="w-4 h-4 text-blue-700" />
              <span>Outil Gratuit & Conforme 2026</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
              Simulateur de Cotisations URSSAF 2026
            </h1>
            <p className="text-base text-slate-600 leading-relaxed font-medium">
              Estimez exactement vos charges sociales, votre abattement fiscal et votre reste à vivre net en fonction de votre Chiffre d'Affaires.
            </p>
          </div>

          {/* Main Interactive Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg space-y-8">
            {/* Input 1: CA Slider & Number */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-sm font-extrabold text-slate-900">
                  Chiffre d'Affaires Annuel Encaissé (HT)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={ca}
                    onChange={(e) => setCa(Math.max(0, Number(e.target.value)))}
                    className="w-36 bg-slate-50 border border-blue-300 rounded-xl px-3 py-2 text-right font-mono font-black text-blue-700 text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="font-bold text-slate-900 text-sm">€</span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100000}
                step={1000}
                value={ca}
                onChange={(e) => setCa(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              <div className="flex flex-wrap gap-2 pt-1">
                {[10000, 25000, 38500, 50000, 77700].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCa(val)}
                    className={`text-xs font-bold px-3.5 py-1.5 min-h-[44px] inline-flex items-center rounded-full border transition-all ${
                      ca === val
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {val.toLocaleString("fr-FR")} €
                  </button>
                ))}
              </div>
            </div>

            {/* Input 2: Activity Category */}
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-slate-900">Catégorie d'Activité</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(Object.keys(rates) as Array<keyof typeof rates>).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActivity(key)}
                    className={`p-3.5 rounded-2xl border text-left font-bold text-xs min-h-[44px] transition-all ${
                      activity === key
                        ? "bg-blue-50 border-blue-600 text-blue-900 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <p className="font-extrabold">{rates[key].label}</p>
                    <p className="text-[11px] text-slate-700 font-mono mt-1">
                      Taux : {rates[key].labelPercent} | Abattement : {rates[key].abattementLabel}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-600 flex items-start gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>CIPAV : architectes, psychologues, ostéopathes, etc. Si vous n'êtes pas sûr, c'est écrit sur votre notification d'affiliation.</span>
              </p>
            </div>

            {/* Options: ACRE & TMI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 min-h-[44px]">
                <input
                  type="checkbox"
                  id="acacre"
                  checked={acacre}
                  onChange={(e) => setAcacre(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
                <label htmlFor="acacre" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Bénéficiaire ACRE (Taux réduit la 1ère année)
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs min-h-[44px]">
                <label className="font-bold text-slate-800">Tranche Marginale Impôt (TMI)</label>
                <p className="text-xs text-slate-500 font-normal">Taux d'impôt s'appliquant à la tranche supérieure de vos revenus personnels (ex. 11 % ou 30 % selon votre foyer fiscal).</p>
                <select
                  value={tmi}
                  onChange={(e) => setTmi(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-xl px-2 py-1.5 font-bold text-blue-700 focus:outline-none"
                >
                  <option value={0}>0 % (Non imposable)</option>
                  <option value={11}>11 % (Tranche standard)</option>
                  <option value={30}>30 % (Tranche supérieure)</option>
                </select>
              </div>
            </div>

            {/* Results Grid */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Résultats du calcul</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
                  <p className="text-xs text-blue-900 font-semibold mb-1">Cotisations URSSAF ({(effectiveRate * 100).toFixed(1).replace(".", ",")} %)</p>
                  <p className="text-2xl font-black text-blue-700 font-mono">
                    {urssafAmount.toLocaleString("fr-FR")} €
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-900 font-semibold mb-1">Impôt estimé (TMI {tmi} %)</p>
                  <p className="text-2xl font-black text-amber-700 font-mono">
                    {estimatedTax.toLocaleString("fr-FR")} €
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-900 font-semibold mb-1">Revenu Net Final Estimé</p>
                  <p className="text-2xl font-black text-emerald-800 font-mono">
                    {finalNet.toLocaleString("fr-FR")} €
                  </p>
                </div>
              </div>
            </div>
          </div>

          <TrustBadgesRow />

          {/* CTA Banner to Signup */}
          <div className="bg-[#011142] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl border border-blue-900/40">
            <h2 className="text-2xl sm:text-3xl font-black">
              Passez de la simulation à l'automatisation avec Bylz
            </h2>
            <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto font-medium">
              Bylz enregistre automatiquement vos encaissements et calcule vos cotisations URSSAF en temps réel sur votre tableau de bord.
            </p>
            <div>
              <Link
                to="/signup?plan=starter"
                className="inline-flex items-center min-h-[44px] space-x-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-8 py-3.5 rounded-full shadow-lg transition-colors"
              >
                <span>Créer un compte gratuit</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter theme="light" />
    </div>
  );
}
