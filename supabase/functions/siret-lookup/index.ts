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

    // 1. Official Free French State Open API (https://recherche-entreprises.api.gouv.fr)
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
      console.warn("Recherche-entreprises API fallback error:", e);
    }

    // 2. Official INSEE API (if INSEE_API_TOKEN secret is configured)
    const token = Deno.env.get("INSEE_API_TOKEN");
    if (token) {
      const apiRes = await fetch(`https://api.insee.fr/api-sirene/3.11/siret/${siret}`, {
        headers: {
          "X-INSEE-Api-Key-Integration": token,
          Accept: "application/json",
        },
      });

      if (apiRes.ok) {
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

        const legalName =
          unite.denominationUniteLegale ||
          `${unite.prenomUsuelUniteLegale || ""} ${unite.nomUniteLegale || ""}`.trim() ||
          "Entreprise";

        return new Response(
          JSON.stringify({
            legal_name: legalName,
            address: addressParts.join(" "),
            naf_code: etab.activitePrincipaleEtablissement || unite.activitePrincipaleUniteLegale || "",
            naf_label: "",
            active: periode.etatAdministratifEtablissement === "A",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "SIRET introuvable dans le registre officiel." }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
