import { useState } from "react";
import { TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

export function InteractiveFiscalSimulator() {
  const [ca, setCa] = useState<number>(28500);
  const [activityType, setActivityType] = useState<"bnc" | "bic_service">("bnc");

  const urssafRate = activityType === "bnc" ? 0.231 : 0.212;
  const urssafAmount = Math.round(ca * urssafRate);
  const netAmount = ca - urssafAmount;

  const tvaThreshold = 39100;
  const tvaPercent = Math.min(Math.round((ca / tvaThreshold) * 100), 120);

  const presets = [12000, 28500, 38500, 45000];

  return (
    <div className="bg-surface/90 backdrop-blur-xl border border-white/10 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 glow-accent">
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-accent/20 text-brand-accent flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-text text-sm sm:text-base">Simulateur Fiscale & URSSAF en direct</h3>
            <p className="text-xs text-text/70">Testez avec vos propres montants de Chiffre d'Affaires</p>
          </div>
        </div>
        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-brand-accent/15 text-brand-accent border border-brand-accent/30 hidden sm:inline-block">
          Interactif
        </span>
      </div>

      {/* Preset Quick Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-text flex justify-between">
          <span>Chiffre d'Affaires Annuel Encaissé</span>
          <span className="font-mono font-black text-brand-primary text-base sm:text-lg">
            {ca.toLocaleString("fr-FR")} €
          </span>
        </label>

        {/* Range Slider */}
        <input
          type="range"
          min={5000}
          max={60000}
          step={500}
          value={ca}
          onChange={(e) => setCa(Number(e.target.value))}
          className="w-full h-2.5 bg-border rounded-lg appearance-none cursor-pointer accent-brand-primary"
        />

        <div className="flex flex-wrap gap-2 pt-1">
          {presets.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setCa(val)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
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

      {/* Activity Selector */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onClick={() => setActivityType("bnc")}
          className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
            activityType === "bnc"
              ? "bg-brand-primary/15 border-brand-primary text-brand-primary shadow-sm"
              : "bg-surface-hover/60 border-border text-text/70"
          }`}
        >
          Prof. Libérale (BNC 23,1%)
        </button>
        <button
          type="button"
          onClick={() => setActivityType("bic_service")}
          className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
            activityType === "bic_service"
              ? "bg-brand-primary/15 border-brand-primary text-brand-primary shadow-sm"
              : "bg-surface-hover/60 border-border text-text/70"
          }`}
        >
          Prestation BIC (21,2%)
        </button>
      </div>

      {/* Calculated Stat Cards */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-surface-hover/80 border border-border">
          <p className="text-text/70 font-semibold text-[11px] mb-1">Cotisations URSSAF</p>
          <p className="text-lg font-black text-brand-primary font-mono">
            {urssafAmount.toLocaleString("fr-FR")} €
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-surface-hover/80 border border-border">
          <p className="text-text/70 font-semibold text-[11px] mb-1">Bénéfice Net estimé</p>
          <p className="text-lg font-black text-emerald-500 font-mono">
            {netAmount.toLocaleString("fr-FR")} €
          </p>
        </div>
      </div>

      {/* Dynamic Gauge for TVA threshold */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          ca >= tvaThreshold
            ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400"
            : ca >= tvaThreshold * 0.8
            ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
        }`}
      >
        <div className="flex justify-between font-bold text-xs mb-1.5">
          <span className="flex items-center gap-1.5">
            {ca >= tvaThreshold ? (
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            ) : ca >= tvaThreshold * 0.8 ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            Seuil de Franchise TVA (39 100 €)
          </span>
          <span className="font-mono font-black">{tvaPercent}%</span>
        </div>

        <div className="w-full bg-border/80 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              ca >= tvaThreshold
                ? "bg-rose-500"
                : ca >= tvaThreshold * 0.8
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(tvaPercent, 100)}%` }}
          />
        </div>

        <p className="text-[11px] mt-2 font-medium">
          {ca >= tvaThreshold
            ? "⚠️ Seuil dépassé : vous devenez redevable de la TVA. Bylz génère automatiquement les lignes de TVA sur vos prochaines factures."
            : `Plus que ${(tvaThreshold - ca).toLocaleString("fr-FR")} € avant le passage obligatoire à la TVA.`}
        </p>
      </div>
    </div>
  );
}
