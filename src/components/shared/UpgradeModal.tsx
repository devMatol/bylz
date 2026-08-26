import { useState } from "react";
import { Sparkles, Check, Loader2, ShieldCheck, Zap } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import {
  STRIPE_PRICE_SOLO_ANNUAL,
  STRIPE_PRICE_SOLO_MONTHLY,
  STRIPE_PRICE_PRO_ANNUAL,
  STRIPE_PRICE_PRO_MONTHLY,
  type BillingCycle,
} from "../../lib/constants";
import { supabase } from "../../lib/supabase";
import { useToast } from "../ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { BillingToggle } from "./BillingToggle";

export interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: "invoices" | "clients" | "fiscalDashboard" | "reminders" | "exports" | "paymentLinks" | "multiCompany";
  title?: string;
  benefit?: string;
  targetPlan?: "solo" | "pro";
}

const FEATURE_CONFIG: Record<
  string,
  { title: string; benefit: string; targetPlan: "solo" | "pro"; hookTemplate: (name: string) => string }
> = {
  invoices: {
    title: "Facturation & Devis illimités",
    benefit: "Émettez autant de devis et factures conformes Factur-X que nécessaire pour développer votre activité.",
    targetPlan: "solo",
    hookTemplate: (name) => `Développez ${name} sans limite de facturation`,
  },
  clients: {
    title: "Répertoire clients illimité",
    benefit: "Gérez l'ensemble de vos clients avec recherche SIRET automatique et suivi des impayés.",
    targetPlan: "solo",
    hookTemplate: (name) => `Gérez tous les clients de ${name} sans restriction`,
  },
  fiscalDashboard: {
    title: "Pilotage fiscal & URSSAF en temps réel",
    benefit: "Suivez votre Chiffre d'Affaires, vos plafonds de TVA et anticipez exactement vos cotisations URSSAF.",
    targetPlan: "solo",
    hookTemplate: (name) => `Pilotez la rentabilité et l'URSSAF de ${name}`,
  },
  reminders: {
    title: "Relances automatiques par e-mail",
    benefit: "Ne courez plus après vos paiements : Bylz relance automatiquement vos clients en retard avec diplomatie.",
    targetPlan: "solo",
    hookTemplate: (name) => `Sécurisez la trésorerie de ${name}`,
  },
  exports: {
    title: "Exports comptables certifiés",
    benefit: "Exportez vos bilans et registres d'achats/ventes en un clic pour votre comptable ou votre déclaration.",
    targetPlan: "solo",
    hookTemplate: (name) => `Simplifiez la comptabilité de ${name}`,
  },
  paymentLinks: {
    title: "Paiement en ligne par carte bancaire",
    benefit: "Permettez à vos clients de régler leurs factures en ligne en 1 clic directement avec Stripe Connect.",
    targetPlan: "pro",
    hookTemplate: (name) => `Faites payer vos clients par carte pour ${name}`,
  },
  multiCompany: {
    title: "Gestion multi-activités",
    benefit: "Gérez plusieurs activités micro-entrepreneur sous un même compte Pro.",
    targetPlan: "pro",
    hookTemplate: (name) => `Gérez plusieurs activités pour ${name}`,
  },
};

export function UpgradeModal({
  open,
  onClose,
  feature = "invoices",
  title: customTitle,
  benefit: customBenefit,
  targetPlan: customTargetPlan,
}: UpgradeModalProps) {
  const { company } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const { toast } = useToast();

  const config = FEATURE_CONFIG[feature] || FEATURE_CONFIG.invoices;
  const companyName = company?.commercial_name || company?.legal_name || "votre entreprise";
  const personalizedTitle = customTitle || config.hookTemplate(companyName);
  const benefit = customBenefit || config.benefit;
  const targetPlan = customTargetPlan || config.targetPlan;

  const activityLabel =
    company?.activity_type === "freelance_bnc" || company?.activity_type === "liberal"
      ? "Prestations de services & Conseil BNC"
      : company?.activity_type === "artisan_bic"
      ? "Artisanat & Services BIC"
      : company?.activity_type === "commerce"
      ? "Achat-revente & Commerce"
      : "Indépendant & Freelance";

  const priceLabel =
    billingCycle === "annual"
      ? targetPlan === "pro"
        ? "80 € / an (6,67 €/mois)"
        : "50 € / an (4,17 €/mois)"
      : targetPlan === "pro"
      ? "12,90 € / mois"
      : "8,90 € / mois";

  const priceId =
    targetPlan === "pro"
      ? billingCycle === "annual"
        ? STRIPE_PRICE_PRO_ANNUAL
        : STRIPE_PRICE_PRO_MONTHLY
      : billingCycle === "annual"
      ? STRIPE_PRICE_SOLO_ANNUAL
      : STRIPE_PRICE_SOLO_MONTHLY;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: { priceId },
      });

      if (error || !data?.url) {
        throw new Error(error?.message || "Impossible de créer la session de paiement.");
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error("Upgrade checkout error:", err);
      toast(err.message || "Une erreur est survenue lors de la redirection vers Stripe.", "danger");
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center sm:text-left space-y-4">
        {/* Dynamic Personalization Badge */}
        {company?.legal_name && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>Spécialement adapté pour {companyName} ({activityLabel})</span>
          </div>
        )}

        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0 mt-1">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text leading-snug">{personalizedTitle}</h3>
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-500">
              Plan {targetPlan.toUpperCase()} • {priceLabel}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted leading-relaxed">{benefit}</p>

        {/* Annual / Monthly Switch */}
        <div className="bg-surface-hover/30 p-3 rounded-card border border-border">
          <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />
        </div>

        <div className="bg-surface-elevated/50 rounded-xl p-4 border border-border/50 space-y-2">
          <div className="flex items-center text-xs text-text space-x-2">
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Essai gratuit de 14 jours (sans engagement, résiliable en 1 clic)</span>
          </div>
          <div className="flex items-center text-xs text-text space-x-2">
            <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
            <span>Conformité Factur-X & e-reporting DGFiP 2026 garantie</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Plus tard
          </Button>
          <Button onClick={handleUpgrade} disabled={loading} className="w-full sm:w-auto bylz-glow-cta font-bold">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirection...
              </>
            ) : (
              `Débloquer pour ${companyName}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
