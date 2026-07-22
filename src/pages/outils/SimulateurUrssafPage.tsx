import { useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Calculator, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { SEO } from "../../components/seo/SEO";
import { MarketingNavbar } from "../../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../../components/marketing/MarketingFooter";
import { TrustBadgesRow } from "../../components/marketing/TrustBadgesRow";

export function SimulateurUrssafPage() {
  const [ca, setCa] = useState<number>(32000);
  const [activity, setActivity] = useState<"bnc" | "bic_service" | "bic_vente">("bnc");
  const [acacre, setAcacre] = useState<boolean>(false);
  const [tmi, setTmi] = useState<number>(11); // 0%, 11%, 30%

  // Activity rates & abattements
  const rates = {
    bnc: { normal: 0.231, acacre: 0.121, abattement: 0.34, label: "Professions Libérales (BNC)" },
    bic_service: { normal: 0.212, acacre: 0.106, abattement: 0.50, label: "Prestations de Services (BIC)" },
    bic_vente: { normal: 0.123, acacre: 0.062, abattement: 0.71, label: "Vente de Marchandises (BIC)" },
  };

  const currentRateConfig = rates[activity];
  const effectiveRate = acacre ? currentRateConfig.acacre : currentRateConfig.normal;

  const urssafAmount = Math.round(ca * effectiveRate);
  const grossNet = ca - urssafAmount;

  // Impôt estimé
  const abattementAmount = ca * currentRateConfig.abattement;
  const taxableIncome = Math.max(0, ca - abattementAmount);
  const estimatedTax = Math.round(taxableIncome * (tmi / 100));
  const finalNet = grossNet - estimatedTax;

  const calculatorSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Simulateur Cotisations URSSAF 2026 — Bylz",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
  };

  return (
    <div className="min-h-screen bg-bg text-text bg-grid-pattern selection:bg-brand-primary/20 selection:text-brand-primary">
      <SEO
        title="Simulateur Cotisations URSSAF 2026 Gratuit — Micro-Entreprise BNC & BIC"
        description="Calculez gratuitement et en direct vos cotisations sociales URSSAF et votre revenu net après impôt en micro-entreprise (BNC, BIC Service, BIC Vente)."
        canonical="/outils/simulateur-urssaf"
        jsonLd={calculatorSchema}
      />

      <MarketingNavbar />

      <main className="pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-primary/15 border border-brand-primary/30 text-brand-primary text-xs font-bold shadow-sm">
              <Calculator className="w-4 h-4 text-brand-accent" />
              <span>Outil Gratuit & Conforme 2026</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-text">
              Simulateur de Cotisations URSSAF 2026
            </h1>
            <p className="text-base text-text/80 leading-relaxed font-normal">
              Estimez exactement vos charges sociales, votre abattement fiscal et votre reste à vivre net en fonction de votre Chiffre d'Affaires.
            </p>
          </div>

          {/* Main Interactive Card */}
          <div className="bg-surface/90 backdrop-blur-xl border border-white/10 dark:border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 glow-primary">
            {/* Input 1: CA Slider & Number */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-sm font-extrabold text-text">
                  Chiffre d'Affaires Annuel Encaissé (HT)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={ca}
                    onChange={(e) => setCa(Math.max(0, Number(e.target.value)))}
                    className="w-36 bg-surface border border-brand-primary/50 rounded-xl px-3 py-2 text-right font-mono font-black text-brand-primary text-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <span className="font-bold text-text text-sm">€</span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100000}
                step={1000}
                value={ca}
                onChange={(e) => setCa(Number(e.target.value))}
                className="w-full h-3 bg-border rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />

              <div className="flex flex-wrap gap-2 pt-1">
                {[10000, 25000, 38500, 50000, 77700].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCa(val)}
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all ${
                      ca === val
                        ? "bg-brand-primary text-white border-brand-primary shadow-md"
                        : "bg-surface-hover border-border text-text/80 hover:border-brand-primary/50"
                    }`}
                  >
                    {val.toLocaleString("fr-FR")} €
                  </button>
                ))}
              </div>
            </div>

            {/* Input 2: Activity Category */}
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-text">Catégorie d'Activité</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(rates) as Array<keyof typeof rates>).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActivity(key)}
                    className={`p-3.5 rounded-2xl border text-left font-bold text-xs transition-all ${
                      activity === key
                        ? "bg-brand-primary/15 border-brand-primary text-brand-primary shadow-md"
                        : "bg-surface-hover/60 border-border text-text/80 hover:border-border/80"
                    }`}
                  >
                    <p>{rates[key].label}</p>
                    <p className="text-[11px] text-text/60 font-mono mt-1">
                      Taux : {(rates[key].normal * 100).toFixed(1)}% | Abattement : {(rates[key].abattement * 100)}%
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Options: ACRE & TMI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
              <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-surface-hover/50 border border-border">
                <input
                  type="checkbox"
                  id="acacre"
                  checked={acacre}
                  onChange={(e) => setAcacre(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary cursor-pointer"
                />
                <label htmlFor="acacre" className="text-xs font-bold text-text cursor-pointer">
                  Bénéficiaire ACRE (Taux réduit la 1ère année)
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-hover/50 border border-border text-xs">
                <label className="font-bold text-text">Tranche Marginale Impôt (TMI)</label>
                <select
                  value={tmi}
                  onChange={(e) => setTmi(Number(e.target.value))}
                  className="bg-surface border border-border rounded-xl px-2 py-1.5 font-bold text-brand-primary focus:outline-none"
                >
                  <option value={0}>0 % (Non imposable)</option>
                  <option value={11}>11 % (Tranche standard)</option>
                  <option value={30}>30 % (Tranche supérieure)</option>
                </select>
              </div>
            </div>

            {/* Results Grid */}
            <div className="pt-4 border-t border-border/80 space-y-4">
              <h4 className="text-sm font-extrabold text-text uppercase tracking-wider">Résultats du calcul</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/30">
                  <p className="text-xs text-text/70 font-semibold mb-1">Cotisations URSSAF ({(effectiveRate * 100).toFixed(1)}%)</p>
                  <p className="text-2xl font-black text-brand-primary font-mono">
                    {urssafAmount.toLocaleString("fr-FR")} €
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-hover/80 border border-border">
                  <p className="text-xs text-text/70 font-semibold mb-1">Impôt estimé (TMI {tmi}%)</p>
                  <p className="text-2xl font-black text-amber-500 font-mono">
                    {estimatedTax.toLocaleString("fr-FR")} €
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-xs text-text/70 font-semibold mb-1">Revenu Net Final Estimé</p>
                  <p className="text-2xl font-black text-emerald-500 font-mono">
                    {finalNet.toLocaleString("fr-FR")} €
                  </p>
                </div>
              </div>
            </div>
          </div>

          <TrustBadgesRow />

          {/* CTA Banner to Signup */}
          <div className="bg-gradient-to-r from-brand-primary via-indigo-600 to-brand-accent text-white rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-black">
              Passez de la simulation à l'automatisation avec Bylz
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto font-medium">
              Bylz enregistre automatiquement vos encaissements et calcule vos cotisations URSSAF en temps réel sur votre tableau de bord.
            </p>
            <div>
              <Link
                to="/signup?plan=starter"
                className="inline-flex items-center space-x-2 text-sm font-black text-brand-primary bg-white hover:bg-slate-100 px-8 py-3.5 rounded-full shadow-xl"
              >
                <span>Créer un compte gratuit</span>
                <ArrowRight className="w-4 h-4 text-brand-primary" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
