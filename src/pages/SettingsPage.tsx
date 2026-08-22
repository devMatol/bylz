import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Check,
  Zap,
  Lock,
  Loader2,
  Building,
  Upload,
} from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { supabase } from "../lib/supabase";
import { BillingToggle } from "../components/shared/BillingToggle";
import {
  PLAN_LABELS,
  PLAN_PRICES,
  STRIPE_PRICE_SOLO_ANNUAL,
  STRIPE_PRICE_SOLO_MONTHLY,
  STRIPE_PRICE_PRO_ANNUAL,
  STRIPE_PRICE_PRO_MONTHLY,
  type BillingCycle,
} from "../lib/constants";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import type { CompanyStructure } from "../types/database";

function formatSiret(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const groups = [];
  if (digits.length > 0) groups.push(digits.slice(0, 3));
  if (digits.length > 3) groups.push(digits.slice(3, 6));
  if (digits.length > 6) groups.push(digits.slice(6, 9));
  if (digits.length > 9) groups.push(digits.slice(9, 14));
  return groups.join(" ");
}
import { UpgradeModal } from "../components/shared/UpgradeModal";
import { ComplianceSection } from "../components/settings/ComplianceSection";
import { AutoRemindersSection } from "../components/settings/AutoRemindersSection";
import { BankSyncSection } from "../components/settings/BankSyncSection";
import { PushNotificationToggle } from "../components/pwa/PushNotificationToggle";
import { WhatsAppCopilotSection } from "../components/settings/WhatsAppCopilotSection";
import { canUseFeature, type FeatureKey } from "../lib/planLimits";

interface ConnectStatus {
  hasAccount: boolean;
  chargesEnabled: boolean;
  detailsSubmitted?: boolean;
  payoutsEnabled?: boolean;
}

interface FeatureLockWrapperProps {
  children: React.ReactNode;
  feature: FeatureKey;
  title: string;
  description: string;
}

function FeatureLockWrapper({ children, feature, title, description }: FeatureLockWrapperProps) {
  const { profile } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const isLocked = !canUseFeature(profile?.plan, feature);

  if (!isLocked) {
    return <>{children}</>;
  }

  const modalFeature =
    feature === "invoicesPerMonth"
      ? "invoices"
      : feature === "exports"
      ? "factpulse"
      : feature === "quotesPerMonth"
      ? "quotes"
      : "bankSync";

  return (
    <Card className="p-6 relative overflow-hidden bg-surface-elevated/30 border-dashed">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-md font-bold text-text">{title}</h3>
            <p className="text-xs text-muted max-w-xl">{description}</p>
          </div>
        </div>

        <Button onClick={() => setUpgradeModalOpen(true)} className="whitespace-nowrap">
          Débloquer avec Pro
        </Button>
      </div>

      <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} feature={modalFeature} />
    </Card>
  );
}

export function SettingsPage() {
  const { profile, company, refreshProfile, refreshCompany } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [siret, setSiret] = useState("");
  const [legalName, setLegalName] = useState("");
  const [commercialName, setCommercialName] = useState("");
  const [address, setAddress] = useState("");
  const [structure, setStructure] = useState<CompanyStructure>("micro");
  const [activityType, setActivityType] = useState<"freelance_bnc" | "artisan_bic" | "commerce" | "liberal">("freelance_bnc");
  const [urssafFrequency, setUrssafFrequency] = useState<"monthly" | "quarterly">("monthly");
  const [vatRegime, setVatRegime] = useState<"franchise" | "vat">("franchise");
  const [previousCa, setPreviousCa] = useState<string>("0");
  const [savingCompany, setSavingCompany] = useState(false);
  const [searchingSiret, setSearchingSiret] = useState(false);

  const [logoUrl, setLogoUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#7C6FE0");
  const [invoiceFooter, setInvoiceFooter] = useState("");
  const [savingDesign, setSavingDesign] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const activeTab = searchParams.get("tab") || (searchParams.get("focus") === "company" ? "company" : "company");

  const setTab = (t: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", t);
    newParams.delete("focus");
    setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    if (company) {
      setSiret(formatSiret(company.siret || ""));
      setLegalName(company.legal_name || "");
      setCommercialName(company.commercial_name || "");
      setAddress(company.address || "");
      setStructure(company.structure || "micro");
      setActivityType(company.activity_type || "freelance_bnc");
      setUrssafFrequency(company.urssaf_frequency || "monthly");
      setVatRegime(company.vat_regime || "franchise");
      setPreviousCa((company.previous_ca || 0).toString());
      setLogoUrl(company.logo_url || "");
      setAccentColor(company.accent_color || "#7C6FE0");
      setInvoiceFooter(company.invoice_footer || "");
    }
  }, [company]);

  const fetchConnectStatus = useCallback(async () => {
    if (!company?.stripe_connect_account_id) {
      setConnectStatus({ hasAccount: false, chargesEnabled: false });
      return;
    }
    setLoadingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-connect-status");
      if (error) throw error;
      setConnectStatus(data as ConnectStatus);
    } catch (err: any) {
      console.error("Error fetching connect status:", err);
    } finally {
      setLoadingStatus(false);
    }
  }, [company?.stripe_connect_account_id]);

  useEffect(() => {
    fetchConnectStatus();
  }, [fetchConnectStatus]);

  const handleOpenPortal = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session");
      if (error || !data?.url) {
        throw new Error(error?.message || "Impossible d'ouvrir le portail client Stripe.");
      }
      window.location.href = data.url;
    } catch (err: any) {
      toast(err.message || "Erreur lors de l'accès au portail de gestion d'abonnement.", "danger");
      setLoadingPortal(false);
    }
  };

  const handleCheckout = async (priceId: string) => {
    setLoadingCheckout(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: { priceId },
      });
      if (error || !data?.url) {
        throw new Error(error?.message || "Impossible de démarrer la session de paiement.");
      }
      window.location.href = data.url;
    } catch (err: any) {
      toast(err.message || "Erreur lors de la redirection vers la caisse Stripe.", "danger");
      setLoadingCheckout(null);
    }
  };

  const handleConnectOnboarding = async () => {
    setLoadingConnect(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account");
      if (error || !data?.url) {
        throw new Error(error?.message || "Erreur lors de la création du compte Stripe Connect.");
      }
      window.location.href = data.url;
    } catch (err: any) {
      toast(err.message || "Impossible d'ouvrir l'onboarding Stripe.", "danger");
      setLoadingConnect(false);
    }
  };

  const handleResetStripeConnect = async () => {
    if (!company?.id) return;
    if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser la connexion Stripe Connect ?")) return;
    setLoadingConnect(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ stripe_connect_account_id: null })
        .eq("id", company.id);

      if (error) throw error;
      toast("Compte Stripe réinitialisé. Vous pouvez maintenant relancer la configuration.", "success");
      await refreshCompany();
      setConnectStatus({ hasAccount: false, chargesEnabled: false });
    } catch (err: any) {
      toast(err.message || "Erreur lors de la réinitialisation de Stripe Connect", "danger");
    } finally {
      setLoadingConnect(false);
    }
  };

  const handleSaveCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSavingCompany(true);
    try {
      const rawSiret = siret.replace(/\s/g, "");
      const { error } = await supabase
        .from("companies")
        .update({
          siret: rawSiret,
          legal_name: legalName,
          commercial_name: commercialName || null,
          address,
          structure,
          activity_type: activityType,
          urssaf_frequency: urssafFrequency,
          vat_regime: vatRegime,
          previous_ca: parseFloat(previousCa) || 0,
        })
        .eq("id", company.id);

      if (error) throw error;
      toast("Informations d'entreprise mises à jour avec succès !", "success");
      await refreshCompany();
    } catch (err: any) {
      toast(err.message || "Erreur lors de la sauvegarde.", "danger");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleLookupSiret = async () => {
    const rawSiret = siret.replace(/\s/g, "");
    if (rawSiret.length !== 14) {
      toast("Veuillez saisir un SIRET valide de 14 chiffres", "danger");
      return;
    }
    setSearchingSiret(true);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-siret", {
        body: { siret: rawSiret },
      });
      if (error || !data) throw new Error(error?.message || "SIRET introuvable");
      if (data.legal_name) setLegalName(data.legal_name);
      if (data.address) setAddress(data.address);
      toast("Informations de l'entreprise récupérées depuis l'INSEE !", "success");
    } catch (err: any) {
      toast(err.message || "Erreur lors de la recherche SIRET", "danger");
    } finally {
      setSearchingSiret(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!company) return;
    setLogoUploading(true);
    setLogoError(null);
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error("Le fichier ne doit pas dépasser 2 Mo.");
      const ext = file.name.split(".").pop();
      const path = `${company.id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from("company-assets").getPublicUrl(path);
      const newLogoUrl = publicUrlData.publicUrl;
      setLogoUrl(newLogoUrl);
      await supabase.from("companies").update({ logo_url: newLogoUrl }).eq("id", company.id);
      toast("Logo mis à jour avec succès !", "success");
      await refreshCompany();
    } catch (err: any) {
      setLogoError(err.message);
      toast(err.message || "Erreur lors du transfert du logo", "danger");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSaveDesign = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSavingDesign(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          logo_url: logoUrl || null,
          accent_color: accentColor,
          invoice_footer: invoiceFooter || null,
        })
        .eq("id", company.id);

      if (error) throw error;
      toast("Personnalisation visuelle mise à jour avec succès !", "success");
      await refreshCompany();
    } catch (err: any) {
      toast(err.message || "Erreur lors de la sauvegarde du style.", "danger");
    } finally {
      setSavingDesign(false);
    }
  };

  const currentPlan = profile?.plan || "starter";

  return (
    <PageContainer title="Paramètres" subtitle="Gérez votre abonnement, votre entreprise et vos intégrations en toute simplicité">
      <div className="space-y-6 max-w-6xl">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border no-scrollbar">
          {[
            { id: "company", label: "🏢 Entreprise & SIRET" },
            { id: "plans", label: "💳 Mon Plan & Facturation" },
            { id: "connect", label: "⚡ Encaissement Stripe" },
            { id: "bank", label: "🏦 Banque & Synchro" },
            { id: "compliance", label: "🛡️ Conformité & Relances" },
            { id: "ai", label: "🤖 Assistant IA & WhatsApp" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-pill text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? "bg-primary text-white shadow-md bylz-glow-primary scale-[1.02]"
                  : "bg-surface text-muted hover:text-text hover:bg-surface-hover border border-border/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: MON ENTREPRISE */}
        {activeTab === "company" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 border-b border-border pb-3">
              <Building className="w-6 h-6 text-brand-primary" />
              <h2 className="text-xl font-bold text-text">Informations de l'entreprise</h2>
            </div>

            <Card className="p-6">
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        label="Numéro SIRET (14 chiffres)"
                        placeholder="123 456 789 00012"
                        value={siret}
                        onChange={(e) => setSiret(formatSiret(e.target.value))}
                        helperText="Recherchez vos infos officielles via l'API INSEE."
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLookupSiret}
                      disabled={searchingSiret || siret.replace(/\s/g, "").length !== 14}
                      className="h-10 text-xs px-3"
                    >
                      {searchingSiret ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      Rechercher
                    </Button>
                  </div>

                  <Input
                    label="Dénomination sociale (Nom légal)"
                    placeholder="ex: Jean Dupont SAS"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nom commercial (optionnel)"
                    placeholder="ex: Bylz Studio"
                    value={commercialName}
                    onChange={(e) => setCommercialName(e.target.value)}
                  />

                  <Input
                    label="Adresse de l'entreprise"
                    placeholder="12 rue de la Paix, 75002 Paris"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select label="Forme juridique" value={structure} onChange={(e) => setStructure(e.target.value as any)}>
                    <option value="micro">Micro-entreprise (Auto-entrepreneur)</option>
                    <option value="sasu">SASU (SAS Unipersonnelle)</option>
                    <option value="sas">SAS (Société par Actions Simplifiée)</option>
                    <option value="eurl">EURL (SARL Unipersonnelle)</option>
                    <option value="sarl">SARL (Société à Responsabilité Limitée)</option>
                  </Select>

                  <Select label="Nature de l'activité" value={activityType} onChange={(e) => setActivityType(e.target.value as any)}>
                    <option value="freelance_bnc">Profession libérale / Freelance (BNC)</option>
                    <option value="artisan_bic">Artisan / Prestation de services (BIC)</option>
                    <option value="commerce">Achat / Vente de marchandises (BIC)</option>
                    <option value="liberal">Autre profession libérale réglementée</option>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select label="Déclaration URSSAF" value={urssafFrequency} onChange={(e) => setUrssafFrequency(e.target.value as any)}>
                    <option value="monthly">Mensuelle</option>
                    <option value="quarterly">Trimestrielle</option>
                  </Select>

                  <Select label="Régime de TVA" value={vatRegime} onChange={(e) => setVatRegime(e.target.value as any)}>
                    <option value="franchise">Franchise en base (TVA non applicable)</option>
                    <option value="vat">Réel simplifié / normal (TVA applicable)</option>
                  </Select>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" disabled={savingCompany}>
                    {savingCompany ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Sauvegarder les informations
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="p-6 space-y-6">
              <h3 className="text-base font-bold text-text flex items-center gap-2">🎨 Personnalisation visuelle des factures</h3>
              <form onSubmit={handleSaveDesign} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted uppercase">Logo d'entreprise</label>
                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                      <div className="relative group w-16 h-16 rounded-xl border border-border overflow-hidden bg-white">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setLogoUrl("")} className="absolute inset-0 bg-black/50 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">Retirer</button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-surface-hover border border-dashed border-border flex items-center justify-center text-muted">
                        <Building className="w-6 h-6 opacity-40" />
                      </div>
                    )}
                    <div>
                      <input type="file" id="logo-upload" accept="image/png, image/jpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleLogoUpload(f); }} className="hidden" />
                      <label htmlFor="logo-upload" className="inline-flex items-center justify-center h-9 px-4 rounded-xl border border-border bg-surface hover:bg-surface-hover text-xs font-bold text-text cursor-pointer transition-colors">
                        {logoUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-3.5 h-3.5 mr-2" />}
                        Télécharger un logo
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase mb-1">Mentions de bas de facture</label>
                  <textarea rows={3} value={invoiceFooter} onChange={(e) => setInvoiceFooter(e.target.value)} placeholder="IBAN, Pénalités de retard..." className="w-full bg-surface border border-border rounded-xl p-3 text-xs text-text" />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" disabled={savingDesign}>
                    {savingDesign ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Sauvegarder le style
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* TAB 2: MON PLAN & FACTURATION */}
        {activeTab === "plans" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 border-b border-border pb-3">
              <CreditCard className="w-6 h-6 text-brand-primary" />
              <h2 className="text-xl font-bold text-text">Abonnement & Facturation</h2>
            </div>

            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted font-medium">Votre plan actuel :</span>
                    <Badge variant={currentPlan === "starter" ? "default" : "warning"}>
                      {PLAN_LABELS[currentPlan] || currentPlan.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-2xl font-extrabold text-text pt-1">
                    {currentPlan === "starter" ? "Gratuit" : `${PLAN_PRICES[currentPlan as keyof typeof PLAN_PRICES]?.annual || 50} € / an`}
                  </div>
                </div>

                {profile?.stripe_customer_id && (
                  <Button variant="outline" onClick={handleOpenPortal} disabled={loadingPortal} className="flex items-center space-x-2">
                    {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                    <span>Gérer mon abonnement (Portail Stripe)</span>
                  </Button>
                )}
              </div>
            </Card>

            <div className="flex justify-center pt-2">
              <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Solo Plan */}
              <Card className="p-6 flex flex-col justify-between border-primary/30">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-text">Solo</h3>
                  <div className="text-3xl font-extrabold font-mono text-text">
                    {billingCycle === "annual" ? "4,17 €" : "6,90 €"} <span className="text-xs font-normal text-muted">/ mois</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Factures & Devis illimités</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Relances automatiques</li>
                  </ul>
                </div>
                <Button onClick={() => void handleCheckout(billingCycle === "annual" ? STRIPE_PRICE_SOLO_ANNUAL : STRIPE_PRICE_SOLO_MONTHLY)} className="mt-6 w-full">
                  Choisir Solo
                </Button>
              </Card>

              {/* Pro Plan */}
              <Card className="p-6 flex flex-col justify-between border-accent bg-accent/5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-text">Pro</h3>
                    <Badge variant="warning">Recommandé</Badge>
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-text">
                    {billingCycle === "annual" ? "6,67 €" : "12,90 €"} <span className="text-xs font-normal text-muted">/ mois</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Encaissement Stripe Connect</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Copilot IA & WhatsApp</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Synchro bancaire automatique</li>
                  </ul>
                </div>
                <Button onClick={() => void handleCheckout(billingCycle === "annual" ? STRIPE_PRICE_PRO_ANNUAL : STRIPE_PRICE_PRO_MONTHLY)} className="mt-6 w-full bylz-glow-cta">
                  Choisir Pro
                </Button>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 3: STRIPE CONNECT */}
        {activeTab === "connect" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 border-b border-border pb-3">
              <ShieldCheck className="w-6 h-6 text-brand-primary" />
              <h2 className="text-xl font-bold text-text">Encaissements Stripe Connect</h2>
            </div>
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text">Paiement par carte bancaire direct sur factures</h3>
                <p className="text-xs text-muted">Permettez à vos clients de régler leurs factures en 1 clic par carte bancaire. Les fonds arrivent sous 48h sur votre compte bancaire.</p>
                {connectStatus?.chargesEnabled ? (
                  <Badge variant="success">Stripe Connect Actif ✓</Badge>
                ) : (
                  <Button onClick={handleConnectOnboarding} disabled={loadingConnect}>
                    {loadingConnect ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Activer les paiements en ligne
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: BANQUE */}
        {activeTab === "bank" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <FeatureLockWrapper feature="bankSync" title="Rapprochement Bancaire" description="Connectez vos comptes bancaires professionnels et rapprochez vos factures automatiquement.">
              <BankSyncSection />
            </FeatureLockWrapper>
          </div>
        )}

        {/* TAB 5: CONFORMITÉ & RELANCES */}
        {activeTab === "compliance" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <FeatureLockWrapper feature="exports" title="Conformité DGFiP 2026 & E-invoicing" description="Déclarations réglementaires et télétransmission Factur-X.">
              <ComplianceSection />
            </FeatureLockWrapper>

            <AutoRemindersSection />
            <PushNotificationToggle />
          </div>
        )}

        {/* TAB 6: IA & WHATSAPP */}
        {activeTab === "ai" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <WhatsAppCopilotSection />
            <Card className="p-6">
              <h3 className="text-base font-bold text-text mb-2">🤖 Copilot IA in-app</h3>
              <p className="text-xs text-muted mb-4">Posez des questions fiscales ou générez des devis à la voix depuis l'espace Assistant.</p>
              <Link to="/assistant">
                <Button variant="outline" size="sm">Ouvrir l'espace Assistant IA →</Button>
              </Link>
            </Card>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
