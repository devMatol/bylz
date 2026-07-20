import { type ReactNode } from "react";
import { useLocation } from "react-router-dom";

const routeTitles: Record<string, string> = {
  "/": "Tableau de bord",
  "/quotes": "Devis",
  "/invoices": "Factures",
  "/clients": "Clients",
  "/catalog": "Catalogue",
  "/urssaf": "URSSAF",
  "/settings": "Paramètres",
  "/onboarding": "Bienvenue",
};

interface TopbarProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const location = useLocation();
  const resolvedTitle =
    title ||
    routeTitles[location.pathname] ||
    (location.pathname.startsWith("/quotes/new")
      ? "Nouveau devis"
      : location.pathname.startsWith("/invoices/new")
      ? "Nouvelle facture"
      : location.pathname.startsWith("/quotes/")
      ? "Devis"
      : location.pathname.startsWith("/invoices/")
      ? "Facture"
      : location.pathname.startsWith("/clients/")
      ? "Client"
      : "");

  return (
    <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur-sm border-b border-border h-16 flex items-center justify-between px-4 md:px-10">
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold text-text truncate">
          {resolvedTitle}
        </h2>
        {subtitle && (
          <p className="text-xs text-muted truncate -mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {actions}
        </div>
      )}
    </header>
  );
}
