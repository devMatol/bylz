import { useState, useCallback } from "react";
import { Step1Company } from "../components/onboarding/Step1Company";
import { Step2Activity } from "../components/onboarding/Step2Activity";
import { Step3Customize } from "../components/onboarding/Step3Customize";
import { SuccessScreen } from "../components/onboarding/SuccessScreen";
import { INITIAL_ONBOARDING_DATA, buildInvoiceFooter, type OnboardingData } from "../lib/onboarding";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/ui/Toast";

type Step = 1 | 2 | 3 | "success";

export function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);

  const update = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const goToStep2 = useCallback(() => setStep(2), []);
  const goToStep3 = useCallback(() => setStep(3), []);
  const backToStep1 = useCallback(() => setStep(1), []);
  const backToStep2 = useCallback(() => setStep(2), []);

  const handleSubmit = useCallback(async () => {
    if (!user) return;
    const siretDigits = data.siret.replace(/\s/g, "");
    const siren = siretDigits.slice(0, 9);
    const insert = {
      user_id: user.id,
      siret: siretDigits,
      siren,
      legal_name: data.legalName,
      commercial_name: data.commercialName || null,
      address: data.address,
      naf_code: data.nafCode || null,
      activity_type: data.activityType,
      urssaf_frequency: data.urssafFrequency,
      logo_url: data.logoUrl,
      accent_color: data.accentColor,
      invoice_footer: buildInvoiceFooter(data),
      vat_regime: "franchise" as const,
      default_payment_terms: "30d" as const,
    };
    const { error } = await supabase.from("companies").insert(insert);
    if (error) {
      toast("Erreur lors de la création de l'entreprise", "danger");
      return;
    }
    await refreshProfile();
    setStep("success");
  }, [user, data, refreshProfile, toast]);

  if (step === "success") {
    return <SuccessScreen />;
  }

  return (
    <>
      {step === 1 && (
        <Step1Company data={data} update={update} onNext={goToStep2} />
      )}
      {step === 2 && (
        <Step2Activity
          data={data}
          update={update}
          onNext={goToStep3}
          onBack={backToStep1}
        />
      )}
      {step === 3 && (
        <Step3Customize
          data={data}
          update={update}
          onSubmit={handleSubmit}
          onBack={backToStep2}
        />
      )}
    </>
  );
}
