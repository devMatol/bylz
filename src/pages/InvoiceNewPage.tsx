import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Eye, Trash2, AlertTriangle, Receipt } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { LineEditor } from "../components/documents/LineEditor";
import { DocumentPreview } from "../components/documents/DocumentPreview";
import { PreviewModal } from "../components/documents/PreviewModal";
import { PdfButton } from "../components/documents/PdfButton";
import { ClientModal } from "../components/documents/ClientModal";
import { ConfirmModal } from "../components/documents/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { canUseFeature, countEmittedInvoicesThisMonth, getPlanLimits } from "../lib/planLimits";
import { UpgradeModal } from "../components/shared/UpgradeModal";
import {
  fetchInvoice,
  saveInvoice,
  emitInvoice,
  deleteInvoice,
  fetchClients,
  fetchCatalog,
  computeTotals,
  type LineInput,
} from "../lib/api";
import { todayISO, paymentTermsToDate, isValidDate } from "../lib/date";
import { formatAmount } from "../lib/utils";
import type { Client, CatalogItem, PaymentTerms } from "../types/database";

export function InvoiceNewPage() {
  const [params] = useSearchParams();
  const id = params.get("id") || undefined;
  const { company, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const [clients, setClients] = useState<Client[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(
    paymentTermsToDate(todayISO(), company?.default_payment_terms || "30d")
  );
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(
    company?.default_payment_terms || "30d"
  );
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<LineInput[]>([]);
  const [pending, setPending] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [emitOpen, setEmitOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [invoiceType, setInvoiceType] = useState<"invoice" | "credit_note">("invoice");

  const [dismissedHistory, setDismissedHistory] = useState(() => {
    return localStorage.getItem("bylz-dismiss-history-banner") === "true";
  });

  const handleDismissHistory = () => {
    localStorage.setItem("bylz-dismiss-history-banner", "true");
    setDismissedHistory(true);
  };

  const load = useCallback(async () => {
    if (!company) return;
    try {
      const [cls, cat] = await Promise.all([
        fetchClients(company.id),
        fetchCatalog(company.id),
      ]);
      setClients(cls as Client[]);
      setCatalog(cat);
      if (isEdit && id) {
        const data = await fetchInvoice(company.id, id);
        if (!data) {
          toast("Facture introuvable", "danger");
          navigate("/invoices");
          return;
        }
        if (data.invoice.status !== "draft") {
          navigate(`/invoices/${id}`);
          return;
        }
        setClientId(data.invoice.client_id);
        setIssueDate(data.invoice.issue_date);
        setDueDate(data.invoice.due_date);
        setPaymentTerms(data.invoice.payment_terms);
        setNote(data.invoice.note || "");
        setInvoiceType(data.invoice.type || "invoice");
        setLines(
          data.lines.map((l) => ({
            id: l.id,
            catalog_item_id: l.catalog_item_id,
            description: l.description,
            quantity: Number(l.quantity),
            unit_price: Number(l.unit_price),
            nature: l.nature,
            position: l.position,
          }))
        );
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setLoading(false);
    }
  }, [company, isEdit, id, navigate, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // recompute due date when issue date or terms change (only if issue date is valid)
  useEffect(() => {
    if (!isValidDate(issueDate)) return;
    setDueDate(paymentTermsToDate(issueDate, paymentTerms));
  }, [issueDate, paymentTerms]);

  if (!company) return null;
  if (loading)
    return (
      <PageContainer title="Nouvelle facture">
        <div>Chargement…</div>
      </PageContainer>
    );

  const totals = computeTotals(lines, company.vat_regime);
  const selectedClient = clients.find((c) => c.id === clientId) || null;
  const isCreditNote = invoiceType === "credit_note";
  const linesValid =
    lines.length > 0 &&
    lines.every(
      (l) => l.description && l.quantity > 0 && (isCreditNote || l.unit_price >= 0)
    );
  const datesValid = isValidDate(issueDate) && isValidDate(dueDate);
  const canSubmit = !!clientId && linesValid && datesValid;

  async function saveDraft() {
    if (!company || !canSubmit) return;
    setPending(true);
    try {
      const saved = await saveInvoice(company.id, {
        id: isEdit ? id : undefined,
        client_id: clientId,
        issue_date: issueDate,
        due_date: dueDate,
        payment_terms: paymentTerms,
        note: note.trim() || null,
        lines: lines.map((l, i) => ({ ...l, position: i })),
      });
      toast("Brouillon enregistré", "success");
      navigate(`/invoices/${saved.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setPending(false);
    }
  }

  async function handleEmit() {
    if (!company || !canSubmit) return;
    const limits = getPlanLimits(profile?.plan);
    if (limits.invoicesPerMonth !== null) {
      const count = await countEmittedInvoicesThisMonth(company.id);
      if (count >= limits.invoicesPerMonth) {
        setEmitOpen(false);
        setUpgradeModalOpen(true);
        return;
      }
    }
    setPending(true);
    try {
      let invoiceId = id;
      if (!invoiceId) {
        const saved = await saveInvoice(company.id, {
          id: undefined,
          client_id: clientId,
          issue_date: issueDate,
          due_date: dueDate,
          payment_terms: paymentTerms,
          note: note.trim() || null,
          lines: lines.map((l, i) => ({ ...l, position: i })),
        });
        invoiceId = saved.id;
      } else {
        await saveInvoice(company.id, {
          id,
          client_id: clientId,
          issue_date: issueDate,
          due_date: dueDate,
          payment_terms: paymentTerms,
          note: note.trim() || null,
          lines: lines.map((l, i) => ({ ...l, position: i })),
        });
      }
      const emitted = await emitInvoice(company.id, invoiceId);
      toast(`Facture émise : ${emitted.number}`, "success");
      navigate(`/invoices/${emitted.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!company || !id) return;
    setPending(true);
    try {
      await deleteInvoice(company.id, id);
      toast("Brouillon supprimé", "success");
      navigate("/invoices");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void saveDraft();
  }

  const previewActions = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      leftIcon={<Eye className="w-4 h-4" />}
      onClick={() => setPreviewOpen(true)}
    >
      Aperçu
    </Button>
  );

  const isProfileIncomplete = !company?.siret || !company?.address;

  return (
    <PageContainer
      title={isEdit ? "Modifier la facture" : "Nouvelle facture"}
      subtitle="Rédigez votre facture"
      actions={previewActions}
    >
      {isProfileIncomplete && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-[880px] mx-auto w-full">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse text-amber-500" />
            <div>
              <p className="font-semibold text-sm">Profil de l'entreprise incomplet</p>
              <p className="text-xs opacity-90 text-muted">
                Renseignez votre SIRET et votre adresse pour que vos factures soient légalement conformes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/settings?focus=company")}
            className="w-full sm:w-auto text-xs whitespace-nowrap bg-surface text-text border border-border px-3 h-8 rounded-pill font-semibold hover:bg-surface-hover transition-colors"
          >
            Compléter mon profil
          </button>
        </div>
      )}

      {!dismissedHistory && company && company.previous_ca === 0 && (
        <div className="mb-6 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-800 dark:text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-[880px] mx-auto w-full">
          <div className="flex items-center space-x-3">
            <Receipt className="w-5 h-5 flex-shrink-0 text-indigo-500" />
            <div>
              <p className="font-semibold text-sm">Rattraper votre historique fiscal {new Date().getFullYear()}</p>
              <p className="text-xs opacity-90 text-muted">
                Renseignez votre chiffre d'affaires antérieur ou importez vos anciennes factures de l'année pour suivre précisément vos plafonds de TVA et micro-entreprise.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/settings?focus=company")}
              className="flex-1 sm:flex-none text-xs whitespace-nowrap bg-surface text-text border border-border px-3 h-8 rounded-pill font-semibold hover:bg-surface-hover transition-colors"
            >
              Saisir mon CA
            </button>
            <button
              type="button"
              onClick={() => navigate("/invoices?import=true")}
              className="flex-1 sm:flex-none text-xs whitespace-nowrap bg-primary text-primary-foreground px-3 h-8 rounded-pill font-semibold hover:bg-primary-hover transition-colors animate-pulse"
            >
              Importer des PDF
            </button>
            <button
              type="button"
              onClick={handleDismissHistory}
              className="text-xs text-muted hover:text-text px-2 h-8 font-medium transition-colors"
              title="Masquer l'invitation"
            >
              Masquer
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 max-w-[880px] mx-auto w-full"
      >
        {/* Client */}
        <section className="border border-border rounded-card p-4 card-shadow">
          <h3 className="text-sm font-bold text-text mb-3">Client</h3>
          <div className="flex gap-2">
            <Select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex-1"
            >
              <option value="">Sélectionner un client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="outline"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setClientModalOpen(true)}
            >
              Nouveau
            </Button>
          </div>
        </section>

        {/* Lines */}
        <section className="border border-border rounded-card p-4 card-shadow">
          <h3 className="text-sm font-bold text-text mb-3">Lignes</h3>
          <LineEditor lines={lines} onChange={setLines} catalog={catalog} allowNegativePrice={isCreditNote} />
          {lines.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between text-muted">
                <span className="font-normal">Total HT</span>
                <span className="tabular-nums">
                  {totals.total_ht.toFixed(2)} €
                </span>
              </div>
              {company.vat_regime !== "franchise" && (
                <div className="flex justify-between text-muted">
                  <span className="font-normal">TVA</span>
                  <span className="tabular-nums">
                    {totals.total_vat.toFixed(2)} €
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center border-t-2 border-border pt-2 mt-0.5">
                <span className="font-bold text-text">Total TTC</span>
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: company.accent_color }}
                >
                  {totals.total_ttc.toFixed(2)} €
                </span>
              </div>
              {company.vat_regime === "franchise" && (
                <p className="text-xs text-muted mt-0.5">
                  TVA non applicable, art. 293 B du CGI
                </p>
              )}
            </div>
          )}
        </section>

        {/* Details */}
        <section className="border border-border rounded-card p-4 flex flex-col gap-3 card-shadow">
          <h3 className="text-sm font-bold text-text">Détails</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Date d'émission"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
            <Input
              label="Échéance"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <Select
            label="Conditions de règlement"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
          >
            <option value="on_receipt">À réception</option>
            <option value="30d">30 jours</option>
            <option value="60d">60 jours</option>
          </Select>
          <div>
            <label className="text-sm font-semibold text-text mb-1.5 block">
              Note (optionnel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Note pour le client…"
              className="w-full rounded bg-bg border border-border px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary resize-none"
            />
          </div>
        </section>

        {/* Spacer for sticky bar */}
        <div className="h-24" />
      </form>

      {/* Sticky summary bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[280px] z-20 border-t border-border px-4 md:px-10 py-3 flex items-center justify-between gap-4" style={{ backgroundColor: "var(--bg)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-3 min-w-0">
          {isEdit && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4" />}
              loading={pending}
              onClick={() => setDeleteOpen(true)}
              className="text-danger hover:bg-danger/10"
            >
              Supprimer
            </Button>
          )}
          <span className="text-sm text-muted tabular-nums">
            {lines.length} ligne{lines.length > 1 ? "s" : ""} · Total TTC{" "}
            <span className="font-bold text-text">
              {formatAmount(totals.total_ttc)}
            </span>
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={pending}
            disabled={!canSubmit}
            onClick={() => void saveDraft()}
          >
            Enregistrer le brouillon
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={pending}
            disabled={!canSubmit}
            onClick={() => setEmitOpen(true)}
          >
            Émettre la facture
          </Button>
        </div>
      </div>

      {/* Preview modal */}
      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        footer={
          isEdit ? (
            <PdfButton
              documentType="invoice"
              documentId={id!}
              size="md"
              variant="primary"
            />
          ) : undefined
        }
      >
        <DocumentPreview
          company={company}
          client={selectedClient}
          documentType="invoice"
          number={isEdit && id ? "FAC-" : "FAC-"}
          issueDate={issueDate}
          dueDate={dueDate}
          paymentTerms={paymentTerms}
          note={note.trim() || null}
          lines={lines}
          totalHt={totals.total_ht}
          totalVat={totals.total_vat}
          totalTtc={totals.total_ttc}
        />
      </PreviewModal>

      <ClientModal
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        companyId={company.id}
        onSaved={(c) => {
          setClients((prev) => [...prev, c]);
          setClientId(c.id);
          void load();
        }}
      />
      <ConfirmModal
        open={emitOpen}
        onClose={() => setEmitOpen(false)}
        onConfirm={handleEmit}
        title="Émettre la facture"
        message="Une fois émise, cette facture ne pourra plus être modifiée. Un avoir sera nécessaire pour toute correction."
        confirmLabel="Émettre"
        danger={false}
      />
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer ce brouillon ?"
        message={`Cette action est définitive. ${selectedClient ? `Client : ${selectedClient.name}. ` : ""}Montant : ${formatAmount(totals.total_ttc)}.`}
        confirmLabel="Supprimer"
        danger
      />
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature="invoices"
      />
    </PageContainer>
  );
}
