import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrRefreshFactPulseToken } from "../_shared/factpulse-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const clientUid = Deno.env.get("FACTPULSE_CLIENT_UID");
    const token = await getOrRefreshFactPulseToken(false);

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "Aucun fichier PDF fourni." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call FactPulse API
    const fpFormData = new FormData();
    fpFormData.append("file", file);

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
    };
    if (clientUid) headers["X-Client-UID"] = clientUid;

    let factPulseRes = await fetch("https://app.factpulse.fr/api/v1/invoices/parse", {
      method: "POST",
      headers,
      body: fpFormData,
    });

    if (factPulseRes.status === 401) {
      const freshToken = await getOrRefreshFactPulseToken(true);
      headers["Authorization"] = `Bearer ${freshToken}`;
      factPulseRes = await fetch("https://app.factpulse.fr/api/v1/invoices/parse", {
        method: "POST",
        headers,
        body: fpFormData,
      });
    }

    if (!factPulseRes.ok) {
      const errText = await factPulseRes.text();
      console.warn("FactPulse API Response Error:", errText);
      return new Response(
        JSON.stringify({ error: "Échec de l'analyse FactPulse", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await factPulseRes.json();

    return new Response(
      JSON.stringify({ success: true, parsed: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error in parse-pdf-factpulse:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
