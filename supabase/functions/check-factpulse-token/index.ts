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
    // Ping FactPulse endpoint
    let isValid = true;
    let lastError: string | null = null;

    try {
      await callFactPulseApi("/me", "GET");
    } catch (err: any) {
      if (err.code === "token_expired" || err.status === 401) {
        isValid = false;
        lastError = err.message;
      } else {
        // Other non-fatal error (e.g. network endpoint variance)
        console.warn("FactPulse ping warning:", err.message);
      }
    }

    // Update factpulse_status DB
    await supabase.from("factpulse_status").upsert({
      id: "default",
      token_valid: isValid,
      last_checked_at: new Date().toISOString(),
      last_error: lastError,
    });

    return new Response(
      JSON.stringify({ success: true, token_valid: isValid, last_error: lastError }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
