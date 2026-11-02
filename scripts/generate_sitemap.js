import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { BLOG_SLUG_REDIRECTS } from "../src/lib/blogSlugs.ts";
import { BLOG_ARTICLES } from "../src/data/blogArticles.ts";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
if (!process.env.NETLIFY) {
  loadEnv();
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = (supabaseUrl && anonKey && !supabaseUrl.includes("placeholder"))
  ? createClient(supabaseUrl, anonKey)
  : null;
const today = new Date().toISOString().slice(0, 10);
const publicPath = path.join(process.cwd(), "public", "sitemap.xml");

const staticUrls = [
  { loc: "https://bylz.fr/", priority: "1.0", changefreq: "daily" },
  { loc: "https://bylz.fr/tarifs", priority: "0.9", changefreq: "weekly" },
  { loc: "https://bylz.fr/fonctionnalites", priority: "0.9", changefreq: "weekly" },
  { loc: "https://bylz.fr/conformite", priority: "0.9", changefreq: "weekly" },
  { loc: "https://bylz.fr/facturation-electronique", priority: "0.9", changefreq: "weekly" },
  { loc: "https://bylz.fr/outils/simulateur-urssaf", priority: "0.9", changefreq: "weekly" },
  { loc: "https://bylz.fr/outils/simulateur-seuil-tva", priority: "0.9", changefreq: "weekly" },
  { loc: "https://bylz.fr/outils/modele-facture-gratuit", priority: "0.9", changefreq: "weekly" },
  { loc: "https://bylz.fr/blog", priority: "0.8", changefreq: "daily" },
  { loc: "https://bylz.fr/contact", priority: "0.6", changefreq: "monthly" },
  { loc: "https://bylz.fr/mentions-legales", priority: "0.3", changefreq: "yearly" },
  { loc: "https://bylz.fr/cgu", priority: "0.3", changefreq: "yearly" },
  { loc: "https://bylz.fr/confidentialite", priority: "0.3", changefreq: "yearly" },
];

async function generateSitemap() {
  console.log("Generating sitemap.xml...");

  const isNetlifyProduction = (process.env.NETLIFY === 'true' || process.env.NETLIFY === true) && process.env.CONTEXT === 'production';

  if (isNetlifyProduction && (!supabaseUrl || !anonKey || supabaseUrl.includes("placeholder"))) {
    console.error("FATAL [generate_sitemap]: En contexte de production Netlify (CONTEXT=production), les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont obligatoires.");
    process.exit(1);
  }

  const existingSitemapExists = fs.existsSync(publicPath);

  const blogMap = new Map();

  // Populate from static blog articles fallback copy
  for (const art of BLOG_ARTICLES) {
    const slug = BLOG_SLUG_REDIRECTS[art.slug] || art.slug;
    blogMap.set(slug, {
      loc: `https://bylz.fr/blog/${slug}`,
      lastmod: today,
      priority: "0.7",
      changefreq: "monthly",
    });
  }

  if (supabase) {
    try {
      const fetchPromise = supabase
        .from("blog_posts")
        .select("slug, updated_at, published_at")
        .eq("status", "published");
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase query timeout")), 4000)
      );
      const { data: posts, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        throw new Error(error.message);
      }

      if (posts && posts.length > 0) {
        for (const p of posts) {
          const canonicalSlug = BLOG_SLUG_REDIRECTS[p.slug] || p.slug;
          blogMap.set(canonicalSlug, {
            loc: `https://bylz.fr/blog/${canonicalSlug}`,
            lastmod: (p.updated_at || p.published_at || today).slice(0, 10),
            priority: "0.7",
            changefreq: "monthly",
          });
        }
      } else if (isNetlifyProduction) {
        console.error("FATAL [generate_sitemap]: En contexte de production Netlify (CONTEXT=production), la table blog_posts n'a renvoyé aucun article publié.");
        process.exit(1);
      }
    } catch (err) {
      if (isNetlifyProduction) {
        console.error("FATAL [generate_sitemap]: En contexte de production Netlify (CONTEXT=production), la requête sur la table blog_posts a échoué :", err.message);
        process.exit(1);
      }
      console.warn("AVERTISSEMENT [generate_sitemap]: Impossible de joindre la base distante (" + (process.env.CONTEXT || 'local') + "). Repli sur src/data/blogArticles.ts :", err.message);
    }
  } else if (!isNetlifyProduction) {
    console.warn("AVERTISSEMENT [generate_sitemap]: Supabase non configuré en contexte (" + (process.env.CONTEXT || 'local') + "). Repli sur la copie statique src/data/blogArticles.ts.");
  }

  const allUrls = [...staticUrls, ...Array.from(blogMap.values())];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const url of allUrls) {
    xml += `  <url>\n`;
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod || today}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  fs.writeFileSync(publicPath, xml, "utf8");
  console.log(`sitemap.xml generated successfully with ${allUrls.length} URLs!`);
}

generateSitemap();
