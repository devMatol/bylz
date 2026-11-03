import { useState } from "react";
import { Calculator, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { SEO } from "../../components/seo/SEO";
import { SEO_METADATA } from "../../lib/seoMeta";
import { MarketingNavbar } from "../../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../../components/marketing/MarketingFooter";
import { TrustBadgesRow } from "../../components/marketing/TrustBadgesRow";

export function SimulateurTvaPage() {
  const [ca, setCa] = useState<number>(32500);
  const [activity, setActivity] = useState<"service" | "vente">("service");

  const thresholds = {
    service: { base: 37500, majore: 41250 },
    vente: { base: 85000, majore: 93500 },
  };

  const currentThreshold = thresholds[activity];
  const percentBase = Math.round((ca / currentThreshold.base) * 100);
  const isBaseExceeded = ca > currentThreshold.base;
  const isMajoreExceeded = ca > currentThreshold.majore;

  const calculatorSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Simulateur Plafond TVA Micro-Entreprise 2026",
    applicationCategory: "BusinessApplication",
    description:
      "Calculateur gratuit pour vérifier l'approche des seuils de franchise de TVA en micro-entreprise.",
    url: "https://bylz.fr/outils/simulateur-seuil-tva",
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
        title={SEO_METADATA["/outils/simulateur-seuil-tva"].title}
        description={SEO_METADATA["/outils/simulateur-seuil-tva"].description}
        canonical={SEO_METADATA["/outils/simulateur-seuil-tva"].canonical}
        jsonLd={calculatorSchema}
      />

      <MarketingNavbar theme="light" />

      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold shadow-xs">
              <Calculator className="w-4 h-4 text-blue-700" />
              <span>Calculateur de Plafonds TVA</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
              Simulateur Seuil de Franchise de TVA 2026
            </h1>
            <p className="text-base text-slate-600 leading-relaxed font-medium">
              Vérifiez si vous êtes en franchise de TVA ou si vous approchez du seuil de basculement.
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg space-y-8">
            {/* Input CA */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-sm font-extrabold text-slate-900">
                  Chiffre d'Affaires Cumulé de l'Année
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
                max={activity === "service" ? 50000 : 130000}
                step={500}
                value={ca}
                onChange={(e) => setCa(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Activity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-slate-900">Secteur d'Activité</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActivity("service")}
                  className={`p-4 rounded-2xl border text-left font-bold text-xs min-h-[44px] transition-all ${
                    activity === "service"
                      ? "bg-blue-50 border-blue-600 text-blue-900 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-sm font-bold">Prestations de Services & Libéral</p>
                  <p className="text-[11px] text-slate-700 mt-1">Seuil base : 37 500 € | Seuil majoré : 41 250 €</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActivity("vente")}
                  className={`p-4 rounded-2xl border text-left font-bold text-xs min-h-[44px] transition-all ${
                    activity === "vente"
                      ? "bg-blue-50 border-blue-600 text-blue-900 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-sm font-bold">Vente de Marchandises</p>
                  <p className="text-[11px] text-slate-700 mt-1">Seuil base : 85 000 € | Seuil majoré : 93 500 €</p>
                </button>
              </div>
            </div>

            {/* Gauge */}
            <div
              className={`p-6 rounded-2xl border space-y-4 ${
                isMajoreExceeded
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : isBaseExceeded
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}
            >
              <div className="flex items-center justify-between font-extrabold text-sm">
                <span className="flex items-center gap-2">
                  {isMajoreExceeded ? (
                    <ShieldAlert className="w-5 h-5 text-rose-700" />
                  ) : isBaseExceeded ? (
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  )}
                  Niveau d'Approche du Seuil de Base
                </span>
                <span className="font-mono text-lg font-black">{percentBase}%</span>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    isMajoreExceeded
                      ? "bg-rose-600"
                      : isBaseExceeded
                      ? "bg-amber-600"
                      : "bg-emerald-600"
                  }`}
                  style={{ width: `${Math.min(percentBase, 100)}%` }}
                />
              </div>

              <div className="text-xs space-y-2 pt-2 border-t border-slate-200/60 font-semibold">
                {isMajoreExceeded ? (
                  <p className="text-rose-900">
                    🚨 <strong>Seuil majoré dépassé ({currentThreshold.majore.toLocaleString("fr-FR")} €) !</strong> Vous devenez redevable de la TVA dès le 1er jour du mois de dépassement. Vos factures doivent obligatoirement appliquer la TVA.
                  </p>
                ) : isBaseExceeded ? (
                  <p className="text-amber-900">
                    ⚠️ <strong>Seuil de base franchi ({currentThreshold.base.toLocaleString("fr-FR")} €).</strong> Vous bénéficiez de la tolérance jusqu'à la fin de l'année tant que vous ne dépassez pas le seuil majoré de {currentThreshold.majore.toLocaleString("fr-FR")} €.
                  </p>
                ) : (
                  <p className="text-emerald-900">
                    ✅ <strong>Franchise en base active.</strong> Vos factures doivent comporter la mention légale : <em>"TVA non applicable, art. 293 B du CGI"</em>.
                  </p>
                )}
              </div>
            </div>
          </div>

          <TrustBadgesRow />
        </div>
      </main>

      <MarketingFooter theme="light" />
    </div>
  );
}
