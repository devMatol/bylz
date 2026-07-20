import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
  children: ReactNode;
}

export function Card({
  hover = false,
  glow = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-card p-6 transition-all duration-200",
        hover && "hover:border-primary/40 hover:-translate-y-0.5",
        glow && "bylz-glow-primary",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
