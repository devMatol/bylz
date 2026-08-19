import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
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
      : feature === "maxClients"
      ? "clients"
      : feature;

  return (
    <div className="relative group overflow-hidden rounded-card border border-border bg-surface/50">
      <div className="blur-[3px] pointer-events-none select-none opacity-40">
        {children}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-bg/40 backdrop-blur-[1px]">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 border border-primary/20 shadow-sm">
          <Zap className="w-6 h-6 animate-pulse" />
        </div>
        <h4 className="text-base font-black text-text tracking-tight">{title}</h4>
        <p className="text-xs text-muted max-w-sm mt-1 mb-4 leading-relaxed">
          {description}
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setUpgradeModalOpen(true)}
          className="bylz-glow-cta text-xs font-bold font-mono"
        >
          Débloquer cette fonctionnalité
        </Button>

        <UpgradeModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          feature={modalFeature}
        />
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { user, profile, company, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");

  const currentPlan = profile?.plan || "starter";

  // Company details form states
  const [legalName, setLegalName] = useState(company?.legal_name || "");
  const [commercialName, setCommercialName] = useState(company?.commercial_name || "");
  const [siret, setSiret] = useState(company?.siret ? formatSiret(company.siret) : "");
  const [address, setAddress] = useState(company?.address || "");
  const [activityType, setActivityType] = useState(company?.activity_type || "freelance_bnc");
  const [urssafFrequency, setUrssafFrequency] = useState(company?.urssaf_frequency || "monthly");
  const [previousCa, setPreviousCa] = useState(company?.previous_ca?.toString() || "0");
  const [vatRegime, setVatRegime] = useState<"franchise" | "vat">(company?.vat_regime || "franchise");
  const [structure, setStructure] = useState<CompanyStructure>(company?.structure || "micro");
  const [logoUrl, setLogoUrl] = useState(company?.logo_url || "");
  const [accentColor, setAccentColor] = useState(company?.accent_color || "#7C6FE0");
  const [invoiceFooter, setInvoiceFooter] = useState(company?.invoice_footer || "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const [searchingSiret, setSearchingSiret] = useState(false);

  useEffect(() => {
    if (company) {
      setLegalName(company.legal_name || "");
      setCommercialName(company.commercial_name || "");
      setSiret(company.siret ? formatSiret(company.siret) : "");
      setAddress(company.address || "");
      setActivityType(company.activity_type || "freelance_bnc");
      setUrssafFrequency(company.urssaf_frequency || "monthly");
      setPreviousCa(company.previous_ca?.toString() || "0");
      setVatRegime(company.vat_regime || "franchise");
      setStructure(company.structure || "micro");
      setLogoUrl(company.logo_url || "");
      setAccentColor(company.accent_color || "#7C6FE0");
      setInvoiceFooter(company.invoice_footer || "");
    }
  }, [company]);

  const handleLookupSiret = async () => {
    const cleanSiret = siret.replace(/\s/g, "");
    if (cleanSiret.length !== 14) {
      toast("Veuillez saisir un SIRET valide à 14 chiffres", "warning");
      return;
    }
    setSearchingSiret(true);
    try {
      let json: any = null;

      try {
        const { data: edgeJson, error } = await supabase.functions.invoke("siret-lookup", {
          body: { siret: cleanSiret },
        });
        if (!error && edgeJson && edgeJson.legal_name) {
          json = edgeJson;
        }
      } catch {
        // Fallback
      }

      if (!json) {
        const govRes = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${cleanSiret}&page=1&per_page=1`);
        if (govRes.ok) {
          const govData = await govRes.json();
          const firstResult = govData?.results?.[0];
          if (firstResult) {
            const etab = firstResult.matching_etablissements?.[0] || firstResult.siege || {};
            const legalName = firstResult.nom_complet || firstResult.nom_raison_sociale || "Entreprise";
            const address = etab.adresse || etab.adresse_complete || `${etab.code_postal || ""} ${etab.libelle_commune || ""}`.trim();
            json = { legal_name: legalName, address };
          }
        }
      }

      if (!json) throw new Error("SIRET introuvable dans le registre officiel des entreprises.");
      setLegalName(json.legal_name || "");
      setAddress(json.address || "");
      toast("Informations de l'entreprise récupérées avec succès !", "success");
    } catch (err: any) {
      toast(err.message || "Impossible de récupérer les informations du SIRET", "danger");
    } finally {
      setSearchingSiret(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSavingCompany(true);
    try {
      const cleanSiret = siret.replace(/\s/g, "");
      const siren = cleanSiret.slice(0, 9);
      const { error } = await supabase
        .from("companies")
        .update({
          legal_name: legalName,
          commercial_name: commercialName || null,
          siret: cleanSiret,
          siren,
          address,
          activity_type: activityType,
          urssaf_frequency: urssafFrequency,
          previous_ca: parseFloat(previousCa) || 0,
          vat_regime: vatRegime,
          structure: structure,
        })
        .eq("id", company.id);

      if (error) throw error;
      await refreshProfile();
      toast("Profil d'entreprise mis à jour avec succès !", "success");
    } catch (err: any) {
      toast(err.message || "Erreur lors de la sauvegarde", "danger");
    } finally {
      setSavingCompany(false);
    }
  };

  const [savingDesign, setSavingDesign] = useState(false);

  const handleLogoUpload = async (file: File) => {
    if (!file.type.match(/^image\/(png|jpe?g)$/)) {
      setLogoError("Format non supporté (PNG/JPG uniquement)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Fichier trop lourd (max 2 Mo)");
      return;
    }
    if (!user || !company) return;
    setLogoUploading(true);
    setLogoError(null);
    try {
      const ext = file.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("logos")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      
      setLogoUrl(urlData.publicUrl);
      const { error: dbErr } = await supabase
        .from("companies")
        .update({ logo_url: urlData.publicUrl })
        .eq("id", company.id);
      if (dbErr) throw dbErr;
      await refreshProfile();
      toast("Logo mis à jour !", "success");
    } catch {
      setLogoError("Échec de l'envoi du logo");
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
          accent_color: accentColor,
          invoice_footer: invoiceFooter || null,
        })
        .eq("id", company.id);

      if (error) throw error;
      await refreshProfile();
      toast("Style des documents sauvegardé !", "success");
    } catch (err: any) {
      toast(err.message || "Erreur lors de la sauvegarde du style", "danger");
    } finally {
      setSavingDesign(false);
    }
  };

  // Check ?checkout=success URL parameter
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast("Abonnement activé ! Félicitations !", "success");
      refreshProfile();
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast, refreshProfile]);

  // Scroll to company settings if focus=company
  useEffect(() => {
    if (searchParams.get("focus") === "company") {
      const el = document.getElementById("company-settings");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        el.classList.add("ring-2", "ring-primary", "ring-offset-2");
        const timer = setTimeout(() => {
          el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams]);

  // Fetch Connect status if account exists
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

  // Handle Customer Portal redirect
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

  // Handle Subscription Checkout
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
      toast(err.message || "Erreur lors de la redirection vers Stripe.", "danger");
      setLoadingCheckout(null);
    }
  };

  // Handle Stripe Connect onboarding / setup
  const handleConnectOnboarding = async () => {
    setLoadingConnect(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account");
      if (error || !data?.url) {
        const errorMsg = data?.error || error?.message || "Impossible de démarrer l'onboarding Stripe Connect.";
        throw new Error(errorMsg);
      }
      window.location.href = data.url;
    } catch (err: any) {
      toast(err.message || "Erreur lors du lancement de Stripe Connect.", "danger");
      setLoadingConnect(false);
    }
  };

  // Reset Stripe Connect account to start fresh onboarding link
  const handleResetStripeConnect = async () => {
    setLoadingConnect(true);
    try {
      if (company?.id) {
        await supabase
          .from("companies")
          .update({ stripe_connect_account_id: null })
          .eq("id", company.id);
      }
      await refreshProfile();
      toast("Configuration Stripe réinitialisée avec succès.", "info");
      await handleConnectOnboarding();
    } catch (err: any) {
      toast(err.message || "Erreur lors de la réinitialisation", "danger");
      setLoadingConnect(false);
    }
  };

  // Calculate remaining trial days if active
  const getTrialDaysRemaining = () => {
    if (!profile?.trial_ends_at) return null;
    const trialEnd = new Date(profile.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    if (diffTime <= 0) return null;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const trialDaysLeft = getTrialDaysRemaining();

  return (
    <PageContainer title="Paramètres" subtitle="Gérez votre abonnement et la configuration de votre entreprise">
      <div className="space-y-8 max-w-6xl">
        
        {/* SECTION 1: ABONNEMENT */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <CreditCard className="w-6 h-6 text-brand-primary" />
            <h2 className="text-xl font-bold text-text">Abonnement & Facturation</h2>
          </div>

          {/* Banner Trial */}
          {trialDaysLeft !== null && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                trialDaysLeft < 4
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="font-semibold text-sm">Essai Pro : {trialDaysLeft} jour(s) restant(s)</p>
                  <p className="text-xs opacity-90">
                    Profitez de toutes les fonctionnalités Pro sans restriction durant votre période d'essai.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Plan Overview Card */}
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
                  {currentPlan === "starter"
                    ? "Gratuit"
                    : `${PLAN_PRICES[currentPlan as keyof typeof PLAN_PRICES]?.annual || 50} € / an (${
                        PLAN_PRICES[currentPlan as keyof typeof PLAN_PRICES]?.annualMonthlyEquiv || "4,17 €"
                      }/mois)`}
                </div>
                {profile?.trial_ends_at && (
                  <p className="text-xs text-muted">
                    Renouvellement / Fin de période : {new Date(profile.trial_ends_at).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>

              {profile?.stripe_customer_id && (
                <Button
                  variant="outline"
                  onClick={handleOpenPortal}
                  disabled={loadingPortal}
                  className="flex items-center space-x-2"
                >
                  {loadingPortal ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Gérer mon abonnement
                </Button>
              )}
            </div>
          </Card>

          {/* Billing Cycle Switch */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-4 pt-2 gap-4">
            <div>
              <h3 className="text-base font-bold text-text">Choisir un plan et un cycle de facturation</h3>
              <p className="text-xs text-muted">Bénéficiez de jusqu'à 53% de réduction en choisissant la facturation annuelle</p>
            </div>
            <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />
          </div>

          {/* 3 Columns Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* Starter Plan */}
            <Card
              className={`p-6 flex flex-col justify-between border-2 ${
                currentPlan === "starter" ? "border-brand-primary" : "border-border"
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-text">Starter</h3>
                    <p className="text-xs text-muted">Pour démarrer sereinement</p>
                  </div>
                  {currentPlan === "starter" && <Badge variant="success">Actif</Badge>}
                </div>

                <div className="text-3xl font-extrabold text-text">0 € <span className="text-xs font-normal text-muted">/ mois</span></div>

                <ul className="space-y-2 text-xs text-text pt-2">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>10 factures</strong> par mois</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>3 clients</strong> max</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Conformité mentions légales</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Button variant="outline" disabled className="w-full">
                  {currentPlan === "starter" ? "Votre plan" : "Plan inférieur"}
                </Button>
              </div>
            </Card>

            {/* Solo Plan */}
            <Card
              className={`p-6 flex flex-col justify-between border-2 relative overflow-hidden ${
                currentPlan === "solo" ? "border-brand-primary" : "border-amber-500/50 shadow-lg"
              }`}
            >
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
                Recommandé
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-text flex items-center space-x-1">
                      <span>Solo</span>
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </h3>
                    <p className="text-xs text-muted">Pour les freelances réguliers</p>
                  </div>
                  {currentPlan === "solo" && <Badge variant="success">Actif</Badge>}
                </div>

                <div>
                  <div className="text-3xl font-extrabold text-text font-mono">
                    {billingCycle === "annual" ? "4,17 €" : "8,90 €"}{" "}
                    <span className="text-xs font-normal text-muted font-sans">/ mois TTC</span>
                  </div>
                  {billingCycle === "annual" ? (
                    <p className="text-[11px] font-bold text-emerald-500 mt-1">
                      soit 50 € / an TTC (proratisé au mois)
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-muted mt-1">
                      facturé 8,90 € par mois
                    </p>
                  )}
                </div>

                <ul className="space-y-2 text-xs text-text pt-2">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>Factures & Devis illimités</strong></span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>Clients illimités</strong></span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Tableau de bord fiscal URSSAF</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Relances automatiques</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Exports comptables bilan</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                {currentPlan === "solo" ? (
                  <Button variant="outline" disabled className="w-full">Votre plan</Button>
                ) : (
                  <Button
                    onClick={() => {
                      const pId = billingCycle === "annual" ? STRIPE_PRICE_SOLO_ANNUAL : STRIPE_PRICE_SOLO_MONTHLY;
                      void handleCheckout(pId);
                    }}
                    disabled={!!loadingCheckout}
                    className="w-full"
                  >
                    {loadingCheckout ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `Passer au plan Solo (${billingCycle === "annual" ? "50€/an" : "8,90€/mois"})`
                    )}
                  </Button>
                )}
              </div>
            </Card>

            {/* Pro Plan */}
            <Card
              className={`p-6 flex flex-col justify-between border-2 ${
                currentPlan === "pro" ? "border-brand-primary" : "border-border"
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-text">Pro</h3>
                    <p className="text-xs text-muted">L'expérience complète sans limite</p>
                  </div>
                  {currentPlan === "pro" && <Badge variant="success">Actif</Badge>}
                </div>

                <div>
                  <div className="text-3xl font-extrabold text-text font-mono">
                    {billingCycle === "annual" ? "6,67 €" : "12,90 €"}{" "}
                    <span className="text-xs font-normal text-muted font-sans">/ mois TTC</span>
                  </div>
                  {billingCycle === "annual" ? (
                    <p className="text-[11px] font-bold text-emerald-500 mt-1">
                      soit 80 € / an TTC (proratisé au mois)
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-muted mt-1">
                      facturé 12,90 € par mois
                    </p>
                  )}
                </div>

                <ul className="space-y-2 text-xs text-text pt-2">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>Tout le plan Solo</strong></span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>Paiement en ligne par carte (Stripe)</strong></span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Multi-activités & sous-comptes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Export FEC réglementaire</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                {currentPlan === "pro" ? (
                  <Button variant="outline" disabled className="w-full">Votre plan</Button>
                ) : (
                  <Button
                    onClick={() => {
                      const pId = billingCycle === "annual" ? STRIPE_PRICE_PRO_ANNUAL : STRIPE_PRICE_PRO_MONTHLY;
                      void handleCheckout(pId);
                    }}
                    disabled={!!loadingCheckout}
                    className="w-full"
                  >
                    {loadingCheckout ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `Passer au plan Pro (${billingCycle === "annual" ? "80€/an" : "12,90€/mois"})`
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* SECTION 2: STRIPE CONNECT (PAIEMENT EN LIGNE) */}
        <div className="space-y-6 pt-4 border-t border-border">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <ShieldCheck className="w-6 h-6 text-brand-primary" />
            <h2 className="text-xl font-bold text-text">Paiement en ligne (Stripe Connect)</h2>
          </div>

          {currentPlan === "pro" ? (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-text flex items-center space-x-2">
                      <Building className="w-5 h-5 text-brand-primary" />
                      <span>Encaissements par Carte Bancaire</span>
                    </h3>
                    <p className="text-sm text-muted">
                      Proposez un lien de paiement sécurisé à vos clients. L'argent est directement transféré sur votre compte bancaire sous 2 jours ouvrés.
                    </p>
                  </div>
                </div>

                {loadingStatus ? (
                  <div className="flex items-center space-x-2 text-sm text-muted py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Vérification du statut du compte Stripe...</span>
                  </div>
                ) : connectStatus?.chargesEnabled ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          Compte Stripe Connect Actif ✓
                        </p>
                        <p className="text-xs text-muted">
                          Vos factures émises contiendront automatiquement un lien de paiement sécurisé.
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Actif</Badge>
                  </div>
                ) : company?.stripe_connect_account_id ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                          Configuration à terminer
                        </p>
                        <p className="text-xs text-muted">
                          Stripe nécessite des informations complémentaires pour valider vos virements.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={handleConnectOnboarding}
                        disabled={loadingConnect}
                        className="whitespace-nowrap"
                      >
                        {loadingConnect ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Reprendre la configuration
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleResetStripeConnect}
                        disabled={loadingConnect}
                        className="whitespace-nowrap text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        Recommencer la configuration
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-surface-elevated/50 border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <p className="text-xs text-muted leading-relaxed">
                      L'activation est rapide et sécurisée. Vous serez redirigé vers l'onboarding sécurisé de Stripe Express.
                    </p>
                    <Button
                      onClick={handleConnectOnboarding}
                      disabled={loadingConnect}
                      className="whitespace-nowrap"
                    >
                      {loadingConnect ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Activer les paiements
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            /* Tease Card for Non-Pro Users */
            <Card className="p-6 relative overflow-hidden bg-surface-elevated/30 border-dashed">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-text">Paiement en ligne par carte</h3>
                    <p className="text-xs text-muted max-w-xl">
                      Encaissez vos factures plus rapidement en intégrant un bouton de paiement sécurisé sur vos factures. Fonctionnalité exclusive au plan **PRO**.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setUpgradeModalOpen(true)}
                  className="whitespace-nowrap"
                >
                  Débloquer avec Pro
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* SECTION 3: MON ENTREPRISE */}
        <div id="company-settings" className="space-y-6 pt-4 border-t border-border transition-all duration-500 rounded-xl p-0.5">
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
                      helperText="En cas de déménagement (nouveau NIC) ou correction, cliquez sur Rechercher pour mettre à jour automatiquement les données INSEE."
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
                    {searchingSiret ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : null}
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
                <Select
                  label="Forme juridique"
                  value={structure}
                  onChange={(e) => setStructure(e.target.value as any)}
                >
                  <option value="micro">Micro-entreprise (Auto-entrepreneur)</option>
                  <option value="sasu">SASU (SAS Unipersonnelle)</option>
                  <option value="sas">SAS (Société par Actions Simplifiée)</option>
                  <option value="eurl">EURL (SARL Unipersonnelle)</option>
                  <option value="sarl">SARL (Société à Responsabilité Limitée)</option>
                </Select>

                <Select
                  label="Nature de l'activité"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as any)}
                >
                  <option value="freelance_bnc">Profession libérale / Freelance (BNC)</option>
                  <option value="artisan_bic">Artisan / Prestation de services (BIC)</option>
                  <option value="commerce">Achat / Vente de marchandises (BIC)</option>
                  <option value="liberal">Autre profession libérale réglementée</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Déclaration URSSAF"
                  value={urssafFrequency}
                  onChange={(e) => setUrssafFrequency(e.target.value as any)}
                >
                  <option value="monthly">Mensuelle</option>
                  <option value="quarterly">Trimestrielle</option>
                </Select>

                <Select
                  label="Régime de TVA"
                  value={vatRegime}
                  onChange={(e) => setVatRegime(e.target.value as any)}
                  helperText="Permet de voir l'impact de l'assujettissement à la TVA sur vos factures, seuils de TVA et votre tableau de bord."
                >
                  <option value="franchise">Franchise en base (TVA non applicable)</option>
                  <option value="vat">Réel simplifié / normal (TVA applicable)</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Chiffre d'affaires antérieur (de l'année en cours)"
                  placeholder="ex: 12500"
                  type="number"
                  step="0.01"
                  value={previousCa}
                  onChange={(e) => setPreviousCa(e.target.value)}
                  helperText="Indiquez le CA déjà encaissé cette année avant d'utiliser Bylz pour le calcul correct des seuils de TVA et plafonds micro-entreprise."
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" disabled={savingCompany}>
                  {savingCompany ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Sauvegarder les modifications
                </Button>
              </div>
            </form>
          </Card>

          {/* Document Design/Style Card */}
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                🎨 Personnalisation des factures & devis
              </h3>
              <p className="text-xs text-muted mt-1">
                Configurez l'identité visuelle et les mentions par défaut de vos documents légaux.
              </p>
            </div>

            <form onSubmit={handleSaveDesign} className="space-y-6">
              {/* Logo upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted uppercase">Logo de l'entreprise</label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="relative group w-16 h-16 rounded-xl border border-border overflow-hidden bg-white">
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="absolute inset-0 bg-black/50 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center animate-fade-in"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-surface-hover border border-dashed border-border flex flex-col items-center justify-center text-muted">
                      <Building className="w-6 h-6 opacity-40" />
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      type="file"
                      id="logo-settings-upload"
                      accept="image/png, image/jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleLogoUpload(file);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo-settings-upload"
                      className="inline-flex items-center justify-center h-9 px-4 rounded-xl border border-border bg-surface hover:bg-surface-hover text-xs font-bold text-text cursor-pointer transition-colors"
                    >
                      {logoUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 mr-2" />
                      )}
                      Télécharger un logo
                    </label>
                    <p className="text-[10px] text-muted mt-1.5">PNG ou JPG (max 2 Mo).</p>
                    {logoError && <p className="text-xs text-danger mt-1">{logoError}</p>}
                  </div>
                </div>
              </div>

              {/* Accent Color picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted uppercase">Couleur d'accentuation</label>
                <div className="flex flex-wrap gap-2">
                  {["#7C6FE0", "#6CB8F5", "#10B981", "#F59E0B", "#F43F5E", "#64748B"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccentColor(c)}
                      className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center transition-transform hover:scale-105"
                      style={{ backgroundColor: c }}
                    >
                      {accentColor === c && <Check className="w-4 h-4 text-white stroke-[3px]" />}
                    </button>
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-full border border-border cursor-pointer p-0 overflow-hidden"
                    />
                    <span className="text-xs font-mono text-muted uppercase">{accentColor}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Footer */}
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1">
                  Pied de page personnalisé & Mentions légales
                </label>
                <textarea
                  rows={3}
                  value={invoiceFooter}
                  onChange={(e) => setInvoiceFooter(e.target.value)}
                  placeholder="Ex: IBAN, Pénalités de retard, Assurances professionnelles..."
                  className="w-full bg-surface border border-border rounded-xl p-3 text-xs text-text focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-[10px] text-muted mt-1">
                  Ce texte s'affichera tout en bas de vos devis et factures.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" disabled={savingDesign}>
                  {savingDesign && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Sauvegarder le style
                </Button>
              </div>
            </form>
          </Card>

          {/* WhatsApp AI Copilot Remote Management Section */}
          {user?.email?.toLowerCase() === "matthiasollivier123@gmail.com" && (
            <FeatureLockWrapper
              feature="paymentLinks"
              title="Pilote IA WhatsApp"
              description="Pilotez votre entreprise à la voix ou par texte via WhatsApp : calcul de CA, relance client, et saisie de dépenses par photo."
            >
              <WhatsAppCopilotSection />
            </FeatureLockWrapper>
          )}

          {/* Push Notification Card */}
          <PushNotificationToggle />

          {/* Compliance & E-invoicing Section */}
          <FeatureLockWrapper
            feature="exports"
            title="Conformité E-invoicing & FactPulse"
            description="Transmettez vos e-reportings réglementaires B2C et connectez la plateforme PDP FactPulse."
          >
            <ComplianceSection />
          </FeatureLockWrapper>

          {/* Automatic Payment Reminders Section */}
          <FeatureLockWrapper
            feature="reminders"
            title="Relances de Paiement Automatiques"
            description="Automatisez vos relances de factures en retard et configurez votre échéancier personnalisé."
          >
            <AutoRemindersSection />
          </FeatureLockWrapper>

          {/* Bank Synchronization & Matching Section */}
          <FeatureLockWrapper
            feature="paymentLinks"
            title="Synchronisation Bancaire & Rapprochement"
            description="Connectez vos comptes bancaires de manière sécurisée et rapprochez automatiquement vos factures avec vos virements."
          >
            <BankSyncSection />
          </FeatureLockWrapper>
        </div>

      </div>

      {/* Shared Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature="paymentLinks"
      />
    </PageContainer>
  );
}
