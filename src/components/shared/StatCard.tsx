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
}

export function StatCard({ label, value, icon, delta, className }: StatCardProps) {
  return (
    <GlowContainer>
      <Card className={cn("relative overflow-hidden", className)}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-sm font-semibold text-muted">{label}</span>
          {icon && <span className="text-primary">{icon}</span>}
        </div>
        <Amount value={value} size="lg" />
        {delta && (
          <div className="mt-2">
            <span
              className={cn(
                "text-xs font-semibold",
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
