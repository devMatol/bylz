import { useEffect, useState, useCallback } from "react";
import { Copy, ExternalLink, Check, Landmark, BarChart3, Calculator, BookOpen, ShieldAlert } from "lucide-react";
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
import { computeFiscalMetrics, type FiscalLanding } from "../lib/fiscal";
import { ThresholdGaugeCard } from "../components/fiscal/ThresholdGaugeCard";
import { FiscalCharts } from "../components/fiscal/FiscalCharts";
import { TvaBreakdownCard } from "../components/fiscal/TvaBreakdownCard";
import { LivreRecettesSection } from "../components/fiscal/LivreRecettesSection";
import { formatAmount, cn } from "../lib/utils";
import { formatDateLong, todayISO } from "../lib/date";
import type { Payment, UrssafDeclaration } from "../types/database";

export function UrssafPage() {
  const { company } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"gauges" | "tva" | "livre" | "urssaf">("gauges");
  const [dataView, setDataView] = useState<"total" | "electronic">("total");
  const [periods, setPeriods] = useState<UrssafPeriod[]>([]);
  const [fiscalMetrics, setFiscalMetrics] = useState<FiscalLanding | null>(null);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      // 1. Fetch invoices
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("id, number, type, status, ereporting_status, pa_status, facturx_pdf_url, total_ht, total_vat, total_ttc, paid_at, issue_date, created_at, clients(name)")
        .eq("company_id", company.id);
      if (error) throw error;

      let eligibleInvoices = invoices || [];
      if (dataView === "electronic") {
        eligibleInvoices = eligibleInvoices.filter(
          (i: any) =>
            i.ereporting_status === "submitted" ||
            i.ereporting_status === "confirmed" ||
            i.pa_status === "submitted" ||
            i.pa_status === "delivered" ||
            i.pa_status === "accepted" ||
            !!i.facturx_pdf_url
        );
      }

      const invoiceIds = eligibleInvoices.map((i: any) => i.id);
      let payments: Payment[] = [];
      if (invoiceIds.length > 0) {
        const { data: pmt, error: pErr } = await supabase
          .from("payments")
          .select("*, invoices:invoices(number, clients(name))")
          .in("invoice_id", invoiceIds);
        if (pErr) throw pErr;
        payments = (pmt || []) as any[];
      }

      // Filter pending sales vs purchases
      const pendingSales = eligibleInvoices.filter((i: any) => i.type !== "credit_note" && i.status !== "paid");
      const purchaseList = eligibleInvoices.filter((i: any) => i.type === "purchase" || i.pa_status === "received");

      setAllPayments(payments);
      setPendingInvoices(pendingSales);
      setPurchases(purchaseList);

      // Compute Fiscal Metrics
      const metrics = computeFiscalMetrics(
        company.activity_type,
        payments,
        pendingSales,
        purchaseList
      );
      setFiscalMetrics(metrics);

      // Compute Monthly Chart Data
      const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
      const currentYear = new Date().getFullYear();
      const chartPoints = monthNames.map((month, idx) => {
        const monthCa = payments
          .filter((p) => {
            const d = new Date(p.paid_at || (p as any).created_at || new Date());
            return d.getFullYear() === currentYear && d.getMonth() === idx;
          })
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        return { month, ca: monthCa };
      });
      setMonthlyData(chartPoints);

      // URSSAF periods
      const declarations: UrssafDeclaration[] = await fetchUrssafDeclarations(company.id);
      const computed = computeUrssafPeriods(
        company.created_at,
        company.urssaf_frequency,
        payments,
        declarations
      );
      setPeriods(computed);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur de chargement des données fiscales", "danger");
    } finally {
      setLoading(false);
    }
  }, [company, dataView, toast]);

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
    <PageContainer
      title="Pilotage Fiscal & URSSAF"
      subtitle="Suivi des plafonds, prévisionnel de TVA et déclarations"
    >
      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("gauges")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "gauges"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-surface-hover text-muted hover:text-text"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 Plafonds & Atterrissage</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tva")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "tva"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-surface-hover text-muted hover:text-text"
            )}
          >
            <Calculator className="w-4 h-4" />
            <span>💶 TVA & Déclarations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("livre")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "livre"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-surface-hover text-muted hover:text-text"
            )}
          >
            <BookOpen className="w-4 h-4" />
            <span>📖 Livre des Recettes & Impôts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("urssaf")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "urssaf"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-surface-hover text-muted hover:text-text"
            )}
          >
            <Landmark className="w-4 h-4" />
            <span>🏦 Cotisations URSSAF</span>
          </button>
        </div>

        {/* Data Scope Toggle */}
        <div className="flex rounded-pill border border-border p-0.5 bg-bg/80">
          <button
            type="button"
            onClick={() => setDataView("total")}
            className={cn(
              "px-3 h-7 rounded-pill text-[11px] font-semibold transition-all",
              dataView === "total"
                ? "bg-primary text-white font-bold shadow-xs"
                : "text-muted hover:text-text"
            )}
          >
            Périmètre Global
          </button>
          <button
            type="button"
            onClick={() => setDataView("electronic")}
            className={cn(
              "px-3 h-7 rounded-pill text-[11px] font-semibold transition-all",
              dataView === "electronic"
                ? "bg-primary text-white font-bold shadow-xs"
                : "text-muted hover:text-text"
            )}
          >
            PDP Électronique
          </button>
        </div>
      </div>

      {loading ? (
        <Skeleton height="14rem" />
      ) : (
        <>
          {/* TAB 1: PLAFONDS & ATTERRISSAGE */}
          {activeTab === "gauges" && fiscalMetrics && (
            <div className="space-y-6">
              {/* Threshold Gauges Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ThresholdGaugeCard
                  title="Plafond Chiffre d'Affaires Micro-Entreprise"
                  subtitle={fiscalMetrics.caConfig.taxBoxLabel}
                  currentValue={fiscalMetrics.ytdCollected}
                  thresholdLimit={fiscalMetrics.caConfig.caCeiling}
                  projectedValue={fiscalMetrics.projectedEndYear}
                  status={fiscalMetrics.caStatus}
                />

                <ThresholdGaugeCard
                  title="Seuil de Franchise en Base de TVA"
                  subtitle="TVA non applicable jusqu'à 36 800 € / Seuil max 39 100 €"
                  currentValue={fiscalMetrics.ytdCollected}
                  thresholdLimit={fiscalMetrics.caConfig.tvaBase}
                  projectedValue={fiscalMetrics.projectedEndYear}
                  status={fiscalMetrics.tvaStatus}
                  secondaryThreshold={fiscalMetrics.caConfig.tvaMax}
                  secondaryThresholdLabel="Seuil de majoration d'urgence"
                />
              </div>

              {/* Visual Chart Component */}
              <FiscalCharts
                monthlyData={monthlyData}
                caThreshold={fiscalMetrics.caConfig.caCeiling}
                tvaThreshold={fiscalMetrics.caConfig.tvaBase}
              />
            </div>
          )}

          {/* TAB 2: TVA & DÉCLARATIONS */}
          {activeTab === "tva" && fiscalMetrics && (
            <div className="space-y-6">
              <TvaBreakdownCard
                tvaCollected={fiscalMetrics.tvaCollected}
                tvaDeductible={fiscalMetrics.tvaDeductible}
                tvaNetToPay={fiscalMetrics.tvaNetToPay}
                isAssujetti={company.vat_regime !== "franchise"}
              />
            </div>
          )}

          {/* TAB 3: LIVRE DES RECETTES & IMPÔTS */}
          {activeTab === "livre" && (
            <LivreRecettesSection
              activityType={company.activity_type}
              payments={allPayments}
              purchases={purchases}
              year={new Date().getFullYear()}
            />
          )}

          {/* TAB 4: COTISATIONS URSSAF */}
          {activeTab === "urssaf" && (
            <div className="space-y-6">
              {currentPeriod && (
                <Card className="p-6 border border-border bg-surface/90">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                        Période courante de déclaration URSSAF
                      </p>
                      <h2 className="text-xl font-bold text-text">{currentPeriod.label}</h2>
                    </div>
                    <CountdownPill
                      dueDate={currentPeriod.dueDate}
                      declared={false}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-xs text-muted mb-1 font-medium">CA encaissé sur la période</p>
                      <p className="text-xl font-black text-text">
                        {formatAmount(currentPeriod.revenue)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-xs text-muted mb-1 font-medium">Cotisations estimées</p>
                      <p className="text-xl font-black text-emerald-400">
                        {formatAmount(currentPeriod.estimatedAmount)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-xs text-muted mb-1 font-medium">Date limite de déclaration</p>
                      <p className="text-xl font-bold text-text">
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
                      Déclarer sur autoentrepreneur.urssaf.fr
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

              {/* History Table */}
              <Card className="p-6 border border-border">
                <h3 className="text-sm font-bold text-text mb-4">Historique des déclarations URSSAF</h3>
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
        </>
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
