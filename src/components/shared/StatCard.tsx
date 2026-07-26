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
  className?: string;
  variant?: "default" | "compact";
}

export function StatCard({ label, value, icon, delta, className, variant = "default" }: StatCardProps) {
  if (variant === "compact") {
    return (
      <Card className={cn("p-3.5 sm:p-4 h-full flex flex-col justify-between", className)}>
        <p className="text-xs text-muted mb-1 truncate font-semibold" title={label}>{label}</p>
        <Amount value={value} size="md" className="text-lg sm:text-xl truncate" />
      </Card>
    );
  }

  // Format amount size based on number length so large amounts never overflow
  const strVal = Math.round(value).toString();
  const responsiveFontSize =
    strVal.length >= 7
      ? "text-lg sm:text-xl md:text-2xl"
      : strVal.length >= 5
      ? "text-xl sm:text-2xl md:text-3xl"
      : "text-xl sm:text-2xl md:text-3xl";

  return (
    <GlowContainer>
      <Card className={cn("relative overflow-hidden h-full flex flex-col justify-between p-3.5 sm:p-5", className)}>
        <div>
          <div className="flex items-center justify-between mb-1.5 gap-1">
            <span className="text-xs sm:text-sm font-semibold text-muted truncate max-w-[85%] whitespace-nowrap" title={label}>
              {label}
            </span>
            {icon && <span className="text-primary flex-shrink-0">{icon}</span>}
          </div>
          <Amount value={value} size="lg" className={cn("block tracking-tight truncate", responsiveFontSize)} />
        </div>
        {delta && (
          <div className="mt-2 pt-1 border-t border-border/40">
            <span
              className={cn(
                "text-[11px] sm:text-xs font-semibold truncate block",
                delta.positive ? "text-success" : "text-danger"
              )}
            >
              {delta.positive ? "▲" : "▼"} {delta.value}
            </span>
          </div>
        )}
      </Card>
    </GlowContainer>
  );
}
