import { AlertTriangle, CheckCircle2, ShieldAlert, TrendingUp, Info } from "lucide-react";
import { formatAmount, cn } from "../../lib/utils";

interface ThresholdGaugeCardProps {
  title: string;
  subtitle: string;
  currentValue: number;
  thresholdLimit: number;
  projectedValue: number;
  status: "safe" | "warning" | "danger";
  unitLabel?: string;
  secondaryThreshold?: number;
  secondaryThresholdLabel?: string;
}

export function ThresholdGaugeCard({
  title,
  subtitle,
  currentValue,
  thresholdLimit,
  projectedValue,
  status,
  unitLabel = "€",
  secondaryThreshold,
  secondaryThresholdLabel,
}: ThresholdGaugeCardProps) {
  const percentUsed = Math.min(100, Math.max(0, (currentValue / thresholdLimit) * 100));
  const percentProjected = Math.min(100, Math.max(0, (projectedValue / thresholdLimit) * 100));

  const statusConfig = {
    safe: {
      badgeText: "Périmètre Sécurisé",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      barClass: "from-emerald-500 to-teal-400 shadow-emerald-500/20",
      icon: CheckCircle2,
      glow: "shadow-emerald-500/5 border-emerald-500/20",
    },
    warning: {
      badgeText: "Vigilance Seuil",
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
      barClass: "from-amber-500 to-yellow-400 shadow-amber-500/20",
      icon: AlertTriangle,
      glow: "shadow-amber-500/10 border-amber-500/30",
    },
    danger: {
      badgeText: "Attention : Seuil Frôlé / Dépassé",
      badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30 animate-bounce",
      barClass: "from-rose-500 to-red-600 shadow-rose-500/30",
      icon: ShieldAlert,
      glow: "shadow-rose-500/15 border-rose-500/40",
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-surface/90 p-6 backdrop-blur-md transition-all duration-300 hover:shadow-xl",
        statusConfig.glow
      )}
    >
      {/* Background Accent Gradient */}
      <div
        className={cn(
          "absolute -right-16 -top-16 h-36 w-36 rounded-full blur-3xl opacity-20 pointer-events-none",
          status === "safe" && "bg-emerald-500",
          status === "warning" && "bg-amber-500",
          status === "danger" && "bg-rose-500"
        )}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-text flex items-center gap-2">
            <span>{title}</span>
          </h3>
          <p className="text-xs text-muted mt-0.5">{subtitle}</p>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px] font-bold border whitespace-nowrap",
            statusConfig.badgeClass
          )}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{statusConfig.badgeText}</span>
        </span>
      </div>

      {/* Gauge Big Value */}
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="text-3xl font-black tracking-tight text-text">
            {formatAmount(currentValue)}
          </span>
          <span className="text-xs text-muted ml-2 font-medium">
            sur {formatAmount(thresholdLimit)} {unitLabel}
          </span>
        </div>
        <span className="text-sm font-extrabold text-muted">
          {percentUsed.toFixed(1)} %
        </span>
      </div>

      {/* Visual Multi-layer Progress Bar */}
      <div className="relative h-3.5 w-full rounded-full bg-slate-800/80 p-0.5 overflow-hidden border border-border">
        {/* Projected Value Ghost Bar */}
        {percentProjected > percentUsed && (
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full bg-white/15 transition-all duration-500"
            style={{ width: `${Math.min(100, percentProjected)}%` }}
            title={`Atterrissage prévisionnel : ${percentProjected.toFixed(1)} %`}
          />
        )}

        {/* Current Active Value Bar */}
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-700 shadow-md",
            statusConfig.barClass
          )}
          style={{ width: `${percentUsed}%` }}
        />

        {/* Secondary Threshold Marker if present */}
        {secondaryThreshold && thresholdLimit > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 shadow-sm"
            style={{ left: `${(secondaryThreshold / thresholdLimit) * 100}%` }}
            title={`${secondaryThresholdLabel || "Seuil secondaire"} : ${formatAmount(secondaryThreshold)}`}
          />
        )}
      </div>

      {/* Bottom Metrics & Forecast */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-1.5 font-medium">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span>Atterrissage 31 déc. :</span>
          <strong className="text-text font-bold">{formatAmount(projectedValue)}</strong>
        </div>

        <div className="flex items-center gap-1 text-[11px]">
          <Info className="w-3 h-3 text-muted" />
          <span>Reste disponible :</span>
          <strong className={cn("font-bold", thresholdLimit - currentValue <= 0 ? "text-rose-400" : "text-emerald-400")}>
            {formatAmount(Math.max(0, thresholdLimit - currentValue))}
          </strong>
        </div>
      </div>
    </div>
  );
}
