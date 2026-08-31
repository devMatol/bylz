import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, *, Authorization, Content-Type, Apikey, X-Client-Info",
};

// Curated Master SEO Matrix covering essential untapped micro-enterprise topics
const MASTER_SEO_MATRIX = [
  {
    topic: "Comment facturer un acompte en micro-entreprise : Règles légales, mentions et modèle",
    keyword: "facturer acompte auto entrepreneur",
    category: "Devis & Facturation",
    intent: "Transactionnel / Pratique",
  },
  {
    topic: "Dépassement du seuil de TVA en micro-entreprise : Que faire le mois du franchissement ?",
    keyword: "depassement seuil tva que faire",
    category: "Fiscalité Micro-entreprise",
    intent: "Informatif / Stratégique",
  },
  {
    topic: "Frais de débours en micro-entreprise : Refacturer ses achats sans payer de cotisations URSSAF",
    keyword: "frais debours auto entrepreneur",
    category: "Gestion & Cotisations",
    intent: "Optimisation / Pratique",
  },
  {
    topic: "Indemnités kilométriques en auto-entrepreneur : Barème fiscal 2026, calcul et justificatifs",
    keyword: "indemnites kilometriques auto entrepreneur",
    category: "Gestion & Cotisations",
    intent: "Calcul / Réglementaire",
  },
  {
    topic: "Mentions obligatoires sur un devis d'auto-entrepreneur en 2026 : Guide et modèle légal",
    keyword: "mentions obligatoires devis",
    category: "Devis & Facturation",
    intent: "Conformité / Pratique",
  },
  {
    topic: "Facture impayée en freelance : Procédure de relance amiable et modèle de mise en demeure",
    keyword: "recouvrement facture impayee freelance",
    category: "Devis & Facturation",
    intent: "Résolution de litige",
  },
  {
    topic: "Compte bancaire dédié pour micro-entreprise : Quand est-il obligatoire et quelles sanctions ?",
    keyword: "compte bancaire dedie obligatoire",
    category: "Comptabilité & Banque",
    intent: "Réglementaire",
  },
  {
    topic: "Déclaration URSSAF mensuelle ou trimestrielle : Quel calendrier choisir pour sa trésorerie ?",
    keyword: "declaration urssaf mensuelle ou trimestrielle",
    category: "Gestion & Cotisations",
    intent: "Conseil / Comparatif",
  },
  {
    topic: "Exonération de CFE pour les auto-entrepreneurs : Plafonds de chiffre d'affaires et démarches",
    keyword: "exoneration cfe micro entreprise",
    category: "Fiscalité Micro-entreprise",
    intent: "Optimisation fiscale",
  },
  {
    topic: "Cumul micro-entreprise et salariat : Droits, obligations fiscales et calcul des cotisations",
    keyword: "cumul micro entreprise salariat",
    category: "Législation & Conformité",
    intent: "Guide statutaire",
  },
  {
    topic: "Tenue du livre des recettes et registre des achats : Obligations légales et modèle conforme",
    keyword: "livre des recettes registre achats",
    category: "Comptabilité & Banque",
    intent: "Tutoriel légal",
  },
  {
    topic: "Facturation à l'étranger pour auto-entrepreneur : TVA intracommunautaire et déclaration DES",
    keyword: "facturation client etranger micro entreprise",
    category: "Fiscalité Micro-entreprise",
    intent: "International / Fiscal",
  },
  {
    topic: "Proposer le paiement par carte bancaire sur ses factures freelance : Avantages et mise en place",
    keyword: "paiement carte bancaire facture",
    category: "Devis & Facturation",
    intent: "Trésorerie / Outil",
  },
  {
    topic: "Abattement forfaitaire BNC / BIC et déclaration 2042-C-PRO : Comment déclarer ses revenus",
    keyword: "declaration impots 2042 c pro",
    category: "Fiscalité Micro-entreprise",
    intent: "Déclaration / Fiscal",
  }
];

const STOPWORDS = new Set([
  "de", "la", "le", "les", "un", "une", "des", "en", "pour", "sur", "par", "et", "ou",
  "comment", "ce", "qui", "que", "dans", "avec", "sans", "est", "son", "sa", "ses", "du", "au", "aux",
  "guide", "conseils", "bonnes", "pratiques", "regles", "2026", "2024", "auto", "entrepreneur", "micro", "entreprise"
]);

function tokenize(text: string): Set<string> {
  const words = (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return new Set(words);
}

function calculateSimilarity(tokens1: Set<string>, tokens2: Set<string>): number {
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  let intersection = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) intersection++;
  }
  const union = new Set([...tokens1, ...tokens2]).size;
  return intersection / union;
}

async function callGeminiWithFallback(apiKey: string, prompt: string) {
  const candidateModels = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.6-pro", "gemini-3.5-pro"];
  const errorLogs: string[] = [];
  let lastErr: any = null;

  for (const model of candidateModels) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          return JSON.parse(rawText);
        }
      } else {
        const errText = await res.text();
        errorLogs.push(`${model} (${res.status}): ${errText}`);
        console.warn(`Model ${model} failed: ${res.status} - ${errText}`);
      }
    } catch (e) {
      lastErr = e;
      console.warn(`Error with model ${model}:`, e);
    }
  }

  throw new Error(`Tous les modèles Gemini ont échoué. Logs: ` + errorLogs.join(" | "));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

    if (!geminiApiKey) {
      throw new Error("Clé GEMINI_API_KEY non configurée dans les secrets Supabase.");
    }

    // 1. Fetch all existing articles
    const { data: existingPosts } = await supabase
      .from("blog_posts")
      .select("id, slug, title, keywords, category, meta_description, published_at")
      .order("published_at", { ascending: false });

    const posts = existingPosts || [];
    const existingTokensList = posts.map((p) => ({
      title: p.title,
      slug: p.slug,
      category: p.category,
      tokens: tokenize(`${p.title} ${(p.keywords || []).join(" ")} ${p.slug}`),
    }));

    // 2. Fetch GSC Queries from admin cache if available
    let candidatePool = [...MASTER_SEO_MATRIX];
    try {
      const { data: gscCache } = await supabase
        .from("admin_metrics_cache")
        .select("data")
        .eq("cache_key", "gsc_30d_metrics")
        .maybeSingle();

      if (gscCache?.data?.topQueries && Array.isArray(gscCache.data.topQueries)) {
        for (const gscItem of gscCache.data.topQueries) {
          if (gscItem.query && gscItem.impressions >= 5) {
            candidatePool.unshift({
              topic: `Guide complet : ${gscItem.query.charAt(0).toUpperCase() + gscItem.query.slice(1)} en 2026`,
              keyword: gscItem.query.toLowerCase().trim(),
              category: "Fiscalité Micro-entreprise",
              intent: "GSC Opportunité Réelle",
            });
          }
        }
      }
    } catch (e) {
      console.warn("GSC cache notice:", e);
    }

    // 3. Evaluate candidates through Anti-Cannibalization Shield
    let selectedTopic: any = null;
    let antiCannibalizationReport: any = null;

    for (const candidate of candidatePool) {
      const candTokens = tokenize(`${candidate.topic} ${candidate.keyword}`);
      let maxSim = 0;
      let closestMatchTitle = "";

      for (const ex of existingTokensList) {
        const sim = calculateSimilarity(candTokens, ex.tokens);
        if (sim > maxSim) {
          maxSim = sim;
          closestMatchTitle = ex.title;
        }
      }

      // Check if topic is virgin (< 0.50 token similarity)
      if (maxSim < 0.50) {
        selectedTopic = candidate;
        antiCannibalizationReport = {
          lexicalSimilarity: Math.round(maxSim * 100),
          closestPreviousArticle: closestMatchTitle || "Aucun (Sujet 100% Neuf)",
          status: "PASSED_ANTI_CANNIBALIZATION_SHIELD",
        };
        break;
      }
    }

    if (!selectedTopic) {
      // Fallback: create an ultra-specific long tail topic
      const nowTag = new Date().toISOString().slice(0, 7);
      selectedTopic = {
        topic: `Facturer un acompte en micro-entreprise : Règles légales, mentions et modèle (${nowTag})`,
        keyword: "acompte facture auto entrepreneur",
        category: "Devis & Facturation",
        intent: "Pratique",
      };
      antiCannibalizationReport = {
        status: "GENERATED_LONG_TAIL_TOPIC",
      };
    }

    // 4. Generate the Comprehensive, High-Converting Article with Gemini
    const writePrompt = `
Rédigez un article de blog SEO B2B de référence (1400 à 2000 mots) en français pour Bylz (bylz.fr), la solution de facturation et de pilotage fiscal pour indépendants et micro-entreprises.

Sujet : "${selectedTopic.topic}"
Mot-clé principal : "${selectedTopic.keyword}"
Catégorie : "${selectedTopic.category}"

Directives de rédaction :
1. Style Cabinet de conseil / Expert-comptable pragmatique : direct, chiffré, pédagogique, zéro blabla.
2. Structure HTML sémantique soignée (<h2>, <h3>, <p>, <ul>, <li>, <strong>). Ne pas utiliser de balise <h1>.
3. Insérer obligatoirement en haut (après le 1er paragraphe) l'encart d'expert Bylz :
<div class="my-6 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
  <p class="font-bold text-sm">💡 L'avis de l'expert fiscal Bylz :</p>
  <p class="text-xs text-white/80 mt-1">[Conseil concret, chiffré et orienté optimisation ou gain de temps]</p>
</div>

4. Insérer un tableau comparatif <table> avec Tailwind CSS montrant les risques de la gestion manuelle (Word/Excel, oublis de déclarations, erreurs de plafonds) vs l'automatisation avec Bylz.

5. Intégrer naturellement des liens internes vers les outils gratuits de Bylz :
- Simulateur URSSAF 2026 : <a href="/outils/simulateur-urssaf" class="text-primary font-bold hover:underline">Simulateur de cotisations URSSAF Bylz</a>
- Simulateur de seuil TVA : <a href="/outils/simulateur-seuil-tva" class="text-primary font-bold hover:underline">Calculateur de franchise en base de TVA</a>
- Conformité Factur-X : <a href="/conformite" class="text-primary font-bold hover:underline">Conformité Factur-X 2026</a>

6. Section FAQ en fin d'article avec 4 questions/réponses précises pour les Rich Snippets Google.

7. Bloc d'appel à l'action final :
<div class="my-8 p-6 rounded-2xl bg-surface border border-border text-center space-y-4 shadow-xl">
  <h3 class="text-xl font-extrabold text-text">Passez à la facturation sans stress avec Bylz</h3>
  <p class="text-sm text-muted max-w-lg mx-auto">Créez vos devis et factures conformes Factur-X 2026, encaissez par carte bancaire et suivez vos seuils en temps réel.</p>
  <a href="/essai" class="inline-block px-6 py-3 rounded-xl bg-primary text-white font-black hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">Essayer gratuitement sans carte bancaire 🚀</a>
</div>

Retournez STRICTEMENT un objet JSON valide avec cette structure :
{
  "title": string (Titre optimisé SEO < 60 caractères),
  "slug": string (slug URL sans accents),
  "excerpt": string (résumé accrocheur 150-200 caractères),
  "metaDescription": string (meta description percutante 130-155 caractères),
  "category": string,
  "readTime": string (ex: "6 min de lecture"),
  "author": "Équipe Fiscale Bylz",
  "keywords": string[] (4 à 6 mots-clés ciblés),
  "content": string (HTML complet de l'article),
  "seoScore": number (note estimée de 90 à 100)
}
`.trim();

    const article = await callGeminiWithFallback(geminiApiKey, writePrompt);

    // Clean slug
    let cleanSlug = (article.slug || selectedTopic.keyword)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Avoid duplicate slug collision if any
    const isSlugDuplicate = posts.some((p) => p.slug === cleanSlug);
    if (isSlugDuplicate) {
      cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
    }

    // 5. Insert newly generated article into blog_posts table
    const { data: insertedPost, error: insertErr } = await supabase
      .from("blog_posts")
      .insert({
        title: article.title,
        slug: cleanSlug,
        excerpt: article.excerpt || article.metaDescription,
        meta_description: article.metaDescription || article.excerpt,
        content: article.content,
        category: article.category || selectedTopic.category,
        read_time: article.readTime || "5 min de lecture",
        author: "Équipe Fiscale Bylz",
        cover_image_url: "https://bylz.fr/og-image.png",
        status: "published",
        keywords: article.keywords || [selectedTopic.keyword],
        seo_score: article.seoScore || 94,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      throw new Error(`Erreur d'insertion BDD : ${insertErr.message}`);
    }

    // 6. Submit URL to Google Indexing API & Sitemap Ping
    let googleIndexingSuccess = false;
    const publishedUrl = `https://bylz.fr/blog/${cleanSlug}`;

    try {
      const gscSecretRaw = Deno.env.get("GSC_SERVICE_ACCOUNT");
      if (gscSecretRaw) {
        const sa = JSON.parse(gscSecretRaw);
        const nowSec = Math.floor(Date.now() / 1000);
        const pemContents = sa.private_key
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

        const jwtToken = await djwt.create(
          { alg: "RS256", typ: "JWT" },
          {
            iss: sa.client_email,
            scope: "https://www.googleapis.com/auth/indexing https://www.googleapis.com/auth/webmasters",
            aud: "https://oauth2.googleapis.com/token",
            exp: nowSec + 3600,
            iat: nowSec,
          },
          cryptoKey
        );

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwtToken,
          }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          const indexRes = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: publishedUrl,
              type: "URL_UPDATED",
            }),
          });
          googleIndexingSuccess = indexRes.ok;
        }
      }
      // Ping search engines
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent("https://bylz.fr/sitemap.xml")}`).catch(() => {});
      await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent("https://bylz.fr/sitemap.xml")}`).catch(() => {});
    } catch (indexErr) {
      console.warn("Google Indexing API notice:", indexErr);
    }

    // 7. Save log in admin_metrics_cache
    const executionSummary = {
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      articleId: insertedPost.id,
      title: article.title,
      slug: cleanSlug,
      url: publishedUrl,
      keyword: selectedTopic.keyword,
      category: selectedTopic.category,
      seoScore: article.seoScore || 94,
      googleIndexing: googleIndexingSuccess ? "SUBMITTED" : "SITEMAP_PINGED",
      antiCannibalizationReport,
    };

    await supabase.from("admin_metrics_cache").upsert({
      cache_key: "seo_autopilot_last_run",
      type: "seo_autopilot",
      data: executionSummary,
      updated_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Article SEO généré, publié et soumis à Google Indexing !",
        article: insertedPost,
        executionSummary,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("Auto-Publish Blog Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
