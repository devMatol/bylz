import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Bell,
  Send,
  Check,
} from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Tooltip } from "../components/ui/Tooltip";
import { DocumentPreview } from "../components/documents/DocumentPreview";
import { PdfButton } from "../components/documents/PdfButton";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import {
  fetchInvoice,
  markInvoicePaid,
  createCreditNote,
  emitInvoice,
} from "../lib/api";
import { formatDateLong, todayISO, isValidDate } from "../lib/date";
import { parseISO } from "date-fns";
import type { Invoice, InvoiceLine, Client, PaymentMethod } from "../types/database";

export function InvoiceDetailPage() {
  const { id } = useParams();
  const { company } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<{
    invoice: Invoice;
    lines: InvoiceLine[];
    client: Client | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const [payDate, setPayDate] = useState(todayISO());
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("transfer");

  const load = useCallback(async () => {
    if (!company || !id) return;
    try {
      const d = await fetchInvoice(company.id, id);
      setData(d);
      if (d) {
        setPayAmount(String(Number(d.invoice.total_ttc)));
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setLoading(false);
    }
  }, [company, id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!company) return null;
  if (loading || !data)
    return (
      <PageContainer title="Facture">
        <Skeleton height="20rem" />
      </PageContainer>
    );

  const { invoice, lines, client } = data;
  const isDraft = invoice.status === "draft";
  const isPendingOrLate = invoice.status === "pending" || invoice.status === "late";
  const isCreditNote = invoice.type === "credit_note";

  async function handlePay() {
    if (!company || !invoice) return;
    setBusy(true);
    try {
      await markInvoicePaid(company.id, invoice.id, {
        paid_at: isValidDate(payDate) ? parseISO(payDate).toISOString() : new Date().toISOString(),
        amount: parseFloat(payAmount),
        method: payMethod,
      });
      toast("Facture marquée comme payée", "success");
      setPayOpen(false);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreditNote() {
    if (!company || !invoice) return;
    setBusy(true);
    try {
      const cn = await createCreditNote(company.id, invoice.id);
      toast("Avoir créé (brouillon)", "success");
      navigate(`/invoices/new?id=${cn.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleEmit() {
    if (!company || !invoice) return;
    setBusy(true);
    try {
      const emitted = await emitInvoice(company.id, invoice.id);
      toast(`${isCreditNote ? "Avoir" : "Facture"} émis${isCreditNote ? "" : "e"} : ${emitted.number}`, "success");
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
    }
  }

  const heroAction = isDraft ? (
    <Button
      type="button"
      variant="primary"
      size="md"
      leftIcon={<Send className="w-4 h-4" />}
      onClick={handleEmit}
      loading={busy}
      className="w-full"
    >
      {isCreditNote ? "Émettre l'avoir" : "Émettre la facture"}
    </Button>
  ) : isPendingOrLate && !isCreditNote ? (
    <Button
      type="button"
      variant="primary"
      size="md"
      leftIcon={<Check className="w-4 h-4" />}
      onClick={() => {
        setPayDate(todayISO());
        setPayAmount(String(Number(invoice.total_ttc)));
        setPayOpen(true);
      }}
      disabled={busy}
      className="w-full"
    >
      Marquer comme payée
    </Button>
  ) : null;

  return (
    <PageContainer
      title={`Facture ${invoice.number.startsWith("DRAFT-") ? "Brouillon" : invoice.number}`}
      subtitle={client?.name || ""}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Document */}
        <div className="mx-auto w-full" style={{ maxWidth: "640px" }}>
          <DocumentPreview
            company={company}
            client={client}
            documentType="invoice"
            number={invoice.number}
            issueDate={invoice.issue_date}
            dueDate={invoice.due_date}
            paymentTerms={invoice.payment_terms}
            note={invoice.note}
            lines={lines}
            totalHt={Number(invoice.total_ht)}
            totalVat={Number(invoice.total_vat)}
            totalTtc={Number(invoice.total_ttc)}
            isCreditNote={isCreditNote}
          />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Status card */}
          <div className="border border-border rounded-card p-4 card-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                Statut
              </span>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <Row label="Émise le" value={formatDateLong(invoice.issue_date)} />
              <Row label="Échéance" value={formatDateLong(invoice.due_date)} />
              {invoice.paid_at && (
                <Row label="Payée le" value={formatDateLong(invoice.paid_at)} />
              )}
              {invoice.paid_amount != null && (
                <Row
                  label="Montant payé"
                  value={`${Number(invoice.paid_amount).toFixed(2)} €`}
                />
              )}
            </div>
          </div>

          {/* Actions card */}
          <div className="border border-border rounded-card p-4 card-shadow flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
              Actions
            </span>
            {heroAction && <div className="pb-2 mb-1 border-b border-border">{heroAction}</div>}
            {isDraft && !isCreditNote && (
              <ActionButton
                icon={<FileText className="w-4 h-4" />}
                onClick={() => navigate(`/invoices/new?id=${invoice.id}`)}
                disabled={busy}
              >
                Modifier
              </ActionButton>
            )}
            {isPendingOrLate && !isCreditNote && (
              <Tooltip content="Disponible prochainement" side="top">
                <span className="block">
                  <ActionButton
                    icon={<Bell className="w-4 h-4" />}
                    onClick={() => {}}
                    disabled
                  >
                    Relancer
                  </ActionButton>
                </span>
              </Tooltip>
            )}
            {!isCreditNote && !isDraft && (
              <ActionButton
                icon={<FileText className="w-4 h-4" />}
                onClick={handleCreditNote}
                disabled={busy}
              >
                Créer un avoir
              </ActionButton>
            )}
            <PdfButton
              documentType="invoice"
              documentId={invoice.id}
              size="sm"
              variant="ghost"
            />
          </div>
        </div>
      </div>

      {/* Payment modal */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Marquer comme payée">
        <div className="flex flex-col gap-4">
          <Input
            label="Date de paiement"
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
            required
          />
          <Input
            label="Montant encaissé"
            type="number"
            step="0.01"
            min="0.01"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            leftIcon={<span className="text-sm">€</span>}
            helperText="Saisissez le montant réellement encaissé (paiement partiel possible)"
            required
          />
          <Select
            label="Méthode"
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
          >
            <option value="transfer">Virement</option>
            <option value="check">Chèque</option>
            <option value="cash">Espèces</option>
            <option value="stripe">Stripe</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPayOpen(false)} disabled={busy}>
              Annuler
            </Button>
            <Button type="button" variant="primary" onClick={handlePay} loading={busy}>
              Encaisser
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}

function ActionButton({
  icon,
  children,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-3 h-9 rounded-card text-sm text-text hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full text-left"
    >
      <span className="text-muted flex-shrink-0">{icon}</span>
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}
