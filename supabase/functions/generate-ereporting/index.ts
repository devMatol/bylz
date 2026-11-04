import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireOperator, unauthorized } from "../_shared/require-operator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Operator verification
  const operator = await requireOperator(req);
  if (!operator.allowed) return unauthorized(corsHeaders);

  // E-reporting function strictly disabled until confirmation of PPF / FactPulse
  // flux specifications (flux 10.1 - 10.4) and contractual inclusion in SaaS plan.
  // No external network call, no database write.
  return new Response(
    JSON.stringify({
      success: false,
      disabled: true,
      reason: "E-reporting temporairement désactivé en attente de confirmation écrite des spécifications de flux par FactPulse.",
      batches_processed: 0,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
