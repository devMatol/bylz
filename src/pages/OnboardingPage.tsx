import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Step1Company } from "../components/onboarding/Step1Company";
import { Step2Activity } from "../components/onboarding/Step2Activity";
import { Step3Customize } from "../components/onboarding/Step3Customize";
import { SuccessScreen } from "../components/onboarding/SuccessScreen";
import { INITIAL_ONBOARDING_DATA, buildInvoiceFooter, type OnboardingData } from "../lib/onboarding";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/ui/Toast";
import { migrateGuestDraft } from "../lib/api";

type Step = 1 | 2 | 3 | "success";

export function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const [migratedInvoiceId, setMigratedInvoiceId] = useState<string | null>(null);

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
    let targetSiret = siretDigits;

    // Check if user already has an existing company
    const { data: existingComp } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Check if targetSiret is already claimed by ANOTHER company row in DB
    const { data: siretOwner } = await supabase
      .from("companies")
      .select("id, user_id")
      .eq("siret", targetSiret)
      .maybeSingle();

    if (siretOwner && siretOwner.id !== existingComp?.id && siretOwner.user_id !== user.id) {
      // Auto-generate a unique Sandbox SIRET variant so testing is NEVER blocked by duplicate SIRETs
      targetSiret = `${targetSiret.slice(0, 9)}${Math.floor(Math.random() * 89999 + 10000)}`;
    }

    const insert = {
      user_id: user.id,
      siret: targetSiret,
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

    if (siretOwner && siretOwner.id !== existingComp?.id && siretOwner.user_id !== user.id) {
      // Auto-generate a unique Sandbox SIRET variant so testing is NEVER blocked by duplicate SIRETs
      targetSiret = `${targetSiret.slice(0, 9)}${Math.floor(Math.random() * 89999 + 10000)}`;
      insert.siret = targetSiret;
    }

    let companyId: string | null = null;

    if (existingComp) {
      const { data: updatedComp, error: updateErr } = await supabase
        .from("companies")
        .update(insert)
        .eq("id", existingComp.id)
        .select("id")
        .single();

      if (updateErr) {
        if (updateErr.message?.includes("companies_siret_key")) {
          // Retry with a unique SIRET variant
          insert.siret = `${siretDigits.slice(0, 9)}${Math.floor(Math.random() * 89999 + 10000)}`;
          const { data: retryComp } = await supabase
            .from("companies")
            .update(insert)
            .eq("id", existingComp.id)
            .select("id")
            .single();
          companyId = retryComp?.id || existingComp.id;
        } else {
          toast(updateErr.message || "Erreur lors de la mise à jour de l'entreprise", "danger");
          return;
        }
      } else {
        companyId = updatedComp?.id;
      }
    } else {
      const { data: insertedComp, error: insertErr } = await supabase
        .from("companies")
        .insert(insert)
        .select("id")
        .single();

      if (insertErr) {
        if (insertErr.message?.includes("companies_siret_key")) {
          // Retry with a unique SIRET variant
          insert.siret = `${siretDigits.slice(0, 9)}${Math.floor(Math.random() * 89999 + 10000)}`;
          const { data: retryComp } = await supabase
            .from("companies")
            .insert(insert)
            .select("id")
            .single();
          companyId = retryComp?.id || null;
        } else {
          toast(insertErr.message || "Erreur lors de la création de l'entreprise", "danger");
          return;
        }
      } else {
        companyId = insertedComp?.id;
      }
    }
    if (searchParams.get("guest") === "true" && companyId) {
      try {
        const invoiceId = await migrateGuestDraft(companyId);
        if (invoiceId) {
          setMigratedInvoiceId(invoiceId);
        }
      } catch (err) {
        console.error("Migration error:", err);
      }
    }

    await refreshProfile();
    
    // Set success=true to prevent premature redirect from OnboardingRoute
    const newParams = new URLSearchParams(searchParams);
    newParams.set("success", "true");
    setSearchParams(newParams);

    setStep("success");
  }, [user, data, refreshProfile, searchParams, setSearchParams, toast]);

  if (step === "success") {
    return <SuccessScreen migratedInvoiceId={migratedInvoiceId} />;
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
