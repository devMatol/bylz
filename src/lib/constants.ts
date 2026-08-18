import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  BookOpen,
  Landmark,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  requiredPlan?: "solo" | "pro";
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", path: "/dashboard", icon: LayoutDashboard },
  { label: "Devis", path: "/quotes", icon: FileText },
  { label: "Factures", path: "/invoices", icon: Receipt },
  { label: "Clients", path: "/clients", icon: Users },
  { label: "Catalogue", path: "/catalog", icon: BookOpen },
  { label: "URSSAF", path: "/urssaf", icon: Landmark },
  { label: "Paramètres", path: "/settings", icon: Settings },
];

export const PLAN_LABELS: Record<string, string> = {
  starter: "STARTER",
  solo: "SOLO ⚡",
  pro: "PRO",
};

export type BillingCycle = "annual" | "monthly";

export const STRIPE_PRICE_SOLO_ANNUAL = "price_SOLO_ANNUAL_50";
export const STRIPE_PRICE_SOLO_MONTHLY = "price_SOLO_MONTHLY_890";
export const STRIPE_PRICE_PRO_ANNUAL = "price_PRO_ANNUAL_75";
export const STRIPE_PRICE_PRO_MONTHLY = "price_PRO_MONTHLY_1290";

export const STRIPE_PRICE_SOLO = STRIPE_PRICE_SOLO_ANNUAL;
export const STRIPE_PRICE_PRO = STRIPE_PRICE_PRO_ANNUAL;

export const PRICE_TO_PLAN: Record<string, "solo" | "pro"> = {
  [STRIPE_PRICE_SOLO_ANNUAL]: "solo",
  [STRIPE_PRICE_SOLO_MONTHLY]: "solo",
  [STRIPE_PRICE_PRO_ANNUAL]: "pro",
  [STRIPE_PRICE_PRO_MONTHLY]: "pro",
  price_1TvYmr2X0yCzQQsNrPbSS9NC: "solo",
  price_1TvYnW2X0yCzQQsN930PPkgJ: "pro",
};

export const PLAN_PRICES = {
  starter: { annual: 0, monthly: 0, annualMonthlyEquiv: "0 €" },
  solo: { annual: 50, monthly: 8.9, annualMonthlyEquiv: "4,17 €" },
  pro: { annual: 80, monthly: 12.9, annualMonthlyEquiv: "6,67 €" },
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  refused: "Refusé",
  pending: "En attente",
  late: "En retard",
  paid: "Payé",
  rejected: "Rejeté",
  none: "Aucun",
  submitted: "Soumis",
  delivered: "Livré",
  received: "Reçu",
  confirmed: "Confirmé",
  error: "Erreur",
};
