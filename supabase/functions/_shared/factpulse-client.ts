import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export interface FactPulseConfig {
  apiToken?: string;
  username?: string;
  password?: string;
  clientUid?: string;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
}

export async function getOrRefreshFactPulseToken(forceRefresh = false): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

  // 1. Check environment variable FACTPULSE_API_TOKEN first
  const envToken = Deno.env.get("FACTPULSE_API_TOKEN");
  if (!forceRefresh && envToken && envToken.trim() !== "") {
    return envToken.trim();
  }

  // 2. Try reading active token from DB if not forcing refresh
  if (!forceRefresh && supabase) {
    try {
      const { data: statusRow } = await supabase
        .from("factpulse_status")
        .select("access_token, token_valid")
        .eq("id", "default")
        .maybeSingle();

      if (statusRow && statusRow.token_valid && statusRow.access_token) {
        return statusRow.access_token;
      }
    } catch (e) {
      console.warn("Could not read cached token from DB:", e);
    }
  }

  // 3. Perform Automatic Auth via Username/Password & Client UID
  const username = Deno.env.get("FACTPULSE_USERNAME") || Deno.env.get("FACTPULSE_EMAIL");
  const password = Deno.env.get("FACTPULSE_PASSWORD");
  const clientUid = Deno.env.get("FACTPULSE_CLIENT_UID");

  if (!username || !password || !clientUid) {
    throw new Error("FACTPULSE_API_TOKEN manquant dans les secrets Supabase Edge Functions.");
  }

  console.log("🔄 Autologin FactPulse : Génération automatique d'un nouveau Token Bearer...");

  const authUrl = "https://factpulse.fr/api/token/";
  const authPayload = {
    username: username,
    password: password,
  };

  const res = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(authPayload),
  });

  const resText = await res.text();
  let resData: any = {};
  try {
    resData = resText ? JSON.parse(resText) : {};
  } catch {
    resData = { rawText: resText };
  }

  if (!res.ok) {
    console.error("🚨 Échec autologin FactPulse:", resData);
    if (supabase) {
      await supabase.from("factpulse_status").upsert({
        id: "default",
        token_valid: false,
        last_checked_at: new Date().toISOString(),
        last_error: resData?.error?.message || resData?.message || "Échec d'authentification automatique FactPulse",
      });
    }
    const err = new Error("Identifiants FactPulse invalides ou Token expiré.");
    (err as any).code = "token_expired";
    (err as any).status = 401;
    throw err;
  }

  const newToken = resData.access_token || resData.token || resData.jwt || resData.access;
  if (!newToken) {
    throw new Error("Réponse d'authentification FactPulse invalide (aucun access_token retourné).");
  }

  console.log("✅ Nouveaux jeton FactPulse généré avec succès !");

  if (supabase) {
    await supabase.from("factpulse_status").upsert({
      id: "default",
      access_token: newToken,
      token_valid: true,
      last_checked_at: new Date().toISOString(),
      last_error: null,
    });
  }

  return newToken;
}

export async function callFactPulseApi(
  endpoint: string,
  method: string,
  payload?: unknown,
  config?: Partial<FactPulseConfig>
) {
  const clientUid = config?.clientUid || Deno.env.get("FACTPULSE_CLIENT_UID");
  let token = config?.apiToken || (await getOrRefreshFactPulseToken(false));

  const baseUrl = "https://app.factpulse.fr/api/v1";
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const sendRequest = async (authToken: string) => {
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
    };
    if (clientUid) headers["X-Client-UID"] = clientUid;

    return await fetch(url, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    });
  };

  let response = await sendRequest(token);

  if (response.status === 401) {
    console.warn("⚠️ Token 401 détecté lors de l'appel FactPulse. Tentative de rafraîchissement...");
    try {
      token = await getOrRefreshFactPulseToken(true);
      response = await sendRequest(token);
    } catch (refreshErr) {
      throw refreshErr;
    }
  }

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
