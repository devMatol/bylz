import { useState } from "react";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { STRIPE_PRICE_SOLO, STRIPE_PRICE_PRO } from "../../lib/constants";
import { supabase } from "../../lib/supabase";
import { useToast } from "../ui/Toast";

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
  { title: string; benefit: string; targetPlan: "solo" | "pro"; priceLabel: string }
> = {
  invoices: {
    title: "Limite de factures atteinte",
    benefit: "Passez au plan Solo pour émettre des factures et devis illimités.",
    targetPlan: "solo",
    priceLabel: "9 € / mois",
  },
  clients: {
    title: "Limite de clients atteinte",
    benefit: "Passez au plan Solo pour gérer un nombre illimité de clients.",
    targetPlan: "solo",
    priceLabel: "9 € / mois",
  },
  fiscalDashboard: {
    title: "Débloquez le pilotage fiscal",
    benefit: "Suivez votre Chiffre d'Affaires, vos plafonds et vos estimations de cotisations en temps réel.",
    targetPlan: "solo",
    priceLabel: "9 € / mois",
  },
  reminders: {
    title: "Relances de paiement automatiques",
    benefit: "Relancez vos factures impayées en un clic et évitez les retards de paiement.",
    targetPlan: "solo",
    priceLabel: "9 € / mois",
  },
  exports: {
    title: "Exports comptables",
    benefit: "Exportez vos bilans et registres d'achats/ventes en un clic pour votre comptable.",
    targetPlan: "solo",
    priceLabel: "9 € / mois",
  },
  paymentLinks: {
    title: "Paiement en ligne par carte",
    benefit: "Permettez à vos clients de régler leurs factures en ligne directement avec Stripe Connect.",
    targetPlan: "pro",
    priceLabel: "19 € / mois",
  },
  multiCompany: {
    title: "Multi-activités",
    benefit: "Gérez plusieurs activités micro-entrepreneur sous un même compte Pro.",
    targetPlan: "pro",
    priceLabel: "19 € / mois",
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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const config = FEATURE_CONFIG[feature] || FEATURE_CONFIG.invoices;
  const title = customTitle || config.title;
  const benefit = customBenefit || config.benefit;
  const targetPlan = customTargetPlan || config.targetPlan;
  const priceLabel = targetPlan === "pro" ? "19 € / mois" : "9 € / mois";
  const priceId = targetPlan === "pro" ? STRIPE_PRICE_PRO : STRIPE_PRICE_SOLO;

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
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">{title}</h3>
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-500">
              Plan {targetPlan.toUpperCase()} • {priceLabel}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted leading-relaxed">{benefit}</p>

        <div className="bg-surface-elevated/50 rounded-xl p-4 border border-border/50 space-y-2">
          <div className="flex items-center text-xs text-text space-x-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>Essai gratuit de 14 jours (sans engagement)</span>
          </div>
          <div className="flex items-center text-xs text-text space-x-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>Annulation en un clic depuis les paramètres</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Plus tard
          </Button>
          <Button onClick={handleUpgrade} disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirection...
              </>
            ) : (
              `Passer au plan ${targetPlan === "pro" ? "Pro" : "Solo"}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
