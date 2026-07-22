import { cn } from "../../lib/utils";
import { STATUS_LABELS } from "../../lib/constants";

type StatusVariant =
  | "paid"
  | "pending"
  | "late"
  | "rejected"
  | "draft"
  | "sent"
  | "accepted"
  | "refused";

interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, { dot: string; text: string }> = {
  paid: { dot: "bg-success", text: "text-success" },
  pending: { dot: "bg-warning", text: "text-warning" },
  late: { dot: "bg-danger", text: "text-danger" },
  rejected: { dot: "bg-danger", text: "text-danger" },
  draft: { dot: "bg-muted", text: "text-muted" },
  sent: { dot: "bg-accent", text: "text-accent" },
  accepted: { dot: "bg-success", text: "text-success" },
  refused: { dot: "bg-danger", text: "text-danger" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = variantStyles[status] || variantStyles.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-semibold bg-surface-hover whitespace-nowrap flex-shrink-0 align-middle",
        style.text,
        className
      )}
    >
      <span className={cn("inline-block w-1.5 h-1.5 rounded-full flex-shrink-0", style.dot)} />
      <span>{STATUS_LABELS[status] || status}</span>
    </span>
  );
}
