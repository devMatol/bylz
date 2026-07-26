import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface GlowContainerProps {
  children: ReactNode;
  variant?: "primary" | "accent";
  intensity?: "subtle" | "normal";
  className?: string;
}

export function GlowContainer({
  children,
  variant = "primary",
  intensity = "normal",
  className,
}: GlowContainerProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          variant === "primary" ? "bylz-radial-primary" : "bylz-radial-accent",
          intensity === "subtle" && "opacity-50"
        )}
      />
      {children}
    </div>
  );
}
