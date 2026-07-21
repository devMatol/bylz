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
  { label: "Tableau de bord", path: "/", icon: LayoutDashboard, requiredPlan: "solo" },
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

export const STRIPE_PRICE_SOLO = "price_1TvYmr2X0yCzQQsNrPbSS9NC";
export const STRIPE_PRICE_PRO = "price_1TvYnW2X0yCzQQsN930PPkgJ";

export const PRICE_TO_PLAN: Record<string, "solo" | "pro"> = {
  [STRIPE_PRICE_SOLO]: "solo",
  [STRIPE_PRICE_PRO]: "pro",
};

export const PLAN_PRICES: Record<string, number> = {
  starter: 0,
  solo: 9,
  pro: 19,
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
