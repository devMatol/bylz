import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Eye, Sparkles, Lock, ArrowRight } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { LineEditor } from "../components/documents/LineEditor";
import { DocumentPreview } from "../components/documents/DocumentPreview";
import { PreviewModal } from "../components/documents/PreviewModal";
import { useGuestDraft, GuestDraftProvider } from "../contexts/GuestDraftContext";
import { GoogleIcon } from "../components/auth/GoogleIcon";
import { signInWithGoogle } from "../lib/auth";
import type { Company, Client, ItemNature, PaymentTerms } from "../types/database";
import { computeTotals } from "../lib/api";
import { todayISO, paymentTermsToDate, isValidDate } from "../lib/date";

export function GuestEditorPageContent() {
  const { draft, updateDraft } = useGuestDraft();
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [wallOpen, setWallOpen] = useState(false);

  // Recompute due date when issue date or terms change
  useEffect(() => {
    if (!isValidDate(draft.issueDate)) return;
    updateDraft({
      dueDate: paymentTermsToDate(draft.issueDate, draft.paymentTerms as PaymentTerms),
    });
  }, [draft.issueDate, draft.paymentTerms]);

  const totals = computeTotals(
    draft.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      nature: l.nature,
      position: 0,
    })),
    "franchise"
  );

  const linesValid =
    draft.lines.length > 0 &&
    draft.lines.every((l) => l.description && l.quantity > 0 && l.unitPrice >= 0);
  const datesValid = isValidDate(draft.issueDate) && isValidDate(draft.dueDate);
  const canEmit = !!draft.clientName.trim() && linesValid && datesValid;

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
    created_at: new Date().toISOString(),
  };

  const mockClient: Client = {
    id: "guest-client",
    company_id: "guest-company",
    name: draft.clientName || "Nom du client",
    type: draft.clientType,
    siren: null,
    siret: null,
    vat_number: null,
    email: draft.clientEmail || null,
    address: "Adresse du client (configurée après inscription)",
    archived_at: null,
    created_at: new Date().toISOString(),
  };

  const handleGoogleLogin = async () => {
    const redirectTo = `${window.location.origin}/onboarding?guest=true`;
    await signInWithGoogle(redirectTo);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Slim Header */}
      <header className="sticky top-0 z-30 w-full bg-bg/85 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4 md:px-10">
        <span className="text-2xl font-extrabold text-text tracking-tight">Bylz</span>
        <Link
          to="/login?guest=true"
          className="text-sm font-bold text-muted hover:text-text transition-colors"
        >
          Se connecter
        </Link>
      </header>

      {/* Editor Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Créez votre première facture</h1>
          <p className="text-sm text-muted">Aucune inscription requise pour l'instant</p>
        </div>

        {/* Client Info */}
        <section className="border border-border rounded-card p-5 flex flex-col gap-4 bg-surface card-shadow">
          <h3 className="text-sm font-bold text-text">Client</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom du client"
              placeholder="ex: Client SAS"
              value={draft.clientName}
              onChange={(e) => updateDraft({ clientName: e.target.value })}
              required
            />
            <Input
              label="Email du client (optionnel)"
              placeholder="client@exemple.fr"
              type="email"
              value={draft.clientEmail}
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
                  draft.clientType === "b2b"
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
                  draft.clientType === "b2c"
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
            lines={draft.lines.map((l, i) => ({
              description: l.description,
              quantity: l.quantity,
              unit_price: l.unitPrice,
              nature: l.nature,
              position: i,
            }))}
            onChange={(lines) =>
              updateDraft({
                lines: lines.map((l) => ({
                  description: l.description,
                  quantity: l.quantity,
                  unitPrice: l.unit_price,
                  nature: l.nature,
                })),
              })
            }
            catalog={[]}
          />
          {draft.lines.length > 0 && (
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
              <p className="text-xs text-muted mt-1">TVA non applicable — Art. 293 B du CGI</p>
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
              value={draft.issueDate}
              onChange={(e) => updateDraft({ issueDate: e.target.value })}
              required
            />
            <Input
              label="Échéance"
              type="date"
              value={draft.dueDate}
              onChange={(e) => updateDraft({ dueDate: e.target.value })}
              required
            />
          </div>
          <Select
            label="Conditions de règlement"
            value={draft.paymentTerms}
            onChange={(e) => updateDraft({ paymentTerms: e.target.value })}
          >
            <option value="on_receipt">À réception</option>
            <option value="30d">30 jours</option>
            <option value="60d">60 jours</option>
          </Select>
          <div>
            <label className="text-sm font-semibold text-text mb-1.5 block">Note (optionnel)</label>
            <textarea
              value={draft.note}
              onChange={(e) => updateDraft({ note: e.target.value })}
              rows={3}
              placeholder="Note apparaissant sur la facture…"
              className="w-full rounded bg-bg border border-border px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary resize-none"
            />
          </div>
        </section>

        <div className="h-28" />
      </main>

      {/* Sticky Bottom Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-border px-4 md:px-10 py-4 flex items-center justify-between gap-4"
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
            onClick={() => setWallOpen(true)}
            className={canEmit ? "bylz-glow-primary" : ""}
          >
            Émettre ma facture
          </Button>
        </div>
      </div>

      {/* Document Preview Modal */}
      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <DocumentPreview
          company={mockCompany}
          client={mockClient}
          documentType="invoice"
          number="PROVISOIRE"
          issueDate={draft.issueDate}
          dueDate={draft.dueDate}
          paymentTerms={draft.paymentTerms as PaymentTerms}
          note={draft.note}
          lines={draft.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unit_price: l.unitPrice,
            nature: l.nature,
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
              setWallOpen(true);
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
            <h2 className="text-2xl font-black text-text">Votre facture est prête ! 🎉</h2>
            <p className="text-sm text-muted">
              Créez votre compte gratuit pour l'émettre et la conserver.
            </p>
          </div>

          {/* Compact Mini-Preview */}
          <div className="bg-surface-hover border border-border rounded-card p-4 text-left space-y-3">
            <div className="flex justify-between border-b border-border pb-2 text-xs text-muted">
              <span>Client: {draft.clientName || "Non spécifié"}</span>
              <span>Date: {draft.issueDate}</span>
            </div>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {draft.lines.map((l, i) => (
                <div key={i} className="flex justify-between text-xs text-text">
                  <span className="truncate max-w-[200px]">{l.description || "Sans description"}</span>
                  <span className="tabular-nums">
                    {l.quantity} x {l.unitPrice.toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-sm font-bold text-text">
              <span>Montant Total</span>
              <span className="text-primary tabular-nums">{totals.total_ttc.toFixed(2)} €</span>
            </div>
          </div>

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
              · Gratuit, sans carte bancaire — votre facture est sauvegardée.
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
