import { useState, type FormEvent } from "react";
import { LifeBuoy, Send, CheckCircle2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { supabase } from "../../lib/supabase";
import type { TicketCategory, TicketPriority } from "../../types/database";

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

export function SupportModal({ open, onClose }: SupportModalProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("question");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) return;

    setLoading(true);
    try {
      // Auto-derive priority from user plan
      const userPlan = profile?.plan || "starter";
      const priority: TicketPriority =
        userPlan === "pro" ? "high" : userPlan === "solo" ? "normal" : "low";

      // 1. Create support ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: subject.trim(),
          category,
          priority,
          status: "open",
        })
        .select("id")
        .single();

      if (ticketError || !ticket) {
        throw new Error("Erreur lors de la création du ticket");
      }

      // 2. Add initial message
      const { error: msgError } = await supabase.from("ticket_messages").insert({
        ticket_id: ticket.id,
        author_id: user.id,
        body: message.trim(),
      });

      if (msgError) {
        console.error("Error creating ticket message:", msgError);
      }

      setSubmitted(true);
      toast("Votre demande a été envoyée au support Bylz", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubject("");
    setCategory("question");
    setMessage("");
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleReset} title="Contacter le support Bylz">
      {submitted ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-text">Message bien reçu !</h3>
          <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
            Notre équipe vous répondra directement par e-mail sous 24h ouvrées. Vous recevrez une notification dès qu'une réponse est publiée.
          </p>
          <div className="pt-2">
            <Button variant="primary" onClick={handleReset}>
              Fermer
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text mb-1">Sujet de la demande</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Question sur l'export de factures"
              className="w-full bg-surface border border-border rounded-card px-3 py-2 text-xs text-text focus:outline-none focus:border-primary font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full bg-surface border border-border rounded-card px-3 py-2 text-xs text-text focus:outline-none focus:border-primary font-bold"
              >
                <option value="question">Question générale</option>
                <option value="billing">Facturation & Offre</option>
                <option value="bug">Signalement de problème</option>
                <option value="feature">Suggestion de fonctionnalité</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text mb-1">Priorité liée à votre plan</label>
              <div className="px-3 py-2 bg-surface-hover border border-border rounded-card text-xs font-bold text-primary flex items-center justify-between">
                <span>{profile?.plan?.toUpperCase() || "STARTER"}</span>
                <span className="text-[10px] text-muted font-mono">
                  {profile?.plan === "pro" ? "Haute < 4h" : profile?.plan === "solo" ? "Normale < 12h" : "Standard < 24h"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text mb-1">Description détaillée</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Expliquez la situation ou votre besoin..."
              className="w-full bg-surface border border-border rounded-card p-3 text-xs text-text focus:outline-none focus:border-primary font-normal leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" loading={loading} leftIcon={<Send className="w-4 h-4" />}>
              Envoyer la demande
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
