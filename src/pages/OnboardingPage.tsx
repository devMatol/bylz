import { useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Step1Company } from "../components/onboarding/Step1Company";
import { INITIAL_ONBOARDING_DATA, buildInvoiceFooter, type OnboardingData } from "../lib/onboarding";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/ui/Toast";
import { migrateGuestDraft } from "../lib/api";

export function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);

  const update = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

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
      vat_regime: data.vatRegime,
      structure: data.structure,
      default_payment_terms: "30d" as const,
    };
    // Update if company already exists for user, otherwise insert
    const { data: existingComps } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const existingComp = existingComps?.[0];

    let companyId: string | null = null;

    if (existingComp) {
      const { data: updatedComp, error: updateErr } = await supabase
        .from("companies")
        .update(insert)
        .eq("id", existingComp.id)
        .select("id")
        .single();

      if (updateErr) {
        toast(updateErr.message || "Erreur lors de la mise à jour de l'entreprise", "danger");
        return;
      }
      companyId = updatedComp?.id;
    } else {
      const { data: insertedComp, error: insertErr } = await supabase
        .from("companies")
        .insert(insert)
        .select("id")
        .single();

      if (insertErr) {
        toast(insertErr.message || "Erreur lors de la création de l'entreprise", "danger");
        return;
      }
      companyId = insertedComp?.id;
    }

    let targetInvoiceId: string | null = null;
    if (searchParams.get("guest") === "true" && companyId) {
      try {
        const invoiceId = await migrateGuestDraft(companyId);
        if (invoiceId) {
          targetInvoiceId = invoiceId;
        }
      } catch (err) {
        console.error("Migration error:", err);
      }
    }

    await refreshProfile();
    toast("Profil entreprise configuré avec succès !", "success");

    if (targetInvoiceId) {
      navigate(`/invoices/${targetInvoiceId}`, { replace: true });
    } else {
      navigate("/invoices", { replace: true });
    }
  }, [user, data, refreshProfile, searchParams, navigate, toast]);

  return <Step1Company data={data} update={update} onNext={handleSubmit} />;
}
