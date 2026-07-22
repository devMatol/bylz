import { ShieldCheck, Lock, Zap } from "lucide-react";

export function TrustBadgesRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 md:gap-10 text-xs sm:text-sm font-bold text-text/80 py-4">
      <div className="flex items-center space-x-2 bg-surface border border-border/80 px-3.5 py-2 rounded-full shadow-sm">
        <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <span>Conforme à la réforme DGFiP 2026</span>
      </div>
      <div className="flex items-center space-x-2 bg-surface border border-border/80 px-3.5 py-2 rounded-full shadow-sm">
        <Lock className="w-4 h-4 text-brand-primary flex-shrink-0" />
        <span>Données 100% hébergées en France</span>
      </div>
      <div className="flex items-center space-x-2 bg-surface border border-border/80 px-3.5 py-2 rounded-full shadow-sm">
        <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span>Opérationnel en moins de 5 minutes</span>
      </div>
    </div>
  );
}
