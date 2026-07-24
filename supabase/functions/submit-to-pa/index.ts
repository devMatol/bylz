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
    const { invoice_id } = await req.json();

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: "invoice_id requis dans le corps de la requête." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch invoice, lines, company, and client
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("*, company:companies(*), client:clients(*), lines:invoice_lines(*)")
      .eq("id", invoice_id)
      .single();

    if (invErr || !invoice) {
      return new Response(
        JSON.stringify({ error: "Facture introuvable." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const company = invoice.company;
    const client = invoice.client;
    const lines = invoice.lines || [];

    // Verify client is B2B
    if (!client || client.type !== "b2b") {
      return new Response(
        JSON.stringify({ error: "La transmission FactPulse PA est réservée aux clients B2B." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Build FactPulse Simplified Payload
    const isFranchise = company?.vat_regime === "franchise";
    const simplifiedLines = lines.map((l: any) => ({
      description: l.description || "Prestation / Produit",
      quantity: Number(l.quantity) || 1,
      unitPrice: Number(l.unit_price) || 0,
      vatRate: isFranchise ? 0 : (l.vat_rate !== undefined ? Number(l.vat_rate) : 20),
    }));

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
        lines: simplifiedLines,
      },
      destination: {
        type: "afnor",
      },
    };

    console.log("Submitting FactPulse simplified payload for invoice:", invoice.number, payload);

    // 3. Submit to FactPulse
    let resData: any = null;
    try {
      resData = await callFactPulseApi("/invoices/submit/", "POST", payload);
    } catch (err: any) {
      const isTokenExpired = err.code === "token_expired" || err.status === 401;
      const errorCode = isTokenExpired ? "token_expired" : "submission_error";
      const userMessage = err.message || "Erreur lors de la transmission à la plateforme FactPulse";

      // Log failure in pa_submission_errors
      await supabase.from("pa_submission_errors").insert({
        invoice_id: invoice.id,
        error: userMessage,
        error_code: errorCode,
      });

      if (isTokenExpired) {
        await supabase.from("factpulse_status").upsert({
          id: "default",
          token_valid: false,
          last_checked_at: new Date().toISOString(),
          last_error: userMessage,
        });
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: userMessage,
          error_code: errorCode,
          message: userMessage,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Update Invoice on Success
    const factpulseRef = resData?.reference || resData?.id || resData?.factpulse_ref || `FP-${Date.now()}`;

    await supabase
      .from("invoices")
      .update({
        factpulse_ref: factpulseRef,
        pa_status: "submitted",
        pa_rejection_reason: null,
      })
      .eq("id", invoice.id);

    return new Response(
      JSON.stringify({
        success: true,
        factpulse_ref: factpulseRef,
        pa_status: "submitted",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error in submit-to-pa Edge Function:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
