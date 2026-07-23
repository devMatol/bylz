import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { callFactPulseApi } from "../_shared/factpulse-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Check FactPulse token status
    const { data: statusRow } = await supabase
      .from("factpulse_status")
      .select("token_valid")
      .eq("id", "default")
      .maybeSingle();

    if (statusRow && statusRow.token_valid === false) {
      return new Response(
        JSON.stringify({ message: "Tentatives ignorées : Token FactPulse expiré." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch pending submission errors (max 3 retries, excluding token_expired)
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
      // Mark as retried
      await supabase
        .from("pa_submission_errors")
        .update({ retried_at: new Date().toISOString() })
        .eq("id", errLog.id);

      // Invoke submit-to-pa logic internally
      const { data: invoice } = await supabase
        .from("invoices")
        .select("*, company:companies(*), client:clients(*), lines:invoice_lines(*)")
        .eq("id", errLog.invoice_id)
        .maybeSingle();

      if (invoice && invoice.client && invoice.client.type === "b2b" && invoice.pa_status !== "submitted") {
        const company = invoice.company;
        const client = invoice.client;
        const lines = invoice.lines || [];

        const isFranchise = company?.vat_regime === "franchise";
        const payload = {
          invoiceData: {
            number: invoice.number,
            supplier: {
              siret: company?.siret || company?.siren || "00000000000000",
              routingAddress: company?.address || "",
              iban: company?.iban || "",
            },
            recipient: {
              siret: client?.siret || client?.siren || "00000000000000",
            },
            lines: lines.map((l: any) => ({
              description: l.description || "Prestation",
              quantity: Number(l.quantity) || 1,
              unitPrice: Number(l.unit_price) || 0,
              vatRate: isFranchise ? 0 : 20,
            })),
          },
          destination: { type: "afnor" },
        };

        try {
          const resData = await callFactPulseApi("/invoices/submit", "POST", payload);
          const factpulseRef = resData?.reference || resData?.id || `FP-${Date.now()}`;

          await supabase
            .from("invoices")
            .update({
              factpulse_ref: factpulseRef,
              pa_status: "submitted",
              pa_rejection_reason: null,
            })
            .eq("id", invoice.id);

          results.push({ invoice_id: invoice.id, status: "success", ref: factpulseRef });
        } catch (retryErr: any) {
          results.push({ invoice_id: invoice.id, status: "failed", error: retryErr.message });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
