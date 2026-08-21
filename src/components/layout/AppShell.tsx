import { useEffect, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Topbar } from "./Topbar";
import { ErrorBoundary } from "../ErrorBoundary";
import { PwaInstallBanner } from "../pwa/PwaInstallBanner";
import { registerServiceWorker } from "../../lib/pushNotifications";
import {
  PageHeaderProvider,
  usePageHeader,
} from "./PageHeaderContext";

const routeTitles: Record<string, string> = {
  "/": "Tableau de bord",
  "/dashboard": "Tableau de bord",
  "/quotes": "Devis",
  "/invoices": "Factures",
  "/livre-recettes": "Livre des recettes",
  "/clients": "Clients",
  "/catalog": "Catalogue",
  "/urssaf": "Déclarations",
  "/settings": "Paramètres",
  "/onboarding": "Bienvenue",
};

function ShellContent() {
  const location = useLocation();
  const { header } = usePageHeader();

  useEffect(() => {
    void registerServiceWorker();
  }, []);

  const fallback =
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
  const title = header.title || fallback;

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <div className="min-h-screen flex flex-col md:ml-[280px]">
        <Topbar title={title} subtitle={header.subtitle} actions={header.actions} />
        <main className="flex-1 p-4 md:p-10 pb-36 md:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <PwaInstallBanner />
    </div>
  );
}

export function AppShell() {
  return (
    <ErrorBoundary>
      <PageHeaderProvider>
        <ShellContent />
      </PageHeaderProvider>
    </ErrorBoundary>
  );
}
