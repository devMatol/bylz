import { formatAmount } from "../../lib/utils";
import { cn } from "../../lib/utils";

interface AmountProps {
  value: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

export function Amount({ value, size = "md", className }: AmountProps) {
  return (
    <span
      className={cn(
        "font-bold text-text tabular-nums",
        sizeClasses[size],
        className
      )}
    >
      {formatAmount(value)}
    </span>
  );
}
