import { ShieldCheck, Lock, Zap } from "lucide-react";

export function TrustBadgesRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-xs md:text-sm font-medium text-muted py-4">
      <div className="flex items-center space-x-2 bg-surface border border-border px-3.5 py-1.5 rounded-full shadow-sm">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Conforme à la réforme DGFiP 2026</span>
      </div>
      <div className="flex items-center space-x-2 bg-surface border border-border px-3.5 py-1.5 rounded-full shadow-sm">
        <Lock className="w-4 h-4 text-brand-primary" />
        <span>Données 100% hébergées en France</span>
      </div>
      <div className="flex items-center space-x-2 bg-surface border border-border px-3.5 py-1.5 rounded-full shadow-sm">
        <Zap className="w-4 h-4 text-amber-500" />
        <span>Opérationnel en moins de 5 minutes</span>
      </div>
    </div>
  );
}
