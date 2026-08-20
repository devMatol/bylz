import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sbwbjkzustnlnnilkogm.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2Jqa3p1c3RubG5uaWxrb2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTk5MzYsImV4cCI6MjEwMDAzNTkzNn0.OjKjWTdgWiGyecOsvIu_OjCwOExiDKR74eow-Lleo40";

const supabase = createClient(supabaseUrl, anonKey);
const SITE_URL = "https://bylz.fr";
const DEFAULT_OG_IMAGE = "https://bylz.fr/og-image.png";

// Static pages metadata and JSON-LD schemas
const staticPages = [
  {
    path: "", // Home
    title: "Bylz : Facturation et pilotage fiscal pour auto-entrepreneurs | Conforme 2026",
    description: "Créez des factures conformes 2026 (Factur-X), suivez votre CA et anticipez vos cotisations URSSAF en 2 minutes par jour. Essai gratuit sans carte bancaire.",
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Bylz",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": [
          { "@type": "Offer", "price": "0", "priceCurrency": "EUR", "name": "Starter" },
          { "@type": "Offer", "price": "9.00", "priceCurrency": "EUR", "name": "Solo" },
          { "@type": "Offer", "price": "19.00", "priceCurrency": "EUR", "name": "Pro" }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Bylz",
        "url": "https://bylz.fr",
        "logo": "https://bylz.fr/og-image.png"
      }
    ]
  },
  {
    path: "invoices",
    title: "Mes Factures & Gestion | Bylz",
    description: "Gérez et éditez vos factures conformes Factur-X 2026 sur Bylz.",
    ogType: "website"
  },
  {
    path: "tarifs",
    title: "Tarifs simples et transparents | Bylz",
    description: "Découvrez nos offres et abonnements adaptés à votre statut d'indépendant ou de société. Commencez gratuitement et sans engagement.",
    ogType: "website"
  },
  {
    path: "fonctionnalites",
    title: "Fonctionnalités : Facturation, TVA & URSSAF | Bylz",
    description: "Découvrez tous nos outils d'aide à la gestion : édition de factures Factur-X certifiées, suivi automatique du CA et alertes de seuils de TVA.",
    ogType: "website"
  },
  {
    path: "conformite",
    title: "Conformité Facturation Électronique 2026 | Bylz",
    description: "Tout comprendre sur la réforme 2026 de la facturation électronique en France. Bylz vous accompagne vers le format hybride Factur-X obligatoire.",
    ogType: "website"
  },
  {
    path: "outils/simulateur-urssaf",
    title: "Simulateur Cotisations URSSAF 2026 Gratuit : Micro-Entreprise BNC & BIC",
    description: "Calculez gratuitement et en direct vos cotisations sociales URSSAF et votre revenu net après impôt en micro-entreprise (BNC, BIC Service, BIC Vente).",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Simulateur Cotisations URSSAF 2026 | Bylz",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
      }
    }
  },
  {
    path: "outils/simulateur-seuil-tva",
    title: "Simulateur Seuil de Franchise TVA 2026 : Plafonds Micro-Entreprise",
    description: "Calculez votre positionnement par rapport au seuil de franchise de TVA (39 100 € et 42 500 €) et découvrez quand vous devenez redevable de la TVA.",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Simulateur Seuil de Franchise de TVA 2026 | Bylz",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
      }
    }
  },
  {
    path: "blog",
    title: "Le Blog de Bylz | Conseils pour Indépendants & Créateurs",
    description: "Retrouvez tous nos guides, conseils fiscaux et actualités réglementaires pour piloter sereinement votre micro-entreprise ou votre société.",
    ogType: "website"
  },
  {
    path: "contact",
    title: "Contactez-nous | Bylz",
    description: "Une question sur Bylz, la facturation électronique 2026 ou votre abonnement ? Notre équipe vous répond en moins de 24h.",
    ogType: "website"
  },
  {
    path: "mentions-legales",
    title: "Mentions Légales | Bylz",
    description: "Consultez les informations légales concernant l'éditeur et l'hébergeur du site Bylz.fr.",
    ogType: "website"
  },
  {
    path: "cgu",
    title: "Conditions Générales d'Utilisation (CGU) | Bylz",
    description: "Découvrez les conditions générales d'utilisation régissant l'accès au site et aux services de Bylz.",
    ogType: "website"
  },
  {
    path: "confidentialite",
    title: "Politique de Confidentialité & RGPD | Bylz",
    description: "Nous accordons une importance capitale à la sécurité et à la confidentialité de vos données personnelles. Consultez notre politique RGPD.",
    ogType: "website"
  }
];

async function prerender() {
  console.log("Starting SEO prerendering...");

  const distDir = path.join(process.cwd(), "dist");
  const templatePath = path.join(distDir, "index.html");

  if (!fs.existsSync(templatePath)) {
    console.error("Error: dist/index.html not found! Run 'npm run build' first.");
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(templatePath, "utf8");

  // Helper to generate a pre-rendered HTML file
  const generateFile = (routePath, meta) => {
    let html = templateHtml;

    // Clean up template tags to avoid duplicates
    html = html.replace(/<title>.*?<\/title>/gi, "");
    html = html.replace(/<meta property="og:image" content=".*?"\s*\/?>/gi, "");
    html = html.replace(/<meta name="twitter:card" content=".*?"\s*\/?>/gi, "");
    html = html.replace(/<meta name="twitter:image" content=".*?"\s*\/?>/gi, "");

    const url = `${SITE_URL}/${routePath}`;
    const title = meta.title;
    const description = meta.description;
    const ogImage = meta.ogImage || DEFAULT_OG_IMAGE;
    const ogType = meta.ogType || "website";

    // Build the SEO tags
    let seoTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:site_name" content="Bylz" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />`;

    // Add JSON-LD if present
    if (meta.jsonLd) {
      seoTags += `\n    <script type="application/ld+json">\n      ${JSON.stringify(meta.jsonLd, null, 2)}\n    </script>`;
    }

    // Inject into head
    html = html.replace("</head>", `${seoTags}\n  </head>`);

    // Target path in dist/
    const targetDir = path.join(distDir, routePath);
    if (routePath !== "") {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetFile = routePath === "" ? templatePath : path.join(targetDir, "index.html");

    fs.writeFileSync(targetFile, html, "utf8");
    console.log(`Prerendered: /${routePath}`);
  };

  // 1. Process static pages
  for (const page of staticPages) {
    generateFile(page.path, page);
  }

  // 2. Fetch blog posts and process them
  try {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, cover_image, published_at")
      .eq("status", "published");

    if (posts && posts.length > 0) {
      for (const post of posts) {
        const blogPath = `blog/${post.slug}`;
        const excerpt = post.excerpt || "Découvrez notre nouvel article sur le blog de Bylz.";
        const schema = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "image": post.cover_image || DEFAULT_OG_IMAGE,
          "datePublished": post.published_at || new Date().toISOString()
        };

        generateFile(blogPath, {
          title: `${post.title} | Blog Bylz`,
          description: excerpt,
          ogType: "article",
          ogImage: post.cover_image || DEFAULT_OG_IMAGE,
          jsonLd: schema
        });
      }
    }
  } catch (err) {
    console.warn("Notice: failed to fetch dynamic blog posts from Supabase for prerendering:", err);
  }

  console.log("SEO Prerendering completed successfully!");
}

prerender();
