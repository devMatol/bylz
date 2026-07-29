import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Receipt, Eye, Trash2, AlertTriangle, Upload, Send } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/shared/EmptyState";
import { SearchInput } from "../components/shared/SearchInput";
import { FilterPills } from "../components/shared/FilterPills";
import { StatusBadge } from "../components/shared/StatusBadge";
import { StatCard } from "../components/shared/StatCard";
import { Amount } from "../components/shared/Amount";
import { ConfirmModal } from "../components/documents/ConfirmModal";
import { ImportInvoiceModal } from "../components/documents/ImportInvoiceModal";
import { FloatingActionButton } from "../components/ui/FloatingActionButton";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { useDebounce } from "../hooks/useDebounce";
import { fetchInvoices, fetchInvoiceStats, deleteInvoice, seedInboundFactpulseInvoice } from "../lib/api";
import { formatDateShort } from "../lib/date";
import { cn, formatAmount } from "../lib/utils";
import type { InvoiceStatus, InvoiceType, PaStatus } from "../types/database";

type Filter = InvoiceStatus | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "draft", label: "Brouillon" },
  { id: "pending", label: "En attente" },
  { id: "late", label: "En retard" },
  { id: "paid", label: "Payées" },
];

interface Row {
  id: string;
  number: string;
  client_name: string;
  client_type?: string;
  issue_date: string;
  due_date: string;
  total_ttc: number;
  status: InvoiceStatus;
  pa_status?: PaStatus;
  type: InvoiceType;
}

export function InvoicesPage() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"sales" | "purchases">("sales");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [stats, setStats] = useState<{
    totalFacture: number;
    enAttente: number;
    enRetard: number;
    encaisseMois: number;
  } | null>(null);

  const [dismissedHistory, setDismissedHistory] = useState(() => {
    return localStorage.getItem("bylz-dismiss-history-banner") === "true";
  });

  const handleDismissHistory = () => {
    localStorage.setItem("bylz-dismiss-history-banner", "true");
    setDismissedHistory(true);
  };

  useEffect(() => {
    if (params.get("import") === "true") {
      setImportOpen(true);
      const newParams = new URLSearchParams(params);
      newParams.delete("import");
      setParams(newParams, { replace: true });
    }
  }, [params, setParams]);

  const load = useCallback(async () => {
    if (!company) return;
    try {
      const [data, s] = await Promise.all([
        fetchInvoices(company.id, filter, debounced),
        fetchInvoiceStats(company.id),
      ]);
      setRows(
        data.map((i) => ({
          id: i.id,
          number: i.number,
          client_name: i.client_name,
          client_type: i.client_type,
          issue_date: i.issue_date,
          due_date: i.due_date,
          total_ttc: i.total_ttc,
          status: i.status,
          pa_status: i.pa_status,
          type: i.type,
        }))
      );
      setStats(s);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
      setRows([]);
    }
  }, [company, filter, debounced, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-seed captured Factur-X PDP invoice once for testing
  useEffect(() => {
    if (!company || !rows) return;
    const hasReceived = rows.some((r) => r.pa_status === "received");
    if (!hasReceived) {
      void seedInboundFactpulseInvoice(company.id)
        .then(() => {
          void load();
        })
        .catch((err) => {
          console.error("Auto-seed error:", err);
        });
    }
  }, [company, rows, load]);

  async function handleDelete() {
    if (!company || !deleteTarget) return;
    try {
      await deleteInvoice(company.id, deleteTarget.id);
      toast("Brouillon supprimé", "success");
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
      setDeleteTarget(null);
    }
  }

  if (!company) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isProfileIncomplete = !company.siret || !company.address;
  const showHistoryBanner = !dismissedHistory && company && company.previous_ca === 0;

  // Filter Sales vs Purchases
  const salesRows = (rows || []).filter((r) => r.pa_status !== "received");
  const purchaseRows = (rows || []).filter((r) => r.pa_status === "received");
  const activeRows = activeTab === "sales" ? salesRows : purchaseRows;

  // Custom tab stats
  const activeTotal = activeRows.reduce((acc, r) => acc + r.total_ttc, 0);
  const activePending = activeRows
    .filter((r) => r.status === "pending")
    .reduce((acc, r) => acc + r.total_ttc, 0);
  const activeLate = activeRows
    .filter((r) => (r.status === "pending" || r.status === "late") && r.due_date < today)
    .reduce((acc, r) => acc + r.total_ttc, 0);
  const activePaidMonth = activeRows
    .filter((r) => r.status === "paid")
    .reduce((acc, r) => acc + r.total_ttc, 0);

  return (
    <PageContainer
      title="Factures"
      subtitle="Vos factures et encaissements"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => setImportOpen(true)}
          >
            Importer des PDF
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate("/invoices/new")}
          >
            Nouvelle facture
          </Button>
        </div>
      }
    >
      {/* Ventes vs Achats Segment Switch */}
      <div className="flex rounded-pill border border-border/80 p-1 bg-surface-hover/40 shadow-inner w-fit mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("sales")}
          className={cn(
            "px-4 h-9 rounded-pill text-xs font-extrabold transition-all flex items-center gap-2",
            activeTab === "sales"
              ? "bg-primary text-white shadow-md scale-[1.02]"
              : "text-muted hover:text-text"
          )}
        >
          <span>Factures émises</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
            {salesRows.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("purchases")}
          className={cn(
            "px-4 h-9 rounded-pill text-xs font-extrabold transition-all flex items-center gap-2",
            activeTab === "purchases"
              ? "bg-primary text-white shadow-md scale-[1.02]"
              : "text-muted hover:text-text"
          )}
        >
          <span>Factures reçues</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
            {purchaseRows.length}
          </span>
        </button>
      </div>

      {isProfileIncomplete && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

      {showHistoryBanner && (
        <div className="mb-6 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-800 dark:text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              onClick={() => setImportOpen(true)}
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

      {/* Stat Cards tailored to activeTab */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          variant="compact"
          label={activeTab === "sales" ? "Total facturé (année)" : "Total achats (année)"}
          value={activeTotal}
        />
        <StatCard
          variant="compact"
          label={activeTab === "sales" ? "En attente" : "À régler (fournisseurs)"}
          value={activePending}
        />
        <StatCard
          variant="compact"
          label="En retard"
          value={activeLate}
        />
        <StatCard
          variant="compact"
          label={activeTab === "sales" ? "Encaissé ce mois" : "Réglé ce mois"}
          value={activePaidMonth}
        />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mt-6 mb-4">
        <div className="order-2 lg:order-1 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <FilterPills options={FILTERS} value={filter} onChange={setFilter} className="flex-nowrap lg:flex-wrap" />
        </div>
        <div className="order-1 lg:order-2 w-full lg:w-64 lg:flex-shrink-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une facture…" />
        </div>
      </div>

      {rows === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="3rem" />
          ))}
        </div>
      ) : activeRows.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-8 h-8" />}
          title={activeTab === "sales" ? "Aucune facture client" : "Aucune facture fournisseur reçue"}
          description={
            activeTab === "sales"
              ? "Créez votre première facture pour facturer vos clients."
              : "Les factures d'achats reçues via le réseau électronique FactPulse PDP apparaîtront ici."
          }
          ctaLabel={activeTab === "sales" ? "Créer une facture" : undefined}
          onCta={activeTab === "sales" ? () => navigate("/invoices/new") : undefined}
        />
      ) : (
        <>
          {/* Desktop table ≥1024px */}
          <div className="hidden lg:block border border-border rounded-card overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col />
                <col className="w-[110px]" />
                <col className="w-[100px]" />
                <col className="w-[100px]" />
                <col className="w-[110px]" />
                <col className="w-[120px]" />
                <col className="w-[90px]" />
              </colgroup>
              <thead className="bg-surface-hover text-muted text-xs uppercase">
                <tr>
                  <th className="text-left p-3 font-semibold">{activeTab === "sales" ? "Client" : "Fournisseur"}</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Numéro</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">{activeTab === "sales" ? "Émise" : "Reçue le"}</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Échéance</th>
                  <th className="text-right p-3 font-semibold whitespace-nowrap">Montant</th>
                  <th className="text-left p-3 font-semibold">Statut</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map((r) => {
                  const isLate =
                    (r.status === "pending" || r.status === "late") &&
                    r.due_date < today;
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-border hover:bg-surface-hover transition-colors group"
                    >
                      <td
                        className="p-3 font-semibold text-text cursor-pointer truncate max-w-0"
                        onClick={() => navigate(`/invoices/${r.id}`)}
                        title={r.client_name}
                      >
                        {r.client_name}
                      </td>
                      <td
                        className="p-3 text-text cursor-pointer whitespace-nowrap"
                        onClick={() => navigate(`/invoices/${r.id}`)}
                      >
                        {r.number.startsWith("DRAFT-") ? "Brouillon" : r.number}
                      </td>
                      <td className="p-3 text-muted whitespace-nowrap">{formatDateShort(r.issue_date)}</td>
                      <td
                        className={cn(
                          "p-3 whitespace-nowrap",
                          isLate ? "text-danger font-bold" : "text-muted"
                        )}
                      >
                        {formatDateShort(r.due_date)}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {activeTab === "purchases" ? (
                          <span className="font-bold text-violet-400">
                            - {formatAmount(r.total_ttc)}
                          </span>
                        ) : (
                          <Amount value={r.total_ttc} size="sm" className={r.type === "credit_note" ? "text-danger" : undefined} />
                        )}
                      </td>
                      <td className="p-3">
                        <div className="inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                          {r.pa_status === "received" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-extrabold bg-violet-500/15 text-violet-400 border border-violet-500/30">
                              Achat PDP
                            </span>
                          )}
                          {r.type === "credit_note" && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-pill text-[10px] font-bold bg-violet-500/15 text-violet-600 dark:text-violet-400">
                              Avoir
                            </span>
                          )}
                          <StatusBadge status={r.status} />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => navigate(`/invoices/${r.id}`)}
                            className="p-1.5 rounded bg-surface-hover text-muted hover:text-text"
                            aria-label="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {r.status === "draft" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(r);
                              }}
                              className="p-1.5 rounded bg-surface-hover text-muted hover:text-danger"
                              aria-label="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tablet 768-1023px: drop ÉMISE column */}
          <div className="hidden md:block lg:hidden border border-border rounded-card overflow-hidden">
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
                  <th className="text-left p-3 font-semibold">{activeTab === "sales" ? "Client" : "Fournisseur"}</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Numéro</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Échéance</th>
                  <th className="text-right p-3 font-semibold whitespace-nowrap">Montant</th>
                  <th className="text-left p-3 font-semibold">Statut</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map((r) => {
                  const isLate =
                    (r.status === "pending" || r.status === "late") &&
                    r.due_date < today;
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-border hover:bg-surface-hover transition-colors group"
                    >
                      <td
                        className="p-3 font-semibold text-text cursor-pointer truncate max-w-0"
                        onClick={() => navigate(`/invoices/${r.id}`)}
                        title={r.client_name}
                      >
                        {r.client_name}
                      </td>
                      <td
                        className="p-3 text-text cursor-pointer whitespace-nowrap"
                        onClick={() => navigate(`/invoices/${r.id}`)}
                      >
                        {r.number.startsWith("DRAFT-") ? "Brouillon" : r.number}
                      </td>
                      <td
                        className={cn(
                          "p-3 whitespace-nowrap",
                          isLate ? "text-danger font-bold" : "text-muted"
                        )}
                      >
                        {formatDateShort(r.due_date)}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {activeTab === "purchases" ? (
                          <span className="font-bold text-violet-400">
                            - {formatAmount(r.total_ttc)}
                          </span>
                        ) : (
                          <Amount value={r.total_ttc} size="sm" className={r.type === "credit_note" ? "text-danger" : undefined} />
                        )}
                      </td>
                      <td className="p-3">
                        <div className="inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                          {r.pa_status === "received" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-extrabold bg-violet-500/15 text-violet-400 border border-violet-500/30">
                              Achat PDP
                            </span>
                          )}
                          {r.type === "credit_note" && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-pill text-[10px] font-bold bg-violet-500/15 text-violet-600 dark:text-violet-400">
                              Avoir
                            </span>
                          )}
                          <StatusBadge status={r.status} />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => navigate(`/invoices/${r.id}`)}
                            className="p-1.5 rounded bg-surface-hover text-muted hover:text-text"
                            aria-label="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {r.status === "draft" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(r);
                              }}
                              className="p-1.5 rounded bg-surface-hover text-muted hover:text-danger"
                              aria-label="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile <768px: stacked cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {activeRows.map((r) => {
              const isLate =
                (r.status === "pending" || r.status === "late") &&
                r.due_date < today;
              return (
                <div
                  key={r.id}
                  className="border border-border rounded-card p-4 hover:bg-surface-hover transition-colors cursor-pointer"
                  onClick={() => navigate(`/invoices/${r.id}`)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text truncate">{r.client_name}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {r.number.startsWith("DRAFT-") ? "Brouillon" : r.number}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                      {r.pa_status === "received" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-extrabold bg-violet-500/15 text-violet-400 border border-violet-500/30">
                          Achat PDP
                        </span>
                      )}
                      {r.type === "credit_note" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-pill text-[10px] font-bold bg-violet-500/15 text-violet-600 dark:text-violet-400">
                          Avoir
                        </span>
                      )}
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <span className={cn("block", isLate ? "text-danger font-bold" : "text-muted")}>
                        {formatDateShort(r.due_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === "draft" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(r);
                          }}
                          className="p-1.5 rounded bg-surface-hover text-muted hover:text-danger"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {activeTab === "purchases" ? (
                        <span className="font-bold text-violet-400">
                          - {formatAmount(r.total_ttc)}
                        </span>
                      ) : (
                        <Amount value={r.total_ttc} size="sm" className={r.type === "credit_note" ? "text-danger" : undefined} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

      <ImportInvoiceModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={load}
      />

      {/* Mobile Floating Action Button */}
      <FloatingActionButton label="Facture" to="/invoices/new" />
    </PageContainer>
  );
}