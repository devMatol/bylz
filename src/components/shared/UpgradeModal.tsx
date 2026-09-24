import { useState } from "react";
import { Sparkles, Check, Loader2, ShieldCheck, X } from "lucide-react";
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
import { BillingToggle } from "./BillingToggle";

export interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: "invoices" | "clients" | "fiscalDashboard" | "reminders" | "exports" | "paymentLinks" | "multiCompany" | "aiCopilot";
  title?: string;
  benefit?: string;
  targetPlan?: "solo" | "pro";
}

const FEATURE_CONFIG: Record<
  string,
  {
    badge: string;
    title: string;
    description: string;
    targetPlan: "solo" | "pro";
    highlights: string[];
  }
> = {
  invoices: {
    badge: "Plan Solo ⚡",
    title: "Facturation & Devis illimités",
    description: "Émettez autant de devis et factures conformes Factur-X que nécessaire pour développer votre activité en toute sérénité.",
    targetPlan: "solo",
    highlights: [
      "Factures et devis illimités conformes Factur-X 2026",
      "Numérotation légale & mentions obligatoires automatiques",
      "Exports comptables et livre des recettes certifiés",
    ],
  },
  clients: {
    badge: "Plan Solo ⚡",
    title: "Répertoire clients illimité",
    description: "Gérez l'ensemble de vos clients sans restriction avec recherche automatique SIRET et suivi des impayés.",
    targetPlan: "solo",
    highlights: [
      "Fiches clients et contacts illimités",
      "Auto-complétion des données d'entreprise via l'INSEE",
      "Suivi personnalisé des délais et états de paiement",
    ],
  },
  fiscalDashboard: {
    badge: "Plan Solo ⚡",
    title: "Pilotage fiscal & URSSAF en temps réel",
    description: "Suivez votre Chiffre d'Affaires, vos seuils de TVA et anticipez exactement vos cotisations URSSAF au centime près.",
    targetPlan: "solo",
    highlights: [
      "Calcul automatique et prévisionnel de vos cotisations URSSAF",
      "Alertes proactives sur les seuils de franchise en base de TVA",
      "Tableau de bord de rentabilité et graphiques de progression",
    ],
  },
  reminders: {
    badge: "Plan Solo ⚡",
    title: "Relances automatiques des impayés",
    description: "Ne courez plus après vos règlements : Bylz relance automatiquement vos factures en retard avec diplomatie et fermeté.",
    targetPlan: "solo",
    highlights: [
      "Relances programmées et graduées (J+7 amical, J+14 ferme, J+30 formel)",
      "Modèles d'e-mails professionnels personnalisables",
      "Intégration automatique de l'indemnité forfaitaire de 40 € B2B",
    ],
  },
  exports: {
    badge: "Plan Solo ⚡",
    title: "Exports comptables certifiés",
    description: "Exportez vos bilans et registres d'achats/ventes en un clic pour votre comptable ou votre déclaration fiscale.",
    targetPlan: "solo",
    highlights: [
      "Livre des recettes et registre des achats conformes",
      "Exports universels CSV, Excel et format FEC",
      "Synthèse TVA prête pour votre déclaration",
    ],
  },
  paymentLinks: {
    badge: "Plan Pro ⚡",
    title: "Paiement en ligne par carte bancaire",
    description: "Permettez à vos clients de régler leurs factures en ligne en 1 clic directement avec Stripe Connect.",
    targetPlan: "pro",
    highlights: [
      "Bouton de paiement sécurisé par CB intégré aux factures",
      "Fonds virés directement sur votre compte bancaire",
      "Mise à jour instantanée du statut des factures",
    ],
  },
  multiCompany: {
    badge: "Plan Pro ⚡",
    title: "Gestion multi-activités",
    description: "Gérez plusieurs activités ou structures micro-entrepreneur sous un seul et même abonnement.",
    targetPlan: "pro",
    highlights: [
      "Bascule instantanée entre vos entreprises",
      "Numéros SIRET, coordonnées et identités visuelles séparés",
      "Plafonds fiscaux et statistiques cloisonnés",
    ],
  },
  aiCopilot: {
    badge: "Plan Pro ⚡",
    title: "Bylz Copilot IA (Web & WhatsApp)",
    description: "Pilotez toute votre facturation par note vocale ou message WhatsApp : création de factures, estimation URSSAF et conseils 24/7.",
    targetPlan: "pro",
    highlights: [
      "Création de devis et factures par commande vocale WhatsApp",
      "Calcul immédiat de cotisations et vérification de trésorerie",
      "Assistant intelligent disponible 24h/24 et 7j/7 sur votre mobile",
    ],
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
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const { toast } = useToast();

  const config = FEATURE_CONFIG[feature] || FEATURE_CONFIG.invoices;
  const targetPlan = customTargetPlan || config.targetPlan;
  const planTitle = targetPlan === "pro" ? "Plan Pro ⚡" : "Plan Solo ⚡";

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

      if (error) {
        let msg = error.message;
        try {
          if ((error as any).context && typeof (error as any).context.json === "function") {
            const body = await (error as any).context.json();
            if (body?.error) msg = body.error;
          }
        } catch {}
        throw new Error(msg || "Impossible de créer la session de paiement.");
      }

      if (!data?.url) {
        throw new Error("Impossible de créer la session de paiement.");
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
      <div className="space-y-4">
        {/* Header with badge & close */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-primary/10 border border-primary/20 text-primary text-[11px] font-black tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{config.badge || planTitle}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-xl font-extrabold text-text tracking-tight">
            {customTitle || config.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            {customBenefit || config.description}
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-surface-hover/40 rounded-2xl p-4 border border-border/80 space-y-3">
          <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />

          <div className="text-center pt-1">
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-text tracking-tight">
                {billingCycle === "annual"
                  ? targetPlan === "pro" ? "6,67 €" : "4,17 €"
                  : targetPlan === "pro" ? "12,90 €" : "8,90 €"}
              </span>
              <span className="text-xs font-bold text-muted uppercase">/ mois</span>
            </div>
            <p className="text-xs text-muted mt-1 font-medium">
              {billingCycle === "annual"
                ? targetPlan === "pro"
                  ? "Facturé 80 € / an (soit 2 mois offerts)"
                  : "Facturé 50 € / an (soit 2 mois offerts)"
                : "Facturation mensuelle sans engagement"}
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2 py-1">
          {config.highlights.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-text font-medium">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{item}</span>
            </div>
          ))}
        </div>

        {/* Trial Guarantee Note */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold justify-center text-center">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>Essai gratuit de 14 jours • Résiliable en 1 clic à tout moment</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto text-xs"
          >
            Plus tard
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full sm:w-auto bylz-glow-cta font-black text-xs sm:text-sm py-2.5 px-5 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirection vers Stripe...
              </>
            ) : (
              `Commencer les 14 jours gratuits`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
