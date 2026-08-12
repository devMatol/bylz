import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireOperator, unauthorized } from "../_shared/require-operator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, *, Authorization, Content-Type, Apikey, X-Client-Info",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 1. Authorize - only administrators can run this function
    const operator = await requireOperator(req);
    if (!operator.allowed) {
      return unauthorized(corsHeaders);
    }

    // 2. Parse request payload
    let guidance = "";
    try {
      const body = await req.json();
      guidance = body.guidance || "";
    } catch {
      // Body may be empty, proceed with default guidance
    }

    // 3. Check Gemini API key
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY is not configured in Supabase secrets.");
      return new Response(
        JSON.stringify({ error: "Clé d'API Gemini non configurée dans Supabase" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Construct prompt for keyword suggestions
    const prompt = `
Vous êtes un expert en marketing d'acquisition SEO B2B pour Bylz, une plateforme SaaS de facturation et de gestion fiscale destinée aux micro-entrepreneurs et indépendants en France.
Votre objectif est de proposer exactement 6 opportunités de mots-clés d'acquisition SEO ultra-ciblés, orientés business et à fort taux de conversion pour Bylz.

Les suggestions doivent cibler :
- Des intentions transactionnelles ou des douleurs opérationnelles spécifiques aux indépendants (gestion de la TVA, franchise de base, déclarations URSSAF, impayés, devis à signer, conformité Factur-X 2026).
- Des thèmes d'aide à la décision (comparaison outils manuels vs automatisés, limites d'Excel, etc.).

${guidance ? `L'utilisateur souhaite orienter les suggestions vers la thématique ou le secteur suivant : "${guidance}". Veuillez adapter vos 6 suggestions pour qu'elles s'articulent autour de ce thème tout en restant centrées sur la facturation, les devis, la gestion ou la fiscalité des indépendants.` : "Générez des suggestions généralistes d'acquisition B2B pour auto-entrepreneurs."}

Retournez STRICTEMENT un tableau JSON de 6 objets respectant cette structure exacte, sans texte d'introduction ni de conclusion, sans bloc de code markdown (pas de triple backticks) :
[
  {
    "keyword": "mot-clé en minuscules",
    "volume": "1200/mois",
    "difficulty": "Faible" | "Moyenne" | "Élevée",
    "intent": "Guide Pratique" | "Transactionnel" | "Informationnel",
    "suggestedTitle": "Titre suggéré accrocheur et professionnel",
    "category": "Nom de la catégorie (ex: Fiscalité Micro-entreprise, Facturation & Devis, Législation & Conformité, Productivité & Outils)"
  }
]
`.trim();

    // 5. Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    
    // Clean potential markdown wrap just in case
    const cleanedText = responseText.replace(/^\s*```json/i, "").replace(/```\s*$/, "").trim();
    const suggestions = JSON.parse(cleanedText);

    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error in blog-suggest-topics:", err);
    return new Response(JSON.stringify({ error: err.message || "Erreur interne" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
