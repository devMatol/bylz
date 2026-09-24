import { BillingCycle } from "../../lib/constants";

interface BillingToggleProps {
  billingCycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  className?: string;
}

export function BillingToggle({ billingCycle, onChange, className = "" }: BillingToggleProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="bg-surface border border-border p-1 rounded-pill inline-flex items-center shadow-inner">
        <button
          type="button"
          onClick={() => onChange("annual")}
          className={`px-3.5 py-1.5 rounded-pill text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            billingCycle === "annual"
              ? "bg-primary text-white shadow-sm bylz-glow-cta"
              : "text-muted hover:text-text"
          }`}
        >
          <span>Annuel</span>
          <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-pill font-black uppercase tracking-wider">
            -53%
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={`px-3.5 py-1.5 rounded-pill text-xs font-bold transition-all cursor-pointer ${
            billingCycle === "monthly"
              ? "bg-primary text-white shadow-sm bylz-glow-cta"
              : "text-muted hover:text-text"
          }`}
        >
          <span>Mensuel</span>
        </button>
      </div>
    </div>
  );
}
