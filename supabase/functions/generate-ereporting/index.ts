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
    const now = new Date();
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const period = `${prevMonthDate.getFullYear()}-${(prevMonthDate.getMonth() + 1).toString().padStart(2, "0")}`;

    // 1. Fetch all pending B2C invoices eligible for e-reporting
    const { data: pendingInvoices, error: fetchErr } = await supabase
      .from("invoices")
      .select("*, company:companies(*), client:clients(*)")
      .eq("ereporting_status", "pending")
      .neq("status", "draft");

    if (fetchErr || !pendingInvoices || pendingInvoices.length === 0) {
      return new Response(
        JSON.stringify({ message: "Aucune facture B2C en attente d'e-reporting." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Group invoices by company_id
    const companyGroups: Record<string, any[]> = {};
    for (const inv of pendingInvoices) {
      if (inv.client && inv.client.type === "b2c") {
        if (!companyGroups[inv.company_id]) companyGroups[inv.company_id] = [];
        companyGroups[inv.company_id].push(inv);
      }
    }

    const createdBatches = [];

    for (const [companyId, invoices] of Object.entries(companyGroups)) {
      const company = invoices[0].company;
      const totalAmountTtc = invoices.reduce((acc, inv) => acc + (Number(inv.total_ttc) || 0), 0);
      const count = invoices.length;

      // Create ereporting batch row in DB
      const { data: batch, error: batchErr } = await supabase
        .from("ereporting_batches")
        .insert({
          company_id: companyId,
          period,
          nature: "services",
          count,
          amount_ttc: totalAmountTtc,
          status: "pending",
        })
        .select("*")
        .single();

      if (batchErr || !batch) continue;

      // Submit batch to FactPulse E-reporting
      const payload = {
        company: {
          siret: company?.siret || company?.siren || "00000000000000",
        },
        period,
        summary: {
          transactionCount: count,
          totalTtc: totalAmountTtc,
          currency: "EUR",
        },
      };

      try {
        const fpRes = await callFactPulseApi("/ereporting/submit", "POST", payload);
        const ref = fpRes?.reference || fpRes?.id || `ER-${Date.now()}`;

        // Mark batch as confirmed
        await supabase
          .from("ereporting_batches")
          .update({ status: "confirmed", factpulse_ref: ref })
          .eq("id", batch.id);

        // Mark invoices as reported
        const invoiceIds = invoices.map((i) => i.id);
        await supabase
          .from("invoices")
          .update({ ereporting_status: "submitted" })
          .in("id", invoiceIds);

        createdBatches.push({ batch_id: batch.id, company_id: companyId, count, totalAmountTtc, ref });
      } catch (err: any) {
        console.error("E-reporting submission error:", err);
        await supabase
          .from("ereporting_batches")
          .update({ status: "error", retry_count: 1 })
          .eq("id", batch.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, period, batchesCreated: createdBatches.length, batches: createdBatches }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
