import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/shared/EmptyState";
import { SearchInput } from "../components/shared/SearchInput";
import { Avatar } from "../components/shared/Avatar";
import { Amount } from "../components/shared/Amount";
import { ClientModal } from "../components/documents/ClientModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { useDebounce } from "../hooks/useDebounce";
import { fetchClients } from "../lib/api";
import { formatDateLong } from "../lib/date";
import type { Client, ClientType } from "../types/database";
import { canUseFeature, countActiveClients, getPlanLimits } from "../lib/planLimits";
import { UpgradeModal } from "../components/shared/UpgradeModal";

interface Row {
  id: string;
  name: string;
  type: ClientType;
  siren: string | null;
  email: string | null;
  total_ca: number;
  invoice_count: number;
  created_at: string;
}

export function ClientsPage() {
  const { company, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const handleOpenNewClient = async () => {
    if (!company) return;
    const limits = getPlanLimits(profile?.plan);
    if (limits.maxClients !== null) {
      const count = await countActiveClients(company.id);
      if (count >= limits.maxClients) {
        setUpgradeModalOpen(true);
        return;
      }
    }
    setModalOpen(true);
  };

  const load = useCallback(async () => {
    if (!company) return;
    try {
      const data = await fetchClients(company.id, debounced);
      setRows(
        data.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          siren: c.siren,
          email: c.email,
          total_ca: c.total_ca,
          invoice_count: c.invoice_count,
          created_at: c.created_at,
        }))
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
      setRows([]);
    }
  }, [company, debounced, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!company) return null;

  return (
    <PageContainer
      title="Clients"
      subtitle="Gérez votre clientèle"
      actions={
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenNewClient}
        >
          Nouveau client
        </Button>
      }
    >
      <div className="max-w-md mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un client…" />
      </div>

      {rows === null ? (
        <SkeletonRows />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="Aucun client"
          description="Ajoutez votre premier client pour commencer à le facturer."
          ctaLabel="Ajouter un client"
          onCta={handleOpenNewClient}
        />
      ) : (
        <ClientsTable rows={rows} onRowClick={(id) => navigate(`/clients/${id}`)} />
      )}

      <ClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        companyId={company.id}
        onSaved={() => void load()}
      />

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature="clients"
      />
    </PageContainer>
  );
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} height="3rem" />
      ))}
    </div>
  );
}

function ClientsTable({
  rows,
  onRowClick,
}: {
  rows: Row[];
  onRowClick: (id: string) => void;
}) {
  return (
    <div className="hidden md:block border border-border rounded-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-hover text-muted text-xs uppercase">
          <tr>
            <th className="text-left p-3 font-semibold">Nom</th>
            <th className="text-left p-3 font-semibold">Type</th>
            <th className="text-left p-3 font-semibold">SIREN</th>
            <th className="text-right p-3 font-semibold">CA total</th>
            <th className="text-right p-3 font-semibold">Factures</th>
            <th className="text-left p-3 font-semibold">Créé le</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onRowClick(r.id)}
              className="border-t border-border hover:bg-surface-hover cursor-pointer transition-colors"
            >
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar name={r.name} size="sm" />
                  <div className="min-w-0">
                    <p className="font-semibold text-text truncate">{r.name}</p>
                    {r.email && (
                      <p className="text-xs text-muted truncate">{r.email}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="p-3">
                <Badge variant={r.type === "b2b" ? "primary" : "default"}>
                  {r.type === "b2b" ? "Professionnel" : "Particulier"}
                </Badge>
              </td>
              <td className="p-3 text-muted">{r.siren || "—"}</td>
              <td className="p-3 text-right">
                <Amount value={r.total_ca} size="sm" />
              </td>
              <td className="p-3 text-right text-text">{r.invoice_count}</td>
              <td className="p-3 text-muted text-xs">
                {formatDateLong(r.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
