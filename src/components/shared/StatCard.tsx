import { type ReactNode } from "react";
import { Card } from "../ui/Card";
import { GlowContainer } from "./GlowContainer";
import { Amount } from "./Amount";
import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
  delta?: { value: string; positive: boolean };
  subtitle?: ReactNode;
  className?: string;
  variant?: "default" | "compact";
}

export function StatCard({
  label,
  value,
  icon,
  delta,
  subtitle,
  className,
  variant = "default",
}: StatCardProps) {
  if (variant === "compact") {
    return (
      <Card className={cn("p-4 h-full flex flex-col justify-between", className)}>
        <div>
          <p className="text-xs text-muted mb-1 font-semibold">{label}</p>
          <Amount value={value} size="md" />
        </div>
        {subtitle && (
          <div className="text-[11px] text-muted mt-2 pt-2 border-t border-border/40 font-medium">
            {subtitle}
          </div>
        )}
      </Card>
    );
  }

  return (
    <GlowContainer className="h-full">
      <Card className={cn("relative overflow-hidden h-full flex flex-col justify-between p-5", className)}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">{label}</span>
            {icon && (
              <span className="text-primary bg-primary/10 p-1.5 rounded-lg border border-primary/20 flex items-center justify-center">
                {icon}
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
            <Amount value={value} size="lg" />
            {delta && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-pill border whitespace-nowrap",
                  delta.positive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                )}
              >
                {delta.positive ? "▲" : "▼"} {delta.value}
              </span>
            )}
          </div>
        </div>

        {subtitle && (
          <div className="mt-4 pt-3 border-t border-border/50 text-xs font-medium text-muted flex items-center justify-between">
            {subtitle}
          </div>
        )}
      </Card>
    </GlowContainer>
  );
}
