import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ImpersonationProvider } from "./contexts/ImpersonationContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "./components/auth/PublicOnlyRoute";
import { OnboardingRoute } from "./components/auth/OnboardingRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import { ImpersonationBanner } from "./components/admin/ImpersonationBanner";

// Auth & Onboarding pages
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { GuestEditorPage } from "./pages/GuestEditorPage";

// App pages
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
import { LivreRecettesPage } from "./pages/LivreRecettesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AssistantPage } from "./pages/AssistantPage";
import { BankPage } from "./pages/BankPage";
import { RemindersPage } from "./pages/RemindersPage";
import { PublicDocumentPage } from "./pages/PublicDocumentPage";

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
const SecurityCompliancePage = lazy(() =>
  import("./pages/SecurityCompliancePage").then((m) => ({ default: m.SecurityCompliancePage }))
);

// Dedicated SEO Tools & Simulators
const SimulateurUrssafPage = lazy(() =>
  import("./pages/outils/SimulateurUrssafPage").then((m) => ({ default: m.SimulateurUrssafPage }))
);
const SimulateurTvaPage = lazy(() =>
  import("./pages/outils/SimulateurTvaPage").then((m) => ({ default: m.SimulateurTvaPage }))
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);

// Admin Back-Office Pages
const AdminSalesPage = lazy(() =>
  import("./pages/admin/AdminSalesPage").then((m) => ({ default: m.AdminSalesPage }))
);
const AdminSeoPage = lazy(() =>
  import("./pages/admin/AdminSeoPage").then((m) => ({ default: m.AdminSeoPage }))
);
const AdminUsersPage = lazy(() =>
  import("./pages/admin/AdminUsersPage").then((m) => ({ default: m.AdminUsersPage }))
);
const AdminUserDetailPage = lazy(() =>
  import("./pages/admin/AdminUserDetailPage").then((m) => ({ default: m.AdminUserDetailPage }))
);
const AdminOffersPage = lazy(() =>
  import("./pages/admin/AdminOffersPage").then((m) => ({ default: m.AdminOffersPage }))
);
const AdminAdminsPage = lazy(() =>
  import("./pages/admin/AdminAdminsPage").then((m) => ({ default: m.AdminAdminsPage }))
);
const AdminSupportPage = lazy(() =>
  import("./pages/admin/AdminSupportPage").then((m) => ({ default: m.AdminSupportPage }))
);
const AdminLogsPage = lazy(() =>
  import("./pages/admin/AdminLogsPage").then((m) => ({ default: m.AdminLogsPage }))
);
const AdminBlogListPage = lazy(() =>
  import("./pages/admin/AdminBlogListPage").then((m) => ({ default: m.AdminBlogListPage }))
);
const AdminBlogEditorPage = lazy(() =>
  import("./pages/admin/AdminBlogEditorPage").then((m) => ({ default: m.AdminBlogEditorPage }))
);
const AdminEmailsPage = lazy(() =>
  import("./pages/admin/AdminEmailsPage").then((m) => ({ default: m.AdminEmailsPage }))
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
      <ImpersonationProvider>
        <AuthProvider>
          <BrowserRouter>
            <NotificationsProvider>
              <ImpersonationBanner />

              <Routes>
                {/* Standalone public marketing & landing routes */}
                <Route
                  path="/"
                  element={
                    <MarketingSuspense>
                      <LandingPage />
                    </MarketingSuspense>
                  }
                />
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
                  path="/conformite"
                  element={
                    <MarketingSuspense>
                      <SecurityCompliancePage />
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
                  path="/cgv"
                  element={
                    <MarketingSuspense>
                      <CGUPage />
                    </MarketingSuspense>
                  }
                />

                {/* Secure Public Document View Route */}
                <Route path="/v/:token" element={<PublicDocumentPage />} />
                <Route
                  path="/confidentialite"
                  element={
                    <MarketingSuspense>
                      <ConfidentialitePage />
                    </MarketingSuspense>
                  }
                />
                <Route path="/essai" element={<GuestEditorPage />} />

                {/* Unauthenticated-only auth forms */}
                <Route element={<PublicOnlyRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>

                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* onboarding — authenticated, standalone layout */}
                <Route path="/onboarding" element={<OnboardingRoute />}>
                  <Route index element={<OnboardingPage />} />
                </Route>

                {/* ADMIN BACK-OFFICE ROUTES */}
                <Route path="/admin" element={<AdminRoute />}>
                  <Route
                    element={
                      <MarketingSuspense>
                        <AdminLayout />
                      </MarketingSuspense>
                    }
                  >
                    <Route index element={<Navigate to="/admin/ventes" replace />} />
                    <Route path="ventes" element={<AdminSalesPage />} />
                    <Route path="blog" element={<AdminBlogListPage />} />
                    <Route path="blog/editor" element={<AdminBlogEditorPage />} />
                    <Route path="seo" element={<AdminSeoPage />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="users/:id" element={<AdminUserDetailPage />} />
                    <Route path="support" element={<AdminSupportPage />} />
                    <Route path="emails" element={<AdminEmailsPage />} />
                    <Route path="logs" element={<AdminLogsPage />} />

                    {/* Super Admin Only Sub-Routes */}
                    <Route element={<AdminRoute requireSuperAdmin />}>
                      <Route path="offres" element={<AdminOffersPage />} />
                      <Route path="admins" element={<AdminAdminsPage />} />
                    </Route>
                  </Route>
                </Route>

                {/* PROTECTED APP ROUTES */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/quotes" element={<QuotesPage />} />
                    <Route path="/quotes/new" element={<QuoteNewPage />} />
                    <Route path="/quotes/:id" element={<QuoteDetailPage />} />
                    <Route path="/invoices" element={<InvoicesPage />} />
                    <Route path="/invoices/new" element={<InvoiceNewPage />} />
                    <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                    <Route path="/assistant" element={<AssistantPage />} />
                    <Route path="/bank" element={<BankPage />} />
                    <Route path="/reminders" element={<RemindersPage />} />
                    <Route path="/clients" element={<ClientsPage />} />
                    <Route path="/clients/:id" element={<ClientDetailPage />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/livre-recettes" element={<LivreRecettesPage />} />
                    <Route path="/urssaf" element={<UrssafPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
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

                <Route
                  path="*"
                  element={
                    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
                      <NotFoundPage />
                    </Suspense>
                  }
                />
              </Routes>
            </NotificationsProvider>
          </BrowserRouter>
        </AuthProvider>
      </ImpersonationProvider>
    </ToastProvider>
  );
}

export default App;
