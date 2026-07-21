import { supabase } from "./supabase";
import type { PlanType } from "../types/database";

export interface PlanFeatureLimits {
  invoicesPerMonth: number | null; // null = unlimited
  maxClients: number | null; // null = unlimited
  fiscalDashboard: boolean;
  reminders: boolean;
  exports: boolean;
  paymentLinks: boolean;
  multiCompany: boolean;
}

export type FeatureKey = keyof PlanFeatureLimits;

export const PLAN_LIMITS: Record<PlanType, PlanFeatureLimits> = {
  starter: {
    invoicesPerMonth: 10,
    maxClients: 3,
    fiscalDashboard: false,
    reminders: false,
    exports: false,
    paymentLinks: false,
    multiCompany: false,
  },
  solo: {
    invoicesPerMonth: null,
    maxClients: null,
    fiscalDashboard: true,
    reminders: true,
    exports: true,
    paymentLinks: false,
    multiCompany: false,
  },
  pro: {
    invoicesPerMonth: null,
    maxClients: null,
    fiscalDashboard: true,
    reminders: true,
    exports: true,
    paymentLinks: true,
    multiCompany: true,
  },
};

export function getPlanLimits(plan: PlanType | undefined | null): PlanFeatureLimits {
  return PLAN_LIMITS[plan ?? "starter"] ?? PLAN_LIMITS.starter;
}

export function canUseFeature(
  plan: PlanType | undefined | null,
  feature: FeatureKey
): boolean {
  const limits = getPlanLimits(plan);
  const val = limits[feature];
  if (typeof val === "boolean") return val;
  return val === null; // null means unlimited/enabled
}

/**
 * Counts non-draft invoices emitted by the company in the current calendar month
 */
export async function countEmittedInvoicesThisMonth(companyId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

  const { count, error } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .neq("status", "draft")
    .gte("created_at", startOfMonth)
    .lte("created_at", endOfMonth);

  if (error) {
    console.error("Error counting emitted invoices:", error);
    return 0;
  }
  return count ?? 0;
}

/**
 * Counts total active clients belonging to the company
 */
export async function countActiveClients(companyId: string): Promise<number> {
  const { count, error } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (error) {
    console.error("Error counting active clients:", error);
    return 0;
  }
  return count ?? 0;
}
