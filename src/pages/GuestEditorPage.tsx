import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  BookOpen,
  Landmark,
  Settings,
  Sparkles,
  Lock,
  Eye,
  Info,
  TrendingUp,
  Wallet,
  Bot,
  BellRing,
  BookMarked,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
} from "lucide-react";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Tooltip } from "../components/ui/Tooltip";
import { LineEditor } from "../components/documents/LineEditor";
import { DocumentPreview } from "../components/documents/DocumentPreview";
import { PreviewModal } from "../components/documents/PreviewModal";
import { Logo } from "../components/shared/Logo";
import { useGuestDraft, GuestDraftProvider } from "../contexts/GuestDraftContext";
import { GoogleIcon } from "../components/auth/GoogleIcon";
import { signInWithGoogle } from "../lib/auth";
import type { Company, Client, PaymentTerms } from "../types/database";
import { computeTotals } from "../lib/api";
import { todayISO, paymentTermsToDate, isValidDate } from "../lib/date";
import { formatAmount } from "../lib/utils";
import { NAV_ITEMS } from "../lib/constants";

type GuestTab = "dashboard" | "invoice";

export function GuestEditorPageContent() {
  const { draft, updateDraft } = useGuestDraft();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<GuestTab>("dashboard");
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [wallOpen, setWallOpen] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState<string>("cette fonctionnalité");
  const [wallTriggerReason, setWallTriggerReason] = useState<"locked_feature" | "emit_invoice">("emit_invoice");

  // Handle query params (?tab=invoice & ?prefill=true)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    const prefillParam = searchParams.get("prefill");
    if (tabParam === "invoice" || prefillParam === "true") {
      setActiveTab("invoice");
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        const stored = localStorage.getItem("bylz-guest-draft");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Array.isArray(parsed.lines) && parsed.lines.length > 0) {
            updateDraft({
              lines: parsed.lines,
              note: parsed.note !== undefined ? parsed.note : draft?.note,
            });
          }
        }
      } catch (err) {
        console.error("Failed to sync draft in /essai:", err);
      }
    }
  }, [location.search]);

  // Recompute due date when issue date or terms change
  useEffect(() => {
    const issueDate = draft?.issueDate;
    const paymentTerms = draft?.paymentTerms;
    if (!issueDate || !isValidDate(issueDate)) return;
    updateDraft({
      dueDate: paymentTermsToDate(issueDate, (paymentTerms || "30d") as PaymentTerms),
    });
  }, [draft?.issueDate, draft?.paymentTerms]);

  const lines = draft?.lines || [];

  const totals = computeTotals(
    lines.map((l) => ({
      description: l.description || "",
      quantity: l.quantity || 1,
      unit_price: l.unitPrice || 0,
      nature: l.nature || "service",
      position: 0,
    })),
    "franchise"
  );

  const linesValid =
    lines.length > 0 &&
    lines.every((l) => l && l.description && l.quantity > 0 && l.unitPrice >= 0);
  const datesValid = isValidDate(draft?.issueDate) && isValidDate(draft?.dueDate);
  const canEmit = !!(draft?.clientName || "").trim() && linesValid && datesValid;

  const mockCompany: Company = {
    id: "guest-company",
    user_id: "guest-user",
    siret: "921 847 291 00018",
    siren: "921847291",
    legal_name: "Bylz Studio SAS",
    commercial_name: "Bylz Studio",
    address: "10 rue de la Paix, 75002 Paris",
    naf_code: "6201Z",
    activity_type: "freelance_bnc",
    vat_regime: "franchise",
    structure: "micro",
    urssaf_frequency: "monthly",
    logo_url: null,
    accent_color: "var(--primary)",
    invoice_footer: "Dispensé d'immatriculation au RCS en application de l'article L. 123-1-1 du code de commerce.\nTVA non applicable, art. 293 B du CGI.",
    default_payment_terms: "30d",
    stripe_connect_account_id: null,
    previous_ca: 0,
    created_at: new Date().toISOString(),
  };

  const hasCustomClient = !!(draft?.clientName && draft.clientName.trim().length > 0 && draft.clientName.trim() !== "Acme Studio SARL");

  const mockClient: Client = {
    id: "guest-client",
    company_id: "guest-company",
    name: draft?.clientName || "Acme Studio SARL",
    type: draft?.clientType || "b2b",
    siren: hasCustomClient ? "" : "803245912",
    siret: hasCustomClient ? "" : "803 245 912 00024",
    vat_number: hasCustomClient ? "" : "FR34803245912",
    email: draft?.clientEmail || (hasCustomClient ? "" : "comptabilite@acme.fr"),
    address: hasCustomClient ? "" : "42 avenue des Champs-Élysées, 75008 Paris",
    archived_at: null,
    created_at: new Date().toISOString(),
  };

  const handleGoogleLogin = async () => {
    const redirectTo = `${window.location.origin}/onboarding?guest=true`;
    await signInWithGoogle(redirectTo);
  };

  const openWall = (reason: "locked_feature" | "emit_invoice", featureTitle?: string) => {
    setWallTriggerReason(reason);
    if (featureTitle) setLockedFeatureName(featureTitle);
    setWallOpen(true);
  };

  // Mock data for the Demo Dashboard (Authentic to real Bylz app)
  const mockMonthlyCa = [
    { month: "Janv.", ca: 1800 },
    { month: "Févr.", ca: 2400 },
    { month: "Mars", ca: 2900 },
    { month: "Avr.", ca: 3400 },
    { month: "Mai", ca: 4250, current: true },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row text-text selection:bg-primary/20 selection:text-primary">
      {/* ========================================================= */}
      {/* 1. SIDEBAR FOR DESKTOP (Fidèle à la vraie app)           */}
      {/* ========================================================= */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[280px] bg-bg-sidebar border-r border-border flex-col z-30">
        <div className="flex items-center justify-between px-6 h-16 border-b border-border">
          <Logo variant="gradient" height={32} to="/essai" />
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/15 text-primary border border-primary/30 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 animate-pulse" /> Démo
          </span>
        </div>

        {/* Real App Navigation Items */}
        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isDashboard = item.path === "/dashboard";
            const isInvoice = item.path === "/invoices";
            const isActive =
              (isDashboard && activeTab === "dashboard") ||
              (isInvoice && activeTab === "invoice");

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  if (isDashboard) {
                    setActiveTab("dashboard");
                  } else if (isInvoice) {
                    setActiveTab("invoice");
                  } else {
                    openWall("locked_feature", item.label);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-l-[3px] ${
                  isActive
                    ? "bg-primary/10 text-primary border-primary font-bold bylz-glow-primary"
                    : "text-muted border-transparent hover:text-text hover:bg-surface-hover"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      item.badge === "PRO"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        : "bg-primary/15 text-primary border border-primary/20"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : !isDashboard && !isInvoice ? (
                  <Lock className="w-3.5 h-3.5 text-muted/40" />
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Bottom Activation CTA */}
        <div className="p-4 border-t border-border flex flex-col gap-2 bg-surface/40">
          <Button
            variant="primary"
            onClick={() => openWall("locked_feature", "Créer un compte")}
            className="w-full text-xs h-10 font-bold bylz-glow-primary justify-center rounded-xl"
          >
            Créer un compte gratuit
          </Button>
          <Link
            to="/login?guest=true"
            className="text-center text-xs text-muted hover:text-text py-1 transition-colors"
          >
            Déjà un compte ? Se connecter
          </Link>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. TOPBAR FOR MOBILE & DESKTOP                            */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col md:ml-[280px] min-h-screen">
        <header className="h-16 border-b border-border px-4 sm:px-6 flex items-center justify-between bg-surface/80 backdrop-blur-md sticky top-0 z-20">
          {/* Left: Mobile Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <Logo variant="gradient" height={26} to="/essai" />
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/15 text-primary border border-primary/20">
                Démo
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-bold text-text">
                {activeTab === "dashboard" ? "Tableau de bord" : "Nouvelle Facture"}
              </span>
              <span className="text-xs text-muted">· Aperçu interactif</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/login?guest=true"
              className="hidden sm:inline-flex text-xs font-semibold text-muted hover:text-text transition-colors"
            >
              Se connecter
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openWall("locked_feature", "Créer mon compte")}
              className="text-xs h-8 px-4 rounded-full font-bold bylz-glow-primary"
            >
              Créer mon compte
            </Button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* 3. MAIN CONTENT BODY                                      */}
        {/* ========================================================= */}
        <main className="flex-1 p-4 md:p-8 flex flex-col gap-6 max-w-6xl w-full mx-auto pb-32 md:pb-16">
          {/* Banner Notice */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-0.5">
              <h4 className="text-sm font-extrabold text-text flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Espace Démonstration Bylz
              </h4>
              <p className="text-xs text-muted">
                Découvrez la simplicité de l'application en direct. Tout ce que vous saisissez ici est conservé à la création de votre compte.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab(activeTab === "dashboard" ? "invoice" : "dashboard")}
                className="text-xs h-8 flex-1 sm:flex-none justify-center"
              >
                {activeTab === "dashboard" ? "Créer une facture →" : "Voir le tableau de bord"}
              </Button>
            </div>
          </div>

          {/* TAB 1: DASHBOARD EXACTEMENT FIDÈLE À LA VRAIE APPLICATION */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Header Title */}
              <div>
                <h1 className="text-2xl font-black text-text tracking-tight">Tableau de bord</h1>
                <p className="text-xs sm:text-sm text-muted">Vue d'ensemble de votre activité en temps réel</p>
              </div>

              {/* 4 StatCards (Grille 2 colonnes mobile, 4 colonnes desktop fidèle à DashboardPage) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="p-4 space-y-1.5 bg-surface border-border">
                  <div className="flex items-center justify-between text-muted">
                    <span className="text-[11px] font-bold uppercase tracking-wider">CA encaissé</span>
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-text font-mono">4 250,00 €</div>
                  <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span>+25% vs mois dernier</span>
                  </div>
                  <p className="text-[10px] text-muted">Ce mois-ci</p>
                </Card>

                <Card className="p-4 space-y-1.5 bg-surface border-border">
                  <div className="flex items-center justify-between text-muted">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Bénéfice fiscal</span>
                    <Wallet className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-text font-mono">2 805,00 €</div>
                  <p className="text-[10px] text-muted">Abattement 34% (BNC)</p>
                  <p className="text-[10px] text-muted">Revenu imposable</p>
                </Card>

                <Card className="p-4 space-y-1.5 bg-surface border-border">
                  <div className="flex items-center justify-between text-muted">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Cotisations URSSAF</span>
                    <Landmark className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-text font-mono">981,75 €</div>
                  <div className="text-[10px] text-amber-400 font-bold">Échéance: 30 nov. 2026</div>
                  <p className="text-[10px] text-muted">Taux légal 2026 : 23,1%</p>
                </Card>

                <Card className="p-4 space-y-1.5 bg-surface border-border">
                  <div className="flex items-center justify-between text-muted">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Net estimé</span>
                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">2 959,70 €</div>
                  <p className="text-[10px] text-muted">Après cotisations et IR</p>
                  <p className="text-[10px] text-slate-500 font-mono">TMI estimé : 11%</p>
                </Card>
              </div>

              {/* Row 2: Évolution du CA (60%) & Santé Fiscale (40%) */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Évolution du CA */}
                <Card className="lg:col-span-3 p-5 space-y-4 bg-surface border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-text">Évolution du CA</h3>
                    <span className="text-xs text-muted font-medium">Année 2026</span>
                  </div>
                  <div className="w-full pt-2">
                    <div className="h-44 flex items-end justify-between gap-3 px-2 pb-2 border-b border-border">
                      {mockMonthlyCa.map((item, idx) => {
                        const heightPct = (item.ca / 5000) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                            <span className="text-[10px] font-bold font-mono text-text opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.ca} €
                            </span>
                            <div className="w-full max-w-[48px] bg-slate-800 rounded-t-lg overflow-hidden h-32 flex items-end">
                              <div
                                className={`w-full rounded-t-lg transition-all duration-500 ${
                                  item.current
                                    ? "bg-gradient-to-t from-blue-600 to-indigo-500"
                                    : "bg-primary/40 hover:bg-primary/60"
                                }`}
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                            <span className={`text-[11px] font-bold ${item.current ? "text-primary" : "text-muted"}`}>
                              {item.month}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-around mt-4 pt-2 text-xs">
                      <div className="text-center">
                        <p className="text-muted text-[11px]">Meilleur mois</p>
                        <p className="font-bold text-text mt-0.5">Mai : 4 250,00 €</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted text-[11px]">Moyenne mensuelle</p>
                        <p className="font-bold text-text mt-0.5">2 950,00 €</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Santé Fiscale & Seuils TVA */}
                <Card className="lg:col-span-2 p-5 flex flex-col justify-between space-y-4 bg-surface border-border">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-text">Santé fiscale</h3>
                        <Tooltip content="Suivi en direct du plafond de franchise en base de TVA (Art. 293 B du CGI)">
                          <span className="text-muted hover:text-text cursor-help">
                            <Info className="w-3.5 h-3.5" />
                          </span>
                        </Tooltip>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Exonéré de TVA
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-text">Franchise de TVA</span>
                        <span className="text-muted font-mono">39 100,00 €</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: "10.8%" }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-muted pt-1">
                        <span>CA Actuel: <strong>4 250,00 €</strong></span>
                        <span>Reste: <strong>34 850,00 €</strong></span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-border text-xs space-y-1">
                      <p className="font-bold text-text flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Régime micro-entreprise
                      </p>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Mention légale obligatoire intégrée automatiquement sur chaque document : <em>« TVA non applicable, art. 293 B du CGI »</em>.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openWall("locked_feature", "Simulateur fiscal complet")}
                    className="w-full text-xs justify-center"
                  >
                    Simuler mes cotisations annuelles
                  </Button>
                </Card>
              </div>

              {/* Row 3: Tableau des Dernières Factures */}
              <Card className="p-5 space-y-4 bg-surface border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-text">Dernières factures</h3>
                    <p className="text-xs text-muted">Exemples de factures émises au format conforme Factur-X</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab("invoice")}
                    className="text-xs font-bold bylz-glow-primary"
                  >
                    Créer une facture
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted text-[11px] uppercase tracking-wider font-bold">
                        <th className="py-2.5 px-3">Numéro</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Émission</th>
                        <th className="py-2.5 px-3">Échéance</th>
                        <th className="py-2.5 px-3 text-right">Montant TTC</th>
                        <th className="py-2.5 px-3 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-surface-hover transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-text">FAC-2026-003</td>
                        <td className="py-3 px-3 font-semibold text-text">Studio Apex SAS</td>
                        <td className="py-3 px-3 text-muted">02 mai 2026</td>
                        <td className="py-3 px-3 text-muted">15 mai 2026</td>
                        <td className="py-3 px-3 font-mono font-bold text-text text-right">2 750,00 €</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Validée · Payée
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-hover transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-text">FAC-2026-002</td>
                        <td className="py-3 px-3 font-semibold text-text">Nexus Digital SARL</td>
                        <td className="py-3 px-3 text-muted">28 avr. 2026</td>
                        <td className="py-3 px-3 text-muted">05 mai 2026</td>
                        <td className="py-3 px-3 font-mono font-bold text-text text-right">1 500,00 €</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Validée · Payée
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-hover transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-text">FAC-2026-001</td>
                        <td className="py-3 px-3 font-semibold text-text">Aura Conseil SAS</td>
                        <td className="py-3 px-3 text-muted">18 mai 2026</td>
                        <td className="py-3 px-3 text-muted">18 juin 2026</td>
                        <td className="py-3 px-3 font-mono font-bold text-text text-right">1 800,00 €</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            En attente
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: INVOICE CREATION & LIVE DOCUMENT PREVIEW (Side by side sur desktop) */}
          {activeTab === "invoice" && (
            <div className="space-y-6">
              {/* Header Title & Mobile Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-text tracking-tight">Nouvelle Facture</h1>
                  <p className="text-xs sm:text-sm text-muted">
                    Format certifié Factur-X avec mentions légales automatiques
                  </p>
                </div>

                {/* Mobile Toggle: Éditeur vs Aperçu Document */}
                <div className="lg:hidden flex bg-surface border border-border p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMobileView("form")}
                    className={`flex-1 py-1.5 px-4 rounded-lg text-xs font-bold transition-all ${
                      mobileView === "form" ? "bg-primary text-white shadow-sm" : "text-muted"
                    }`}
                  >
                    1. Formulaire
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileView("preview")}
                    className={`flex-1 py-1.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      mobileView === "preview" ? "bg-primary text-white shadow-sm" : "text-muted"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> 2. Aperçu Facture
                  </button>
                </div>
              </div>

              {/* Main Grid: Formulaire à gauche, DocumentPreview Factur-X en direct à droite */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Formulaire */}
                <div className={`space-y-6 ${mobileView === "preview" ? "hidden lg:block" : "block"} lg:col-span-6`}>
                  {/* Client Info */}
                  <Card className="p-5 space-y-4 bg-surface border-border">
                    <h3 className="text-sm font-bold text-text">Destinataire (Client)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Nom du client / Raison sociale"
                        placeholder="ex: Acme Studio SARL"
                        value={draft?.clientName || ""}
                        onChange={(e) => updateDraft({ clientName: e.target.value })}
                        required
                      />
                      <Input
                        label="Email du client"
                        placeholder="compta@client.fr"
                        type="email"
                        value={draft?.clientEmail || ""}
                        onChange={(e) => updateDraft({ clientEmail: e.target.value })}
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-text mb-1.5 block">Type de client</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateDraft({ clientType: "b2b" })}
                          className={`flex-1 h-9 rounded-xl text-xs font-bold border transition-all ${
                            draft?.clientType === "b2b"
                              ? "bg-primary border-primary text-white"
                              : "bg-bg border-border text-muted hover:text-text"
                          }`}
                        >
                          Entreprise (B2B)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDraft({ clientType: "b2c" })}
                          className={`flex-1 h-9 rounded-xl text-xs font-bold border transition-all ${
                            draft?.clientType === "b2c"
                              ? "bg-primary border-primary text-white"
                              : "bg-bg border-border text-muted hover:text-text"
                          }`}
                        >
                          Particulier (B2C)
                        </button>
                      </div>
                    </div>
                  </Card>

                  {/* Lignes de la facture */}
                  <Card className="p-5 space-y-4 bg-surface border-border">
                    <h3 className="text-sm font-bold text-text">Prestations & Lignes de facturation</h3>
                    <LineEditor
                      lines={lines.map((l, i) => ({
                        description: l.description || "",
                        quantity: l.quantity || 1,
                        unit_price: l.unitPrice || 0,
                        nature: l.nature || "service",
                        position: i,
                      }))}
                      onChange={(newLines) =>
                        updateDraft({
                          lines: newLines.map((l) => ({
                            description: l.description || "",
                            quantity: l.quantity || 1,
                            unitPrice: l.unit_price || 0,
                            nature: l.nature || "service",
                          })),
                        })
                      }
                      catalog={[]}
                    />

                    {lines.length > 0 && (
                      <div className="pt-4 border-t border-border flex flex-col gap-2 text-xs">
                        <div className="flex justify-between text-muted">
                          <span>Total HT</span>
                          <span className="tabular-nums font-mono font-bold text-text">
                            {formatAmount(totals.total_ht)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-border pt-2">
                          <span className="font-bold text-text">Total TTC</span>
                          <span className="text-lg font-black text-primary font-mono tabular-nums">
                            {formatAmount(totals.total_ttc)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted">TVA non applicable, art. 293 B du CGI</p>
                      </div>
                    )}
                  </Card>

                  {/* Dates & Conditions */}
                  <Card className="p-5 space-y-4 bg-surface border-border">
                    <h3 className="text-sm font-bold text-text">Échéance & Règlement</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Date d'émission"
                        type="date"
                        value={draft?.issueDate || ""}
                        onChange={(e) => updateDraft({ issueDate: e.target.value })}
                        required
                      />
                      <Input
                        label="Date d'échéance"
                        type="date"
                        value={draft?.dueDate || ""}
                        onChange={(e) => updateDraft({ dueDate: e.target.value })}
                        required
                      />
                    </div>
                    <Select
                      label="Conditions de règlement"
                      value={draft?.paymentTerms || "30d"}
                      onChange={(e) => updateDraft({ paymentTerms: e.target.value })}
                    >
                      <option value="on_receipt">À réception</option>
                      <option value="30d">30 jours</option>
                      <option value="60d">60 jours</option>
                    </Select>
                    <div>
                      <label className="text-xs font-bold text-text mb-1.5 block">Note sur la facture</label>
                      <textarea
                        value={draft?.note || ""}
                        onChange={(e) => updateDraft({ note: e.target.value })}
                        rows={2}
                        placeholder="Coordonnées bancaires, instructions ou remerciements…"
                        className="w-full rounded-xl bg-bg border border-border px-3 py-2 text-xs text-text placeholder:text-muted focus:border-primary resize-none"
                      />
                    </div>
                  </Card>
                </div>

                {/* Right Column: Authentic DocumentPreview (Factur-X A4) */}
                <div className={`space-y-4 ${mobileView === "form" ? "hidden lg:block" : "block"} lg:col-span-6`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted flex items-center gap-1.5 uppercase tracking-wider">
                      <FileText className="w-3.5 h-3.5 text-primary" /> Rendu Factur-X officiel
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewOpen(true)}
                      className="text-xs h-7 text-primary hover:bg-primary/10"
                    >
                      Agrandir en plein écran
                    </Button>
                  </div>

                  {/* Real Document Preview Frame */}
                  <div className="rounded-2xl border border-border shadow-2xl overflow-hidden bg-slate-950 p-2 sm:p-4">
                    <div className="scale-[0.88] sm:scale-100 origin-top">
                      <DocumentPreview
                        company={mockCompany}
                        client={mockClient}
                        documentType="invoice"
                        number="FAC-2026-001"
                        issueDate={draft?.issueDate || todayISO()}
                        dueDate={draft?.dueDate}
                        paymentTerms={(draft?.paymentTerms || "30d") as PaymentTerms}
                        note={draft?.note}
                        lines={lines.map((l) => ({
                          description: l.description || "",
                          quantity: l.quantity || 1,
                          unit_price: l.unitPrice || 0,
                          nature: l.nature || "service",
                        }))}
                        totalHt={totals.total_ht}
                        totalVat={totals.total_vat}
                        totalTtc={totals.total_ttc}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Bottom Bar for Invoice Actions */}
              <div
                className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-[280px] z-20 border-t border-border px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 bg-surface/95 backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted hidden sm:inline">Montant TTC :</span>
                  <span className="text-lg sm:text-xl font-black text-text font-mono">
                    {formatAmount(totals.total_ttc)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye className="w-4 h-4 text-slate-300" />}
                    onClick={() => setPreviewOpen(true)}
                    className="text-xs h-9 text-slate-200 bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-white font-medium"
                  >
                    Plein écran
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openWall("emit_invoice")}
                    disabled={!canEmit}
                    className="text-xs h-9 px-4 font-bold bylz-glow-primary"
                  >
                    Valider & Télécharger PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* 4. MOBILE BOTTOM NAV (Idem vraie application)             */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-sidebar/95 backdrop-blur-xl border-t border-border flex items-center justify-around z-30 h-16 px-1">
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-semibold transition-colors ${
            activeTab === "dashboard" ? "text-primary font-extrabold" : "text-muted hover:text-text"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Tableau bord</span>
        </button>

        <button
          type="button"
          onClick={() => openWall("locked_feature", "Devis")}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-semibold text-muted hover:text-text transition-colors"
        >
          <FileText className="w-5 h-5" />
          <span>Devis</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invoice")}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-semibold transition-colors ${
            activeTab === "invoice" ? "text-primary font-extrabold" : "text-muted hover:text-text"
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span>Factures</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-semibold text-muted hover:text-text transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* ========================================================= */}
      {/* 5. MOBILE DRAWER (Menu complet sur mobile)                */}
      {/* ========================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-bg-sidebar border-l border-border h-full flex flex-col z-10 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Logo variant="gradient" height={26} to="/essai" />
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isDashboard = item.path === "/dashboard";
                const isInvoice = item.path === "/invoices";

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      if (isDashboard) {
                        setActiveTab("dashboard");
                      } else if (isInvoice) {
                        setActiveTab("invoice");
                      } else {
                        openWall("locked_feature", item.label);
                      }
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-text hover:bg-surface-hover"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-primary/10 text-primary">
                        {item.badge}
                      </span>
                    ) : !isDashboard && !isInvoice ? (
                      <Lock className="w-3.5 h-3.5 text-muted/40" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-border space-y-2">
              <Button
                variant="primary"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  openWall("locked_feature", "Créer un compte");
                }}
                className="w-full text-xs h-10 font-bold bylz-glow-primary justify-center rounded-xl"
              >
                Créer un compte gratuit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. FULL SCREEN PREVIEW MODAL                              */}
      {/* ========================================================= */}
      {previewOpen && (
        <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)}>
          <DocumentPreview
            company={mockCompany}
            client={mockClient}
            documentType="invoice"
            number="FAC-2026-001"
            issueDate={draft?.issueDate || todayISO()}
            dueDate={draft?.dueDate}
            paymentTerms={(draft?.paymentTerms || "30d") as PaymentTerms}
            note={draft?.note}
            lines={lines.map((l) => ({
              description: l.description || "",
              quantity: l.quantity || 1,
              unit_price: l.unitPrice || 0,
              nature: l.nature || "service",
            }))}
            totalHt={totals.total_ht}
            totalVat={totals.total_vat}
            totalTtc={totals.total_ttc}
          />
        </PreviewModal>
      )}

      {/* ========================================================= */}
      {/* 7. CONVERSION / SIGNUP WALL MODAL                         */}
      {/* ========================================================= */}
      {wallOpen && (
        <Modal
          open={wallOpen}
          onClose={() => setWallOpen(false)}
          title={
            wallTriggerReason === "emit_invoice"
              ? "Enregistrez votre première facture Factur-X"
              : `Débloquez l'accès à ${lockedFeatureName}`
          }
        >
          <div className="space-y-6 pt-2">
            <p className="text-sm text-muted leading-relaxed">
              {wallTriggerReason === "emit_invoice"
                ? "Créez votre compte en 30 secondes pour télécharger le PDF officiel Factur-X, sauvegarder vos coordonnées de facturation et activer le suivi automatique. Gratuit pour toujours jusqu'à 3 factures/mois, sans carte bancaire."
                : `Pour accéder à ${lockedFeatureName}, connectez-vous ou créez votre compte gratuit. Vos brouillons créés pendant la démo seront automatiquement conservés ! Gratuit pour toujours jusqu'à 3 factures/mois, sans carte bancaire.`}
            </p>

            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 space-y-1 text-xs">
              <p className="font-bold text-primary flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Aucune perte de données
              </p>
              <p className="text-muted">
                Votre facture actuelle de <strong>{formatAmount(totals.total_ttc)}</strong> sera importée directement dans votre nouvel espace.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full justify-center h-11 text-sm font-semibold border-border hover:bg-surface-hover gap-3"
              >
                <GoogleIcon className="w-5 h-5" />
                Continuer avec Google
              </Button>

              <div className="relative flex items-center justify-center my-1 w-full">
                <div className="flex-grow border-t border-border" />
                <span className="flex-shrink mx-3 text-[11px] font-bold text-muted uppercase tracking-wider">
                  ou par email
                </span>
                <div className="flex-grow border-t border-border" />
              </div>

              <Link to="/signup?guest=true" className="block w-full">
                <Button variant="primary" className="w-full justify-center h-11 text-sm font-bold bylz-glow-primary">
                  Créer un compte avec mon email
                </Button>
              </Link>
            </div>

            <p className="text-[11px] text-center text-muted">
              Déjà inscrit ?{" "}
              <Link to="/login?guest=true" className="text-primary font-bold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function GuestEditorPage() {
  return (
    <GuestDraftProvider>
      <GuestEditorPageContent />
    </GuestDraftProvider>
  );
}
