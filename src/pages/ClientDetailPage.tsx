import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, Archive } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Tabs } from "../components/ui/Tabs";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Avatar } from "../components/shared/Avatar";
import { Amount } from "../components/shared/Amount";
import { StatCard } from "../components/shared/StatCard";
import { ClientModal } from "../components/documents/ClientModal";
import { ConfirmModal } from "../components/documents/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import {
  fetchClient,
  archiveClient,
  fetchClientStats,
  fetchClientDocuments,
} from "../lib/api";
import { formatDateLong } from "../lib/date";
import type { Client, Quote, Invoice } from "../types/database";

export function ClientDetailPage() {
  const { id } = useParams();
  const { company } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [stats, setStats] = useState<{
    caEncaisse: number;
    enAttente: number;
    delaiMoyen: number | null;
  } | null>(null);
  const [docs, setDocs] = useState<{
    invoices: (Invoice & { client_name: string })[];
    quotes: (Quote & { client_name: string })[];
  } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!company || !id) return;
    try {
      const [c, s, d] = await Promise.all([
        fetchClient(company.id, id),
        fetchClientStats(company.id, id),
        fetchClientDocuments(company.id, id),
      ]);
      setClient(c);
      setStats(s);
      setDocs(d);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    }
  }, [company, id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!company) return null;
  if (!client)
    return (
      <PageContainer title="Client" subtitle="Fiche client">
        <Skeleton height="8rem" />
      </PageContainer>
    );

  async function handleArchive() {
    if (!company || !client) return;
    setPending(true);
    try {
      await archiveClient(company.id, client.id);
      toast("Client archivé", "success");
      navigate("/clients");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setPending(false);
    }
  }

  return (
    <PageContainer title={client.name} subtitle="Fiche client">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={client.name} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-text truncate">{client.name}</h2>
              {client.type && (
                <Badge variant={client.type === "b2b" ? "primary" : "default"}>
                  {client.type === "b2b" ? "Professionnel" : "Particulier"}
                </Badge>
              )}
            </div>
            {client.address && (
              <p className="text-sm text-muted mt-1 truncate">{client.address}</p>
            )}
            {client.siret && (
              <p className="text-xs text-muted mt-1">SIRET {client.siret}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Pencil className="w-4 h-4" />}
            onClick={() => setEditOpen(true)}
            className="flex-1 sm:flex-none justify-center"
          >
            Modifier
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Archive className="w-4 h-4" />}
            onClick={() => setArchiveOpen(true)}
            className="flex-1 sm:flex-none justify-center"
          >
            Archiver
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats ? (
          <>
            <StatCard label="CA encaissé" value={stats.caEncaisse} />
            <StatCard label="Factures en attente" value={stats.enAttente} />
            <StatCard
              label="Délai moyen (j)"
              value={stats.delaiMoyen ?? 0}
            />
          </>
        ) : (
          <Skeleton height="6rem" />
        )}
      </div>
      {stats && stats.delaiMoyen === null && (
        <p className="text-xs text-muted -mt-3">Délai moyen : -</p>
      )}

      <Tabs
        tabs={[
          {
            id: "invoices",
            label: "Factures",
            content: (
              <DocsTable
                rows={(docs?.invoices || []).map((i) => ({
                  id: i.id,
                  number: i.number,
                  date: i.issue_date,
                  amount: Number(i.total_ttc),
                  status: i.status,
                  onClick: () => navigate(`/invoices/${i.id}`),
                }))}
                empty="Aucune facture"
              />
            ),
          },
          {
            id: "quotes",
            label: "Devis",
            content: (
              <DocsTable
                rows={(docs?.quotes || []).map((q) => ({
                  id: q.id,
                  number: q.number,
                  date: q.issue_date,
                  amount: Number(q.total_ttc),
                  status: q.status,
                  onClick: () => navigate(`/quotes/${q.id}`),
                }))}
                empty="Aucun devis"
              />
            ),
          },
        ]}
      />

      <ClientModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        companyId={company.id}
        client={client}
        onSaved={() => void load()}
      />
      <ConfirmModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        title="Archiver le client"
        message="Ce client sera masqué des listes mais conservé sur ses documents existants. Cette action est irréversible."
        confirmLabel="Archiver"
      />
    </PageContainer>
  );
}

function DocsTable({
  rows,
  empty,
}: {
  rows: {
    id: string;
    number: string;
    date: string;
    amount: number;
    status: any;
    onClick: () => void;
  }[];
  empty: string;
}) {
  if (rows.length === 0)
    return <p className="text-sm text-muted py-4">{empty}</p>;
  return (
    <div className="border border-border rounded-card overflow-x-auto">
      <table className="w-full text-sm min-w-[500px]">
        <thead className="bg-surface-hover text-muted text-xs uppercase">
          <tr>
            <th className="text-left p-3 font-semibold">Numéro</th>
            <th className="text-left p-3 font-semibold">Date</th>
            <th className="text-right p-3 font-semibold">Montant TTC</th>
            <th className="text-left p-3 font-semibold">Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={r.onClick}
              className="border-t border-border hover:bg-surface-hover cursor-pointer transition-colors"
            >
              <td className="p-3 font-semibold text-text">
                {r.number.startsWith("DRAFT-") ? "Brouillon" : r.number}
              </td>
              <td className="p-3 text-muted">{formatDateLong(r.date)}</td>
              <td className="p-3 text-right">
                <Amount value={r.amount} size="sm" />
              </td>
              <td className="p-3">
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
