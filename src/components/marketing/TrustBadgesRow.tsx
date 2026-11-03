import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Zap, FileCheck } from "lucide-react";

export function TrustBadgesRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs font-semibold text-slate-700 py-4">
      <Link
        to="/conformite"
        className="inline-flex items-center space-x-2 bg-white border border-emerald-300 px-3.5 py-2.5 min-h-[44px] rounded-lg hover:border-emerald-500 shadow-xs transition-colors"
      >
        <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
        <span className="text-slate-800">Livre chronologique des recettes, exportable en CSV</span>
      </Link>

      <Link
        to="/conformite"
        className="inline-flex items-center space-x-2 bg-white border border-blue-200 px-3.5 py-2.5 min-h-[44px] rounded-lg hover:border-blue-400 shadow-xs transition-colors"
      >
        <FileCheck className="w-4 h-4 text-blue-700 flex-shrink-0" />
        <span className="text-slate-800">Mentions légales obligatoires conformes</span>
      </Link>

      <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 px-3.5 py-2.5 min-h-[44px] rounded-lg shadow-xs">
        <Lock className="w-4 h-4 text-slate-700 flex-shrink-0" />
        <span className="text-slate-800">Base de données hébergée en Europe</span>
      </div>

      <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 px-3.5 py-2.5 min-h-[44px] rounded-lg shadow-xs">
        <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="text-slate-800">Opérationnel en 2 minutes</span>
      </div>
    </div>
  );
}
