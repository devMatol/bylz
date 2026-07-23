import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export interface FactPulseConfig {
  apiToken: string;
  clientUid: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
}

export async function callFactPulseApi(
  endpoint: string,
  method: string,
  payload?: unknown,
  config?: Partial<FactPulseConfig>
) {
  const apiToken = config?.apiToken || Deno.env.get("FACTPULSE_API_TOKEN");
  const clientUid = config?.clientUid || Deno.env.get("FACTPULSE_CLIENT_UID");
  const supabaseUrl = config?.supabaseUrl || Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = config?.supabaseServiceKey || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!apiToken || !clientUid) {
    throw new Error("FACTPULSE_API_TOKEN ou FACTPULSE_CLIENT_UID manquant dans l'environnement Supabase Edge Function.");
  }

  const baseUrl = "https://app.factpulse.fr/api/v1";
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${apiToken}`,
    "X-Client-UID": clientUid,
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (response.status === 401) {
    console.error("🚨 FactPulse API Token expiré (HTTP 401 Unauthorized) !");

    // Update factpulse_status table in Supabase DB
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from("factpulse_status")
          .upsert({
            id: "default",
            token_valid: false,
            last_checked_at: new Date().toISOString(),
            last_error: "401 Unauthorized — Token FactPulse expiré",
          });
      } catch (err) {
        console.error("Erreur lors de la mise à jour du statut token FactPulse:", err);
      }
    }

    const err = new Error("Token FactPulse expiré — régénérez-le sur factpulse.fr et mettez à jour le secret FACTPULSE_API_TOKEN");
    (err as any).code = "token_expired";
    (err as any).status = 401;
    throw err;
  }

  // Parse JSON response
  let resData: any = null;
  const text = await response.text();
  try {
    resData = text ? JSON.parse(text) : {};
  } catch {
    resData = { rawText: text };
  }

  if (!response.ok) {
    const errorMsg = resData?.error || resData?.message || text || `FactPulse API status ${response.status}`;
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).data = resData;
    throw err;
  }

  return resData;
}
