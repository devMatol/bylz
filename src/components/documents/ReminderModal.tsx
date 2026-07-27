import { useState, useEffect } from "react";
import { Mail, Send, Paperclip, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { formatAmount } from "../../lib/utils";

interface ReminderModalProps {
  open: boolean;
  onClose: () => void;
  onSend: (subject: string, body: string) => Promise<void>;
  clientName: string;
  clientEmail?: string | null;
  invoiceNumber: string;
  invoiceAmount: number;
}

export function ReminderModal({
  open,
  onClose,
  onSend,
  clientName,
  clientEmail,
  invoiceNumber,
  invoiceAmount,
}: ReminderModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSubject(`Rappel : Règlement de la facture ${invoiceNumber}`);
      setBody(
        `Bonjour ${clientName},\n\nSauf erreur ou omission de notre part, nous constatons que la facture ${invoiceNumber} d'un montant de ${formatAmount(
          invoiceAmount
        )} n'a pas encore été réglée.\n\nNous vous prions de bien vouloir procéder à son règlement dans les meilleurs délais.\n\nNous restons à votre entière disposition pour toute question.\n\nCordialement,`
      );
    }
  }, [open, clientName, invoiceNumber, invoiceAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail) return;
    setLoading(true);
    try {
      await onSend(subject, body);
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl p-0 overflow-hidden">
      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Header */}
        <div className="p-6 bg-surface-hover/30 border-b border-border space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text">Envoyer une relance par e-mail</h3>
              <p className="text-xs text-muted">Aperçu et personnalisation du message avant envoi</p>
            </div>
          </div>

          {/* Context Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="text-xs font-semibold text-text bg-surface border border-border px-2.5 py-1 rounded-pill flex items-center space-x-1">
              <span className="text-muted">Client :</span>
              <span className="text-text font-bold">{clientName}</span>
            </div>
            {clientEmail ? (
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-pill">
                Email : {clientEmail}
              </div>
            ) : (
              <div className="text-xs font-semibold text-danger bg-danger/10 border border-danger/20 px-2.5 py-1 rounded-pill flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Aucune adresse email !</span>
              </div>
            )}
            <div className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-pill ml-auto">
              Facture {invoiceNumber} • {formatAmount(invoiceAmount)}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {!clientEmail && (
            <div className="p-3.5 rounded-card bg-danger/10 border border-danger/30 text-danger text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Veuillez ajouter une adresse e-mail au client <strong>{clientName}</strong> dans l'onglet Clients pour pouvoir envoyer des relances.
              </span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-text mb-1.5 block">Objet du courriel</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet de l'e-mail..."
              disabled={!clientEmail || loading}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text mb-1.5 block">Corps du message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              disabled={!clientEmail || loading}
              className="w-full bg-surface border border-border rounded-xl p-3.5 text-xs text-text font-sans leading-relaxed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner resize-y transition-all"
              required
            />
          </div>

          <div className="flex items-center text-xs text-muted bg-surface-hover/20 p-2.5 rounded-lg border border-border/50">
            <Paperclip className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
            <span>La facture <strong>{invoiceNumber}.pdf</strong> sera automatiquement jointe en pièce jointe.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-hover/30 border-t border-border flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={!clientEmail || loading}
            className="bylz-glow-cta font-bold flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Envoyer la relance par e-mail</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
