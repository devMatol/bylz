import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, CheckCircle2, Clock, AlertTriangle, RefreshCw, AlertCircle } from "lucide-react";
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

  // Manual Trigger Transmit to FactPulse PA (supports retry for rejected invoices)
  const handleTransmit = async (isRetry = false) => {
    setSubmitting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("submit-to-pa", {
        body: { invoice_id: invoice.id, retry: isRetry },
      });

      if (error || (res && !res.success)) {
        const errorCode = res?.error_code;
        let errorMsg =
          (typeof res?.error === "string" && res.error) ||
          (typeof res?.message === "string" && res.message) ||
          (typeof error?.message === "string" && error.message) ||
          "Échec de l'envoi à la facturation électronique.";

        if (errorCode === "concurrency_conflict") {
          errorMsg = "Une transmission pour cette facture est déjà en cours.";
        } else if (errorCode === "already_submitted") {
          errorMsg = "Cette facture a déjà fait l'objet d'une transmission validée.";
        } else if (errorCode === "retry_not_allowed") {
          errorMsg = "La relance n'est autorisée que pour une facture précédemment rejetée.";
        } else if (errorCode === "production_disabled") {
          errorMsg = "Transmission à la facturation électronique désactivée pour le moment.";
        }

        toast(errorMsg, "warning");
      } else {
        toast("Facture envoyée avec succès à la facturation électronique !", "success");
      }
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast(e.message || "Erreur lors de l'envoi à la facturation électronique.", "danger");
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
          <span>Facturation électronique</span>
        </h4>
        {factpulseRef && (
          <span className="text-[10px] font-mono text-muted bg-surface-hover px-1.5 py-0.5 rounded border border-border">
            {factpulseRef}
          </span>
        )}
      </div>

      {/* Submitting Status : Transit en cours */}
      {currentStatus === "submitting" && (
        <div className="p-3.5 rounded-card bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
          <div>
            <p className="font-bold text-amber-200">Transmission en cours...</p>
            <p className="text-amber-300/80 text-[11px] mt-0.5">
              Transmission de la facture auprès de la plateforme agréée.
            </p>
          </div>
        </div>
      )}

      {/* Litigation Status : Facture en litige */}
      {currentStatus === "litigation" && (
        <div className="p-3.5 rounded-card bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-orange-200">Facture en litige</p>
            <p className="text-orange-300/80 text-[11px] mt-0.5">
              L'acheteur a signalé un litige sur cette facture via la plateforme agréée.
            </p>
          </div>
        </div>
      )}

      {/* Suspended Status : Facture suspendue */}
      {currentStatus === "suspended" && (
        <div className="p-3.5 rounded-card bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-200">Facture suspendue</p>
            <p className="text-amber-300/80 text-[11px] mt-0.5">
              Le traitement de la facture a été temporairement suspendu par la plateforme.
            </p>
          </div>
        </div>
      )}

      {/* Rejected Status Danger Card with Retry & Re-emit buttons */}
      {currentStatus === "rejected" ? (
        <div className="p-3.5 rounded-card bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">Facture rejetée</p>
              <p className="text-rose-300/80 mt-1 leading-relaxed">
                Motif : {invoice.pa_rejection_reason || "Rejeté lors de la transmission"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTransmit(true)}
              loading={submitting}
              className="w-full justify-center text-xs font-bold py-2 border-rose-500/40 text-rose-200 hover:bg-rose-500/20"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retenter la transmission
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCorrectAndReemit}
              loading={reemitting}
              className="w-full justify-center bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Corriger et réémettre
            </Button>
          </div>
        </div>
      ) : (
        /* Timeline Steps (when not rejected) */
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
                onClick={() => handleTransmit(false)}
                loading={submitting}
                className="w-full justify-center bylz-glow-cta text-xs font-bold py-2"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Envoyer à la facturation électronique
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
