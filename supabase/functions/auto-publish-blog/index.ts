import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, *, Authorization, Content-Type, Apikey, X-Client-Info",
};

// 8 Diversified Pillars with 40+ Long-Tail Micro-Enterprise Topics
const EXPANDED_NICHE_MATRIX = [
  // 1. Artisans & BTP
  {
    topic: "Facturation pour artisan du bâtiment : Mentions assurance décennale et devis conformes",
    keyword: "facturation artisan batiment decennale",
    category: "Devis & Facturation",
    niche: "Artisans & BTP",
  },
  {
    topic: "Sous-traitance dans le BTP en micro-entreprise : Autoliquidation de la TVA et règles",
    keyword: "autoliquidation tva btp sous traitance",
    category: "Fiscalité Micro-entreprise",
    niche: "Artisans & BTP",
  },

  // 2. Freelances Tech & Développeurs
  {
    topic: "Développeur freelance et tech : Facturer son TJM, gérer ses devis et ses acomptes",
    keyword: "facturation developpeur freelance tjm",
    category: "Devis & Facturation",
    niche: "Freelances Tech",
  },
  {
    topic: "Facturation de prestations à l'étranger pour indépendant : TVA intracommunautaire et DES",
    keyword: "facturation client etranger micro entreprise",
    category: "Fiscalité Micro-entreprise",
    niche: "Freelances Tech",
  },

  // 3. Consultants, Formateurs & Coachs
  {
    topic: "Consultant et formateur indépendant : Exonération de TVA formation et mentions obligatoires",
    keyword: "exoneration tva formation professionnelle consultant",
    category: "Fiscalité Micro-entreprise",
    niche: "Consultants & Formateurs",
  },
  {
    topic: "Frais de déplacement et de mission : Refacturation en débours sans cotisations URSSAF",
    keyword: "refacturation frais deplacement debours",
    category: "Gestion & Cotisations",
    niche: "Consultants & Formateurs",
  },

  // 4. Créatifs & Médias (Photographes, Graphistes, Vidéastes)
  {
    topic: "Facturation photographe et graphiste : Distinguer cession de droits d'auteur et prestation",
    keyword: "facturation graphiste droits auteur",
    category: "Législation & Conformité",
    niche: "Créatifs & Médias",
  },

  // 5. Immobilier & Agents Commerciaux
  {
    topic: "Agent commercial immobilier en micro-entreprise : Facturation des commissions et TVA",
    keyword: "facturation agent commercial immobilier",
    category: "Fiscalité Micro-entreprise",
    niche: "Immobilier",
  },

  // 6. Trésorerie, Acomptes & Recouvrement
  {
    topic: "Comment facturer un acompte en micro-entreprise : Règles légales, mentions et modèle",
    keyword: "facturer acompte auto entrepreneur",
    category: "Devis & Facturation",
    niche: "Trésorerie & Facturation",
  },
  {
    topic: "Facture impayée en freelance : Procédure de relance amiable et modèle de mise en demeure",
    keyword: "recouvrement facture impayee freelance",
    category: "Devis & Facturation",
    niche: "Trésorerie & Facturation",
  },
  {
    topic: "Proposer le paiement par carte bancaire sur ses factures : Diviser par 3 les délais de paiement",
    keyword: "paiement carte bancaire facture freelance",
    category: "Devis & Facturation",
    niche: "Paiements & Trésorerie",
  },

  // 7. Fiscalité Pointue & Seuil TVA
  {
    topic: "Dépassement du seuil de TVA en micro-entreprise : Que faire le mois exact du franchissement ?",
    keyword: "depassement seuil tva que faire",
    category: "Fiscalité Micro-entreprise",
    niche: "Fiscalité & TVA",
  },
  {
    topic: "Exonération de CFE pour les auto-entrepreneurs : Plafonds de chiffre d'affaires et démarches",
    keyword: "exoneration cfe micro entreprise",
    category: "Fiscalité Micro-entreprise",
    niche: "Fiscalité & Taxes",
  },
  {
    topic: "Abattement forfaitaire BNC / BIC et déclaration 2042-C-PRO : Guide fiscal pas à pas",
    keyword: "declaration impots 2042 c pro micro entrepreneur",
    category: "Fiscalité Micro-entreprise",
    niche: "Impôts & Revenus",
  },

  // 8. Gestion & Cotisations
  {
    topic: "Indemnités kilométriques en auto-entrepreneur : Barème fiscal 2026, calcul et justificatifs",
    keyword: "indemnites kilometriques auto entrepreneur",
    category: "Gestion & Cotisations",
    niche: "Optimisation des Charges",
  },
  {
    topic: "Déclaration URSSAF mensuelle ou trimestrielle : Quel calendrier choisir pour sa trésorerie ?",
    keyword: "declaration urssaf mensuelle ou trimestrielle",
    category: "Gestion & Cotisations",
    niche: "Cotisations Sociales",
  },
  {
    topic: "Compte bancaire dédié pour micro-entreprise : Quand est-il obligatoire et quelles sanctions ?",
    keyword: "compte bancaire dedie obligatoire",
    category: "Comptabilité & Banque",
    niche: "Banque & Réglementaire",
  },
  {
    topic: "Tenue du livre des recettes et registre des achats : Obligations légales et modèle conforme",
    keyword: "livre des recettes registre achats obligatoire",
    category: "Comptabilité & Banque",
    niche: "Comptabilité & Registres",
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

async function callGemini(apiKey: string, prompt: string) {
  const candidateModels = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.6-pro"];
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
        console.warn(`Model ${model} failed: ${res.status} - ${errText.slice(0, 100)}`);
      }
    } catch (e) {
      lastErr = e;
      console.warn(`Error with model ${model}:`, e);
    }
  }

  throw new Error(`Génération IA impossible : ${lastErr?.message || "Erreur de modèle"}`);
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

    let payloadGuidance = "";
    try {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        payloadGuidance = (body?.guidance || body?.niche || "").trim().toLowerCase();
      }
    } catch {
      // Ignored
    }

    // 1. Fetch all existing articles
    const { data: existingPosts } = await supabase
      .from("blog_posts")
      .select("id, slug, title, keywords, category, published_at")
      .order("published_at", { ascending: false });

    const posts = existingPosts || [];
    const existingTokensList = posts.map((p) => ({
      title: p.title,
      slug: p.slug,
      category: p.category,
      tokens: tokenize(`${p.title} ${(p.keywords || []).join(" ")} ${p.slug}`),
    }));

    // 2. Select Candidate through Niche Guidance & Anti-Cannibalization Filter
    let candidatePool = [...EXPANDED_NICHE_MATRIX];

    if (payloadGuidance) {
      // Prioritize matched niche
      candidatePool.sort((a, b) => {
        const matchA = a.niche.toLowerCase().includes(payloadGuidance) || a.category.toLowerCase().includes(payloadGuidance) ? 1 : 0;
        const matchB = b.niche.toLowerCase().includes(payloadGuidance) || b.category.toLowerCase().includes(payloadGuidance) ? 1 : 0;
        return matchB - matchA;
      });
    }

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

      // Check if topic is virgin (< 0.40 token similarity)
      if (maxSim < 0.40) {
        selectedTopic = candidate;
        antiCannibalizationReport = {
          lexicalSimilarity: Math.round(maxSim * 100),
          closestPreviousArticle: closestMatchTitle || "Aucun (Sujet 100% Inédit)",
          status: "PASSED_ANTI_CANNIBALIZATION_SHIELD",
          niche: candidate.niche,
        };
        break;
      }
    }

    if (!selectedTopic) {
      // Create dynamically indexed topic
      const count = posts.length + 1;
      selectedTopic = {
        topic: `Gestion fiscale et facturation micro-entreprise : Guide pratique #${count}`,
        keyword: `gestion fiscale auto entrepreneur guide ${count}`,
        category: "Fiscalité Micro-entreprise",
        niche: "Généraliste",
      };
      antiCannibalizationReport = { status: "FALLBACK_GENERATION" };
    }

    // 3. Generate the High-Converting Article with Gemini
    const writePrompt = `
Rédigez un article de blog SEO B2B de référence (1300 à 1700 mots) en français pour Bylz (bylz.fr), le logiciel de facturation Factur-X et de pilotage fiscal pour indépendants et micro-entreprises.

Sujet : "${selectedTopic.topic}"
Mot-clé principal : "${selectedTopic.keyword}"
Catégorie : "${selectedTopic.category}"
Cible / Niche : "${selectedTopic.niche}"

Directives de rédaction :
1. Style Cabinet de conseil / Expert-comptable pragmatique : direct, chiffré, pédagogique, zéro blabla.
2. Structure HTML sémantique soignée (<h2>, <h3>, <p>, <ul>, <li>, <strong>). Ne pas utiliser de balise <h1>.
3. Insérer obligatoirement après le 1er paragraphe l'encart d'expert Bylz :
<div class="my-6 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
  <p class="font-bold text-sm">💡 L'avis de l'expert fiscal Bylz :</p>
  <p class="text-xs text-white/80 mt-1">[Conseil concret, chiffré et orienté optimisation fiscale ou gain de temps]</p>
</div>

4. Insérer un tableau comparatif <table> avec classes Tailwind montrant les risques de la gestion manuelle (Word/Excel, oublis) vs l'automatisation avec Bylz.

5. Intégrer des liens internes vers les outils gratuits de Bylz :
- <a href="/outils/simulateur-urssaf" class="text-primary font-bold hover:underline">Simulateur de cotisations URSSAF Bylz</a>
- <a href="/outils/simulateur-seuil-tva" class="text-primary font-bold hover:underline">Calculateur de seuil de TVA</a>
- <a href="/conformite" class="text-primary font-bold hover:underline">Conformité Factur-X 2026</a>

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
  "excerpt": string (résumé 150-200 caractères),
  "metaDescription": string (meta description 130-155 caractères),
  "category": string,
  "readTime": string (ex: "6 min de lecture"),
  "author": "Équipe Fiscale Bylz",
  "keywords": string[] (4 à 6 mots-clés ciblés),
  "content": string (HTML complet de l'article),
  "seoScore": number (note estimée de 92 à 100)
}
`.trim();

    const article = await callGemini(geminiApiKey, writePrompt);

    // Clean slug
    let cleanSlug = (article.slug || selectedTopic.keyword)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const isDuplicate = posts.some((p) => p.slug === cleanSlug);
    if (isDuplicate) {
      cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
    }

    // 4. Insert into database
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
        seo_score: article.seoScore || 96,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      throw new Error(`Erreur d'insertion BDD : ${insertErr.message}`);
    }

    // 5. Submit to Google Indexing API & Sitemap Ping
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
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent("https://bylz.fr/sitemap.xml")}`).catch(() => {});
      await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent("https://bylz.fr/sitemap.xml")}`).catch(() => {});
    } catch (indexErr) {
      console.warn("Google Indexing API notice:", indexErr);
    }

    // 6. Save log
    const executionSummary = {
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      articleId: insertedPost.id,
      title: article.title,
      slug: cleanSlug,
      url: publishedUrl,
      keyword: selectedTopic.keyword,
      category: selectedTopic.category,
      niche: selectedTopic.niche,
      seoScore: article.seoScore || 96,
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
        message: `Article SEO "${article.title}" publié avec succès !`,
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
