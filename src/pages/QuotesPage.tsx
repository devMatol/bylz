import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Eye, Copy, Trash2, ArrowRightCircle, Loader2 } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/shared/EmptyState";
import { SearchInput } from "../components/shared/SearchInput";
import { FilterPills } from "../components/shared/FilterPills";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Amount } from "../components/shared/Amount";
import { ConfirmModal } from "../components/documents/ConfirmModal";
import { FloatingActionButton } from "../components/ui/FloatingActionButton";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { useDebounce } from "../hooks/useDebounce";
import { fetchQuotes, duplicateQuote, deleteQuote, convertQuoteToInvoice } from "../lib/api";
import { formatDateShort } from "../lib/date";
import { formatAmount } from "../lib/utils";
import type { QuoteStatus } from "../types/database";

type Filter = QuoteStatus | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "draft", label: "Brouillon" },
  { id: "sent", label: "Envoyé" },
  { id: "accepted", label: "Accepté" },
  { id: "refused", label: "Refusé" },
];

interface Row {
  id: string;
  number: string;
  client_name: string;
  issue_date: string;
  total_ttc: number;
  status: QuoteStatus;
}

export function QuotesPage() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const load = useCallback(async () => {
    if (!company) return;
    try {
      const data = await fetchQuotes(company.id, filter, debounced);
      setRows(
        data.map((q) => ({
          id: q.id,
          number: q.number,
          client_name: q.client_name,
          issue_date: q.issue_date,
          total_ttc: q.total_ttc,
          status: q.status,
        }))
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
      setRows([]);
    }
  }, [company, filter, debounced, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!company) return null;

  async function handleDuplicate(id: string) {
    try {
      const n = await duplicateQuote(company!.id, id);
      toast(`Devis dupliqué : ${n.number}`, "success");
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    }
  }

  const [convertingId, setConvertingId] = useState<string | null>(null);

  async function handleConvert(quoteId: string) {
    if (!company) return;
    setConvertingId(quoteId);
    try {
      const inv = await convertQuoteToInvoice(company.id, quoteId);
      toast("Facture créée avec succès depuis le devis !", "success");
      navigate(`/invoices/new?id=${inv.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur lors de la conversion", "danger");
    } finally {
      setConvertingId(null);
    }
  }

  async function handleDelete() {
    if (!company || !deleteTarget) return;
    try {
      await deleteQuote(company.id, deleteTarget.id);
      toast("Brouillon supprimé", "success");
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
      setDeleteTarget(null);
    }
  }

  return (
    <PageContainer
      title="Devis"
      subtitle="Vos propositions commerciales"
      actions={
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate("/quotes/new")}
        >
          Nouveau devis
        </Button>
      }
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mt-6 mb-6">
        <div className="order-2 lg:order-1 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <FilterPills options={FILTERS} value={filter} onChange={setFilter} className="flex-nowrap lg:flex-wrap" />
        </div>
        <div className="order-1 lg:order-2 w-full lg:w-64 lg:flex-shrink-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un devis…" />
        </div>
      </div>

      {rows === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="3rem" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="Aucun devis"
          description="Créez votre premier devis pour l'envoyer à vos clients."
          ctaLabel="Créer un devis"
          onCta={() => navigate("/quotes/new")}
        />
      ) : (
        <>
          {/* Desktop + tablet ≥768px table */}
          <div className="hidden md:block border border-border rounded-card overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col />
                <col className="w-[110px]" />
                <col className="w-[100px]" />
                <col className="w-[110px]" />
                <col className="w-[100px]" />
                <col className="w-[90px]" />
              </colgroup>
              <thead className="bg-surface-hover text-muted text-xs uppercase">
                <tr>
                  <th className="text-left p-3 font-semibold">Client</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Numéro</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Date</th>
                  <th className="text-right p-3 font-semibold whitespace-nowrap">Montant</th>
                  <th className="text-left p-3 font-semibold">Statut</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-border hover:bg-surface-hover transition-colors group"
                  >
                    <td
                      className="p-3 font-semibold text-text cursor-pointer truncate max-w-0"
                      onClick={() => navigate(`/quotes/${r.id}`)}
                      title={r.client_name}
                    >
                      {r.client_name}
                    </td>
                    <td
                      className="p-3 text-text cursor-pointer whitespace-nowrap"
                      onClick={() => navigate(`/quotes/${r.id}`)}
                    >
                      {r.number}
                    </td>
                    <td className="p-3 text-muted whitespace-nowrap">{formatDateShort(r.issue_date)}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Amount value={r.total_ttc} size="sm" />
                    </td>
                    <td className="p-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/quotes/${r.id}`)}
                          className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover text-muted hover:text-text border border-border transition-colors cursor-pointer"
                          title="Ouvrir le devis"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleConvert(r.id)}
                          disabled={convertingId === r.id}
                          className="px-2 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="Convertir ce devis en facture"
                        >
                          {convertingId === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden xl:inline">Facturer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(r.id)}
                          className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover text-muted hover:text-text border border-border transition-colors cursor-pointer"
                          title="Dupliquer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {r.status === "draft" && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(r)}
                            className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover text-muted hover:text-danger border border-border transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile <768px: stacked cards */}
          <div className="flex flex-col gap-3 md:hidden pb-28">
            {rows.map((r) => (
              <div
                key={r.id}
                className="border border-border rounded-card p-4 hover:bg-surface-hover transition-colors cursor-pointer space-y-3"
                onClick={() => navigate(`/quotes/${r.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text truncate">{r.client_name}</p>
                    <p className="text-xs text-muted mt-0.5">{r.number}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex items-center justify-between gap-2 text-sm border-t border-border/40 pt-2">
                  <span className="text-muted">{formatDateShort(r.issue_date)}</span>
                  <Amount value={r.total_ttc} size="sm" />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/quotes/${r.id}`)}
                    className="text-xs font-bold min-h-[36px]"
                  >
                    Ouvrir
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    loading={convertingId === r.id}
                    onClick={() => void handleConvert(r.id)}
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                    className="text-xs font-bold min-h-[36px]"
                  >
                    Convertir en facture
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer ce brouillon ?"
        message={`Cette action est définitive. ${deleteTarget ? `Client : ${deleteTarget.client_name}. Montant : ${formatAmount(deleteTarget.total_ttc)}.` : ""}`}
        confirmLabel="Supprimer"
        danger
      />

      {/* Mobile Floating Action Button */}
      <FloatingActionButton label="Devis" to="/quotes/new" />
    </PageContainer>
  );
}
