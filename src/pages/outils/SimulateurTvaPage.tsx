import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ShieldCheck, CheckCircle2, Calculator, ArrowRight, ShieldAlert } from "lucide-react";
import { SEO } from "../../components/seo/SEO";
import { MarketingNavbar } from "../../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../../components/marketing/MarketingFooter";
import { TrustBadgesRow } from "../../components/marketing/TrustBadgesRow";

export function SimulateurTvaPage() {
  const [ca, setCa] = useState<number>(36500);
  const [activity, setActivity] = useState<"service" | "vente">("service");

  const thresholds = {
    service: { base: 39100, majore: 42500, label: "Prestation de Services (BNC / BIC)" },
    vente: { base: 101000, majore: 110000, label: "Vente de Marchandises (BIC)" },
  };

  const currentThreshold = thresholds[activity];
  const isBaseExceeded = ca >= currentThreshold.base;
  const isMajoreExceeded = ca >= currentThreshold.majore;

  const percentBase = Math.min(Math.round((ca / currentThreshold.base) * 100), 120);

  const calculatorSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Simulateur Seuil de Franchise TVA 2026 — Bylz",
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
        title="Simulateur Seuil de Franchise TVA 2026 — Plafonds Micro-Entreprise"
        description="Calculez votre positionnement par rapport au seuil de franchise de TVA (39 100 € et 42 500 €) et découvrez quand vous devenez redevable de la TVA."
        canonical="/outils/simulateur-seuil-tva"
        jsonLd={calculatorSchema}
      />

      <MarketingNavbar />

      <main className="pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-primary/15 border border-brand-primary/30 text-brand-primary text-xs font-bold shadow-sm">
              <Calculator className="w-4 h-4 text-brand-accent" />
              <span>Calculateur de Plafonds TVA</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-text">
              Simulateur Seuil de Franchise de TVA 2026
            </h1>
            <p className="text-base text-text/80 leading-relaxed font-normal">
              Vérifiez si vous êtes en franchise de TVA ou si vous approchez du seuil de basculement.
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-surface/90 backdrop-blur-xl border border-white/10 dark:border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 glow-accent">
            {/* Input CA */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-sm font-extrabold text-text">
                  Chiffre d'Affaires Cumulé de l'Année
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
                max={activity === "service" ? 50000 : 130000}
                step={500}
                value={ca}
                onChange={(e) => setCa(Number(e.target.value))}
                className="w-full h-3 bg-border rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
            </div>

            {/* Activity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-text">Secteur d'Activité</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActivity("service")}
                  className={`p-4 rounded-2xl border text-left font-bold text-xs transition-all ${
                    activity === "service"
                      ? "bg-brand-primary/15 border-brand-primary text-brand-primary shadow-md"
                      : "bg-surface-hover/60 border-border text-text/80"
                  }`}
                >
                  <p className="text-sm">Prestations de Services & Libéral</p>
                  <p className="text-[11px] text-text/60 mt-1">Seuil base : 39 100 € | Seuil majoré : 42 500 €</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActivity("vente")}
                  className={`p-4 rounded-2xl border text-left font-bold text-xs transition-all ${
                    activity === "vente"
                      ? "bg-brand-primary/15 border-brand-primary text-brand-primary shadow-md"
                      : "bg-surface-hover/60 border-border text-text/80"
                  }`}
                >
                  <p className="text-sm">Vente de Marchandises</p>
                  <p className="text-[11px] text-text/60 mt-1">Seuil base : 101 000 € | Seuil majoré : 110 000 €</p>
                </button>
              </div>
            </div>

            {/* Gauge */}
            <div
              className={`p-6 rounded-3xl border space-y-4 ${
                isMajoreExceeded
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400"
                  : isBaseExceeded
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <div className="flex items-center justify-between font-extrabold text-sm">
                <span className="flex items-center gap-2">
                  {isMajoreExceeded ? (
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                  ) : isBaseExceeded ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                  Niveau d'Approche du Seuil de Base
                </span>
                <span className="font-mono text-lg font-black">{percentBase}%</span>
              </div>

              <div className="w-full bg-border/80 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    isMajoreExceeded
                      ? "bg-rose-500"
                      : isBaseExceeded
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(percentBase, 100)}%` }}
                />
              </div>

              <div className="text-xs space-y-2 pt-2 border-t border-border/40 font-semibold">
                {isMajoreExceeded ? (
                  <p>
                    🚨 <strong>Seuil majoré dépassé ({currentThreshold.majore.toLocaleString("fr-FR")} €) !</strong> Vous devenez redevable de la TVA dès le 1er jour du mois de dépassement. Vos factures doivent obligatoirement appliquer la TVA.
                  </p>
                ) : isBaseExceeded ? (
                  <p>
                    ⚠️ <strong>Seuil de base franchi ({currentThreshold.base.toLocaleString("fr-FR")} €).</strong> Vous bénéficiez de la tolérance jusqu'à la fin de l'année tant que vous ne dépassez pas le seuil majoré de {currentThreshold.majore.toLocaleString("fr-FR")} €.
                  </p>
                ) : (
                  <p>
                    ✅ <strong>Franchise en base active.</strong> Vos factures doivent comporter la mention légale : <em>"TVA non applicable, art. 293 B du CGI"</em>.
                  </p>
                )}
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
