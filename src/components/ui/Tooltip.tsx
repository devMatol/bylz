import { type ReactNode, useState } from "react";
import { cn } from "../../lib/utils";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            "absolute z-50 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-surface border border-border px-2 py-1 text-xs text-text shadow-lg pointer-events-none",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
            className
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
