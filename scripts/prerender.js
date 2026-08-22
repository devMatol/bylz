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
    title: "Bylz : Facturation et pilotage fiscal pour indépendants, micro-entreprises & sociétés | Conforme 2026",
    description: "Créez des factures conformes 2026 (Factur-X), suivez votre CA et anticipez vos cotisations URSSAF & impôts en 2 minutes par jour. Essai gratuit sans carte bancaire.",
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
          { "@type": "Offer", "price": "5.00", "priceCurrency": "EUR", "name": "Solo" },
          { "@type": "Offer", "price": "8.00", "priceCurrency": "EUR", "name": "Pro" }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Bylz",
        "url": "https://bylz.fr",
        "logo": "https://bylz.fr/og-image.png"
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Bylz est-il conforme à la réforme de la facturation électronique 2026 ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui, Bylz génère nativement des factures au format hybride Factur-X certifié conforme aux exigences fiscales françaises 2026."
            }
          },
          {
            "@type": "Question",
            "name": "Puis-je utiliser Bylz gratuitement ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui, le plan Starter gratuit permet de créer vos premières factures sans carte bancaire requise."
            }
          }
        ]
      }
    ],
    htmlContent: `
      <header style="padding:1rem 2rem;display:flex;justify-content:space-between;align-items:center;background:#090d16;color:#fff;">
        <a href="/" style="font-size:1.5rem;font-weight:bold;color:#10b981;text-decoration:none;">Bylz</a>
        <nav style="display:flex;gap:1.5rem;">
          <a href="/tarifs" style="color:#cbd5e1;text-decoration:none;">Tarifs</a>
          <a href="/fonctionnalites" style="color:#cbd5e1;text-decoration:none;">Fonctionnalités</a>
          <a href="/outils/simulateur-urssaf" style="color:#cbd5e1;text-decoration:none;">Simulateur URSSAF</a>
          <a href="/outils/simulateur-seuil-tva" style="color:#cbd5e1;text-decoration:none;">Seuil TVA</a>
          <a href="/blog" style="color:#cbd5e1;text-decoration:none;">Blog</a>
          <a href="/conformite" style="color:#cbd5e1;text-decoration:none;">Conformité 2026</a>
        </nav>
      </header>
      <main style="max-width:1200px;margin:0 auto;padding:4rem 2rem;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
        <h1 style="font-size:2.5rem;font-weight:900;line-height:1.2;margin-bottom:1.5rem;">Bylz — Facturation & Pilotage Fiscal pour Indépendants, Micro-Entreprises & Sociétés (Conforme 2026)</h1>
        <p style="font-size:1.25rem;color:#94a3b8;max-width:800px;margin-bottom:2rem;">Créez des factures conformes 2026 (Factur-X), suivez votre chiffre d'affaires en temps réel et anticipez vos cotisations URSSAF & taxes en 2 minutes par jour. Essai gratuit sans carte bancaire.</p>
        <div style="display:flex;gap:1rem;margin-bottom:3rem;">
          <a href="/login" style="background:#059669;color:#fff;padding:0.875rem 1.75rem;border-radius:0.75rem;font-weight:bold;text-decoration:none;">Essayer gratuitement</a>
          <a href="/tarifs" style="background:#1e293b;color:#fff;padding:0.875rem 1.75rem;border-radius:0.75rem;font-weight:bold;text-decoration:none;">Voir les offres</a>
        </div>
        <section style="margin-top:4rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem;">
          <article style="background:#1e293b;padding:2rem;border-radius:1rem;">
            <h2>📄 Factures Factur-X Conformes 2026</h2>
            <p>Générez des factures électroniques conformes au standard Factur-X requis par la DGFIP pour 2026.</p>
          </article>
          <article style="background:#1e293b;padding:2rem;border-radius:1rem;">
            <h2>📊 Suivi du Chiffre d'Affaires & Seuils de TVA</h2>
            <p>Suivez votre CA cumulé, anticipez les franchissements des seuils de TVA (39 100 € et 42 500 €) et recevez des alertes automatiques.</p>
          </article>
          <article style="background:#1e293b;padding:2rem;border-radius:1rem;">
            <h2>🎙️ Assistant IA & Dictée Vocale WhatsApp</h2>
            <p>Dictez vos factures à la voix sur WhatsApp ou posez vos questions fiscales à Bylz Copilot IA 24h/24.</p>
          </article>
        </section>
      </main>
    `
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
    ogType: "website",
    htmlContent: `
      <main style="max-width:1200px;margin:0 auto;padding:4rem 2rem;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
        <h1 style="font-size:2.5rem;font-weight:900;margin-bottom:1rem;">Tarifs simples et sans surprise</h1>
        <p style="font-size:1.25rem;color:#94a3b8;margin-bottom:3rem;">Commencez gratuitement, sans carte bancaire. Changez d'offre à tout moment.</p>
        <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem;">
          <div style="background:#1e293b;padding:2rem;border-radius:1rem;">
            <h2>Starter (Gratuit)</h2>
            <p>Idéal pour démarrer votre activité en micro-entreprise.</p>
          </div>
          <div style="background:#1e293b;padding:2rem;border-radius:1rem;border:2px solid #10b981;">
            <h2>Solo (⚡ 5€ / mois)</h2>
            <p>Pour les indépendants qui veulent automatiser leur facturation et leurs relances.</p>
          </div>
          <div style="background:#1e293b;padding:2rem;border-radius:1rem;">
            <h2>Pro (8€ / mois)</h2>
            <p>Assistant IA WhatsApp illimité, synchronisation bancaire et pilotage complet.</p>
          </div>
        </section>
      </main>
    `
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
    },
    htmlContent: `
      <main style="max-width:1200px;margin:0 auto;padding:4rem 2rem;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
        <h1 style="font-size:2.25rem;font-weight:900;margin-bottom:1rem;">Simulateur Cotisations URSSAF 2026 (Gratuit)</h1>
        <p style="font-size:1.125rem;color:#94a3b8;margin-bottom:2rem;">Calculez le montant de vos cotisations sociales URSSAF en fonction de votre chiffre d'affaires et de votre activité (BNC, BIC service, BIC vente) pour l'année 2026.</p>
      </main>
    `
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
    },
    htmlContent: `
      <main style="max-width:1200px;margin:0 auto;padding:4rem 2rem;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
        <h1 style="font-size:2.25rem;font-weight:900;margin-bottom:1rem;">Simulateur Seuil de Franchise de TVA 2026</h1>
        <p style="font-size:1.125rem;color:#94a3b8;margin-bottom:2rem;">Anticipez le dépassement du seuil de TVA en micro-entreprise (39 100 € et 42 500 €) et découvrez comment facturer la TVA à vos clients en toute conformité.</p>
      </main>
    `
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

    // Inject SEO tags into head
    html = html.replace("</head>", `${seoTags}\n  </head>`);

    // Inject semantic body content inside <div id="root"> for non-JS crawlers
    if (meta.htmlContent) {
      html = html.replace('<div id="root"></div>', `<div id="root">${meta.htmlContent}</div>`);
    }

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

  // 2. Fetch blog posts and process them with full body text for SEO crawlers
  try {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, content, cover_image, published_at")
      .eq("status", "published");

    if (posts && posts.length > 0) {
      for (const post of posts) {
        const blogPath = `blog/${post.slug}`;
        const excerpt = post.excerpt || "Découvrez notre nouvel article sur le blog de Bylz.";
        const schema = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "description": excerpt,
          "image": post.cover_image || DEFAULT_OG_IMAGE,
          "datePublished": post.published_at || new Date().toISOString(),
          "publisher": {
            "@type": "Organization",
            "name": "Bylz",
            "logo": DEFAULT_OG_IMAGE
          }
        };

        const blogBody = `
          <header style="padding:1rem 2rem;display:flex;justify-content:space-between;align-items:center;background:#090d16;color:#fff;">
            <a href="/" style="font-size:1.5rem;font-weight:bold;color:#10b981;text-decoration:none;">Bylz</a>
            <nav style="display:flex;gap:1.5rem;">
              <a href="/blog" style="color:#cbd5e1;text-decoration:none;">Blog</a>
              <a href="/tarifs" style="color:#cbd5e1;text-decoration:none;">Tarifs</a>
              <a href="/login" style="color:#cbd5e1;text-decoration:none;">Connexion</a>
            </nav>
          </header>
          <main style="max-width:800px;margin:0 auto;padding:4rem 2rem;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
            <article>
              <h1 style="font-size:2.25rem;font-weight:900;line-height:1.2;margin-bottom:1.5rem;">${post.title}</h1>
              <p style="font-size:1.25rem;color:#94a3b8;margin-bottom:2rem;line-height:1.6;">${excerpt}</p>
              <div style="line-height:1.8;color:#cbd5e1;">
                ${post.content || excerpt}
              </div>
            </article>
          </main>
        `;

        generateFile(blogPath, {
          title: `${post.title} | Blog Bylz`,
          description: excerpt,
          ogType: "article",
          ogImage: post.cover_image || DEFAULT_OG_IMAGE,
          jsonLd: schema,
          htmlContent: blogBody
        });
      }
    }
  } catch (err) {
    console.warn("Notice: failed to fetch dynamic blog posts from Supabase for prerendering:", err);
  }

  console.log("SEO Prerendering completed successfully!");
}

prerender();
