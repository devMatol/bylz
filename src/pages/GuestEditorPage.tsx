import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Wallet
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
import { useGuestDraft, GuestDraftProvider } from "../contexts/GuestDraftContext";
import { GoogleIcon } from "../components/auth/GoogleIcon";
import { signInWithGoogle } from "../lib/auth";
import type { Company, Client, ItemNature, PaymentTerms } from "../types/database";
import { computeTotals } from "../lib/api";
import { todayISO, paymentTermsToDate, isValidDate } from "../lib/date";
import { formatAmount } from "../lib/utils";

type GuestTab = "dashboard" | "invoice";

export function GuestEditorPageContent() {
  const { draft, updateDraft } = useGuestDraft();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<GuestTab>("dashboard");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [wallOpen, setWallOpen] = useState(false);
  const [wallTriggerReason, setWallTriggerReason] = useState<"locked_feature" | "emit_invoice">("emit_invoice");

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
    siret: "Saisissez votre SIRET après inscription",
    siren: "",
    legal_name: "Votre entreprise",
    commercial_name: null,
    address: "Votre adresse professionnelle",
    naf_code: null,
    activity_type: "freelance_bnc",
    vat_regime: "franchise",
    urssaf_frequency: "monthly",
    logo_url: null,
    accent_color: "var(--primary)",
    invoice_footer: "",
    default_payment_terms: "30d",
    stripe_connect_account_id: null,
    previous_ca: 0,
    created_at: new Date().toISOString(),
  };

  const mockClient: Client = {
    id: "guest-client",
    company_id: "guest-company",
    name: draft?.clientName || "Nom du client",
    type: draft?.clientType || "b2b",
    siren: null,
    siret: null,
    vat_number: null,
    email: draft?.clientEmail || null,
    address: "Adresse du client (configurée après inscription)",
    archived_at: null,
    created_at: new Date().toISOString(),
  };

  const handleGoogleLogin = async () => {
    const redirectTo = `${window.location.origin}/onboarding?guest=true`;
    await signInWithGoogle(redirectTo);
  };

  const openWall = (reason: "locked_feature" | "emit_invoice") => {
    setWallTriggerReason(reason);
    setWallOpen(true);
  };

  // Mock data for the Demo Dashboard
  const mockMonthlyCa = [
    { month: "2026-01", ca: 1800 },
    { month: "2026-02", ca: 2400 },
    { month: "2026-03", ca: 2900 },
    { month: "2026-04", ca: 3400 },
    { month: "2026-05", ca: 4250 },
  ];

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[280px] bg-bg-sidebar border-r border-border flex-col z-30">
        <div className="flex items-center justify-between px-6 h-16 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-text">Bylz</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
              Essai
            </span>
          </div>
        </div>

        {/* Guest sidebar nav items */}
        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
              activeTab === "dashboard"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted hover:text-text hover:bg-surface-hover"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Tableau de bord</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-primary/10 text-primary font-bold">
              SOLO <Sparkles className="w-2.5 h-2.5" />
            </span>
          </button>

          <button
            onClick={() => openWall("locked_feature")}
            className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-muted hover:text-text hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4" />
              <span>Devis</span>
            </div>
            <Lock className="w-3.5 h-3.5 text-muted/50" />
          </button>

          <button
            onClick={() => setActiveTab("invoice")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
              activeTab === "invoice"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted hover:text-text hover:bg-surface-hover"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Receipt className="w-4 h-4" />
              <span>Factures (Créer)</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-primary" />
          </button>

          <button
            onClick={() => openWall("locked_feature")}
            className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-muted hover:text-text hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              <span>Clients</span>
            </div>
            <Lock className="w-3.5 h-3.5 text-muted/50" />
          </button>

          <button
            onClick={() => openWall("locked_feature")}
            className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-muted hover:text-text hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4" />
              <span>Catalogue</span>
            </div>
            <Lock className="w-3.5 h-3.5 text-muted/50" />
          </button>

          <button
            onClick={() => openWall("locked_feature")}
            className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-muted hover:text-text hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Landmark className="w-4 h-4" />
              <span>URSSAF</span>
            </div>
            <Lock className="w-3.5 h-3.5 text-muted/50" />
          </button>

          <button
            onClick={() => openWall("locked_feature")}
            className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-muted hover:text-text hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4" />
              <span>Paramètres</span>
            </div>
            <Lock className="w-3.5 h-3.5 text-muted/50" />
          </button>
        </nav>

        {/* Sidebar bottom Activation CTA */}
        <div className="p-4 border-t border-border flex flex-col gap-2">
          <Button
            variant="primary"
            onClick={() => openWall("locked_feature")}
            className="w-full text-xs h-9 bylz-glow-primary"
          >
            Créer un compte gratuit
          </Button>
          <Link
            to="/login?guest=true"
            className="text-center text-xs text-muted hover:text-text py-1 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col md:ml-[280px]">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 w-full bg-bg/85 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-text">Bylz</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-pill text-[9px] font-bold bg-primary/10 text-primary">
              ESSAI
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === "dashboard" ? "invoice" : "dashboard")}
              className="text-xs font-semibold px-3 h-8 rounded border border-border bg-surface text-text hover:bg-surface-hover"
            >
              {activeTab === "dashboard" ? "Créer Facture ✏️" : "Dashboard 📊"}
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openWall("locked_feature")}
              className="text-xs h-8"
            >
              S'inscrire
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 flex flex-col gap-6 max-w-5xl w-full mx-auto pb-32">
          {activeTab === "dashboard" ? (
            /* TAB 1: MOCK DASHBOARD VIEW */
            <>
              {/* Demo top banner */}
              <div className="bg-primary/5 border border-primary/20 rounded-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-text flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Mode Démonstration
                  </h4>
                  <p className="text-xs text-muted">
                    Découvrez votre futur espace de pilotage. Créez un compte pour connecter vos données réelles.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openWall("locked_feature")}
                  className="w-full sm:w-auto text-xs bylz-glow-primary"
                >
                  S'inscrire gratuitement
                </Button>
              </div>

              <div>
                <h1 className="text-2xl font-black text-text">Tableau de bord</h1>
                <p className="text-sm text-muted">Vue d'ensemble simulée de votre activité</p>
              </div>

              {/* StatCards grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CA Card */}
                <div className="relative group">
                  <div className="absolute inset-0 rounded-card bg-primary/2 blur-lg transition-all" />
                  <Card className="relative overflow-hidden">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-muted uppercase tracking-wider">CA Encaissé</span>
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-2xl font-black text-text tabular-nums">4 250,00 €</div>
                    <div className="mt-1 text-[10px] text-success font-semibold flex items-center gap-1">
                      ▲ +25% vs mois dernier
                    </div>
                  </Card>
                </div>

                {/* Cotisations URSSAF Card */}
                <div className="relative group">
                  <Card className="relative overflow-hidden">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-muted uppercase tracking-wider">Charges URSSAF</span>
                      <Landmark className="w-4 h-4 text-danger" />
                    </div>
                    <div className="text-2xl font-black text-text tabular-nums">896,00 €</div>
                    <div className="mt-1 text-[10px] text-muted">Taux moyen estimé : 21.1%</div>
                  </Card>
                </div>

                {/* Net Income Card */}
                <div className="relative group">
                  <Card className="relative overflow-hidden">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-muted uppercase tracking-wider">Revenu Net Estimé</span>
                      <Wallet className="w-4 h-4 text-success" />
                    </div>
                    <div className="text-2xl font-black text-text tabular-nums">3 354,00 €</div>
                    <div className="mt-1 text-[10px] text-muted">Après impôts et cotisations</div>
                  </Card>
                </div>
              </div>

              {/* Chart + Sante fiscale grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* SVG CA chart (3/5 width) */}
                <Card className="lg:col-span-3">
                  <h3 className="text-sm font-bold text-text mb-4">Évolution du CA (Exemple)</h3>
                  <div className="w-full">
                    <svg viewBox="0 0 520 240" className="w-full" style={{ height: 200 }}>
                      {/* Grid lines */}
                      {[0, 1000, 2000, 3000, 4000, 5000].map((val, idx) => {
                        const y = 10 + 190 - (val / 5000) * 190;
                        return (
                          <g key={idx}>
                            <line x1="36" y1={y} x2="508" y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                            <text x="30" y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
                              {val} €
                            </text>
                          </g>
                        );
                      })}
                      {/* Bars */}
                      {mockMonthlyCa.map((item, idx) => {
                        const barWidth = 60;
                        const spacing = 30;
                        const x = 50 + idx * (barWidth + spacing);
                        const barHeight = (item.ca / 5000) * 190;
                        const y = 200 - barHeight;
                        return (
                          <g key={idx} className="group/bar">
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={barHeight}
                              fill="var(--primary)"
                              opacity="0.8"
                              rx="4"
                              className="transition-all hover:opacity-100 cursor-pointer"
                            />
                            <text x={x + barWidth / 2} y="220" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                              {item.month === "2026-05" ? "Ce mois" : item.month.slice(5, 7) + "/26"}
                            </text>
                            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--text)" className="opacity-0 group-hover/bar:opacity-100 transition-opacity">
                              {item.ca} €
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </Card>

                {/* Sante Fiscale & TVAT (2/5 width) */}
                <Card className="lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-4">
                      <h3 className="text-sm font-bold text-text">Santé fiscale (TVA)</h3>
                      <Tooltip content="Seuil de franchise de TVA : au-delà, vous devrez facturer la TVA.">
                        <span className="inline-flex text-muted hover:text-text transition-colors cursor-help">
                          <Info className="w-3.5 h-3.5" />
                        </span>
                      </Tooltip>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-text">Seuil de franchise TVA</span>
                          <span className="text-muted">39 100,00 €</span>
                        </div>
                        <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: "10.8%" }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted">
                          <span>CA Actuel: 4 250,00 €</span>
                          <span>Restant: 34 850,00 €</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted leading-relaxed">
                      💡 Vous êtes actuellement en franchise de TVA. Vos factures comportent automatiquement la mention légale d'exonération.
                    </p>
                  </div>
                </Card>
              </div>

              {/* Recent Documents Simulation */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-text">Dernières factures</h3>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("invoice")}>
                    Créer une facture
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted text-xs uppercase">
                        <th className="py-2.5">Numéro</th>
                        <th className="py-2.5">Client</th>
                        <th className="py-2.5 text-right">Montant</th>
                        <th className="py-2.5 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {draft?.clientName ? (
                        <tr className="hover:bg-surface-hover/50 cursor-pointer" onClick={() => setActiveTab("invoice")}>
                          <td className="py-3 font-semibold text-text">DRAFT-GUEST</td>
                          <td className="py-3 text-muted">{draft.clientName}</td>
                          <td className="py-3 text-right font-semibold text-text tabular-nums">
                            {totals.total_ttc.toFixed(2)} €
                          </td>
                          <td className="py-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                              Brouillon invité
                            </span>
                          </td>
                        </tr>
                      ) : null}
                      <tr className="opacity-40">
                        <td className="py-3 font-semibold text-text">FAC-2026-003</td>
                        <td className="py-3 text-muted">Exemple Client SARL</td>
                        <td className="py-3 text-right font-semibold text-text tabular-nums">1 200,00 €</td>
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-success/10 text-success">
                            Payée
                          </span>
                        </td>
                      </tr>
                      <tr className="opacity-40">
                        <td className="py-3 font-semibold text-text">FAC-2026-002</td>
                        <td className="py-3 text-muted">Jean Dupont</td>
                        <td className="py-3 text-right font-semibold text-text tabular-nums">450,00 €</td>
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-warning/10 text-warning">
                            En attente
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : (
            /* TAB 2: INTERACTIVE GUEST INVOICE EDITOR */
            <>
              <div>
                <h1 className="text-2xl font-black text-text">Créez votre première facture</h1>
                <p className="text-sm text-muted">Aucune inscription requise pour l'instant</p>
              </div>

              {/* Client Info */}
              <section className="border border-border rounded-card p-5 flex flex-col gap-4 bg-surface card-shadow">
                <h3 className="text-sm font-bold text-text">Client</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nom du client"
                    placeholder="ex: Client SAS"
                    value={draft?.clientName || ""}
                    onChange={(e) => updateDraft({ clientName: e.target.value })}
                    required
                  />
                  <Input
                    label="Email du client (optionnel)"
                    placeholder="client@exemple.fr"
                    type="email"
                    value={draft?.clientEmail || ""}
                    onChange={(e) => updateDraft({ clientEmail: e.target.value })}
                  />
                </div>
                <div>
                  <span className="text-sm font-semibold text-text mb-1.5 block">Type de client</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateDraft({ clientType: "b2b" })}
                      className={`flex-1 h-9 rounded text-xs font-semibold border transition-all ${
                        draft?.clientType === "b2b"
                          ? "bg-primary border-primary text-white"
                          : "bg-bg border-border text-muted hover:text-text"
                      }`}
                    >
                      Professionnel (B2B)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDraft({ clientType: "b2c" })}
                      className={`flex-1 h-9 rounded text-xs font-semibold border transition-all ${
                        draft?.clientType === "b2c"
                          ? "bg-primary border-primary text-white"
                          : "bg-bg border-border text-muted hover:text-text"
                      }`}
                    >
                      Particulier (B2C)
                    </button>
                  </div>
                </div>
              </section>

              {/* Lines Editor */}
              <section className="border border-border rounded-card p-5 bg-surface card-shadow">
                <h3 className="text-sm font-bold text-text mb-3">Lignes de la facture</h3>
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
                  <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2 text-sm">
                    <div className="flex justify-between text-muted">
                      <span>Total HT</span>
                      <span className="tabular-nums font-medium">{totals.total_ht.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center border-t-2 border-border pt-2 mt-1">
                      <span className="font-bold text-text">Total TTC</span>
                      <span className="text-lg font-extrabold text-primary tabular-nums">
                        {totals.total_ttc.toFixed(2)} €
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">TVA non applicable, art. 293 B du CGI</p>
                  </div>
                )}
              </section>

              {/* Details / Dates */}
              <section className="border border-border rounded-card p-5 bg-surface card-shadow flex flex-col gap-4">
                <h3 className="text-sm font-bold text-text">Dates & Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Date d'émission"
                    type="date"
                    value={draft?.issueDate || ""}
                    onChange={(e) => updateDraft({ issueDate: e.target.value })}
                    required
                  />
                  <Input
                    label="Échéance"
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
                  <label className="text-sm font-semibold text-text mb-1.5 block">Note (optionnel)</label>
                  <textarea
                    value={draft?.note || ""}
                    onChange={(e) => updateDraft({ note: e.target.value })}
                    rows={3}
                    placeholder="Note apparaissant sur la facture…"
                    className="w-full rounded bg-bg border border-border px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary resize-none"
                  />
                </div>
              </section>

              {/* Sticky Bottom Bar for invoice tab */}
              <div
                className="fixed bottom-0 left-0 right-0 md:left-[280px] z-20 border-t border-border px-4 md:px-10 py-4 flex items-center justify-between gap-4"
                style={{ backgroundColor: "var(--bg)", backdropFilter: "blur(8px)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted hidden sm:inline">Total TTC :</span>
                  <span className="text-xl font-black text-text tabular-nums">
                    {totals.total_ttc.toFixed(2)} €
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    leftIcon={<Eye className="w-4 h-4" />}
                    onClick={() => setPreviewOpen(true)}
                  >
                    Aperçu
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!canEmit}
                    onClick={() => openWall("emit_invoice")}
                    className={canEmit ? "bylz-glow-primary" : ""}
                  >
                    Émettre ma facture
                  </Button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Document Preview Modal */}
      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <DocumentPreview
          company={mockCompany}
          client={mockClient}
          documentType="invoice"
          number="PROVISOIRE"
          issueDate={draft?.issueDate || ""}
          dueDate={draft?.dueDate || ""}
          paymentTerms={(draft?.paymentTerms || "30d") as PaymentTerms}
          note={draft?.note || ""}
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
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(false)}>
            Retour
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setPreviewOpen(false);
              openWall("emit_invoice");
            }}
          >
            Émettre ma facture
          </Button>
        </div>
      </PreviewModal>

      {/* The Wall Modal */}
      <Modal open={wallOpen} onClose={() => setWallOpen(false)}>
        <div className="p-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary animate-bounce">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-text">
              {wallTriggerReason === "locked_feature" ? "Créer un compte pour débloquer 🔒" : "Votre facture est prête ! 🎉"}
            </h2>
            <p className="text-sm text-muted">
              {wallTriggerReason === "locked_feature"
                ? "Créez votre compte gratuit en 10 secondes pour débloquer toutes les fonctionnalités."
                : "Créez votre compte gratuit pour l'émettre et la conserver."}
            </p>
          </div>

          {/* Compact Mini-Preview of Invoice if relevant */}
          {lines.length > 0 && (
            <div className="bg-surface-hover border border-border rounded-card p-4 text-left space-y-3">
              <div className="flex justify-between border-b border-border pb-2 text-xs text-muted">
                <span>Client: {draft?.clientName || "Non spécifié"}</span>
                <span>Date: {draft?.issueDate || ""}</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {lines.map((l, i) => (
                  <div key={i} className="flex justify-between text-xs text-text">
                    <span className="truncate max-w-[200px]">{l.description || "Sans description"}</span>
                    <span className="tabular-nums">
                      {l.quantity} x {(l.unitPrice || 0).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-bold text-text">
                <span>Montant Total</span>
                <span className="text-primary tabular-nums">{totals.total_ttc.toFixed(2)} €</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => navigate("/signup?guest=true")}
              className="w-full h-11 bylz-glow-primary"
            >
              Créer mon compte gratuit
            </Button>

            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-11"
              leftIcon={<GoogleIcon />}
            >
              Continuer avec Google
            </Button>

            <div className="pt-2 text-xs text-muted">
              <Link to="/login?guest=true" className="hover:underline font-bold text-primary mr-1">
                J'ai déjà un compte
              </Link>
              · Gratuit, sans carte bancaire.
            </div>
          </div>
        </div>
      </Modal>
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
