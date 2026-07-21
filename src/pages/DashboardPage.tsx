import { Component, useEffect, useState, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Receipt,
  TrendingUp,
  Landmark,
  Wallet,
  CalendarClock,
  Plus,
  BarChart3,
  Info,
} from "lucide-react";
import { parseISO, isValid } from "date-fns";
import { PageContainer } from "../components/layout/PageContainer";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { Tooltip } from "../components/ui/Tooltip";
import { StatCard } from "../components/shared/StatCard";
import { Amount } from "../components/shared/Amount";
import { StatusBadge } from "../components/shared/StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import {
  fetchDashboardData,
  VAT_THRESHOLDS,
  MICRO_THRESHOLDS,
  type DashboardData,
  type DashboardPeriod,
} from "../lib/api";
import { formatAmount, cn } from "../lib/utils";
import { formatDateLong, todayISO, safeFormatDate } from "../lib/date";
import { canUseFeature } from "../lib/planLimits";
import { UpgradeModal } from "../components/shared/UpgradeModal";
import { Sparkles, Lock } from "lucide-react";

const MONTH_LABELS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function safeNum(n: unknown, fallback = 0): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function sanitizeMonthlyCa(data: { month: string; ca: number }[] | undefined): { month: string; ca: number }[] {
  if (!Array.isArray(data) || data.length === 0) return [];
  return data
    .filter((d) => d && d.month && typeof d.month === "string")
    .map((d) => ({ month: d.month, ca: safeNum(d.ca) }));
}

export function DashboardPage() {
  const { company, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const isBlurred = !canUseFeature(profile?.plan, "fiscalDashboard");

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    setLoadError(null);
    try {
      const d = await fetchDashboardData(
        company.id,
        company.activity_type,
        period,
        profile?.tmi ?? null
      );
      setData(d);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setLoadError(msg);
      toast(msg, "danger");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [company, profile, period, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const periodLabel =
    period === "month" ? "Ce mois-ci" : period === "quarter" ? "Ce trimestre" : "Cette année";

  const isMixed =
    safeNum(data?.caByNature.service) > 0 && safeNum(data?.caByNature.goods) > 0;

  if (!company) return null;

  return (
    <PageContainer
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre activité"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-pill border border-border p-0.5 bg-surface">
            {(["month", "quarter", "year"] as DashboardPeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 h-8 rounded-pill text-xs font-semibold transition-colors",
                  period === p
                    ? "bg-primary text-white"
                    : "text-muted hover:text-text"
                )}
              >
                {p === "month" ? "Ce mois" : p === "quarter" ? "Ce trimestre" : "Cette année"}
              </button>
            ))}
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
      {loadError ? (
        <Card className="p-8 text-center">
          <div className="w-12 h-12 rounded-card bg-danger/10 flex items-center justify-center text-danger mx-auto mb-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-text mb-2">Données indisponibles</h3>
          <p className="text-sm text-muted mb-4">{loadError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-pill px-5 h-10 text-sm font-semibold text-white bg-primary hover:opacity-90 transition-opacity"
          >
            Réessayer
          </button>
        </Card>
      ) : (
        <div className={cn("relative", isBlurred && "overflow-hidden max-h-[calc(100vh-10rem)]")}>
          <div className={cn("space-y-6 transition-all duration-300", isBlurred && "blur-md pointer-events-none select-none opacity-60")}>
            {/* Row 1 — StatCards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {loading || !data ? (
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
                    value={safeNum(data.caEncaisse)}
                    icon={<TrendingUp className="w-4 h-4" />}
                    delta={
                      data.caDeltaPct != null && Number.isFinite(data.caDeltaPct)
                        ? {
                            value: `${data.caDeltaPct >= 0 ? "+" : ""}${data.caDeltaPct}% vs période précédente`,
                            positive: data.caDeltaPct >= 0,
                          }
                        : undefined
                    }
                  />
                  <StatCard
                    label="Bénéfice fiscal"
                    value={safeNum(data.beneficeFiscal)}
                    icon={<Wallet className="w-4 h-4" />}
                  />
                  <StatCard
                    label="Cotisations URSSAF"
                    value={safeNum(data.cotisationsUrssaf)}
                    icon={<Landmark className="w-4 h-4" />}
                  />
                  <StatCard
                    label="Net estimé"
                    value={safeNum(data.netEstime)}
                    icon={<Receipt className="w-4 h-4" />}
                  />
                </>
              )}
            </div>

            {/* Subtitles row */}
            {!loading && data && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 -mt-2">
                <p className="text-xs text-muted text-center">{periodLabel}</p>
                <p className="text-xs text-muted text-center">
                  Après abattement de {safeNum(data.abattementPct)}%
                </p>
                <p className="text-xs text-muted text-center">
                  {data.nextUrssafDueDate
                    ? `Prochaine déclaration: ${safeFormatDate(data.nextUrssafDueDate)}`
                    : "Prochaine déclaration à venir"}
                </p>
                <p className="text-xs text-muted text-center">
                  {profile?.tmi != null ? (
                    data.netSubtitle
                  ) : (
                    <button
                      onClick={() => navigate("/settings")}
                      className="text-primary hover:underline"
                    >
                      Renseignez votre TMI
                    </button>
                  )}
                </p>
              </div>
            )}

            {/* Row 2 — Chart + Santé fiscale */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
              {/* CA chart (60%) */}
              <Card className="lg:col-span-3">
                <h3 className="text-sm font-bold text-text mb-4">Évolution du CA</h3>
                {loading ? (
                  <Skeleton height="12rem" />
                ) : (
                  <ChartErrorBoundary>
                    <CaBarChart
                      data={sanitizeMonthlyCa(data?.monthlyCa)}
                      accent={company.accent_color}
                      vatThreshold={VAT_THRESHOLDS.service}
                    />
                    <div className="flex justify-around mt-4 pt-4 border-t border-border">
                      <div className="text-center">
                        <p className="text-xs text-muted">Meilleur mois</p>
                        <p className="text-sm font-bold text-text">
                          {data?.bestMonth && data.bestMonth.ca > 0
                            ? `${MONTH_LABELS[parseInt(data.bestMonth.month.slice(5, 7), 10) - 1] ?? data.bestMonth.month} — ${formatAmount(safeNum(data.bestMonth.ca))}`
                            : "—"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted">Moyenne mensuelle</p>
                        <p className="text-sm font-bold text-text">
                          {formatAmount(safeNum(data?.monthlyAverage))}
                        </p>
                      </div>
                    </div>
                  </ChartErrorBoundary>
                )}
              </Card>

              {/* Santé fiscale (40%) */}
              <Card className="lg:col-span-2">
                <div className="flex items-center gap-1.5 mb-4">
                  <h3 className="text-sm font-bold text-text">Santé fiscale</h3>
                  <Tooltip content="Seuil de franchise de TVA : au-delà, vous devrez facturer la TVA">
                    <span className="inline-flex text-muted hover:text-text transition-colors cursor-help">
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </Tooltip>
                </div>
                {loading ? (
                  <Skeleton height="10rem" />
                ) : isMixed ? (
                  <div className="flex flex-col gap-4">
                    <NatureBar
                      label="Services"
                      value={safeNum(data?.caByNature.service)}
                      threshold={VAT_THRESHOLDS.service}
                      accent={company.accent_color}
                    />
                    <NatureBar
                      label="Vente de biens"
                      value={safeNum(data?.caByNature.goods)}
                      threshold={VAT_THRESHOLDS.goods}
                      accent={company.accent_color}
                    />
                    <div className="pt-2 border-t border-border text-xs text-muted space-y-1">
                      <div className="flex justify-between">
                        <span>CA annuel services</span>
                        <span className="font-semibold text-text">{formatAmount(safeNum(data?.caByNature.service))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seuil micro services</span>
                        <span className="font-semibold text-text">{formatAmount(MICRO_THRESHOLDS.service)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CA annuel biens</span>
                        <span className="font-semibold text-text">{formatAmount(safeNum(data?.caByNature.goods))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seuil micro biens</span>
                        <span className="font-semibold text-text">{formatAmount(MICRO_THRESHOLDS.goods)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <FiscalHealthGauge
                    ca={safeNum(data?.yearlyCa)}
                    threshold={VAT_THRESHOLDS.service}
                    accent={company.accent_color}
                  />
                )}
              </Card>
            </div>

            {/* Row 3 — Recent invoices + Upcoming deadlines */}
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
                    Voir tout
                  </button>
                </div>
                {loading ? (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} height="2.5rem" />
                    ))}
                  </div>
                ) : (data?.recentInvoices || []).length === 0 ? (
                  <p className="text-sm text-muted text-center py-8">Aucune facture émise</p>
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
                            {inv.number?.startsWith("DRAFT-") ? "Brouillon" : inv.number}{" "}
                            · {safeFormatDate(inv.issue_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Amount value={safeNum(inv.total_ttc)} size="sm" />
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
                      const today = todayISO();
                      const isLate = inv.due_date < today;
                      const dueDate = parseISO(inv.due_date);
                      const todayDate = parseISO(today);
                      const days =
                        isValid(dueDate) && isValid(todayDate)
                          ? Math.ceil((dueDate.getTime() - todayDate.getTime()) / 86400000)
                          : 0;
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
                              {inv.number} · {safeFormatDate(inv.due_date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <Amount value={safeNum(inv.total_ttc)} size="sm" />
                            <CountdownPill days={days} isLate={isLate} />
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
          </div>

          {/* Centered Upgrade Overlay for Starter */}
          {isBlurred && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
              <div className="bg-surface/95 backdrop-blur-md border border-amber-500/30 rounded-card p-8 max-w-md text-center shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-text">Débloquez votre pilotage fiscal</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Suivez votre Chiffre d'Affaires, vos plafonds micro-entrepreneur, vos cotisations URSSAF et vos indicateurs financiers en temps réel.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setUpgradeModalOpen(true)}
                    className="w-full h-11 px-6 rounded-pill bg-brand-primary text-white font-bold text-sm hover:opacity-90 transition-all shadow-md flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Passer au plan Solo — 9 € / mois</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <UpgradeModal
            open={upgradeModalOpen}
            onClose={() => setUpgradeModalOpen(false)}
            feature="fiscalDashboard"
          />
        </div>
      )}
    </PageContainer>
  );
}

class ChartErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error("Chart render error:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="w-8 h-8 text-muted mb-2" />
          <p className="text-sm text-muted">Graphique indisponible</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function CountdownPill({ days, isLate }: { days: number; isLate: boolean }) {
  const safeDays = Number.isFinite(days) ? days : 0;
  const absDays = Math.abs(safeDays);
  const color = isLate
    ? "bg-danger/15 text-danger"
    : absDays < 7
    ? "bg-danger/15 text-danger"
    : absDays < 15
    ? "bg-warning/15 text-warning"
    : "bg-surface-hover text-muted";
  const label = isLate ? `${absDays}j de retard` : `J-${absDays}`;
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-pill", color)}>
      {label}
    </span>
  );
}

function NatureBar({
  label,
  value,
  threshold,
  accent,
}: {
  label: string;
  value: number;
  threshold: number;
  accent: string;
}) {
  const safeThreshold = threshold > 0 ? threshold : 1;
  const pct = Math.min((value / safeThreshold) * 100, 100);
  const color =
    pct < 70 ? "var(--success)" : pct < 90 ? "var(--warning)" : "var(--danger)";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-text">
          {formatAmount(value)} / {formatAmount(threshold)}
        </span>
      </div>
      <div className="h-3 rounded-full bg-surface-hover overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(pct, 100))}%`, backgroundColor: color }}
        />
      </div>
      {pct >= 90 && (
        <p className="text-xs text-danger mt-1">Vous approchez du seuil de TVA</p>
      )}
    </div>
  );
}

function FiscalHealthGauge({
  ca,
  threshold,
}: {
  ca: number;
  threshold: number;
  accent: string;
}) {
  const safeThreshold = threshold > 0 ? threshold : 1;
  const pct = Math.min(ca / safeThreshold, 1);
  const visualPct = Math.max(pct, 0.03);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const arcLength = visualPct * circumference;

  const status =
    pct < 0.7 ? "Sain" : pct < 0.9 ? "Attention" : "Critique";
  const pillClass =
    pct < 0.7
      ? "bg-success/15 text-success"
      : pct < 0.9
      ? "bg-warning/15 text-warning"
      : "bg-danger/15 text-danger";
  const strokeColor =
    pct < 0.7 ? "var(--success)" : pct < 0.9 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="var(--surface-hover)"
            strokeWidth="10"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-text tabular-nums">
            {Math.round(pct * 100)}%
          </span>
          <span className="text-xs text-muted">du seuil TVA</span>
        </div>
      </div>
      <span className={cn("mt-4 text-xs font-bold px-3 py-1 rounded-pill", pillClass)}>
        {status}
      </span>
      <p className="text-sm text-muted mt-2 text-center">
        {formatAmount(ca)} / {formatAmount(threshold)}
      </p>
    </div>
  );
}

function CaBarChart({
  data,
  accent,
  vatThreshold,
}: {
  data: { month: string; ca: number }[];
  accent: string;
  vatThreshold: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const safeData = Array.isArray(data) && data.length > 0 ? data : [];
  const safeVat = safeNum(vatThreshold, VAT_THRESHOLDS.service);
  const width = 520;
  const height = 240;
  const padTop = 10;
  const padBottom = 28;
  const padLeft = 36;
  const padRight = 12;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const maxCa = safeData.length > 0 ? Math.max(...safeData.map((d) => safeNum(d.ca))) : 0;
  const maxVal = Math.max(safeVat, maxCa, 1);
  const barW = safeData.length > 0 ? chartW / safeData.length : chartW;
  const accentColor = accent || "var(--primary)";

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => (maxVal / yTicks) * i);
  const vatY = padTop + chartH - (safeVat / maxVal) * chartH;

  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted">
        Aucune donnée à afficher
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 240 }}>
        {/* Y grid + labels */}
        {tickVals.map((tv, i) => {
          const y = padTop + chartH - (tv / maxVal) * chartH;
          return (
            <g key={i}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="var(--border)"
                strokeWidth={0.5}
                opacity={0.5}
              />
              <text
                x={padLeft - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={9}
                fill="var(--text-muted)"
              >
                {tv >= 1000 ? `${(tv / 1000).toFixed(0)}k` : tv.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* VAT threshold line */}
        <line
          x1={padLeft}
          y1={vatY}
          x2={width - padRight}
          y2={vatY}
          stroke="var(--warning)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <text x={width - padRight - 4} y={vatY - 4} textAnchor="end" fontSize={9} fill="var(--warning)">
          Seuil TVA
        </text>

        {/* Bars */}
        {safeData.map((d, i) => {
          const ca = safeNum(d.ca);
          const barH = (ca / maxVal) * chartH;
          const x = padLeft + i * barW + barW * 0.15;
          const w = barW * 0.7;
          const y = padTop + chartH - barH;
          const isCurrent = i === safeData.length - 1;
          const isHover = hoverIdx === i;
          const monthIdx = parseInt(d.month.slice(5, 7), 10) - 1;
          const monthLabel = MONTH_LABELS[monthIdx] || d.month;
          return (
            <g
              key={d.month}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={Math.max(barH, 0)}
                rx={4}
                fill={accentColor}
                opacity={isCurrent ? 1 : isHover ? 0.8 : 0.5}
                className="transition-opacity duration-150"
              />
              <text
                x={x + w / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-muted)"
              >
                {monthLabel}
              </text>
              {isHover && ca > 0 && (
                <g>
                  <rect
                    x={x + w / 2 - 40}
                    y={y - 24}
                    width={80}
                    height={18}
                    rx={4}
                    fill="var(--surface)"
                    stroke="var(--border)"
                    strokeWidth={0.5}
                  />
                  <text
                    x={x + w / 2}
                    y={y - 11}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--text)"
                    fontWeight={600}
                  >
                    {formatAmount(ca)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
