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
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", path: "/", icon: LayoutDashboard },
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
