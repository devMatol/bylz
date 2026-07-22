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

// Code-split marketing & tools bundle from main app
const LandingPage = lazy(() =>
  import("./pages/LandingPage").then((m) => ({ default: m.LandingPage }))
);
const PricingPage = lazy(() =>
  import("./pages/PricingPage").then((m) => ({ default: m.PricingPage }))
);
const FeaturesPage = lazy(() =>
  import("./pages/FeaturesPage").then((m) => ({ default: m.FeaturesPage }))
);
const BlogListPage = lazy(() =>
  import("./pages/BlogListPage").then((m) => ({ default: m.BlogListPage }))
);
const BlogPostPage = lazy(() =>
  import("./pages/BlogPostPage").then((m) => ({ default: m.BlogPostPage }))
);
const ContactPage = lazy(() =>
  import("./pages/ContactPage").then((m) => ({ default: m.ContactPage }))
);
const MentionsLegalesPage = lazy(() =>
  import("./pages/MentionsLegalesPage").then((m) => ({ default: m.MentionsLegalesPage }))
);
const CGUPage = lazy(() =>
  import("./pages/CGUPage").then((m) => ({ default: m.CGUPage }))
);
const ConfidentialitePage = lazy(() =>
  import("./pages/ConfidentialitePage").then((m) => ({ default: m.ConfidentialitePage }))
);

// Dedicated SEO Tools & Simulators
const SimulateurUrssafPage = lazy(() =>
  import("./pages/outils/SimulateurUrssafPage").then((m) => ({ default: m.SimulateurUrssafPage }))
);
const SimulateurTvaPage = lazy(() =>
  import("./pages/outils/SimulateurTvaPage").then((m) => ({ default: m.SimulateurTvaPage }))
);

const KitchenSinkPage = lazy(() =>
  import("./pages/KitchenSinkPage").then((m) => ({ default: m.KitchenSinkPage }))
);

const MarketingSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center p-10 text-muted text-sm font-medium">
        Chargement…
      </div>
    }
  >
    {children}
  </Suspense>
);

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <NotificationsProvider>
            <Routes>
              {/* Standalone public marketing routes (accessible to everyone) */}
              <Route
                path="/tarifs"
                element={
                  <MarketingSuspense>
                    <PricingPage />
                  </MarketingSuspense>
                }
              />
              <Route
                path="/fonctionnalites"
                element={
                  <MarketingSuspense>
                    <FeaturesPage />
                  </MarketingSuspense>
                }
              />
              <Route
                path="/blog"
                element={
                  <MarketingSuspense>
                    <BlogListPage />
                  </MarketingSuspense>
                }
              />
              <Route
                path="/blog/:slug"
                element={
                  <MarketingSuspense>
                    <BlogPostPage />
                  </MarketingSuspense>
                }
              />
              <Route
                path="/outils/simulateur-urssaf"
                element={
                  <MarketingSuspense>
                    <SimulateurUrssafPage />
                  </MarketingSuspense>
                }
              />
              <Route
                path="/outils/simulateur-seuil-tva"
                element={
                  <MarketingSuspense>
                    <SimulateurTvaPage />
                  </MarketingSuspense>
                }
              />
              <Route
                path="/contact"
                element={
                  <MarketingSuspense>
                    <ContactPage />
                  </MarketingSuspense>
                }
              />
              <Route
                path="/mentions-legales"
                element={
                  <MarketingSuspense>
                    <MentionsLegalesPage />
                  </MarketingSuspense>
                }
              />
              <Route
                path="/cgu"
                element={
                  <MarketingSuspense>
                    <CGUPage />
                  </MarketingSuspense>
                }
              />
              <Route
                path="/confidentialite"
                element={
                  <MarketingSuspense>
                    <ConfidentialitePage />
                  </MarketingSuspense>
                }
              />

              {/* Unauthenticated-only public routes (logged-in users redirected to /dashboard) */}
              <Route element={<PublicOnlyRoute />}>
                <Route
                  path="/"
                  element={
                    <MarketingSuspense>
                      <LandingPage />
                    </MarketingSuspense>
                  }
                />
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
                  <Route path="/dashboard" element={<DashboardPage />} />
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
