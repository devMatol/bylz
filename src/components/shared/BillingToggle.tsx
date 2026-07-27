import { BillingCycle } from "../../lib/constants";
import { Sparkles } from "lucide-react";

interface BillingToggleProps {
  billingCycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  className?: string;
}

export function BillingToggle({ billingCycle, onChange, className = "" }: BillingToggleProps) {
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 ${className}`}>
      <div className="bg-surface border border-border p-1 rounded-pill inline-flex items-center shadow-inner">
        <button
          type="button"
          onClick={() => onChange("annual")}
          className={`px-4 py-2 rounded-pill text-xs font-bold transition-all flex items-center gap-1.5 ${
            billingCycle === "annual"
              ? "bg-primary text-white shadow-md bylz-glow-cta"
              : "text-muted hover:text-text"
          }`}
        >
          <span>Facturation Annuelle</span>
          <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-pill font-black uppercase tracking-wider shadow-sm">
            Jusqu'à -53%
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={`px-4 py-2 rounded-pill text-xs font-bold transition-all ${
            billingCycle === "monthly"
              ? "bg-primary text-white shadow-md bylz-glow-cta"
              : "text-muted hover:text-text"
          }`}
        >
          <span>Facturation Mensuelle</span>
        </button>
      </div>
      {billingCycle === "annual" && (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Proration mensuelle affichée</span>
        </span>
      )}
    </div>
  );
}
