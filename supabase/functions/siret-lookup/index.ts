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
    // Built-in Mock Test SIRETs for Sandbox Testing
    if (siret === "81234567800012") {
      return new Response(
        JSON.stringify({
          legal_name: "STUDIO BYLZ SAS",
          address: "10 RUE DE LA PAIX 75002 PARIS",
          naf_code: "6201Z",
          naf_label: "Programmation informatique",
          active: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (siret === "98765432100020") {
      return new Response(
        JSON.stringify({
          legal_name: "AGENCE HORIZON DIGITAL SARL",
          address: "45 AVENUE MONTAIGNE 75008 PARIS",
          naf_code: "7022Z",
          naf_label: "Conseil pour les affaires",
          active: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Try official free French State Open API (https://recherche-entreprises.api.gouv.fr)
    try {
      const openGovRes = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${siret}&page=1&per_page=1`
      );
      if (openGovRes.ok) {
        const govJson = await openGovRes.json();
        const firstResult = govJson?.results?.[0];
        if (firstResult) {
          const etab = firstResult.matching_etablissements?.[0] || firstResult.siege || {};
          const legalName = firstResult.nom_complet || firstResult.nom_raison_sociale || "Entreprise";
          const address = etab.adresse || etab.adresse_complete || `${etab.code_postal || ""} ${etab.libelle_commune || ""}`.trim();
          const nafCode = etab.activite_principale || firstResult.activite_principale || "";
          const active = etab.etat_administratif === "A" || firstResult.etat_administratif === "A";

          return new Response(
            JSON.stringify({
              legal_name: legalName,
              address: address,
              naf_code: nafCode,
              naf_label: "",
              active: active,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (e) {
      console.warn("Recherche-entreprises.api.gouv.fr fallback error:", e);
    }

    // 2. Try INSEE API if token is configured
    const token = Deno.env.get("INSEE_API_TOKEN");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "SIRET introuvable dans le registre officiel." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      return new Response(
        JSON.stringify({ error: "SIRET introuvable dans le registre SIRENE" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await apiRes.json();
    const etab = json?.etablissement || {};
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
    const active = periode.etatAdministratifEtablissement === "A";

    const legalName =
      unite.denominationUniteLegale ||
      `${unite.prenomUsuelUniteLegale || ""} ${unite.nomUniteLegale || ""}`.trim() ||
      "Entreprise";

    return new Response(
      JSON.stringify({
        legal_name: legalName,
        address,
        naf_code: nafCode,
        naf_label: "",
        active,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
