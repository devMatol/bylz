import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, CheckCircle2, Clock, AlertTriangle, RefreshCw, FileText, ArrowRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { saveInvoice, fetchInvoice } from "../../lib/api";
import { useToast } from "../ui/Toast";
import type { Invoice, PaStatus } from "../../types/database";
import { Button } from "../ui/Button";

interface PaTimelineProps {
  invoice: Invoice;
  isB2b: boolean;
  onRefresh?: () => void;
}

export function PaTimeline({ invoice, isB2b, onRefresh }: PaTimelineProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [reemitting, setReemitting] = useState(false);

  if (!isB2b) return null;

  const currentStatus: PaStatus = invoice.pa_status || "none";
  const factpulseRef = invoice.factpulse_ref;

  const steps = [
    { key: "submitted", label: "Transmise", status: "submitted" },
    { key: "delivered", label: "Délivrée", status: "delivered" },
    { key: "received", label: "Reçue", status: "received" },
    { key: "accepted", label: "Acceptée", status: "accepted" },
  ];

  const getStepIndex = (status: PaStatus) => {
    switch (status) {
      case "submitted": return 0;
      case "delivered": return 1;
      case "received": return 2;
      case "accepted": return 3;
      default: return -1;
    }
  };

  const activeStepIdx = getStepIndex(currentStatus);

  // Manual Trigger Transmit to FactPulse PA
  const handleTransmit = async () => {
    setSubmitting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("submit-to-pa", {
        body: { invoice_id: invoice.id },
      });

      if (error || (res && !res.success)) {
        const errorMsg =
          (typeof res?.error === "string" && res.error) ||
          (typeof res?.message === "string" && res.message) ||
          (typeof error?.message === "string" && error.message) ||
          "Échec de la transmission à la plateforme PA.";
        toast(errorMsg, "warning");
      } else {
        toast("Facture transmise avec succès à FactPulse !", "success");
      }
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast(e.message || "Erreur lors de la transmission.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  // Correct & Re-emit Flow (Draft copy replacing FAC-2026-XXX)
  const handleCorrectAndReemit = async () => {
    setReemitting(true);
    try {
      const fullInv = await fetchInvoice(invoice.company_id, invoice.id);
      if (!fullInv) {
        toast("Impossible de charger les détails de la facture.", "danger");
        setReemitting(false);
        return;
      }
      const lines = fullInv.lines || [];

      // Create new draft invoice
      const newDraft = await saveInvoice(invoice.company_id, {
        client_id: invoice.client_id,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: invoice.due_date,
        payment_terms: invoice.payment_terms,
        note: `Remplace ${invoice.number}`,
        lines: lines.map((l: any) => ({
          catalog_item_id: l.catalog_item_id,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          nature: l.nature,
          position: l.position,
        })),
      });

      toast(`Nouvelle facture brouillon créée (Remplace ${invoice.number})`, "success");
      navigate(`/factures/${newDraft.id}`);
    } catch (e: any) {
      toast(e.message || "Erreur lors de la création de la facture de remplacement.", "danger");
    } finally {
      setReemitting(false);
    }
  };

  return (
    <div className="border border-border bg-surface rounded-card p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-text flex items-center gap-1.5">
          <Send className="w-3.5 h-3.5 text-primary" />
          <span>Transmission PDP FactPulse</span>
        </h4>
        {factpulseRef && (
          <span className="text-[10px] font-mono text-muted bg-surface-hover px-1.5 py-0.5 rounded border border-border">
            {factpulseRef}
          </span>
        )}
      </div>

      {/* Rejected Status Danger Card */}
      {currentStatus === "rejected" ? (
        <div className="p-3.5 rounded-card bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">Facture rejetée par le destinataire</p>
              <p className="text-rose-300/80 mt-1 leading-relaxed">
                Motif : {invoice.pa_rejection_reason || "Rejeté sur le réseau PDP FactPulse"}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleCorrectAndReemit}
            loading={reemitting}
            className="w-full justify-center bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Corriger et réémettre (Brouillon)
          </Button>
        </div>
      ) : (
        /* Timeline Steps */
        <div className="space-y-3 pt-1">
          <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {steps.map((step, idx) => {
              const isDone = activeStepIdx >= idx;
              const isCurrent = activeStepIdx === idx;

              return (
                <div key={step.key} className="relative flex items-center justify-between text-xs">
                  <div
                    className={`absolute -left-6 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                      isDone
                        ? "bg-primary text-white"
                        : "bg-surface-hover border border-border text-muted"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                  </div>

                  <span
                    className={`font-semibold ${
                      isCurrent
                        ? "text-primary font-bold"
                        : isDone
                        ? "text-text"
                        : "text-muted"
                    }`}
                  >
                    {step.label}
                  </span>

                  {isCurrent && (
                    <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold">
                      En cours
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* User Choice Manual Transmit Button */}
          {currentStatus === "none" && (
            <div className="pt-2 border-t border-border">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleTransmit}
                loading={submitting}
                className="w-full justify-center bylz-glow-cta text-xs font-bold py-2"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Transmettre à FactPulse PDP
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
