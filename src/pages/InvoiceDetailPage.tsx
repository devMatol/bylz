import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Bell,
  Send,
  Check,
  Mail,
  Link2,
  Trash2,
} from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { ConfirmModal } from "../components/documents/ConfirmModal";
import { StatusBadge } from "../components/shared/StatusBadge";
import { DocumentPreview } from "../components/documents/DocumentPreview";
import { PdfButton } from "../components/documents/PdfButton";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import {
  fetchInvoice,
  markInvoicePaid,
  createCreditNote,
  emitInvoice,
  fetchInvoiceReminders,
  sendInvoiceReminder,
  sendDocumentByEmail,
  deleteInvoice,
} from "../lib/api";
import { formatDateLong, todayISO, isValidDate } from "../lib/date";
import { formatAmount, cn } from "../lib/utils";
import { parseISO, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { format } from "date-fns";
import type { Invoice, InvoiceLine, Client, PaymentMethod, InvoiceReminder } from "../types/database";
import { canUseFeature, countEmittedInvoicesThisMonth, getPlanLimits } from "../lib/planLimits";
import { UpgradeModal } from "../components/shared/UpgradeModal";
import { Copy, CheckCircle2 } from "lucide-react";
import { PaTimeline } from "../components/documents/PaTimeline";

export function InvoiceDetailPage() {
  const { id } = useParams();
  const { company, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<{
    invoice: Invoice;
    lines: InvoiceLine[];
    client: Client | null;
    linkedCreditNotes: { id: string; number: string }[];
    sourceInvoice: { id: string; number: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [remindOpen, setRemindOpen] = useState(false);
  const [reminders, setReminders] = useState<InvoiceReminder[]>([]);
  const [remindSubject, setRemindSubject] = useState("");
  const [remindBody, setRemindBody] = useState("");
  const [remindError, setRemindError] = useState<string | null>(null);

  const [payDate, setPayDate] = useState(todayISO());
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("transfer");
  const [cnOpen, setCnOpen] = useState(false);
  const [cnMode, setCnMode] = useState<"total" | "partial">("total");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<"invoices" | "reminders" | "paymentLinks">("invoices");

  const load = useCallback(async () => {
    if (!company || !id) return;
    try {
      const d = await fetchInvoice(company.id, id);
      setData(d);
      if (d) {
        setPayAmount(String(Number(d.invoice.total_ttc)));
        const rems = await fetchInvoiceReminders(company.id, id);
        setReminders(rems);
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

  function computeDaysLate(): number {
    const due = parseISO(invoice.due_date);
    const today = new Date();
    return today > due ? differenceInCalendarDays(today, due) : 0;
  }

  function buildReminderTemplate(): { subject: string; body: string } {
    if (!company) return { subject: "", body: "" };
    const daysLate = computeDaysLate();
    const clientName = client?.name || "client";
    const amount = formatAmount(Number(invoice.total_ttc));
    const dueDate = formatDateLong(invoice.due_date);
    const invoiceNumber = invoice.number;

    if (daysLate <= 0 || daysLate < 7) {
      return {
        subject: `Rappel : facture ${invoiceNumber} à régler`,
        body: `Bonjour ${clientName},\n\nJe me permets de vous rappeler que la facture ${invoiceNumber} d'un montant de ${amount}, échéance du ${dueDate}, est en attente de règlement.\n\nMerci de bien vouloir procéder au paiement dans les meilleurs délais.\n\nCordialement,\n${company.commercial_name || company.legal_name}`,
      };
    }
    if (daysLate <= 30) {
      return {
        subject: `Relance : facture ${invoiceNumber} (échéance dépassée)`,
        body: `Bonjour ${clientName},\n\nSauf erreur de ma part, la facture ${invoiceNumber} d'un montant de ${amount}, dont l'échéance était fixée au ${dueDate}, n'a pas encore été réglée (soit ${daysLate} jours de retard).\n\nJe vous remercie de bien vouloir procéder au règlement dès réception de ce courriel.\n\nCordialement,\n${company.commercial_name || company.legal_name}`,
      };
    }
    return {
      subject: `Mise en demeure : facture ${invoiceNumber} (${daysLate} jours de retard)`,
      body: `Bonjour ${clientName},\n\nMalgré plusieurs relances, la facture ${invoiceNumber} d'un montant de ${amount}, dont l'échéance était fixée au ${dueDate}, reste impayée à ce jour (${daysLate} jours de retard).\n\nJe vous informe que des pénalités de retard sont applicables conformément aux conditions de vente. Une indemnité forfaitaire de 40€ pour frais de recouvrement est également due en application de l'article L441-10 du Code de commerce.\n\nJe vous demande par conséquent de procéder au règlement de cette facture dans un délai de 8 jours.\n\nÀ défaut, je me verrai contraint d'engager les poursuites nécessaires.\n\nCordialement,\n${company.commercial_name || company.legal_name}`,
    };
  }

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
      if (cnMode === "total") {
        const emitted = await emitInvoice(company.id, cn.id);
        toast(`Avoir créé et émis : ${emitted.number}`, "success");
        if (client?.email) {
          try {
            const amount = formatAmount(Number(emitted.total_ttc));
            await sendDocumentByEmail("invoice", emitted.id, client.email, {
              subject: `Avoir ${emitted.number} : ${company.commercial_name || company.legal_name}`,
              body: `Bonjour ${client.name},\n\nVeuillez trouver ci-joint votre avoir ${emitted.number} d'un montant de ${amount}.\n\nCordialement,\n${company.commercial_name || company.legal_name}`,
            });
            toast("Avoir envoyé par email au client", "info");
          } catch (err) {
            toast(err instanceof Error ? `Email non envoyé : ${err.message}` : "Email non envoyé", "danger");
          }
        }
        setCnOpen(false);
        void load();
      } else {
        toast("Avoir créé (brouillon) : modifiez les lignes puis émettez", "success");
        setCnOpen(false);
        navigate(`/invoices/new?id=${cn.id}`);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!company || !invoice) return;
    setBusy(true);
    try {
      await deleteInvoice(company.id, invoice.id);
      toast("Brouillon supprimé", "success");
      navigate("/invoices");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleEmit() {
    if (!company || !invoice) return;
    const limits = getPlanLimits(profile?.plan);
    if (limits.invoicesPerMonth !== null) {
      const count = await countEmittedInvoicesThisMonth(company.id);
      if (count >= limits.invoicesPerMonth) {
        setUpgradeFeature("invoices");
        setUpgradeModalOpen(true);
        return;
      }
    }
    setBusy(true);
    try {
      const emitted = await emitInvoice(company.id, invoice.id);
      toast(`${isCreditNote ? "Avoir" : "Facture"} émis${isCreditNote ? "" : "e"} : ${emitted.number}`, "success");
      if (client?.email) {
        try {
          const amount = formatAmount(Number(emitted.total_ttc));
          await sendDocumentByEmail("invoice", emitted.id, client.email, {
            subject: `${isCreditNote ? "Avoir" : "Facture"} ${emitted.number} : ${company.commercial_name || company.legal_name}`,
            body: `Bonjour ${client.name},\n\nVeuillez trouver ci-joint ${isCreditNote ? "votre avoir" : "votre facture"} ${emitted.number} d'un montant de ${amount}.\n\nCordialement,\n${company.commercial_name || company.legal_name}`,
          });
          toast("Document envoyé par email au client", "info");
        } catch (err) {
          toast(err instanceof Error ? `Email non envoyé : ${err.message}` : "Email non envoyé", "danger");
        }
      } else {
        toast("Client sans email : document non envoyé", "info");
      }
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
    }
  }

  function openRemind() {
    if (!canUseFeature(profile?.plan, "reminders")) {
      setUpgradeFeature("reminders");
      setUpgradeModalOpen(true);
      return;
    }
    const tpl = buildReminderTemplate();
    setRemindSubject(tpl.subject);
    setRemindBody(tpl.body);
    setRemindError(null);
    setRemindOpen(true);
  }

  async function handleSendReminder() {
    if (!company || !invoice) return;
    setBusy(true);
    setRemindError(null);
    try {
      await sendInvoiceReminder(
        company.id,
        invoice.id,
        { number: invoice.number, due_date: invoice.due_date, total_ttc: Number(invoice.total_ttc) },
        client ? { email: client.email, name: client.name } : null,
        { subject: remindSubject, body: remindBody }
      );
      toast("Relance envoyée", "success");
      setRemindOpen(false);
      void load();
    } catch (err) {
      setRemindError(err instanceof Error ? err.message : "Erreur");
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

          {/* FactPulse PA Transmission Timeline Card (B2B Only) */}
          {client && (
            <PaTimeline invoice={invoice} isB2b={client.type === "b2b"} onRefresh={load} />
          )}

          {/* Stripe Payment Link Card if available */}
          {invoice.stripe_payment_link && (
            <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-card p-4 card-shadow space-y-2">
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4" />
                <span>Lien de paiement Stripe</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Permet un paiement sécurisé par carte bancaire.
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={invoice.stripe_payment_link}
                  className="bg-surface border border-border text-xs rounded-lg px-2.5 py-1.5 w-full text-text truncate font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(invoice.stripe_payment_link!);
                    setCopiedLink(true);
                    toast("Lien copié dans le presse-papier !", "success");
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="flex-shrink-0"
                >
                  {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          )}

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
              <ActionButton
                icon={<Bell className="w-4 h-4" />}
                onClick={openRemind}
                disabled={busy}
              >
                Relancer
              </ActionButton>
            )}
            {!isCreditNote && !isDraft && (
              <ActionButton
                icon={<FileText className="w-4 h-4" />}
                onClick={() => {
                  setCnMode("total");
                  setCnOpen(true);
                }}
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
            {isDraft && (
              <>
                <div className="border-t border-border my-1" />
                <ActionButton
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setDeleteOpen(true)}
                  disabled={busy}
                  danger
                >
                  Supprimer le brouillon
                </ActionButton>
              </>
            )}
          </div>

          {/* Reminder history */}
          {isPendingOrLate && !isCreditNote && (
            <div className="border border-border rounded-card p-4 card-shadow">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 block">
                Relances
              </span>
              {reminders.length === 0 ? (
                <p className="text-sm text-muted">Aucune relance envoyée</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {reminders.map((r, idx) => {
                    const ordinal =
                      idx === 0 ? "1ère relance" : `${idx + 1}ème relance`;
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Mail className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                        <span className="text-text">
                          Relancé le {format(parseISO(r.sent_at), "d MMMM yyyy", { locale: fr })}
                        </span>
                        <span className="text-muted text-xs">({ordinal})</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Linked documents */}
          {(data.linkedCreditNotes.length > 0 || data.sourceInvoice) && (
            <div className="border border-border rounded-card p-4 card-shadow">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 block">
                Documents liés
              </span>
              <div className="flex flex-col gap-2">
                {data.sourceInvoice && (
                  <button
                    type="button"
                    onClick={() => navigate(`/invoices/${data.sourceInvoice!.id}`)}
                    className="flex items-center gap-2 text-sm text-text hover:text-primary transition-colors text-left"
                  >
                    <Link2 className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                    Avoir sur : <span className="font-semibold">{data.sourceInvoice.number}</span>
                  </button>
                )}
                {data.linkedCreditNotes.map((cn) => (
                  <button
                    key={cn.id}
                    type="button"
                    onClick={() => navigate(`/invoices/${cn.id}`)}
                    className="flex items-center gap-2 text-sm text-text hover:text-primary transition-colors text-left"
                  >
                    <Link2 className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                    Avoir lié : <span className="font-semibold">{cn.number}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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

      {/* Credit note modal */}
      <Modal open={cnOpen} onClose={() => setCnOpen(false)} title="Créer un avoir">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Créer un avoir pour <span className="font-semibold text-text">{invoice.number}</span> ?
            L'avoir annulera tout ou partie du montant de cette facture.
          </p>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-text">Type d'avoir</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCnMode("total")}
                className={cn(
                  "flex-1 px-3 py-2.5 rounded-card text-sm font-semibold border transition-all",
                  cnMode === "total"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted hover:text-text"
                )}
              >
                Avoir total
              </button>
              <button
                type="button"
                onClick={() => setCnMode("partial")}
                className={cn(
                  "flex-1 px-3 py-2.5 rounded-card text-sm font-semibold border transition-all",
                  cnMode === "partial"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted hover:text-text"
                )}
              >
                Avoir partiel
              </button>
            </div>
            <p className="text-xs text-muted">
              {cnMode === "total"
                ? "Toutes les lignes seront copiées avec des montants négatifs, puis l'avoir sera émis automatiquement."
                : "Un brouillon sera créé avec des montants négatifs. Vous pourrez ajuster les lignes avant émission."}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCnOpen(false)} disabled={busy}>
              Annuler
            </Button>
            <Button type="button" variant="primary" onClick={handleCreditNote} loading={busy}>
              {cnMode === "total" ? "Créer et émettre" : "Créer le brouillon"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reminder modal */}
      <Modal open={remindOpen} onClose={() => setRemindOpen(false)} title="Relancer le client">
        <div className="flex flex-col gap-4">
          <Input
            label="Sujet"
            value={remindSubject}
            onChange={(e) => setRemindSubject(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Message</label>
            <textarea
              value={remindBody}
              onChange={(e) => setRemindBody(e.target.value)}
              rows={10}
              className="w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-text resize-y focus:outline-none focus:border-primary"
              required
            />
          </div>
          {!client?.email && (
            <p className="text-sm text-danger">
              Ce client n'a pas d'email enregistré : la relance ne peut pas être envoyée.
            </p>
          )}
          {remindError && (
            <p className="text-sm text-danger">{remindError}</p>
          )}
          <p className="text-xs text-muted">
            La facture sera jointe automatiquement au format PDF.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRemindOpen(false)} disabled={busy}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSendReminder}
              loading={busy}
              disabled={!client?.email}
            >
              Envoyer la relance
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer ce brouillon ?"
        message={`Cette action est définitive. ${client?.name ? `Client : ${client.name}. ` : ""}Montant : ${formatAmount(Number(invoice.total_ttc))}.`}
        confirmLabel="Supprimer"
        danger
      />

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeFeature}
      />
    </PageContainer>
  );
}

function ActionButton({
  icon,
  children,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-3 h-9 rounded-card text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full text-left",
        danger
          ? "text-danger hover:bg-danger/10"
          : "text-text hover:bg-surface-hover"
      )}
    >
      <span className={danger ? "text-danger flex-shrink-0" : "text-muted flex-shrink-0"}>{icon}</span>
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
