import { useState, useRef, useEffect } from "react";
import { X, CheckCircle2, Eraser, ShieldCheck, Lock } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentNumber: string;
  documentType: "quote" | "invoice";
  clientName?: string;
  clientEmail?: string;
  onSubmit: (data: { signerName: string; signerEmail: string; signatureImage: string }) => Promise<void>;
}

export function SignatureModal({
  isOpen,
  onClose,
  documentNumber,
  documentType,
  clientName = "",
  clientEmail = "",
  onSubmit,
}: SignatureModalProps) {
  const [name, setName] = useState(clientName);
  const [email, setEmail] = useState(clientEmail);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setName(clientName);
      setEmail(clientEmail);
      setConsent(false);
      setHasDrawn(false);
      setErrorMsg(null);
      setTimeout(clearCanvas, 100);
    }
  }, [isOpen, clientName, clientEmail]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#4F46E5";
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();

    if (!hasDrawn) setHasDrawn(true);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Veuillez indiquer votre nom complet");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Veuillez indiquer une adresse e-mail valide");
      return;
    }

    if (!hasDrawn) {
      setErrorMsg("Veuillez apposer votre signature dans le cadre ci-dessous");
      return;
    }

    if (!consent) {
      setErrorMsg("Vous devez accepter les conditions d'engagement et de signature électronique");
      return;
    }

    const canvas = canvasRef.current;
    const signatureImage = canvas ? canvas.toDataURL("image/png") : "";

    setLoading(true);
    try {
      await onSubmit({
        signerName: name.trim(),
        signerEmail: email.trim(),
        signatureImage,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la validation de la signature");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-black text-text flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Signature Électronique Certifiée</span>
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {documentType === "quote" ? "Validation du devis N°" : "Validation de la facture N°"}{" "}
              <strong className="text-text">{documentNumber}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text p-1 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold p-3 rounded-lg">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nom & Prénom du signataire"
              placeholder="Ex: Jean Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="E-mail de confirmation"
              type="email"
              placeholder="Ex: jean.dupont@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-text">Signature manuscrite (Souris ou Tactile)</label>
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center space-x-1 text-xs text-muted hover:text-rose-400 transition-colors"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Effacer</span>
              </button>
            </div>
            <div className="border border-dashed border-primary/40 rounded-xl bg-surface-hover/30 overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={450}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 touch-none cursor-crosshair"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-muted/60 font-medium">
                  Dessinez votre signature ici
                </div>
              )}
            </div>
          </div>

          <label className="flex items-start space-x-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 rounded text-primary focus:ring-primary"
            />
            <span className="text-xs text-muted leading-relaxed">
              J'atteste être habilité(e) à engager le destinataire et j'appose ma signature électronique conformément au règlement eIDAS.
            </span>
          </label>

          <div className="flex items-center justify-end space-x-3 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="bylz-glow-cta text-xs font-bold"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Valider et Signer le document
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-muted/70 pt-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Signature sécurisée horodatée certifiée Bylz</span>
          </div>
        </form>
      </div>
    </div>
  );
}
