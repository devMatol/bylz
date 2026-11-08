import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import {
  verifyWebhookSignatureAndTime,
  mapCdarStatusCodeToPaStatus,
  getPaStatusRank,
  sanitizeWebhookPayload,
} from "../_shared/factpulse-helpers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp",
};

/**
 * Edge Function Webhook pour les retours FactPulse / AFNOR
 *
 * TODO: Demander à l'équipe support FactPulse la documentation contractuelle formelle des webhooks entrants
 * (spécification officielle des en-têtes de signature, tolérance d'horodatage et schéma JSON exhaustif).
 * Référence documentation API publique : https://factpulse.fr/api/facturation/documentation
 * (la documentation publique Swagger/Scalar ne décrit pas les webhooks entrants, seuls les endpoints de soumission y figurent).
 * L'implémentation ci-dessous s'appuie sur le standard SDK FactPulse : en-têtes 'X-Webhook-Signature' (HMAC-SHA256)
 * et 'X-Webhook-Timestamp' (anti-rejeu < 300s).
 *
 * Norme statuts : AFNOR XP Z12-012 / DGFIP Annexe 6 / Invopop (https://docs.invopop.com/guides/fr-pa-status)
 *
 * NOTE DE DÉPLOIEMENT :
 * supabase functions deploy factpulse-webhook --no-verify-jwt
 * (ou via supabase/config.toml : [functions.factpulse-webhook] verify_jwt = false)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1. Échec fermé : si FACTPULSE_WEBHOOK_SECRET est vide, 503
  const webhookSecret = Deno.env.get("FACTPULSE_WEBHOOK_SECRET") || "";
  if (!webhookSecret || webhookSecret.trim() === "") {
    console.error("🚨 FACTPULSE_WEBHOOK_SECRET non configuré sur le serveur (échec fermé).");
    return new Response(
      JSON.stringify({ error: "Service webhook temporairement indisponible : secret non configuré." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const signatureHeader = req.headers.get("x-webhook-signature");
  const timestampHeader = req.headers.get("x-webhook-timestamp");
  const rawBody = await req.text();

  // 2. Authentification cryptographique stricte par signature HMAC et horodatage anti-rejeu
  const authCheck = await verifyWebhookSignatureAndTime(
    rawBody,
    signatureHeader,
    timestampHeader,
    webhookSecret,
    300 // tolérance maximale de 5 minutes contre le rejeu
  );

  if (!authCheck.valid) {
    const headerNames = Array.from(req.headers.keys());
    console.warn("⚠️ Rejet webhook FactPulse :", authCheck.reason, "| Noms d'en-têtes reçus :", headerNames);
    return new Response(
      JSON.stringify({ error: "Non autorisé : signature HMAC ou horodatage invalide." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const data = rawBody ? JSON.parse(rawBody) : {};
    const eventType = data.event_type || data.eventType || "status.updated";
    const eventId = data.event_id || data.eventId || null;
    const sanitizedPayload = sanitizeWebhookPayload(data);

    // 3. Rapprochement de la facture UNIQUEMENT par factpulse_ref (flowId officiel)
    const factpulseRef = data.factpulse_ref || data.reference || data.flow_id || data.flowId || data.data?.flowId;

    if (!factpulseRef) {
      console.warn("⚠️ Webhook FactPulse reçu sans identifiant factpulse_ref/flowId.");
      return new Response(
        JSON.stringify({ success: false, error: "Identifiant factpulse_ref ou flowId requis." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, status, pa_status, factpulse_ref, pa_lifecycle_code")
      .eq("factpulse_ref", factpulseRef)
      .maybeSingle();

    // Règle critique : Si la facture n'est pas encore trouvée (ex: événement reçu avant écriture du flowId),
    // on ne bloque PAS l'événement dans pa_webhook_events et on répond 404 pour que FactPulse réessaie.
    if (!invoice) {
      console.warn(`⚠️ Facture introuvable pour factpulse_ref: ${factpulseRef}. Signalement 404 pour nouvel essai.`);
      return new Response(
        JSON.stringify({ error: "invoice_not_found", factpulse_ref: factpulseRef }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Idempotence : enregistrement dans pa_webhook_events SEULEMENT une fois la facture trouvée
    if (eventId) {
      const { error: insertErr } = await supabase.from("pa_webhook_events").insert({
        event_id: eventId,
        invoice_id: invoice.id,
        event_type: eventType,
        payload: sanitizedPayload,
      });

      if (insertErr && (insertErr.code === "23505" || insertErr.message?.includes("duplicate key"))) {
        console.log(`ℹ️ Événement ${eventId} déjà traité (idempotence).`);
        return new Response(
          JSON.stringify({ status: "already_processed", event_id: eventId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 5. Mapping AFNOR XP Z12-012 et contrôle de non-régression de statut
    // Supporte également le schéma AFNOR InvoiceLifecycle (data.events[].statusCode)
    const rawStatusCode =
      data.status_code ||
      data.statusCode ||
      data.data?.statusCode ||
      data.data?.status_code ||
      data.events?.[data.events.length - 1]?.statusCode ||
      data.code;
    const statusMapping = mapCdarStatusCodeToPaStatus(rawStatusCode, eventType);

    const currentRank = getPaStatusRank(invoice.pa_status);
    const incomingRank = statusMapping.rank;

    // Ne jamais régresser un statut (ex: si 'accepted' (rank 30), ignorer 'submitted' (rank 10) ou 'delivered' (rank 20))
    const shouldUpdatePaStatus =
      statusMapping.pa_status !== null &&
      (incomingRank > currentRank || invoice.pa_status === "submitting");

    const updateData: Record<string, any> = {
      pa_lifecycle_code: statusMapping.code,
    };

    if (shouldUpdatePaStatus) {
      updateData.pa_status = statusMapping.pa_status;
      if (statusMapping.pa_status === "rejected") {
        updateData.pa_rejection_reason =
          data.reason || data.data?.reason || data.error_message || data.message || "Rejeté par la plateforme agréée.";
      } else if (statusMapping.pa_status === "accepted" || statusMapping.pa_status === "delivered") {
        updateData.pa_rejection_reason = null;
      }
    }

    await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoice.id);

    return new Response(
      JSON.stringify({
        success: true,
        event_id: eventId,
        invoice_id: invoice.id,
        applied_pa_status: shouldUpdatePaStatus ? statusMapping.pa_status : invoice.pa_status,
        lifecycle_code: statusMapping.code,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Erreur lors du traitement du webhook FactPulse:", err);
    return new Response(
      JSON.stringify({ error: "Erreur interne lors du traitement du webhook." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
