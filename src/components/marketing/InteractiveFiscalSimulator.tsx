import { useState } from "react";
import { TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Card } from "../ui/Card";

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
    <Card hover glow className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-card bg-accent/20 text-accent flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-text text-sm sm:text-base">Simulateur Fiscal & URSSAF en direct</h3>
            <p className="text-xs text-muted">Testez avec vos propres montants de Chiffre d'Affaires</p>
          </div>
        </div>
        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-pill bg-accent/15 text-accent border border-accent/30 hidden sm:inline-block">
          Interactif
        </span>
      </div>

      {/* Preset Quick Buttons */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-text">Chiffre d'Affaires Annuel Encaissé</label>
          <span className="font-mono font-black text-primary text-base sm:text-lg">
            {ca.toLocaleString("fr-FR")} €
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min={5000}
          max={60000}
          step={500}
          value={ca}
          onChange={(e) => setCa(Number(e.target.value))}
          className="w-full h-2.5 bg-border rounded-pill appearance-none cursor-pointer accent-primary"
        />

        <div className="flex flex-wrap gap-2 pt-1">
          {presets.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setCa(val)}
              className={`text-xs font-bold px-3 py-1.5 rounded-pill border transition-all ${
                ca === val
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-surface-hover border-border text-muted hover:text-text hover:border-primary/50"
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
          className={`p-2.5 rounded-card border text-center font-bold transition-all ${
            activityType === "bnc"
              ? "bg-primary/15 border-primary text-primary shadow-sm"
              : "bg-surface-hover border-border text-muted hover:text-text"
          }`}
        >
          Prof. Libérale (BNC 23,1%)
        </button>
        <button
          type="button"
          onClick={() => setActivityType("bic_service")}
          className={`p-2.5 rounded-card border text-center font-bold transition-all ${
            activityType === "bic_service"
              ? "bg-primary/15 border-primary text-primary shadow-sm"
              : "bg-surface-hover border-border text-muted hover:text-text"
          }`}
        >
          Prestation BIC (21,2%)
        </button>
      </div>

      {/* Calculated Stat Cards */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-card bg-surface-hover border border-border">
          <p className="text-muted font-semibold text-[11px] mb-1">Cotisations URSSAF</p>
          <p className="text-lg font-black text-primary font-mono">
            {urssafAmount.toLocaleString("fr-FR")} €
          </p>
        </div>
        <div className="p-3.5 rounded-card bg-surface-hover border border-border">
          <p className="text-muted font-semibold text-[11px] mb-1">Bénéfice Net estimé</p>
          <p className="text-lg font-black text-success font-mono">
            {netAmount.toLocaleString("fr-FR")} €
          </p>
        </div>
      </div>

      {/* Dynamic Gauge for TVA threshold */}
      <div
        className={`p-4 rounded-card border transition-all ${
          ca >= tvaThreshold
            ? "bg-danger/10 border-danger/40 text-danger"
            : ca >= tvaThreshold * 0.8
            ? "bg-warning/10 border-warning/40 text-warning"
            : "bg-success/10 border-success/30 text-success"
        }`}
      >
        <div className="flex justify-between font-bold text-xs mb-1.5">
          <span className="flex items-center gap-1.5">
            {ca >= tvaThreshold ? (
              <ShieldAlert className="w-4 h-4 text-danger" />
            ) : ca >= tvaThreshold * 0.8 ? (
              <AlertTriangle className="w-4 h-4 text-warning" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-success" />
            )}
            Seuil de Franchise TVA (39 100 €)
          </span>
          <span className="font-mono font-black">{tvaPercent}%</span>
        </div>

        <div className="w-full bg-border rounded-pill h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-pill transition-all duration-500 ${
              ca >= tvaThreshold
                ? "bg-danger"
                : ca >= tvaThreshold * 0.8
                ? "bg-warning"
                : "bg-success"
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
    </Card>
  );
}
