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
import { formatDateLong } from "../lib/date";
import { cn } from "../lib/utils";
import type { InvoiceStatus } from "../types/database";

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
          <StatCard label="Total facturé (année)" value={stats.totalFacture} />
          <StatCard label="En attente" value={stats.enAttente} />
          <StatCard label="En retard" value={stats.enRetard} />
          <StatCard label="Encaissé ce mois" value={stats.encaisseMois} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <FilterPills options={FILTERS} value={filter} onChange={setFilter} />
        <div className="sm:max-w-xs sm:ml-auto">
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
        <div className="border border-border rounded-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-hover text-muted text-xs uppercase">
              <tr>
                <th className="text-left p-3 font-semibold">Client</th>
                <th className="text-left p-3 font-semibold">Numéro</th>
                <th className="text-left p-3 font-semibold">Émise le</th>
                <th className="text-left p-3 font-semibold">Échéance</th>
                <th className="text-right p-3 font-semibold">Montant TTC</th>
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
                      className="p-3 font-semibold text-text cursor-pointer"
                      onClick={() => navigate(`/invoices/${r.id}`)}
                    >
                      {r.client_name}
                    </td>
                    <td
                      className="p-3 text-text cursor-pointer"
                      onClick={() => navigate(`/invoices/${r.id}`)}
                    >
                      {r.number.startsWith("DRAFT-") ? "Brouillon" : r.number}
                    </td>
                    <td className="p-3 text-muted">{formatDateLong(r.issue_date)}</td>
                    <td
                      className={cn(
                        "p-3",
                        isLate
                          ? "text-danger font-bold"
                          : "text-muted"
                      )}
                    >
                      {formatDateLong(r.due_date)}
                    </td>
                    <td className="p-3 text-right">
                      <Amount value={r.total_ttc} size="sm" />
                    </td>
                    <td className="p-3">
                      <StatusBadge status={r.status} />
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
      )}
    </PageContainer>
  );
}
