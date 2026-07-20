import { type ReactNode } from "react";
import { Button } from "../ui/Button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-16 h-16 rounded-card bg-surface-hover flex items-center justify-center text-muted mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-text mb-2">{title}</h3>
      <p className="text-sm text-muted max-w-sm mb-6">{description}</p>
      {ctaLabel && onCta && (
        <Button variant="primary" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
