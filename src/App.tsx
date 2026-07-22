import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "./components/auth/PublicOnlyRoute";
import { OnboardingRoute } from "./components/auth/OnboardingRoute";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { QuotesPage } from "./pages/QuotesPage";
import { QuoteNewPage } from "./pages/QuoteNewPage";
import { QuoteDetailPage } from "./pages/QuoteDetailPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { InvoiceNewPage } from "./pages/InvoiceNewPage";
import { InvoiceDetailPage } from "./pages/InvoiceDetailPage";
import { ClientsPage } from "./pages/ClientsPage";
import { ClientDetailPage } from "./pages/ClientDetailPage";
import { CatalogPage } from "./pages/CatalogPage";
import { UrssafPage } from "./pages/UrssafPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminPage } from "./pages/AdminPage";

import { GuestEditorPage } from "./pages/GuestEditorPage";

const KitchenSinkPage = lazy(() =>
  import("./pages/KitchenSinkPage").then((m) => ({ default: m.KitchenSinkPage }))
);

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <NotificationsProvider>
            <Routes>
              {/* public — standalone layout, no AppShell */}
              <Route element={<PublicOnlyRoute />}>
                <Route path="/essai" element={<GuestEditorPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Route>

              {/* onboarding — authenticated, standalone layout */}
              <Route path="/onboarding" element={<OnboardingRoute />}>
                <Route index element={<OnboardingPage />} />
              </Route>

              {/* protected app — AppShell wraps ALL of these */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/quotes" element={<QuotesPage />} />
                  <Route path="/quotes/new" element={<QuoteNewPage />} />
                  <Route path="/quotes/:id" element={<QuoteDetailPage />} />
                  <Route path="/invoices" element={<InvoicesPage />} />
                  <Route path="/invoices/new" element={<InvoiceNewPage />} />
                  <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                  <Route path="/clients" element={<ClientsPage />} />
                  <Route path="/clients/:id" element={<ClientDetailPage />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  <Route path="/urssaf" element={<UrssafPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  {import.meta.env.DEV && (
                    <Route
                      path="/dev-kitchen-sink"
                      element={
                        <Suspense fallback={<div className="p-10">Chargement…</div>}>
                          <KitchenSinkPage />
                        </Suspense>
                      }
                    />
                  )}
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationsProvider>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
