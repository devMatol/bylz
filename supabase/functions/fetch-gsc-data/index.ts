import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { djwt } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const gscSecretRaw = Deno.env.get("GSC_SERVICE_ACCOUNT");
    if (!gscSecretRaw) {
      return new Response(
        JSON.stringify({ error: "GSC_SERVICE_ACCOUNT secret is missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const sa = JSON.parse(gscSecretRaw);
    const clientEmail = sa.client_email;
    const privateKeyPem = sa.private_key;

    // 1. Generate JWT Access Token for Google API
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    // Format PEM key for Web Crypto
    const pemContents = privateKeyPem
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\s/g, "");
    const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const jwtToken = await djwt.create({ alg: "RS256", typ: "JWT" }, payload, cryptoKey);

    // Exchange JWT for OAuth2 Access Token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwtToken,
      }),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error(`Failed to obtain Google access token: ${JSON.stringify(tokenData)}`);
    }

    // 2. Fetch 30-day performance data from Search Console API
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const siteUrl = encodeURIComponent("sc-domain:bylz.fr");
    const gscApiUrl = `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`;

    // Query Top Keywords
    const queryReq = await fetch(gscApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 10,
      }),
    });

    const queryData = await queryReq.json();

    // Query Top Pages
    const pagesReq = await fetch(gscApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["page"],
        rowLimit: 10,
      }),
    });

    const pagesData = await pagesReq.json();

    // Aggregate metrics
    const topQueries = (queryData.rows || []).map((r: any) => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: Number((r.ctr * 100).toFixed(1)),
      position: Number(r.position.toFixed(1)),
    }));

    const topPages = (pagesData.rows || []).map((r: any) => ({
      page: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
    }));

    const totalClicks = topQueries.reduce((acc: number, item: any) => acc + item.clicks, 0);
    const totalImpressions = topQueries.reduce((acc: number, item: any) => acc + item.impressions, 0);
    const avgCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(1)) : 0;
    const avgPos = topQueries.length > 0
      ? Number((topQueries.reduce((acc: number, i: any) => acc + i.position, 0) / topQueries.length).toFixed(1))
      : 0;

    const formattedMetrics = {
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: avgCtr,
      position: avgPos,
      topQueries,
      topPages,
      updatedAt: new Date().toISOString(),
    };

    // 3. Save into admin_metrics_cache
    await supabase.from("admin_metrics_cache").upsert({
      cache_key: "gsc_30d_metrics",
      type: "gsc",
      data: formattedMetrics,
      updated_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, metrics: formattedMetrics }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("GSC Sync Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
