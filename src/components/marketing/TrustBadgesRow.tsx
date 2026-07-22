import { ShieldCheck, Lock, Zap } from "lucide-react";

export function TrustBadgesRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 md:gap-10 text-xs sm:text-sm font-bold text-muted py-4">
      <div className="flex items-center space-x-2 bg-surface border border-border px-3.5 py-2 rounded-pill card-shadow">
        <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" />
        <span className="text-text">Conforme à la réforme DGFiP 2026</span>
      </div>
      <div className="flex items-center space-x-2 bg-surface border border-border px-3.5 py-2 rounded-pill card-shadow">
        <Lock className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-text">Données 100% hébergées en France</span>
      </div>
      <div className="flex items-center space-x-2 bg-surface border border-border px-3.5 py-2 rounded-pill card-shadow">
        <Zap className="w-4 h-4 text-warning flex-shrink-0" />
        <span className="text-text">Opérationnel en moins de 5 minutes</span>
      </div>
    </div>
  );
}
