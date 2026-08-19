import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, *, Authorization, Content-Type, Apikey, X-Client-Info",
};

// Credentials come from the environment only. A literal secret in source is
// readable by anyone with the repository and cannot be rotated independently.

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "JWT invalide" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: company } = await userClient
      .from("companies")
      .select("id, legal_name")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!company) {
      return new Response(JSON.stringify({ error: "Entreprise introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bridgeClientId = Deno.env.get("BRIDGE_CLIENT_ID") || "";
    const bridgeClientSecret = Deno.env.get("BRIDGE_CLIENT_SECRET") || "";
    if (!bridgeClientId || !bridgeClientSecret) {
      console.error("BRIDGE_CLIENT_ID / BRIDGE_CLIENT_SECRET are not configured.");
      return new Response(JSON.stringify({ error: "Service bancaire non configuré" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = userData.user.email || "client@bylz.fr";
    const externalUserId = `bylz-user-${userData.user.id.slice(0, 12)}`;

    // 1. Get User Access Token directly using external_user_id
    let accessToken = "";
    try {
      const tRes = await fetch("https://api.bridgeapi.io/v3/aggregation/authorization/token", {
        method: "POST",
        headers: {
          "Client-Id": bridgeClientId,
          "Client-Secret": bridgeClientSecret,
          "Bridge-Version": "2025-01-15",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ external_user_id: externalUserId }),
      });
      const tData = await tRes.json();
      if (tData.access_token) {
        accessToken = tData.access_token;
      }
    } catch (e) {
      console.warn("Direct token fetch failed:", e);
    }

    // 2. If token fetch failed, create the user first, then try token fetch again
    if (!accessToken) {
      try {
        await fetch("https://api.bridgeapi.io/v3/aggregation/users", {
          method: "POST",
          headers: {
            "Client-Id": bridgeClientId,
            "Client-Secret": bridgeClientSecret,
            "Bridge-Version": "2025-01-15",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ external_user_id: externalUserId }),
        });
        
        // Try getting token again since user is now created
        const tRes = await fetch("https://api.bridgeapi.io/v3/aggregation/authorization/token", {
          method: "POST",
          headers: {
            "Client-Id": bridgeClientId,
            "Client-Secret": bridgeClientSecret,
            "Bridge-Version": "2025-01-15",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ external_user_id: externalUserId }),
        });
        const tData = await tRes.json();
        if (tData.access_token) {
          accessToken = tData.access_token;
        }
      } catch (err) {
        console.error("User creation or token retry failed:", err);
      }
    }

    // 3. Create Connect Session
    let connectUrl = "";
    if (accessToken) {
      const origin = req.headers.get("Origin") || "https://bylz.fr";
      const callbackUrl = `${origin}/settings?tab=bank&connected=true`;

      const sRes = await fetch("https://api.bridgeapi.io/v3/aggregation/connect-sessions", {
        method: "POST",
        headers: {
          "Client-Id": bridgeClientId,
          "Client-Secret": bridgeClientSecret,
          Authorization: `Bearer ${accessToken}`,
          "Bridge-Version": "2025-01-15",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_email: userEmail,
          callback_url: callbackUrl,
        }),
      });
      const sData = await sRes.json();
      if (sData.url) {
        connectUrl = sData.url;
      }
    }

    // Fallback if needed
    if (!connectUrl) {
      if (Deno.env.get("MOCK_BANK_SYNC") === "true") {
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const adminClient = createClient(supabaseUrl, serviceKey);

        const bankNames = ["BoursoBank (Pro)", "Crédit Agricole", "Revolut Business", "Qonto", "BNP Paribas"];
        const randomBank = bankNames[Math.floor(Math.random() * bankNames.length)];
        const providerItemId = `item-${Math.floor(Math.random() * 899999 + 100000)}`;

        await adminClient.from("bank_connections").upsert({
          company_id: company.id,
          provider_item_id: providerItemId,
          bank_name: randomBank,
          status: "active",
          connected_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        });

        const origin = req.headers.get("Origin") || "https://bylz.fr";
        connectUrl = `${origin}/settings?tab=bank&connected=true&mock_bank=${encodeURIComponent(randomBank)}`;
      } else {
        return new Response(JSON.stringify({ error: "Impossible de créer la session de connexion bancaire (Bridge API)" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, connect_url: connectUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("create-bridge-connect-session error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
