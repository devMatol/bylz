import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Zap, FileCheck } from "lucide-react";

export function TrustBadgesRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs font-semibold text-muted py-4">
      <Link
        to="/conformite"
        className="flex items-center space-x-2 bg-surface/90 border border-emerald-500/30 px-3.5 py-2 rounded-lg hover:border-emerald-500/60 transition-colors"
      >
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="text-text">Livre chronologique des recettes, exportable en CSV</span>
      </Link>

      <Link
        to="/conformite"
        className="flex items-center space-x-2 bg-surface/90 border border-primary/30 px-3.5 py-2 rounded-lg hover:border-primary/60 transition-colors"
      >
        <FileCheck className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-text">Facturation électronique en préparation</span>
      </Link>

      <div className="flex items-center space-x-2 bg-surface/90 border border-border px-3.5 py-2 rounded-lg">
        <Lock className="w-4 h-4 text-sky-400 flex-shrink-0" />
        <span className="text-text">Base de données hébergée en Europe</span>
      </div>

      <div className="flex items-center space-x-2 bg-surface/90 border border-border px-3.5 py-2 rounded-lg">
        <Zap className="w-4 h-4 text-warning flex-shrink-0" />
        <span className="text-text">Opérationnel en 2 minutes</span>
      </div>
    </div>
  );
}
