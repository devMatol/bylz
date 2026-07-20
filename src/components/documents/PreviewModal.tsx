import { type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function PreviewModal({
  open,
  onClose,
  children,
  footer,
}: PreviewModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={cn(
          "relative bg-surface border border-border rounded-card w-full max-w-[720px] shadow-2xl",
          "flex flex-col max-h-[90vh]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-text">Aperçu</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-border flex justify-end gap-2 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
