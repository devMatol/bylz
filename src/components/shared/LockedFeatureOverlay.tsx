import { Lock, Sparkles } from "lucide-react";

interface LockedFeatureOverlayProps {
  planBadge?: string;
  title: string;
  description: string;
  buttonText?: string;
  onUnlock: () => void;
  className?: string;
}

export function LockedFeatureOverlay({
  planBadge = "PLAN SOLO ⚡",
  title,
  description,
  buttonText = "Débloquer le Plan Solo (14 jours offerts)",
  onUnlock,
  className = "",
}: LockedFeatureOverlayProps) {
  return (
    <div
      className={`bg-surface/95 backdrop-blur-md border border-amber-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-4 bylz-glow-accent animate-in fade-in duration-200 ${className}`}
    >
      {/* Translucent Glowing Icon */}
      <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10">
        <Lock className="w-7 h-7" />
      </div>

      {/* Plan Badge */}
      {planBadge && (
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-black tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{planBadge}</span>
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-extrabold text-text tracking-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="text-xs sm:text-sm text-muted leading-relaxed">
        {description}
      </p>

      {/* CTA Button & Trust Note */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          onClick={onUnlock}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>{buttonText}</span>
        </button>
        <p className="text-xs text-muted font-medium">
          14 jours d'essai gratuit • Sans engagement • Résiliable en 1 clic
        </p>
      </div>
    </div>
  );
}
