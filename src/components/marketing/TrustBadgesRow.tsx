import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Zap, FileCheck } from "lucide-react";

export function TrustBadgesRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs font-bold text-muted py-4">
      <Link
        to="/conformite"
        className="flex items-center space-x-2 bg-surface/90 border border-emerald-500/30 px-3.5 py-2 rounded-pill card-shadow hover:border-emerald-500/60 transition-all"
      >
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="text-text">Anti-Fraude TVA (Art. 286 CGI)</span>
      </Link>

      <Link
        to="/conformite"
        className="flex items-center space-x-2 bg-surface/90 border border-primary/30 px-3.5 py-2 rounded-pill card-shadow hover:border-primary/60 transition-all"
      >
        <FileCheck className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-text">Factur-X & Norme EN 16931</span>
      </Link>

      <div className="flex items-center space-x-2 bg-surface/90 border border-border px-3.5 py-2 rounded-pill card-shadow">
        <Lock className="w-4 h-4 text-sky-400 flex-shrink-0" />
        <span className="text-text">Hébergé 100% en France (ISO 27001)</span>
      </div>

      <div className="flex items-center space-x-2 bg-surface/90 border border-border px-3.5 py-2 rounded-pill card-shadow">
        <Zap className="w-4 h-4 text-warning flex-shrink-0" />
        <span className="text-text">Opérationnel en 2 minutes</span>
      </div>
    </div>
  );
}
