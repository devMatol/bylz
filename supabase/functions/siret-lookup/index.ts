/*
 * SIRET Lookup Edge Function
 * ---------------------------
 * Proxies the INSEE Sirene API to look up a French establishment by SIRET.
 *
 * Required secret: INSEE_API_TOKEN
 *   Obtain a token at https://api.insee.fr/ (create an app, subscribe to the
 *   "Sirene - API Sirene v3" service, then generate a bearer token).
 *   Set it as an edge function secret named INSEE_API_TOKEN.
 *
 * Endpoint: POST /functions/v1/siret-lookup
 * Body: { "siret": "12345678901234" }
 * Response: { "legal_name": "...", "address": "...", "naf_code": "...", "naf_label": "...", "active": true }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const siret = String(body?.siret || "").replace(/\s/g, "");

    if (!siret || !/^\d{14}$/.test(siret)) {
      return new Response(
        JSON.stringify({ error: "SIRET invalide (14 chiffres requis)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Built-in Mock Test SIRETs for Sandbox Testing
    if (siret === "81234567800012") {
    }

    const token = Deno.env.get("INSEE_API_TOKEN");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Service de recherche SIRET non configuré" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiRes = await fetch(
      `https://api.insee.fr/api-sirene/3.11/siret/${siret}`,
      {
        headers: {
          "X-INSEE-Api-Key-Integration": token,
          Accept: "application/json",
        },
      }
    );

    if (!apiRes.ok) {
      if (apiRes.status === 404) {
        return new Response(
          JSON.stringify({ error: "SIRET introuvable dans le registre SIRENE" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `Erreur INSEE (HTTP ${apiRes.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await apiRes.json();
    const etab = json?.etablissement;
    if (!etab) {
      return new Response(
        JSON.stringify({ error: "Réponse INSEE inattendue" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const unite = etab.uniteLegale || {};
    const adresse = etab.adresseEtablissement || {};
    const periode = etab.periodeEtablissement || {};

    const addressParts = [
      adresse.numeroVoieEtablissement,
      adresse.typeVoieEtablissement,
      adresse.libelleVoieEtablissement,
      adresse.codePostalEtablissement,
      adresse.libelleCommuneEtablissement,
    ].filter(Boolean);
    const address = addressParts.join(" ");

    const nafCode = etab.activitePrincipaleEtablissement || unite.activitePrincipaleUniteLegale || "";
    const nafLabel = unite.nomenclatureActivitePrincipaleUniteLegale || "";

    const active =
      periode.etatAdministratifEtablissement === "A" &&
      (unite.etatAdministratifUniteLegale === "A" || !unite.etatAdministratifUniteLegale);

    const legalName =
      unite.denominationUniteLegale ||
      `${unite.prenomUsuelUniteLegale || ""} ${unite.nomUniteLegale || ""}`.trim() ||
      "Entreprise";

    return new Response(
      JSON.stringify({
        legal_name: legalName,
        address,
        naf_code: nafCode,
        naf_label: nafLabel,
        active,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
