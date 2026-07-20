import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Receipt,
  TrendingUp,
  Landmark,
  Wallet,
  CalendarClock,
  FileText,
  Plus,
} from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { StatCard } from "../components/shared/StatCard";
import { Amount } from "../components/shared/Amount";
import { StatusBadge } from "../components/shared/StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { fetchDashboardData, type DashboardData } from "../lib/api";
import { formatAmount, cn } from "../lib/utils";
import { formatDateLong } from "../lib/date";

type Period = "month" | "year";

const VAT_THRESHOLD = 36800;

const MONTH_LABELS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export function DashboardPage() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const d = await fetchDashboardData(company.id, company.activity_type);
      setData(d);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
      setData({
        caEncaisse: 0,
        beneficeFiscal: 0,
        cotisationsUrssaf: 0,
        netEstime: 0,
        monthlyCa: [],
        recentInvoices: [],
        upcomingEcheances: [],
      });
    } finally {
      setLoading(false);
    }
  }, [company, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const periodLabel = period === "month" ? "Ce mois-ci" : "Cette année";

  const maxCa = useMemo(
    () => Math.max(1, ...(data?.monthlyCa || []).map((m) => m.ca)),
    [data]
  );

  const caForPeriod =
    period === "month"
      ? data?.caEncaisse ?? 0
      : data?.monthlyCa.reduce((s, m) => s + m.ca, 0) ?? 0;

  if (!company) return null;

  return (
    <PageContainer
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre activité"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-pill border border-border p-0.5 bg-surface">
            <button
              type="button"
              onClick={() => setPeriod("month")}
              className={cn(
                "px-3 h-8 rounded-pill text-xs font-semibold transition-colors",
                period === "month"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-text"
              )}
            >
              Mois
            </button>
            <button
              type="button"
              onClick={() => setPeriod("year")}
              className={cn(
                "px-3 h-8 rounded-pill text-xs font-semibold transition-colors",
                period === "year"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-text"
              )}
            >
              Année
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate("/invoices/new")}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-pill bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Facture
          </button>
        </div>
      }
    >
      {/* Stat cards — always rendered */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton height="1rem" width="60%" className="mb-2" />
              <Skeleton height="2rem" width="80%" />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="CA encaissé"
              value={caForPeriod}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard
              label="Bénéfice fiscal"
              value={data?.beneficeFiscal ?? 0}
              icon={<Wallet className="w-4 h-4" />}
            />
            <StatCard
              label="Cotisations URSSAF"
              value={data?.cotisationsUrssaf ?? 0}
              icon={<Landmark className="w-4 h-4" />}
            />
            <StatCard
              label="Net estimé"
              value={data?.netEstime ?? 0}
              icon={<Receipt className="w-4 h-4" />}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* CA 12-month bar chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text">
              CA encaissé — 12 mois
            </h3>
            <span className="text-xs text-muted">
              Seuil TVA: {formatAmount(VAT_THRESHOLD)}
            </span>
          </div>
          {loading ? (
            <Skeleton height="12rem" />
          ) : (
            <div className="relative">
              <div className="flex items-end gap-1.5 h-40">
                {(data?.monthlyCa || []).map((m) => {
                  const heightPct = (m.ca / maxCa) * 100;
                  const monthIdx = parseInt(m.month.slice(5, 7), 10) - 1;
                  return (
                    <div
                      key={m.month}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      <div className="relative w-full flex items-end justify-center" style={{ height: "100%" }}>
                        <div
                          className="w-full max-w-[2rem] rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                          style={{
                            height: `${Math.max(heightPct, m.ca > 0 ? 4 : 0)}%`,
                            backgroundColor: company.accent_color || "var(--primary)",
                            minHeight: m.ca > 0 ? "4px" : "0",
                          }}
                          title={`${MONTH_LABELS[monthIdx]}: ${formatAmount(m.ca)}`}
                        />
                      </div>
                      <span className="text-[10px] text-muted">
                        {MONTH_LABELS[monthIdx]}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* VAT threshold line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-warning pointer-events-none"
                style={{
                  bottom: `${(VAT_THRESHOLD / (maxCa * 1.1 || 1)) * 100}%`,
                }}
              >
                <span className="absolute -top-4 right-0 text-[10px] text-warning font-semibold bg-bg px-1">
                  Seuil TVA
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Santé fiscale gauge */}
        <Card>
          <h3 className="text-sm font-bold text-text mb-4">Santé fiscale</h3>
          {loading ? (
            <Skeleton height="10rem" />
          ) : (
            <FiscalHealthGauge
              ca={data?.beneficeFiscal ?? 0}
              threshold={VAT_THRESHOLD}
              accent={company.accent_color}
            />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factures récentes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text">Factures récentes</h3>
            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Tout voir
            </button>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height="2.5rem" />
              ))}
            </div>
          ) : (data?.recentInvoices || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 rounded-card bg-surface-hover flex items-center justify-center text-muted mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm text-muted">Aucune facture émise</p>
              <button
                type="button"
                onClick={() => navigate("/invoices/new")}
                className="mt-3 text-xs text-primary font-semibold hover:underline"
              >
                Créer une facture
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {(data?.recentInvoices || []).map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0 hover:bg-surface-hover -mx-2 px-2 rounded transition-colors text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text truncate">
                      {inv.client_name}
                    </p>
                    <p className="text-xs text-muted">
                      {inv.number.startsWith("DRAFT-") ? "Brouillon" : inv.number}{" "}
                      · {formatDateLong(inv.issue_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Amount value={inv.total_ttc} size="sm" />
                    <StatusBadge status={inv.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Prochaines échéances */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text">Prochaines échéances</h3>
            <CalendarClock className="w-4 h-4 text-muted" />
          </div>
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height="2.5rem" />
              ))}
            </div>
          ) : (data?.upcomingEcheances || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 rounded-card bg-surface-hover flex items-center justify-center text-muted mb-3">
                <CalendarClock className="w-6 h-6" />
              </div>
              <p className="text-sm text-muted">Aucune échéance à venir</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {(data?.upcomingEcheances || []).map((inv) => {
                const today = new Date().toISOString().slice(0, 10);
                const isLate = inv.due_date < today;
                return (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    className="flex items-center justify-between py-2.5 border-b border-border last:border-0 hover:bg-surface-hover -mx-2 px-2 rounded transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text truncate">
                        {inv.client_name}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          isLate ? "text-danger font-semibold" : "text-muted"
                        )}
                      >
                        {inv.number} · {formatDateLong(inv.due_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Amount value={inv.total_ttc} size="sm" />
                      <StatusBadge status={isLate ? "late" : "pending"} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <p className="text-xs text-muted mt-6 text-center">
        {periodLabel} · Estimations indicatives basées sur les encaissements enregistrés
      </p>
    </PageContainer>
  );
}

function FiscalHealthGauge({
  ca,
  threshold,
  accent,
}: {
  ca: number;
  threshold: number;
  accent: string;
}) {
  const pct = Math.min(ca / threshold, 1);
  const angle = pct * 270;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (angle / 360) * circumference;
  const fullArc = (270 / 360) * circumference;

  const status =
    pct < 0.5 ? "Sain" : pct < 0.8 ? "Attention" : pct < 1 ? "Limite" : "Dépassé";
  const statusColor =
    pct < 0.5
      ? "text-success"
      : pct < 0.8
      ? "text-warning"
      : "text-danger";

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-[135deg]">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
          strokeDasharray={`${fullArc} ${circumference}`}
          strokeLinecap="round"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={accent || "var(--primary)"}
          strokeWidth="10"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="-mt-20 flex flex-col items-center">
        <span className="text-2xl font-bold text-text tabular-nums">
          {Math.round(pct * 100)}%
        </span>
        <span className="text-xs text-muted">du seuil TVA</span>
      </div>
      <span className={cn("mt-3 text-sm font-bold", statusColor)}>{status}</span>
      <p className="text-xs text-muted mt-1 text-center">
        {formatAmount(ca)} / {formatAmount(threshold)}
      </p>
    </div>
  );
}
