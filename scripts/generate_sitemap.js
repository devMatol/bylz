import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sbwbjkzustnlnnilkogm.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2Jqa3p1c3RubG5uaWxrb2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTk5MzYsImV4cCI6MjEwMDAzNTkzNn0.OjKjWTdgWiGyecOsvIu_OjCwOExiDKR74eow-Lleo40";

const supabase = createClient(supabaseUrl, anonKey);
const today = new Date().toISOString().slice(0, 10);

const staticUrls = [
  { loc: "https://bylz.fr/", priority: "1.0", changefreq: "daily" },
  { loc: "https://bylz.fr/tarifs", priority: "0.9", changefreq: "weekly" },
  { loc: "https://bylz.fr/fonctionnalites", priority: "0.9", changefreq: "weekly" },
  { loc: "https://bylz.fr/conformite", priority: "0.9", changefreq: "weekly" },
  { loc: "https://bylz.fr/outils/simulateur-urssaf", priority: "0.9", changefreq: "weekly" },
  { loc: "https://bylz.fr/outils/simulateur-seuil-tva", priority: "0.9", changefreq: "weekly" },
  { loc: "https://bylz.fr/outils/modele-facture-gratuit", priority: "0.9", changefreq: "weekly" },
  { loc: "https://bylz.fr/blog", priority: "0.8", changefreq: "daily" },
  { loc: "https://bylz.fr/contact", priority: "0.6", changefreq: "monthly" },
  { loc: "https://bylz.fr/mentions-legales", priority: "0.3", changefreq: "yearly" },
  { loc: "https://bylz.fr/cgu", priority: "0.3", changefreq: "yearly" },
  { loc: "https://bylz.fr/confidentialite", priority: "0.3", changefreq: "yearly" },
];

const STATIC_BLOG_SLUGS = [
  "reforme-factur-x-2026-auto-entrepreneurs",
  "franchise-tva-2026-seuils-et-regles",
  "calcul-cotisations-urssaf-bnc-bic",
  "modele-facture-auto-entrepreneur-gratuit"
];

async function generateSitemap() {
  console.log("Generating sitemap.xml...");

  const blogMap = new Map();

  for (const slug of STATIC_BLOG_SLUGS) {
    blogMap.set(slug, {
      loc: `https://bylz.fr/blog/${slug}`,
      lastmod: today,
      priority: "0.7",
      changefreq: "monthly",
    });
  }

  try {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published");

    if (posts && posts.length > 0) {
      for (const p of posts) {
        blogMap.set(p.slug, {
          loc: `https://bylz.fr/blog/${p.slug}`,
          lastmod: (p.updated_at || p.published_at || today).slice(0, 10),
          priority: "0.7",
          changefreq: "monthly",
        });
      }
    }
  } catch (err) {
    console.warn("Notice fetching blog posts for sitemap:", err);
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

  const publicPath = path.join(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(publicPath, xml, "utf8");
  console.log(`sitemap.xml generated successfully with ${allUrls.length} URLs!`);
}

generateSitemap();
