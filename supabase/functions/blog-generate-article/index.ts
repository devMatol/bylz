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
    const body = await req.json();
    const { topic, keyword, category } = body;
    if (!topic || !keyword) {
      return new Response(
        JSON.stringify({ error: "Les paramètres topic et keyword sont requis." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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

    // 4. Construct prompt for premium B2B content generation
    const prompt = `
Rédigez un article de blog SEO B2B haut de gamme en français pour le site de Bylz (bylz.fr), la plateforme de facturation et de gestion pour micro-entrepreneurs.

Sujet de l'article : "${topic}"
Mot-clé principal à cibler : "${keyword}"
Catégorie de l'article : "${category || "Guides & Fiscalité"}"

Directives d'écriture et de style (STYLE CABINET DE CONSEIL / MCKINSEY) :
1. Évitez absolument les clichés et phrases typiques des rédactions d'IA (bannir : "dans le monde d'aujourd'hui", "révolutionner", "il est crucial de", "à l'ère du numérique", "le paysage professionnel", "en conclusion"). Utilisez un ton direct, factuel, expert, chiffré et orienté efficacité.
2. Structurez le texte avec du HTML sémantique propre (<h2>, <h3>, <p>, <ul>, <li>, <strong>). Interdiction d'utiliser la balise <h1>.
3. Insérez STRICTEMENT au tout début du contenu (juste après l'introduction ou premier paragraphe) cet encart d'expert exact avec son style CSS :
<div class="my-6 p-5 rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
  <p class="font-bold text-sm">💡 L'avis de l'expert Bylz :</p>
  <p class="text-xs text-white/70 mt-1">[Insérez ici un conseil d'expert comptable ou fiscal senior, chiffré, pragmatique et orienté vers l'optimisation des revenus ou le gain de temps]</p>
</div>

4. Intégrez obligatoirement dans le corps de l'article un tableau comparatif <table> complet et propre (avec thead, tbody, tr, th, td) montrant l'écart de performance et de sécurité entre :
   - D'une part, les processus classiques (Excel/Word manuel, relances oubliées, risques d'erreurs URSSAF).
   - D'autre part, la solution automatisée Bylz (Factur-X 2026 natif, relance auto, synchronisation bancaire).
   Utilisez les classes Tailwind CSS de Bylz pour styliser le tableau :
   <table class="w-full text-xs text-left border-collapse my-6 border border-border">
     <thead>
       <tr class="bg-surface border-b border-border">
         <th class="p-3 font-bold text-text">...</th>
       </tr>
     </thead>
     <tbody class="divide-y divide-border">
       <tr>
         <td class="p-3 font-semibold text-text">...</td>
       </tr>
     </tbody>
   </table>

5. Positionnez commercialement Bylz comme l'alternative moderne, abordable et sécurisée aux logiciels lourds ou aux calculs fastidieux.

6. Terminez impérativement l'article par ce bloc de conversion final exact :
<div class="my-8 p-6 rounded-2xl bg-surface border border-border text-center space-y-4 shadow-xl">
  <h3 class="text-xl font-extrabold text-text">Gagnez du temps et sécurisez votre facturation dès aujourd'hui</h3>
  <p class="text-sm text-muted max-w-lg mx-auto">Rejoignez les micro-entrepreneurs qui utilisent Bylz pour éditer leurs devis, encaisser par carte bancaire et piloter leur chiffre d'affaires.</p>
  <a href="/signup" class="inline-block px-6 py-3 rounded-xl bg-primary text-white font-black hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">Créer mon compte gratuit Bylz 🚀</a>
</div>

Remplissez les champs de retour structuré demandés par le schéma de réponse.
`.trim();

    // 5. Call Gemini API with strict response schema
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`,
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
            responseSchema: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                excerpt: { type: "STRING" },
                metaDescription: { type: "STRING" },
                content: { type: "STRING" },
                readTime: { type: "STRING" },
                keywords: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["title", "excerpt", "metaDescription", "content", "readTime", "keywords"],
            },
          },
        }),
      }
    );

    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    const articleData = JSON.parse(responseText);

    return new Response(JSON.stringify(articleData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error in blog-generate-article:", err);
    return new Response(JSON.stringify({ error: err.message || "Erreur interne" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
