import type { ActivityType } from "../types/database";

export interface ThresholdConfig {
  caCeiling: number;
  tvaBase: number;
  tvaMax: number;
  abattementPercent: number; // 34%, 50%, or 71%
  taxBoxCode: string;
  taxBoxLabel: string;
}

export const FISCAL_THRESHOLDS: Record<string, ThresholdConfig> = {
  services: {
    caCeiling: 77700,
    tvaBase: 36800,
    tvaMax: 39100,
    abattementPercent: 34,
    taxBoxCode: "5HQ",
    taxBoxLabel: "Micro-BNC (Prestations & professions libérales)",
  },
  services_bic: {
    caCeiling: 77700,
    tvaBase: 36800,
    tvaMax: 39100,
    abattementPercent: 50,
    taxBoxCode: "5KP",
    taxBoxLabel: "Micro-BIC Prestations de services artisanales / commerciales",
  },
  sales: {
    caCeiling: 188700,
    tvaBase: 91900,
    tvaMax: 101000,
    abattementPercent: 71,
    taxBoxCode: "5KO",
    taxBoxLabel: "Micro-BIC Ventes de marchandises / logement",
  },
  mixed: {
    caCeiling: 188700,
    tvaBase: 36800,
    tvaMax: 39100,
    abattementPercent: 34,
    taxBoxCode: "5HQ / 5KO",
    taxBoxLabel: "Activité Mixte (Services + Ventes)",
  },
};

export interface FiscalLanding {
  ytdCollected: number;
  pendingBacklog: number;
  projectedEndYear: number;
  
  caConfig: ThresholdConfig;
  caUsedPercent: number;
  caProjectedPercent: number;
  caStatus: "safe" | "warning" | "danger";
  
  tvaBaseUsedPercent: number;
  tvaBaseProjectedPercent: number;
  tvaStatus: "safe" | "warning" | "danger";

  // TVA collected / deductible
  tvaCollected: number;
  tvaDeductible: number;
  tvaNetToPay: number;
}

export function computeFiscalMetrics(
  activityType: ActivityType,
  yearPayments: Array<{ amount: number; paid_at: string }>,
  pendingInvoices: Array<{ total_ttc: number; total_vat?: number }>,
  supplierPurchases: Array<{ total_ttc: number; total_vat?: number }> = []
): FiscalLanding {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = Math.max(1, now.getMonth() + 1);

  // YTD payments
  const ytdCollected = yearPayments
    .filter((p) => {
      const d = new Date(p.paid_at);
      return d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Pending backlog
  const pendingBacklog = pendingInvoices.reduce(
    (sum, i) => sum + Number(i.total_ttc || 0),
    0
  );

  // Projected year-end landing
  const monthlyAvg = ytdCollected / currentMonth;
  const projectedEndYear = Math.round(monthlyAvg * 12 + pendingBacklog * 0.75);

  const config = FISCAL_THRESHOLDS[activityType] || FISCAL_THRESHOLDS.services;

  // CA Ceiling status
  const caUsedPercent = (ytdCollected / config.caCeiling) * 100;
  const caProjectedPercent = (projectedEndYear / config.caCeiling) * 100;
  const caStatus =
    caUsedPercent >= 95 || caProjectedPercent >= 100
      ? "danger"
      : caUsedPercent >= 80 || caProjectedPercent >= 85
      ? "warning"
      : "safe";

  // TVA Base status
  const tvaBaseUsedPercent = (ytdCollected / config.tvaBase) * 100;
  const tvaBaseProjectedPercent = (projectedEndYear / config.tvaBase) * 100;
  const tvaStatus =
    tvaBaseUsedPercent >= 100 || ytdCollected >= config.tvaMax
      ? "danger"
      : tvaBaseUsedPercent >= 85 || tvaBaseProjectedPercent >= 90
      ? "warning"
      : "safe";

  // TVA Collected & Deductible calculation
  const tvaCollected = pendingInvoices.reduce(
    (sum, i) => sum + (Number(i.total_vat) || Number(i.total_ttc || 0) * 0.2),
    0
  );

  const tvaDeductible = supplierPurchases.reduce(
    (sum, i) => sum + (Number(i.total_vat) || Number(i.total_ttc || 0) * 0.2),
    0
  );

  const tvaNetToPay = Math.max(0, tvaCollected - tvaDeductible);

  return {
    ytdCollected,
    pendingBacklog,
    projectedEndYear,
    caConfig: config,
    caUsedPercent,
    caProjectedPercent,
    caStatus,
    tvaBaseUsedPercent,
    tvaBaseProjectedPercent,
    tvaStatus,
    tvaCollected,
    tvaDeductible,
    tvaNetToPay,
  };
}

export function get2042CProEstimation(
  caAmount: number,
  abattementPercent: number
): {
  caBrut: number;
  abattementMontant: number;
  revenuImposableEstime: number;
} {
  const abattementMontant = Math.max(305, Math.round(caAmount * (abattementPercent / 100)));
  const revenuImposableEstime = Math.max(0, Math.round(caAmount - abattementMontant));
  return {
    caBrut: caAmount,
    abattementMontant,
    revenuImposableEstime,
  };
}
