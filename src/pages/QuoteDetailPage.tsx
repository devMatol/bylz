import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Copy,
  Check,
  X,
  FileText,
  ChevronRight,
  FilePlus2,
  Send,
  Trash2,
} from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/shared/StatusBadge";
import { DocumentPreview } from "../components/documents/DocumentPreview";
import { PdfButton } from "../components/documents/PdfButton";
import { ConfirmModal } from "../components/documents/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import {
  fetchQuote,
  updateQuoteStatus,
  duplicateQuote,
  convertQuoteToInvoice,
  quoteHasInvoice,
  sendDocumentByEmail,
  deleteQuote,
} from "../lib/api";
import { formatDateLong } from "../lib/date";
import { formatAmount, cn } from "../lib/utils";
import type { Quote, QuoteLine, Client } from "../types/database";

export function QuoteDetailPage() {
  const { id } = useParams();
  const { company } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<{
    quote: Quote;
    lines: QuoteLine[];
    client: Client | null;
  } | null>(null);
  const [linkedInvoice, setLinkedInvoice] = useState<{
    id: string;
    number: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!company || !id) return;
    try {
      const d = await fetchQuote(company.id, id);
      setData(d);
      if (d) {
        const inv = await quoteHasInvoice(company.id, id);
        setLinkedInvoice(inv);
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
      <PageContainer title="Devis">
        <Skeleton height="20rem" />
      </PageContainer>
    );

  const { quote, lines, client } = data;

  async function setStatus(status: "sent" | "accepted" | "refused") {
    if (!company || !quote) return;
    setBusy(true);
    try {
      await updateQuoteStatus(company.id, quote.id, status);
      if (status === "sent" && client?.email) {
        try {
          const amount = formatAmount(Number(quote.total_ttc));
          await sendDocumentByEmail("quote", quote.id, client.email, {
            subject: `Devis ${quote.number} : ${company.commercial_name || company.legal_name}`,
            body: `Bonjour ${client.name},\n\nVeuillez trouver ci-joint mon devis ${quote.number} d'un montant de ${amount}.\n\nJe reste à votre disposition pour toute question.\n\nCordialement,\n${company.commercial_name || company.legal_name}`,
          });
          toast("Devis envoyé par email au client", "info");
        } catch (err) {
          toast(err instanceof Error ? `Email non envoyé : ${err.message}` : "Email non envoyé", "danger");
        }
      } else if (status === "sent" && !client?.email) {
        toast("Client sans email : document non envoyé", "info");
      }
      toast("Statut mis à jour", "success");
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicate() {
    if (!company || !quote) return;
    setBusy(true);
    try {
      const n = await duplicateQuote(company.id, quote.id);
      toast(`Devis dupliqué : ${n.number}`, "success");
      navigate(`/quotes/${n.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleConvert() {
    if (!company || !quote) return;
    setBusy(true);
    try {
      const inv = await convertQuoteToInvoice(company.id, quote.id);
      toast("Facture créée depuis le devis", "success");
      navigate(`/invoices/new?id=${inv.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!company || !quote) return;
    setBusy(true);
    try {
      await deleteQuote(company.id, quote.id);
      toast("Brouillon supprimé", "success");
      navigate("/quotes");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
    }
  }

  const heroAction =
    quote.status === "draft" ? (
      <Button
        type="button"
        variant="primary"
        size="md"
        leftIcon={<Send className="w-4 h-4" />}
        onClick={() => void setStatus("sent")}
        loading={busy}
        className="w-full"
      >
        Marquer envoyé
      </Button>
    ) : quote.status === "sent" ? (
      <Button
        type="button"
        variant="primary"
        size="md"
        leftIcon={<Check className="w-4 h-4" />}
        onClick={() => void setStatus("accepted")}
        loading={busy}
        className="w-full"
      >
        Marquer accepté
      </Button>
    ) : quote.status === "accepted" && !linkedInvoice ? (
      <Button
        type="button"
        variant="primary"
        size="md"
        leftIcon={<FilePlus2 className="w-4 h-4" />}
        onClick={handleConvert}
        loading={busy}
        className="w-full"
      >
        Convertir en facture
      </Button>
    ) : null;

  return (
    <PageContainer title={`Devis ${quote.number}`} subtitle={client?.name || ""}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Document */}
        <div className="mx-auto w-full" style={{ maxWidth: "640px" }}>
          <DocumentPreview
            company={company}
            client={client}
            documentType="quote"
            number={quote.number}
            issueDate={quote.issue_date}
            validityDate={quote.validity_date}
            paymentTerms={quote.payment_terms}
            note={quote.note}
            lines={lines}
            totalHt={Number(quote.total_ht)}
            totalVat={Number(quote.total_vat)}
            totalTtc={Number(quote.total_ttc)}
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
              <StatusBadge status={quote.status} />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <Timeline label="Créé le" date={quote.created_at} />
              {quote.status !== "draft" && (
                <Timeline label="Envoyé" date={quote.issue_date} />
              )}
              {quote.status === "accepted" && (
                <Timeline label="Accepté" date={quote.issue_date} />
              )}
              {quote.status === "refused" && (
                <Timeline label="Refusé" date={quote.issue_date} />
              )}
            </div>
          </div>


          <button
            type="button"
            onClick={() =>
              linkedInvoice
                ? navigate(`/invoices/${linkedInvoice.id}`)
                : undefined
            }
            className="flex items-center gap-2 px-3 py-2.5 rounded-card hover:bg-surface-hover transition-colors text-left w-full"
          >
            <FileText className="w-4 h-4 text-muted flex-shrink-0" />
            <span className="text-sm text-muted flex-shrink-0">Facture liée</span>
            <span className="flex-1 min-w-0 text-right">
              {linkedInvoice ? (
                <span className="text-sm font-semibold text-text">
                  {linkedInvoice.number.startsWith("DRAFT-")
                    ? "Brouillon"
                    : linkedInvoice.number}
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 rounded-pill bg-bg text-muted text-xs font-semibold">
                  Brouillon
                </span>
              )}
            </span>
            <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />
          </button>

          {/* Actions card */}
          <div className="border border-border rounded-card p-4 card-shadow flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
              Actions
            </span>
            {heroAction && <div className="pb-2 mb-1 border-b border-border">{heroAction}</div>}

            {/* Public Link Sharing Actions */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 space-y-2 mb-2">
              <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Partage & Signature Client</p>
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Copy className="w-4 h-4" />}
                  onClick={() => {
                    const token = quote.public_token || quote.id;
                    const url = `${window.location.origin}/v/${token}`;
                    void navigator.clipboard.writeText(url);
                    toast("Lien public copié dans le presse-papier !", "success");
                  }}
                  className="w-full text-xs font-bold bylz-glow-cta"
                >
                  Copier le lien public
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Send className="w-4 h-4 text-primary" />}
                  onClick={async () => {
                    if (!client?.email) {
                      toast("Veuillez renseigner un e-mail pour ce client dans la fiche Client.", "warning");
                      return;
                    }
                    setBusy(true);
                    try {
                      const token = quote.public_token || quote.id;
                      const publicUrl = `${window.location.origin}/v/${token}`;
                      const amount = formatAmount(Number(quote.total_ttc));
                      await sendDocumentByEmail("quote", quote.id, client.email, {
                        subject: `Devis N° ${quote.number} - ${company.commercial_name || company.legal_name}`,
                        body: `Bonjour ${client.name},\n\nVeuillez trouver ci-joint votre devis N° ${quote.number} d'un montant de ${amount}.\n\nVous pouvez le consulter, le télécharger et le SIGNER EN LIGNE via ce lien sécurisé :\n${publicUrl}\n\nCordialement,\n${company.commercial_name || company.legal_name}`,
                      });
                      toast(`Devis envoyé par e-mail à ${client.email} !`, "success");
                      if (quote.status === "draft") {
                        await updateQuoteStatus(company.id, quote.id, "sent");
                        void load();
                      }
                    } catch (err: any) {
                      toast(err.message || "Erreur d'envoi email", "danger");
                    } finally {
                      setBusy(false);
                    }
                  }}
                  loading={busy}
                  className="w-full text-xs font-semibold"
                >
                  Envoyer par e-mail au client
                </Button>

                <a
                  href={`/v/${quote.public_token || quote.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-1.5 bg-surface-hover hover:bg-surface border border-border text-text px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  <span>🌐 Tester la vue client & signature</span>
                </a>
              </div>
            </div>

            {quote.signature_data && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-[11px] text-emerald-400 space-y-1 mb-2">
                <p className="font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Signé par {quote.signature_data.signer_name}
                </p>
                <p className="text-muted">Email : {quote.signature_data.signer_email}</p>
              </div>
            )}

            {quote.status === "draft" && (
              <ActionButton
                icon={<FileText className="w-4 h-4" />}
                onClick={() => navigate(`/quotes/new?id=${quote.id}`)}
                disabled={busy}
              >
                Modifier
              </ActionButton>
            )}
            {quote.status === "sent" && (
              <ActionButton
                icon={<X className="w-4 h-4" />}
                onClick={() => void setStatus("refused")}
                disabled={busy}
              >
                Marquer refusé
              </ActionButton>
            )}
            <ActionButton
              icon={<Copy className="w-4 h-4" />}
              onClick={handleDuplicate}
              disabled={busy}
            >
              Dupliquer
            </ActionButton>
            <PdfButton
              documentType="quote"
              documentId={quote.id}
              size="sm"
              variant="ghost"
            />
            {quote.status === "draft" && (
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
        </div>
      </div>
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer ce brouillon ?"
        message={`Cette action est définitive. ${client?.name ? `Client : ${client.name}. ` : ""}Montant : ${formatAmount(Number(quote.total_ttc))}.`}
        confirmLabel="Supprimer"
        danger
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

function Timeline({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-text">{formatDateLong(date)}</span>
    </div>
  );
}
