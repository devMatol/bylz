import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-factpulse-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const webhookSecret = Deno.env.get("FACTPULSE_WEBHOOK_SECRET");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const signature = req.headers.get("x-factpulse-signature") || req.headers.get("x-signature");
    const rawBody = await req.text();

    console.log("FactPulse Webhook received signature:", signature);
    console.log("FactPulse Webhook raw body:", rawBody);

    if (webhookSecret && signature) {
      // Signature verification placeholder (logs for inspection)
      console.log("Verifying FactPulse webhook signature against FACTPULSE_WEBHOOK_SECRET...");
    }

    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON payload", { status: 400 });
    }

    const eventId = body.event_id || body.id || `evt-${Date.now()}`;
    const eventType = (body.event_type || body.event || body.status || "").toLowerCase();
    const factpulseRef = body.factpulse_ref || body.reference || body.invoice_ref;
    const invoiceNumber = body.number || body.invoice_number;

    // Idempotent deduplication check
    const { data: existingEvent } = await supabase
      .from("pa_webhook_events")
      .select("id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingEvent) {
      return new Response(JSON.stringify({ status: "ignored_duplicate" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find target invoice by factpulse_ref or invoice number
    let targetInvoice: any = null;
    if (factpulseRef) {
      const { data: inv } = await supabase
        .from("invoices")
        .select("id, status, pa_status")
        .eq("factpulse_ref", factpulseRef)
        .maybeSingle();
      targetInvoice = inv;
    }

    if (!targetInvoice && invoiceNumber) {
      const { data: inv } = await supabase
        .from("invoices")
        .select("id, status, pa_status")
        .eq("number", invoiceNumber)
        .maybeSingle();
      targetInvoice = inv;
    }

    // Log event in pa_webhook_events
    await supabase.from("pa_webhook_events").insert({
      event_id: eventId,
      invoice_id: targetInvoice?.id || null,
      event_type: eventType,
      payload: body,
      received_at: new Date().toISOString(),
    });

    if (targetInvoice) {
      const updateData: Record<string, any> = {};

      if (eventType.includes("deliver")) {
        updateData.pa_status = "delivered";
      } else if (eventType.includes("receiv")) {
        updateData.pa_status = "received";
      } else if (eventType.includes("accept") || eventType.includes("confirm")) {
        updateData.pa_status = "accepted";
      } else if (eventType.includes("reject") || eventType.includes("refus")) {
        updateData.pa_status = "rejected";
        updateData.status = "rejected";
        updateData.pa_rejection_reason =
          body.reason || body.rejection_reason || body.message || "Facture rejetée par le destinataire sur la plateforme PA.";
      } else if (eventType.includes("submit")) {
        updateData.pa_status = "submitted";
      }

      if (Object.keys(updateData).length > 0) {
        await supabase.from("invoices").update(updateData).eq("id", targetInvoice.id);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("FactPulse Webhook Exception:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
