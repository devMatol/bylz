import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { requireOperator, unauthorized } from "../_shared/require-operator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function de rejeu des soumissions rejetées ou en échec.
 * S'exécute de façon privilégiée (tâche planifiée ou administrateur plateforme).
 *
 * Utilise submit-to-pa comme unique source de vérité pour garantir :
 * - Réservation atomique (submitting)
 * - Restitution en cas d'échec
 * - Validation du legal_snapshot et du PDF certifié
 * - Endpoint officiel FactPulse /processing/invoices/submit-complete
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const operator = await requireOperator(req);
  if (!operator.allowed) return unauthorized(corsHeaders);

  try {
    // 1. Récupération des erreurs de transmission en attente de relance
    const { data: errors, error: fetchErr } = await supabase
      .from("pa_submission_errors")
      .select("id, invoice_id, error_code, created_at")
      .neq("error_code", "token_expired")
      .is("retried_at", null)
      .limit(10);

    if (fetchErr || !errors || errors.length === 0) {
      return new Response(
        JSON.stringify({ message: "Aucune tentative de transmission à rejouer." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const errLog of errors) {
      // Marquer l'erreur comme retraitée
      await supabase
        .from("pa_submission_errors")
        .update({ retried_at: new Date().toISOString() })
        .eq("id", errLog.id);

      // Récupération de l'utilisateur propriétaire de la facture pour générer son contexte JWT
      const { data: invoice } = await supabase
        .from("invoices")
        .select("id, status, pa_status, company:companies(user_id)")
        .eq("id", errLog.invoice_id)
        .maybeSingle();

      if (!invoice || !invoice.company?.user_id) {
        results.push({ invoice_id: errLog.invoice_id, status: "ignored", reason: "Facture ou utilisateur introuvable" });
        continue;
      }

      // Seules les factures non-brouillon et au statut rejected ou none sont relançables
      if (invoice.status === "draft" || (invoice.pa_status !== "rejected" && invoice.pa_status !== "none")) {
        results.push({ invoice_id: errLog.invoice_id, status: "ignored", reason: `Statut actuel incompatible: ${invoice.pa_status}` });
        continue;
      }

      try {
        // Délégation unifiée à submit-to-pa avec retry: true
        const submitRes = await fetch(`${supabaseUrl}/functions/v1/submit-to-pa`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoice_id: invoice.id,
            retry: invoice.pa_status === "rejected",
          }),
        });

        const resJson = await submitRes.json().catch(() => ({}));
        if (submitRes.ok && resJson.success) {
          results.push({ invoice_id: invoice.id, status: "success", ref: resJson.factpulse_ref });
        } else {
          results.push({ invoice_id: invoice.id, status: "failed", error: resJson.error || resJson.message });
        }
      } catch (invokeErr: any) {
        results.push({ invoice_id: invoice.id, status: "failed", error: invokeErr.message });
      }
    }

    return new Response(
      JSON.stringify({ message: "Rejeu terminé.", processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Erreur dans retry-pa-submissions:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
