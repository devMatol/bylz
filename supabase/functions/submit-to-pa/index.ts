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
    const { invoice_id, is_sandbox } = await req.json();

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ success: false, error: "invoice_id requis dans le corps de la requête." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ success: false, error: "Facture introuvable." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const company = invoice.company;
    const client = invoice.client;
    const lines = invoice.lines || [];

    // Verify client is B2B
    if (!client || client.type !== "b2b") {
      return new Response(
        JSON.stringify({ success: false, error: "La transmission FactPulse PA est réservée aux clients B2B." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Read global Super Admin mode from factpulse_status (sandbox vs production)
    const { data: statusRow } = await supabase
      .from("factpulse_status")
      .select("mode")
      .eq("id", "default")
      .maybeSingle();

    const globalMode = statusRow?.mode || "sandbox";
    const useSandbox = is_sandbox === true || is_sandbox === "true" || globalMode === "sandbox" || invoice.number.includes("TEST");

    if (useSandbox) {
      const sandboxRef = `FP-SANDBOX-${Date.now().toString(36).toUpperCase()}`;
      
      await supabase
        .from("invoices")
        .update({
          factpulse_ref: sandboxRef,
          pa_status: "submitted",
          pa_rejection_reason: null,
        })
        .eq("id", invoice.id);

      return new Response(
        JSON.stringify({
          success: true,
          factpulse_ref: sandboxRef,
          pa_status: "submitted",
          is_sandbox: true,
          message: "Facture transmise avec succès en Mode Sandbox PDP (aucun envoi DGFiP).",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Build FactPulse Simplified Payload for Live Production
    const isFranchise = company?.vat_regime === "franchise";
    const simplifiedLines = lines.map((l: any) => ({
      description: l.description || "Prestation / Produit",
      quantity: Number(l.quantity) || 1,
      unitPrice: Number(l.unit_price) || 0,
      vatRate: isFranchise ? 0 : (l.vat_rate !== undefined ? Number(l.vat_rate) : 20),
    }));

    // Clean sirets
    const supplierSiret = (company?.siret || company?.siren || "").replace(/\s/g, "");
    const recipientSiret = (client?.siret || client?.siren || "").replace(/\s/g, "");

    const payload = {
      number: invoice.number,
      issueDate: invoice.issue_date || new Date().toISOString().split("T")[0],
      dueDate: invoice.due_date || new Date().toISOString().split("T")[0],
      supplier: {
        siret: supplierSiret,
        name: company?.name || "Émetteur",
        routingAddress: company?.address || "",
        iban: company?.iban || "",
      },
      recipient: {
        siret: recipientSiret,
        name: client?.name || "Client",
      },
      lines: simplifiedLines,
      totalHt: Number(invoice.total_ht) || 0,
      totalVat: Number(invoice.total_vat) || 0,
      totalTtc: Number(invoice.total_ttc) || 0,
      destination: {
        type: "afnor",
      },
    };

    console.log("Submitting FactPulse payload for invoice:", invoice.number, payload);

    // 4. Submit to FactPulse Live API
    let resData: any = null;
    try {
      resData = await callFactPulseApi("/invoices/submit/", "POST", payload);
    } catch (err: any) {
      const isTokenExpired = err.code === "token_expired" || err.status === 401;
      const errorCode = isTokenExpired ? "token_expired" : "submission_error";

      let userMessage = err.message || "Erreur lors de la transmission à la plateforme FactPulse";
      if (err.data) {
        userMessage = `FactPulse error: ${JSON.stringify(err.data)}`;
      }

      console.error("FactPulse submission failed details:", { userMessage, errData: err.data });

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

    // 5. Update Invoice on Success
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
        is_sandbox: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error in submit-to-pa Edge Function:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Erreur interne lors de la transmission" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
