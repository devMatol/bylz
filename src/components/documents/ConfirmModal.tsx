import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Confirmer la suppression",
  message = "Cette action est irréversible.",
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  danger = true,
}: ConfirmModalProps) {
  const [pending, setPending] = useState(false);
  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span
            className={
              danger
                ? "w-10 h-10 rounded-card bg-danger/15 flex items-center justify-center flex-shrink-0"
                : "w-10 h-10 rounded-card bg-warning/15 flex items-center justify-center flex-shrink-0"
            }
          >
            <AlertTriangle
              className={danger ? "w-5 h-5 text-danger" : "w-5 h-5 text-warning"}
            />
          </span>
          <p className="text-sm text-muted">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={handleConfirm}
            loading={pending}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
