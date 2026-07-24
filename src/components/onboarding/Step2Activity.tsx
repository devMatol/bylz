import { Laptop, Wrench, ShoppingBag, Briefcase, Check, Info } from "lucide-react";
import { OnboardingLayout } from "./OnboardingLayout";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { cn } from "../../lib/utils";
import {
  ACTIVITY_INFO,
  nafToActivityType,
  type OnboardingData,
} from "../../lib/onboarding";
import type { ActivityType, UrssafFreq } from "../../types/database";
import { useEffect } from "react";

interface Step2ActivityProps {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ACTIVITY_CARDS: {
  type: ActivityType;
  icon: typeof Laptop;
  title: string;
  desc: string;
}[] = [
  { type: "freelance_bnc", icon: Laptop, title: "Freelance / Services", desc: "Prestations BNC" },
  { type: "artisan_bic", icon: Wrench, title: "Artisan / BTP", desc: "Fabrication et services BIC" },
  { type: "commerce", icon: ShoppingBag, title: "Commerce", desc: "Achat-revente de marchandises" },
  { type: "liberal", icon: Briefcase, title: "Profession libérale", desc: "Activités réglementées ou non" },
];

export function Step2Activity({ data, update, onNext, onBack }: Step2ActivityProps) {
  useEffect(() => {
    if (!data.activityType && data.nafCode) {
      const suggested = nafToActivityType(data.nafCode);
      if (suggested) update({ activityType: suggested });
    }
  }, [data.activityType, data.nafCode, update]);

  const selected = data.activityType;
  const info = selected ? ACTIVITY_INFO[selected] : null;

  return (
    <OnboardingLayout step={2} onBack={onBack}>
      <div className="text-center mb-6 mt-2">
        <h2 className="text-xl font-bold text-text mb-1">Quel type d'activité exercez-vous ?</h2>
        <p className="text-sm text-muted mb-2">
          Cette information détermine vos cotisations et votre abattement fiscal.
        </p>
        {data.nafCode && (
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-pill">
            ⚡ Pré-sélectionné selon votre Code NAF ({data.nafCode})
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {ACTIVITY_CARDS.map((card) => {
          const Icon = card.icon;
          const isSelected = selected === card.type;
          return (
            <button
              key={card.type}
              type="button"
              onClick={() => update({ activityType: card.type })}
              className={cn(
                "relative text-left p-4 rounded-card border-2 transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5 bylz-glow-primary"
                  : "border-border hover:border-primary/30"
              )}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </span>
              )}
              <div className="w-10 h-10 rounded-card bg-primary/15 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-bold text-text text-sm">{card.title}</p>
              <p className="text-xs text-muted mt-0.5">{card.desc}</p>
            </button>
          );
        })}
      </div>

      {info && (
        <div className="bg-surface-hover border border-border rounded-card p-4 mb-4 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold text-text">Abattement fiscal : {info.abattement}</p>
            <Tooltip content="L'abattement est appliqué par l'administration fiscale sur votre chiffre d'affaires pour calculer votre bénéfice imposable.">
              <span className="text-muted hover:text-text transition-colors cursor-help">
                <Info className="w-4 h-4" />
              </span>
            </Tooltip>
          </div>
          <p className="text-sm font-semibold text-text">Taux URSSAF : {info.urssaf}</p>
        </div>
      )}

      <div className="border-t border-border pt-4 mb-6">
        <p className="text-sm font-semibold text-text mb-3">Fréquence de déclaration URSSAF</p>
        <div className="flex gap-2">
          {(
            [
              { value: "quarterly", label: "Trimestrielle (recommandé)" },
              { value: "monthly", label: "Mensuelle" },
            ] as { value: UrssafFreq; label: string }[]
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ urssafFrequency: opt.value })}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-pill text-sm font-semibold border transition-all duration-200",
                data.urssafFrequency === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted hover:text-text hover:bg-surface-hover"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        className="w-full"
        disabled={!selected}
        onClick={onNext}
      >
        Continuer
      </Button>
    </OnboardingLayout>
  );
}
