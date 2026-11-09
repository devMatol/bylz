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
  AlertTriangle,
  ShieldCheck,
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
  fetchClients,
  MICRO_THRESHOLDS,
  VAT_THRESHOLDS,
  type DashboardData,
  type DashboardPeriod,
} from "../lib/api";
import { formatAmount, cn } from "../lib/utils";
import { formatDateLong, todayISO, safeFormatDate } from "../lib/date";
import { canUseFeature } from "../lib/planLimits";
import { OnboardingChecklist } from "../components/dashboard/OnboardingChecklist";
import { UpgradeModal } from "../components/shared/UpgradeModal";
import { ReminderModal } from "../components/documents/ReminderModal";
import { Button } from "../components/ui/Button";
import { sendInvoiceReminder } from "../lib/api";
import type { Invoice } from "../types/database";
import { LockedFeatureOverlay } from "../components/shared/LockedFeatureOverlay";
import { FloatingActionButton } from "../components/ui/FloatingActionButton";
import { Sparkles, Lock, AlertCircle, X, ChevronDown, ChevronUp } from "lucide-react";

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
  const [dataView, setDataView] = useState<"total" | "electronic">("total");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [clientsCount, setClientsCount] = useState(0);
  const [reminderInvoice, setReminderInvoice] = useState<(Invoice & { client_name: string; client_email?: string | null }) | null>(null);

  const isBlurred = !canUseFeature(profile?.plan, "fiscalDashboard");

  const [dismissedHistory, setDismissedHistory] = useState(() => {
    return localStorage.getItem("bylz-dismiss-history-banner") === "true";
  });
  const [mobileHistoryExpanded, setMobileHistoryExpanded] = useState(false);

  const handleDismissHistory = () => {
    localStorage.setItem("bylz-dismiss-history-banner", "true");
    setDismissedHistory(true);
  };

  useEffect(() => {
    // Only redirect to /invoices on the very first connection of the session
    const hasLandedFirstTime = sessionStorage.getItem("bylz-first-landing-done");
    if (!hasLandedFirstTime) {
      sessionStorage.setItem("bylz-first-landing-done", "true");
      navigate("/invoices", { replace: true });
    }
  }, [navigate]);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    setLoadError(null);
    try {
      const d = await fetchDashboardData(
        company.id,
        company.activity_type,
        period,
        profile?.tmi ?? null,
        dataView
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
  }, [company, profile, period, dataView, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const periodLabel =
    period === "month" ? "Ce mois-ci" : period === "quarter" ? "Ce trimestre" : "Cette année";

  const isMixed =
    safeNum(data?.caByNature.service) > 0 && safeNum(data?.caByNature.goods) > 0;

  if (!company) return null;
  const isProfileIncomplete = !company.siret || !company.address;

  return (
    <PageContainer
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre activité"
      actions={
        <button
          type="button"
          onClick={() => navigate("/invoices/new")}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-pill bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Facture
        </button>
      }
    >
      {/* Dashboard Control Toolbar - Clean, Modern & Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Time Horizon Selector: Ce mois / Ce trimestre / Cette année */}
        <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-pill overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-fit max-w-full">
          {(["month", "quarter", "year"] as DashboardPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "min-h-[40px] px-3.5 py-2 rounded-pill text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center",
                period === p
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted hover:text-text"
              )}
            >
              {p === "month" ? "Ce mois" : p === "quarter" ? "Ce trimestre" : "Cette année"}
            </button>
          ))}
        </div>

        {/* Scope Selector: Total vs Facturation électronique */}
        <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-pill w-fit self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDataView("total")}
            className={cn(
              "min-h-[40px] px-3.5 py-2 rounded-pill text-xs font-semibold transition-all flex items-center justify-center",
              dataView === "total"
                ? "bg-surface-hover text-text font-bold shadow-xs border border-border/60"
                : "text-muted hover:text-text"
            )}
          >
            Total
          </button>
          <button
            type="button"
            onClick={() => setDataView("electronic")}
            className={cn(
              "min-h-[40px] px-3.5 py-2 rounded-pill text-xs font-semibold transition-all flex items-center justify-center",
              dataView === "electronic"
                ? "bg-surface-hover text-text font-bold shadow-xs border border-border/60"
                : "text-muted hover:text-text"
            )}
          >
            Facturation électronique
          </button>
        </div>
      </div>
      {/* Checklist d'onboarding jusqu'à la 1ère facture */}
      <OnboardingChecklist
        company={company}
        clientsCount={clientsCount}
        invoicesCount={data?.recentInvoices?.length || 0}
      />

      {isProfileIncomplete && (
        <div className="mb-4 p-3 sm:p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse text-amber-500" />
            <div>
              <p className="font-semibold text-sm">Profil de l'entreprise incomplet</p>
              <p className="text-xs opacity-90 text-muted">
                Renseignez votre SIRET et votre adresse pour que vos factures comportent toutes les mentions obligatoires.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/onboarding?mode=complete")}
            className="w-full sm:w-auto text-xs whitespace-nowrap bg-surface text-text border border-border px-3 min-h-[40px] rounded-pill font-semibold hover:bg-surface-hover transition-colors flex items-center justify-center"
          >
            Compléter mon profil
          </button>
        </div>
      )}

      {!dismissedHistory && company && company.previous_ca === 0 && (
        <div className="mb-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-800 dark:text-indigo-200 overflow-hidden">
          {/* Mobile: Replié sur 1 seule ligne par défaut */}
          <div className="flex sm:hidden items-center justify-between px-3 py-2 text-xs min-h-[40px]">
            <div className="flex items-center gap-2 min-w-0">
              <Receipt className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="font-semibold truncate">Rattraper votre historique {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setMobileHistoryExpanded(!mobileHistoryExpanded)}
                className="px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-300 min-h-[40px] flex items-center"
              >
                {mobileHistoryExpanded ? "Réduire" : "Déplier"}
              </button>
              <button
                type="button"
                onClick={handleDismissHistory}
                className="p-2 text-muted hover:text-text min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Masquer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contenu complet : visible sur sm+ ou si déplié sur mobile */}
          <div className={cn("p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", !mobileHistoryExpanded && "hidden sm:flex")}>
            <div className="flex items-center space-x-3">
              <Receipt className="w-5 h-5 flex-shrink-0 text-indigo-500 hidden sm:block" />
              <div>
                <p className="font-semibold text-sm hidden sm:block">Rattraper votre historique {new Date().getFullYear()}</p>
                <p className="text-xs opacity-90 text-muted">
                  Renseignez votre chiffre d'affaires antérieur ou importez vos anciennes factures de l'année pour suivre précisément vos plafonds de TVA et micro-entreprise.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate("/settings?focus=company")}
                className="flex-1 sm:flex-none text-xs whitespace-nowrap bg-surface text-text border border-border px-3 min-h-[40px] rounded-pill font-semibold hover:bg-surface-hover transition-colors flex items-center justify-center"
              >
                Saisir mon CA
              </button>
              <button
                type="button"
                onClick={() => navigate("/invoices?import=true")}
                className="flex-1 sm:flex-none text-xs whitespace-nowrap bg-primary text-primary-foreground px-3 min-h-[40px] rounded-pill font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center"
              >
                Importer des PDF
              </button>
              <button
                type="button"
                onClick={handleDismissHistory}
                className="hidden sm:inline-flex text-xs text-muted hover:text-text px-2 min-h-[40px] items-center font-medium transition-colors"
                title="Masquer l'invitation"
              >
                Masquer
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className={cn(
          "relative",
          isBlurred && "overflow-hidden max-h-[520px] sm:max-h-[580px] -mx-4 md:-mx-10 -mb-20 md:-mb-10"
        )}>
          <div className={cn("space-y-4 sm:space-y-6 transition-all duration-300", isBlurred && "blur-md pointer-events-none select-none opacity-60 px-4 md:px-10 pt-6")}>
            {/* KPI Cards Row - Compact 2-column mobile grid matching InvoicesPage */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
              {loading || !data ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-4 h-28">
                    <Skeleton height="0.875rem" width="60%" className="mb-2" />
                    <Skeleton height="1.5rem" width="80%" />
                  </Card>
                ))
              ) : (
                <>
                  <StatCard
                    variant="compact"
                    label="CA encaissé"
                    value={safeNum(data.caEncaisse)}
                    icon={<TrendingUp className="w-3.5 h-3.5" />}
                    delta={
                      data.caDeltaPct != null && Number.isFinite(data.caDeltaPct)
                        ? {
                            value: `${data.caDeltaPct >= 0 ? "+" : ""}${data.caDeltaPct}%`,
                            positive: data.caDeltaPct >= 0,
                          }
                        : undefined
                    }
                    subtitle={<span>{periodLabel}</span>}
                  />
                  <StatCard
                    variant="compact"
                    label="Bénéfice fiscal"
                    value={safeNum(data.beneficeFiscal)}
                    icon={<Wallet className="w-3.5 h-3.5" />}
                    subtitle={<span>Abattement {safeNum(data.abattementPct)}% • {periodLabel}</span>}
                  />
                  <StatCard
                    variant="compact"
                    label="Cotisations URSSAF"
                    value={safeNum(data.cotisationsUrssaf)}
                    icon={<Landmark className="w-3.5 h-3.5" />}
                    subtitle={<span>{periodLabel}</span>}
                  />
                  <StatCard
                    variant="compact"
                    label="Net estimé"
                    value={safeNum(data.netEstime)}
                    icon={<Receipt className="w-3.5 h-3.5" />}
                    subtitle={<span>avant impôt • {periodLabel}</span>}
                  />
                </>
              )}
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 mb-4 sm:mb-6">
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
                    />
                    <div className="flex justify-around mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-border">
                      <div className="text-center">
                        <p className="text-xs text-muted">Meilleur mois</p>
                        <p className="text-sm font-bold text-text">
                          {data?.bestMonth && data.bestMonth.ca > 0
                            ? `${MONTH_LABELS[parseInt(data.bestMonth.month.slice(5, 7), 10) - 1] ?? data.bestMonth.month} : ${formatAmount(safeNum(data.bestMonth.ca))}`
                            : "-"}
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
                  <Tooltip
                    content={
                      company.structure === "micro"
                        ? "Suivi des plafonds de chiffre d'affaires autorisés pour conserver le statut de micro-entreprise (URSSAF)"
                        : "Suivi des seuils de franchise en base de TVA"
                    }
                  >
                    <span className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center -my-2 -mr-2 text-muted hover:text-text transition-colors cursor-help">
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </Tooltip>
                </div>
                {loading ? (
                  <Skeleton height="10rem" />
                ) : company.structure !== "micro" && company.vat_regime === "vat" ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center h-full min-h-[160px] space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-text">Régime Réel de TVA</h4>
                    <p className="text-xs text-muted max-w-xs leading-relaxed">
                      Votre société est assujettie à la TVA. Vos factures incluent la TVA par défaut et aucun plafond de chiffre d'affaires ne s'applique.
                    </p>
                  </div>
                ) : isMixed ? (
                  <div className="flex flex-col gap-4">
                    <NatureBar
                      label="Prestations de Services"
                      value={safeNum(data?.caByNature.service)}
                      threshold={company.structure === "micro" ? MICRO_THRESHOLDS.service : VAT_THRESHOLDS.service}
                      accent={company.accent_color}
                    />
                    <NatureBar
                      label="Ventes de Marchandises"
                      value={safeNum(data?.caByNature.goods)}
                      threshold={company.structure === "micro" ? MICRO_THRESHOLDS.goods : VAT_THRESHOLDS.goods}
                      accent={company.accent_color}
                    />
                    <div className="pt-2 border-t border-border text-xs text-muted space-y-1">
                      <div className="flex justify-between">
                        <span>CA annuel services</span>
                        <span className="font-semibold text-text">{formatAmount(safeNum(data?.caByNature.service))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          {company.structure === "micro" ? "Plafond micro services" : "Seuil TVA services"}
                        </span>
                        <span className="font-semibold text-text">
                          {formatAmount(company.structure === "micro" ? MICRO_THRESHOLDS.service : VAT_THRESHOLDS.service)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>CA annuel marchandises/biens</span>
                        <span className="font-semibold text-text">{formatAmount(safeNum(data?.caByNature.goods))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          {company.structure === "micro" ? "Plafond micro marchandises/biens" : "Seuil TVA marchandises/biens"}
                        </span>
                        <span className="font-semibold text-text">
                          {formatAmount(company.structure === "micro" ? MICRO_THRESHOLDS.goods : VAT_THRESHOLDS.goods)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <FiscalHealthGauge
                    ca={safeNum(data?.yearlyCa)}
                    threshold={
                      company.structure === "micro"
                        ? (company.activity_type === "commerce" ? MICRO_THRESHOLDS.goods : MICRO_THRESHOLDS.service)
                        : (company.activity_type === "commerce" ? VAT_THRESHOLDS.goods : VAT_THRESHOLDS.service)
                    }
                    isVatOnly={company.structure !== "micro"}
                    accent={company.accent_color}
                  />
                )}
              </Card>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Factures récentes */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-text">Factures récentes</h3>
                  <button
                    type="button"
                    onClick={() => navigate("/invoices")}
                    className="min-h-[40px] px-2 -mr-2 inline-flex items-center text-xs text-primary font-semibold hover:underline"
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
                  <p className="text-sm text-muted text-center py-8">Aucune facture validée</p>
                ) : (
                  <div className="flex flex-col">
                    {(data?.recentInvoices || []).slice(0, 3).map((inv, idx) => (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        className={cn("flex items-center justify-between min-h-[44px] py-2 sm:py-2.5 border-b border-border last:border-0 hover:bg-surface-hover -mx-2 px-2 rounded transition-colors text-left", idx >= 2 && "hidden sm:flex")}
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
                    {(data?.upcomingEcheances || []).slice(0, 3).map((inv, idx) => {
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
                          className={cn("flex items-center justify-between min-h-[44px] py-2 sm:py-2.5 border-b border-border last:border-0 hover:bg-surface-hover -mx-2 px-2 rounded transition-colors text-left", idx >= 2 && "hidden sm:flex")}
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

              {/* B5: Bloc dédié "À relancer" pour les retards avec bouton Relancer */}
              {(data?.lateInvoices || []).length > 0 && (
                <Card className="lg:col-span-2 border-danger/30 bg-danger/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-danger" />
                      <h3 className="text-sm font-bold text-text">À relancer</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-danger/15 text-danger border border-danger/20">
                        {(data?.lateInvoices || []).length} impayé{(data?.lateInvoices || []).length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/invoices?filter=late")}
                      className="min-h-[40px] px-2 -mr-2 inline-flex items-center text-xs text-danger font-semibold hover:underline"
                    >
                      Voir tous les retards
                    </button>
                  </div>

                  <div className="flex flex-col divide-y divide-border/60">
                    {(data?.lateInvoices || []).slice(0, 5).map((inv, idx) => {
                      const today = todayISO();
                      const dueDate = parseISO(inv.due_date);
                      const todayDate = parseISO(today);
                      const daysOverdue = isValid(dueDate) && isValid(todayDate)
                        ? Math.max(1, Math.ceil((todayDate.getTime() - dueDate.getTime()) / 86400000))
                        : 0;

                      return (
                        <div
                          key={inv.id}
                          className={cn("flex items-center justify-between py-2.5 sm:py-3 gap-2 sm:gap-3", idx >= 2 && "hidden sm:flex")}
                        >
                          <div
                            className="min-w-0 flex-1 cursor-pointer"
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                          >
                            <p className="text-sm font-semibold text-text truncate">
                              {inv.client_name}
                            </p>
                            <p className="text-xs text-danger font-medium mt-0.5">
                              {inv.number} · Échue le {safeFormatDate(inv.due_date)} ({daysOverdue} j de retard)
                            </p>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <Amount value={safeNum(inv.total_ttc)} size="sm" className="font-bold text-text" />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs font-bold border-danger/30 text-danger hover:bg-danger/10 min-h-[40px] px-3.5 py-2 sm:px-3 sm:py-1"
                              onClick={() => setReminderInvoice(inv)}
                            >
                              Relancer
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>

            <p className="text-xs text-muted mt-6 text-center">
              {periodLabel} · Estimations indicatives basées sur les encaissements enregistrés
            </p>
          </div>

          {/* Centered Upgrade Overlay for Starter */}
          {isBlurred && (
            <div className="absolute inset-0 z-20 flex items-start sm:items-center justify-center pt-6 sm:pt-0 p-4">
              <LockedFeatureOverlay
                planBadge="PLAN SOLO ⚡"
                title="Débloquez votre Pilotage Fiscal & URSSAF"
                description="Suivez votre chiffre d'affaires, vos plafonds micro-entrepreneur, vos cotisations URSSAF et vos indicateurs financiers en temps réel."
                buttonText="Débloquer le Plan Solo (14 jours offerts)"
                onUnlock={() => setUpgradeModalOpen(true)}
              />
            </div>
          )}

          <UpgradeModal
            open={upgradeModalOpen}
            onClose={() => setUpgradeModalOpen(false)}
            feature="fiscalDashboard"
          />

          {reminderInvoice && (
            <ReminderModal
              open={!!reminderInvoice}
              onClose={() => setReminderInvoice(null)}
              clientName={reminderInvoice.client_name}
              clientEmail={reminderInvoice.client_email}
              invoiceNumber={reminderInvoice.number}
              invoiceAmount={safeNum(reminderInvoice.total_ttc)}
              onSend={async (subject, body) => {
                if (!company) return;
                try {
                  await sendInvoiceReminder(
                    company.id,
                    reminderInvoice.id,
                    reminderInvoice,
                    { name: reminderInvoice.client_name, email: reminderInvoice.client_email } as any,
                    { subject, body }
                  );
                  toast("Relance envoyée par email", "success");
                } catch (err) {
                  toast(err instanceof Error ? err.message : "Erreur lors de l'envoi", "danger");
                  throw err;
                }
              }}
            />
          )}
        </div>
      )}

      {/* Mobile Floating Action Button */}
      <FloatingActionButton label="Facture" to="/invoices/new" />
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
        <p className="text-xs text-danger mt-1">Vous approchez du plafond micro-entrepreneur</p>
      )}
    </div>
  );
}

function FiscalHealthGauge({
  ca,
  threshold,
  isVatOnly = false,
}: {
  ca: number;
  threshold: number;
  isVatOnly?: boolean;
  accent: string;
}) {
  const safeThreshold = threshold > 0 ? threshold : 1;
  // B6: Progression strictement proportionnelle à la valeur réelle
  const pct = Math.min(ca / safeThreshold, 1);
  const visualPct = ca > 0 ? pct : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const arcLength = visualPct * circumference;

  // B6: Pourcentage unifié avec Déclarations et virgule française
  const rawPercent = (ca / safeThreshold) * 100;
  const formattedPct = rawPercent.toFixed(1).replace(".", ",");

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
      <div className="relative w-28 h-28 sm:w-[140px] sm:h-[140px]">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
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
            {formattedPct} %
          </span>
          <span className="text-xs text-muted">
            {isVatOnly ? "du seuil TVA" : "du plafond micro"}
          </span>
        </div>
      </div>
      <span className={cn("mt-2 sm:mt-4 text-xs font-bold px-3 py-1 rounded-pill", pillClass)}>
        {status}
      </span>
      <p className="text-xs sm:text-sm text-muted mt-1.5 sm:mt-2 text-center">
        {formatAmount(ca)} / {formatAmount(threshold)}
      </p>
    </div>
  );
}

function CaBarChart({
  data,
  accent,
}: {
  data: { month: string; ca: number }[];
  accent: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const safeData = Array.isArray(data) && data.length > 0 ? data : [];
  const width = 520;
  const height = 240;
  const padTop = 10;
  const padBottom = 28;
  const padLeft = 36;
  const padRight = 12;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const maxCa = safeData.length > 0 ? Math.max(...safeData.map((d) => safeNum(d.ca))) : 0;
  const maxVal = Math.max(maxCa, 1);
  const barW = safeData.length > 0 ? chartW / safeData.length : chartW;
  const accentColor = accent || "var(--primary)";

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => (maxVal / yTicks) * i);

  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted">
        Aucune donnée à afficher
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 sm:h-60" style={{ maxHeight: 240 }}>
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
                fontSize={12}
                fill="var(--text-muted)"
              >
                {tv >= 1000 ? `${(tv / 1000).toFixed(0)}k` : tv.toFixed(0)}
              </text>
            </g>
          );
        })}

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
                fontSize={12}
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
                    fontSize={12}
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
