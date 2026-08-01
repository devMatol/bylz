import { Receipt, ArrowUpRight, ArrowDownLeft, Calculator } from "lucide-react";
import { formatAmount } from "../../lib/utils";

interface TvaBreakdownCardProps {
  tvaCollected: number;
  tvaDeductible: number;
  tvaNetToPay: number;
  isAssujetti: boolean;
}

export function TvaBreakdownCard({
  tvaCollected,
  tvaDeductible,
  tvaNetToPay,
  isAssujetti,
}: TvaBreakdownCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface/90 p-6 backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-text flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <span>Synthèse & Prévisionnel de TVA</span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {isAssujetti
              ? "Calcul en temps réel de votre TVA collectée vs déductible"
              : "Franchise en base de TVA active (TVA non applicable, Art. 293 B du CGI)"}
          </p>
        </div>

        <span
          className={`text-xs font-extrabold px-3 py-1 rounded-pill border ${
            isAssujetti
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}
        >
          {isAssujetti ? "Assujetti TVA (Régime Réel / Simplifié)" : "Franchise de TVA Active"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TVA Collectée */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1 font-medium">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              TVA Collectée (Factures Clients)
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {formatAmount(tvaCollected)}
          </p>
          <p className="text-[11px] text-muted">TVA facturée à vos clients</p>
        </div>

        {/* TVA Déductible */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1 font-medium">
              <ArrowDownLeft className="w-4 h-4 text-violet-400" />
              TVA Déductible (Achats Pros)
            </span>
          </div>
          <p className="text-2xl font-black text-violet-400">
            {formatAmount(tvaDeductible)}
          </p>
          <p className="text-[11px] text-muted">TVA récupérable sur vos dépenses</p>
        </div>

        {/* Solde à Reverser */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-primary/30 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1 font-bold text-text">
              <Receipt className="w-4 h-4 text-primary" />
              Solde Net de TVA à Reverser
            </span>
          </div>
          <p className="text-2xl font-black text-primary">
            {formatAmount(tvaNetToPay)}
          </p>
          <p className="text-[11px] text-muted">Estimation pour la prochaine déclaration CA3 / CA12</p>
        </div>
      </div>
    </div>
  );
}
