import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Receipt, Eye } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/shared/EmptyState";
import { SearchInput } from "../components/shared/SearchInput";
import { FilterPills } from "../components/shared/FilterPills";
import { StatusBadge } from "../components/shared/StatusBadge";
import { StatCard } from "../components/shared/StatCard";
import { Amount } from "../components/shared/Amount";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { useDebounce } from "../hooks/useDebounce";
import { fetchInvoices, fetchInvoiceStats } from "../lib/api";
import { formatDateShort } from "../lib/date";
import { cn } from "../lib/utils";
import type { InvoiceStatus, InvoiceType } from "../types/database";

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
  issue_date: string;
  due_date: string;
  total_ttc: number;
  status: InvoiceStatus;
  type: InvoiceType;
}

export function InvoicesPage() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [stats, setStats] = useState<{
    totalFacture: number;
    enAttente: number;
    enRetard: number;
    encaisseMois: number;
  } | null>(null);

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
          issue_date: i.issue_date,
          due_date: i.due_date,
          total_ttc: i.total_ttc,
          status: i.status,
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

  if (!company) return null;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <PageContainer
      title="Factures"
      subtitle="Vos factures et encaissements"
      actions={
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate("/invoices/new")}
        >
          Nouvelle facture
        </Button>
      }
    >
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard variant="compact" label="Total facturé (année)" value={stats.totalFacture} />
          <StatCard variant="compact" label="En attente" value={stats.enAttente} />
          <StatCard variant="compact" label="En retard" value={stats.enRetard} />
          <StatCard variant="compact" label="Encaissé ce mois" value={stats.encaisseMois} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
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
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-8 h-8" />}
          title="Aucune facture"
          description="Créez votre première facture pour facturer vos clients."
          ctaLabel="Créer une facture"
          onCta={() => navigate("/invoices/new")}
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
                <col className="w-[100px]" />
                <col className="w-[90px]" />
              </colgroup>
              <thead className="bg-surface-hover text-muted text-xs uppercase">
                <tr>
                  <th className="text-left p-3 font-semibold">Client</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Numéro</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Émise</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Échéance</th>
                  <th className="text-right p-3 font-semibold whitespace-nowrap">Montant</th>
                  <th className="text-left p-3 font-semibold">Statut</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
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
                        <Amount value={r.total_ttc} size="sm" className={r.type === "credit_note" ? "text-danger" : undefined} />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
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
                  <th className="text-left p-3 font-semibold">Client</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Numéro</th>
                  <th className="text-left p-3 font-semibold whitespace-nowrap">Échéance</th>
                  <th className="text-right p-3 font-semibold whitespace-nowrap">Montant</th>
                  <th className="text-left p-3 font-semibold">Statut</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
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
                        <Amount value={r.total_ttc} size="sm" className={r.type === "credit_note" ? "text-danger" : undefined} />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
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
            {rows.map((r) => {
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
                    <div className="flex items-center gap-1.5">
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
                    <Amount value={r.total_ttc} size="sm" className={r.type === "credit_note" ? "text-danger" : undefined} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </PageContainer>
  );
}
