import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Eye, Copy } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/shared/EmptyState";
import { SearchInput } from "../components/shared/SearchInput";
import { FilterPills } from "../components/shared/FilterPills";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Amount } from "../components/shared/Amount";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { useDebounce } from "../hooks/useDebounce";
import { fetchQuotes, duplicateQuote } from "../lib/api";
import { formatDateLong } from "../lib/date";
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
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <FilterPills options={FILTERS} value={filter} onChange={setFilter} />
        <div className="sm:max-w-xs sm:ml-auto">
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
        <div className="border border-border rounded-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-hover text-muted text-xs uppercase">
              <tr>
                <th className="text-left p-3 font-semibold">Client</th>
                <th className="text-left p-3 font-semibold">Numéro</th>
                <th className="text-left p-3 font-semibold">Date</th>
                <th className="text-right p-3 font-semibold">Montant TTC</th>
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
                    className="p-3 font-semibold text-text cursor-pointer"
                    onClick={() => navigate(`/quotes/${r.id}`)}
                  >
                    {r.client_name}
                  </td>
                  <td
                    className="p-3 text-text cursor-pointer"
                    onClick={() => navigate(`/quotes/${r.id}`)}
                  >
                    {r.number}
                  </td>
                  <td className="p-3 text-muted">{formatDateLong(r.issue_date)}</td>
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
                        onClick={() => navigate(`/quotes/${r.id}`)}
                        className="p-1.5 rounded bg-surface-hover text-muted hover:text-text"
                        aria-label="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(r.id)}
                        className="p-1.5 rounded bg-surface-hover text-muted hover:text-text"
                        aria-label="Dupliquer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
