import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { downloadPdf } from "../../lib/api";

interface PdfButtonProps {
  documentType: "quote" | "invoice";
  documentId: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function PdfButton({
  documentType,
  documentId,
  variant = "outline",
  size = "md",
  label = "Télécharger PDF",
}: PdfButtonProps) {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  async function handle() {
    setPending(true);
    try {
      const url = await downloadPdf(documentType, documentId);
      window.open(url, "_blank");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Échec du téléchargement PDF",
        "danger"
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handle}
      loading={pending}
      leftIcon={!pending ? <Download className="w-4 h-4" /> : undefined}
    >
      {label}
    </Button>
  );
}
