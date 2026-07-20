import { useEffect, useState, useCallback } from "react";
import { Copy, ExternalLink, Check, Landmark } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/shared/EmptyState";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { supabase } from "../lib/supabase";
import {
  computeUrssafPeriods,
  fetchUrssafDeclarations,
  markUrssafDeclared,
  type UrssafPeriod,
} from "../lib/api";
import { formatAmount, cn } from "../lib/utils";
import { formatDateLong, todayISO } from "../lib/date";
import type { Payment, UrssafDeclaration } from "../types/database";

export function UrssafPage() {
  const { company } = useAuth();
  const { toast } = useToast();
  const [periods, setPeriods] = useState<UrssafPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("id")
        .eq("company_id", company.id);
      if (error) throw error;
      const invoiceIds = (invoices || []).map((i: any) => i.id);
      let payments: Payment[] = [];
      if (invoiceIds.length > 0) {
        const { data: pmt, error: pErr } = await supabase
          .from("payments")
          .select("*")
          .in("invoice_id", invoiceIds);
        if (pErr) throw pErr;
        payments = (pmt || []) as Payment[];
      }
      const declarations: UrssafDeclaration[] = await fetchUrssafDeclarations(company.id);
      const computed = computeUrssafPeriods(
        company.created_at,
        company.urssaf_frequency,
        payments,
        declarations
      );
      setPeriods(computed);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setLoading(false);
    }
  }, [company, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!company) return null;

  const currentPeriod = periods.find((p) => !p.declared);
  const pastPeriods = periods;

  async function handleCopyAmount(amount: number) {
    try {
      await navigator.clipboard.writeText(String(amount.toFixed(2)));
      toast("Montant copié dans le presse-papiers", "success");
    } catch {
      toast("Copie impossible", "danger");
    }
  }

  async function handleDeclare(period: UrssafPeriod) {
    if (!company) return;
    setBusy(true);
    try {
      await markUrssafDeclared(company.id, period, company.activity_type);
      toast("Période marquée comme déclarée", "success");
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer title="URSSAF" subtitle="Vos déclarations URSSAF">
      {loading ? (
        <Skeleton height="12rem" />
      ) : periods.length === 0 ? (
        <EmptyState
          icon={<Landmark className="w-8 h-8" />}
          title="Aucune déclaration"
          description="Vos déclarations URSSAF apparaîtront ici automatiquement."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Hero — current period */}
          {currentPeriod && (
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                    Période courante
                  </p>
                  <h2 className="text-xl font-bold text-text">{currentPeriod.label}</h2>
                </div>
                <CountdownPill
                  dueDate={currentPeriod.dueDate}
                  declared={false}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-xs text-muted mb-1">CA encaissé</p>
                  <p className="text-lg font-bold text-text">
                    {formatAmount(currentPeriod.revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Cotisations estimées</p>
                  <p className="text-lg font-bold text-text">
                    {formatAmount(currentPeriod.estimatedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Échéance</p>
                  <p className="text-lg font-bold text-text">
                    {formatDateLong(currentPeriod.dueDate)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={<Copy className="w-4 h-4" />}
                  onClick={() => handleCopyAmount(currentPeriod.estimatedAmount)}
                >
                  Copier le montant
                </Button>
                <a
                  href="https://www.autoentrepreneur.urssaf.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-card text-sm font-semibold border border-border text-text hover:bg-surface-hover transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Déclarer sur urssaf.fr
                </a>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Check className="w-4 h-4" />}
                  onClick={() => handleDeclare(currentPeriod)}
                  loading={busy}
                >
                  Marquer comme déclaré
                </Button>
              </div>
            </Card>
          )}

          {/* History table */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-text mb-4">Historique des déclarations</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-border">
                    <th className="pb-2 pr-4 font-semibold">Période</th>
                    <th className="pb-2 pr-4 font-semibold">CA encaissé</th>
                    <th className="pb-2 pr-4 font-semibold">Montant</th>
                    <th className="pb-2 pr-4 font-semibold">Échéance</th>
                    <th className="pb-2 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {pastPeriods.map((p) => (
                    <tr key={p.periodStart} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-semibold text-text">{p.label}</td>
                      <td className="py-3 pr-4 text-text">{formatAmount(p.revenue)}</td>
                      <td className="py-3 pr-4 text-text">{formatAmount(p.estimatedAmount)}</td>
                      <td className="py-3 pr-4 text-muted">{formatDateLong(p.dueDate)}</td>
                      <td className="py-3">
                        <PeriodStatus period={p} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

function PeriodStatus({ period }: { period: UrssafPeriod }) {
  if (period.declared) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-pill bg-success/15 text-success">
        <Check className="w-3 h-3" /> Déclaré
      </span>
    );
  }
  const today = todayISO();
  if (period.dueDate < today) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-pill bg-danger/15 text-danger">
        En retard
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-pill bg-surface-hover text-muted">
      À venir
    </span>
  );
}

function CountdownPill({ dueDate, declared }: { dueDate: string; declared: boolean }) {
  if (declared) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-pill bg-success/15 text-success">
        <Check className="w-3 h-3" /> Déclaré
      </span>
    );
  }
  const today = todayISO();
  const days = Math.ceil(
    (new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000
  );
  const isLate = days < 0;
  const absDays = Math.abs(days);
  const color = isLate
    ? "bg-danger/15 text-danger"
    : absDays < 7
    ? "bg-danger/15 text-danger"
    : absDays < 15
    ? "bg-warning/15 text-warning"
    : "bg-surface-hover text-muted";
  const label = isLate ? `${absDays}j de retard` : `J-${absDays}`;
  return (
    <span className={cn("text-xs font-semibold px-3 py-1 rounded-pill", color)}>
      {label}
    </span>
  );
}
