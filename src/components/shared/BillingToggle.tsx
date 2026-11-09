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
          className={`px-4 py-2 min-h-[44px] rounded-pill text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:focus-visible:outline-primary ${
            billingCycle === "annual"
              ? "bg-primary text-white shadow-sm bylz-glow-cta"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:focus-visible:outline-primary"
          }`}
        >
          <span>Annuel</span>
          <span className="bg-emerald-800 text-white text-xs px-2 py-0.5 rounded-pill font-black uppercase tracking-wider">
            Jusqu'à -53%
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={`px-4 py-2 min-h-[44px] rounded-pill text-xs font-bold transition-all flex items-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:focus-visible:outline-primary ${
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
