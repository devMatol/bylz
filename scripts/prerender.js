import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sbwbjkzustnlnnilkogm.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2Jqa3p1c3RubG5uaWxrb2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTk5MzYsImV4cCI6MjEwMDAzNTkzNn0.OjKjWTdgWiGyecOsvIu_OjCwOExiDKR74eow-Lleo40";

const supabase = createClient(supabaseUrl, anonKey);
const SITE_URL = "https://bylz.fr";
const DEFAULT_OG_IMAGE = "https://bylz.fr/og-image.png";

// Base static blog articles
const STATIC_BLOG_ARTICLES = [
  {
    slug: "reforme-factur-x-2026-auto-entrepreneurs",
    title: "Réforme Factur-X 2026 : Ce qui change pour les auto-entrepreneurs et micro-entreprises",
    excerpt: "La réforme de la facturation électronique entre en vigueur en France. Découvrez les obligations du format Factur-X et du E-Reporting pour les indépendants.",
    date: "2026-07-15T10:00:00.000Z",
    readTime: "5 min de lecture",
    author: "Équipe Fiscale Bylz",
    category: "Législation & Conformité",
    content: `
      <h2>Qu'est-ce que la réforme de la facturation électronique 2026 ?</h2>
      <p>À partir de 2026, la réglementation française impose l'abandon progressif des simples factures PDF transmises par e-mail au profit de factures électroniques certifiées et structurées dites <strong>Factur-X</strong>.</p>
      <p>Cette réforme s'applique à l'ensemble des assujettis à la TVA en France, y compris les micro-entrepreneurs réalisant des prestations ou ventes B2B (Business to Business).</p>
      <h3>Les 2 volets fondamentaux de la réforme :</h3>
      <ul>
        <li><strong>Le E-Invoicing (Facturation électronique B2B) :</strong> Transmission des factures inter-entreprises dans un format hybride contenant des données lisibles par l'homme (PDF) et un fichier XML structuré pour les ordinateurs.</li>
        <li><strong>Le E-Reporting (Transmission des données de ventes) :</strong> Transmission à l'administration fiscale des données relatives aux ventes B2C ou aux transactions internationales.</li>
      </ul>
      <h3>Quelles sanctions en cas de non-conformité ?</h3>
      <p>L'administration fiscale prévoit des amendes forfaitaires (jusqu'à 15 € par facture non conforme). Utiliser un outil compatible Factur-X comme Bylz vous garantit une conformité sans coût supplémentaire.</p>
    `
  },
  {
    slug: "franchise-tva-2026-seuils-et-regles",
    title: "Franchise en base de TVA 2026 : Nouveaux seuils, tolérance et règles de dépassement",
    excerpt: "Tout savoir sur les plafonds de TVA en micro-entreprise : seuil de base, seuil majoré, facturation de la TVA et basculement du régime.",
    date: "2026-07-10T10:00:00.000Z",
    readTime: "6 min de lecture",
    author: "Équipe Fiscale Bylz",
    category: "Fiscalité Micro-entreprise",
    content: `
      <h2>Comprendre la franchise en base de TVA</h2>
      <p>Par défaut, un auto-entrepreneur bénéficie du système de la <strong>franchise en base de TVA</strong> (article 293 B du CGI). Cela signifie qu'il ne facture pas la TVA à ses clients et ne la récupère pas sur ses achats.</p>
      <h3>Les plafonds actuels de TVA :</h3>
      <ul>
        <li><strong>Prestations de services (BNC / BIC) :</strong> Seuil de base à 39 100 € (seuil majoré à 42 500 €).</li>
        <li><strong>Vente de marchandises (BIC) :</strong> Seuil de base à 101 000 € (seuil majoré à 110 000 €).</li>
      </ul>
      <h3>Que se passe-t-il en cas de dépassement ?</h3>
      <p>Si vous dépassez le seuil de base mais restez sous le seuil majoré, vous conservez la franchise jusqu'à la fin de l'année. En revanche, si vous dépassez le seuil majoré, vous devenez redevable de la TVA dès le premier jour du mois de dépassement.</p>
      <p>Le module de pilotage fiscal de Bylz inclut une jauge en temps réel qui vous alerte automatiquement à l'approche de ces plafonds.</p>
    `
  },
  {
    slug: "calcul-cotisations-urssaf-bnc-bic",
    title: "Comment calculer ses cotisations URSSAF et son bénéfice net en BNC et BIC en 2026",
    excerpt: "Apprenez à calculer exactement le montant de vos cotisations sociales et votre résultat net après impôt en micro-entreprise.",
    date: "2026-07-02T10:00:00.000Z",
    readTime: "4 min de lecture",
    author: "Équipe Fiscale Bylz",
    category: "Gestion & Cotisations",
    content: `
      <h2>Les taux de cotisations sociales URSSAF</h2>
      <p>Les cotisations sociales en micro-entreprise sont calculées en appliquant un pourcentage fixe sur le chiffre d'affaires brut encaissé (et non sur le bénéfice) :</p>
      <ul>
        <li><strong>Professions libérales (BNC) & Prestations de services :</strong> Taux de cotisation à 23,1% (ou taux ACRE réduit la 1ère année).</li>
        <li><strong>Vente de marchandises (BIC) :</strong> Taux de cotisation à 12,3%.</li>
      </ul>
      <h2>L'abattement forfaitaire pour le calcul de l'impôt</h2>
      <p>Pour déterminer votre revenu imposable (bénéfice net), les impôts appliquent un abattement forfaitaire représentatif de vos charges :</p>
      <ul>
        <li>34% d'abattement pour les activités BNC (libérales).</li>
        <li>50% d'abattement pour les prestations de service BIC.</li>
        <li>71% d'abattement pour les ventes de marchandises BIC.</li>
      </ul>
      <p>Bylz intègre ces moteurs de calcul et simule instantanément votre reste à vivre net après cotisations et impôt estimé.</p>
    `
  },
  {
    slug: "modele-facture-auto-entrepreneur-gratuit",
    title: "Modèle de Facture Auto-Entrepreneur Gratuit 2026 : Exemples Word, Excel et Format Conforme",
    excerpt: "Téléchargez un modèle de facture officiel pour micro-entrepreneur. Mentions obligatoires, franchise en base de TVA (art. 293 B) et pourquoi éviter les modèles Word et Excel en 2026.",
    date: "2026-09-04T10:00:00.000Z",
    readTime: "6 min de lecture",
    author: "Équipe Fiscale Bylz",
    category: "Devis & Facturation",
    content: `
      <h2>Quelles sont les obligations de facturation pour un auto-entrepreneur ?</h2>
      <p>En tant qu'auto-entrepreneur, vous devez émettre une facture conforme pour vos clients B2B et B2C comportant l'ensemble des mentions légales obligatoires 2026.</p>
    `
  }
];

// Static pages metadata and JSON-LD schemas with exact matching prices
const staticPages = [
  {
    path: "", // Home
    title: "Bylz — Facturation Factur-X & Pilotage Fiscal | Auto-Entrepreneurs",
    description: "Créez des factures conformes 2026 (Factur-X), suivez votre CA et anticipez vos cotisations URSSAF & impôts en 2 min/jour. Essai gratuit sans carte bancaire.",
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Bylz",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": [
          { "@type": "Offer", "price": "0.00", "priceCurrency": "EUR", "name": "Starter" },
          { "@type": "Offer", "price": "8.90", "priceCurrency": "EUR", "name": "Solo" },
          { "@type": "Offer", "price": "12.90", "priceCurrency": "EUR", "name": "Pro" }
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
              "text": "Oui, le plan Starter gratuit permet de créer vos factures sans carte bancaire requise."
            }
          }
        ]
      }
    ]
  },
  {
    path: "tarifs",
    title: "Tarifs Bylz : Logiciel de Facturation et Pilotage Fiscal pour Micro-Entrepreneurs",
    description: "Découvrez nos tarifs simples et sans engagement : Solo 50€/an (ou 8,90€/mois) et Pro 80€/an (ou 12,90€/mois). 14 jours d'essai offerts.",
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Bylz Starter",
        "description": "Plan gratuit de démarrage pour créer des factures conformes Factur-X.",
        "offers": { "@type": "Offer", "price": "0.00", "priceCurrency": "EUR" }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Bylz Solo",
        "description": "Plan complet pour indépendant avec facturation illimitée et pilotage fiscal.",
        "offers": { "@type": "Offer", "price": "8.90", "priceCurrency": "EUR" }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Bylz Pro",
        "description": "Plan premium avec paiement en ligne Stripe Connect et télétransmission DGFiP.",
        "offers": { "@type": "Offer", "price": "12.90", "priceCurrency": "EUR" }
      }
    ]
  },
  {
    path: "fonctionnalites",
    title: "Fonctionnalités Bylz : Facturation, TVA et Cotisations URSSAF",
    description: "Découvrez l'ensemble des fonctionnalités de Bylz : édition Factur-X, suivi des plafonds de TVA, calcul URSSAF, relances et import PDF historique.",
    ogType: "website"
  },
  {
    path: "conformite",
    title: "Conformité Légale & Sécurité des Données | Bylz",
    description: "Découvrez les garanties de conformité de Bylz : Loi Anti-Fraude TVA Art. 286 CGI, Norme Européenne EN 16931 Factur-X, Agrément DSP2 Banque de France et hébergement sécurisé en France.",
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
      "offers": { "@type": "Offer", "price": "0.00", "priceCurrency": "EUR" }
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
      "offers": { "@type": "Offer", "price": "0.00", "priceCurrency": "EUR" }
    }
  },
  {
    path: "outils/modele-facture-gratuit",
    title: "Modèle de Facture Gratuit 2026 : Auto-Entrepreneur, Artisan & Freelance (PDF)",
    description: "Créez et téléchargez votre modèle de facture gratuit conforme aux obligations 2026 (Factur-X, franchise TVA art. 293 B, mentions obligatoires). Prêt en 30 secondes.",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Générateur de Modèle de Facture Gratuit Conforme 2026 | Bylz",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0.00", "priceCurrency": "EUR" }
    }
  },
  {
    path: "blog",
    title: "Le Blog de Bylz | Conseils Fiscaux & Facturation pour Indépendants",
    description: "Retrouvez tous nos guides pratiques, conseils fiscaux et actualités réglementaires pour gérer sereinement votre micro-entreprise.",
    ogType: "website"
  },
  {
    path: "contact",
    title: "Contactez l'Équipe Bylz | Support & Assistance",
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
    console.error("Error: dist/index.html not found! Run 'vite build' first.");
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(templatePath, "utf8");

  // Helper to generate a pre-rendered HTML file
  const generateFile = (routePath, meta) => {
    let html = templateHtml;

    // Clean up all existing dynamic head tags to ensure completely fresh, unique injection
    html = html.replace(/<title>.*?<\/title>/gi, "");
    html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, "");
    html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/gi, "");
    html = html.replace(/<meta\s+property="og:.*?"\s+content=".*?"\s*\/?>/gi, "");
    html = html.replace(/<meta\s+name="twitter:.*?"\s+content=".*?"\s*\/?>/gi, "");
    html = html.replace(/<script\s+type="application\/ld\+json">.*?<\/script>/gis, "");

    const url = routePath === "" ? `${SITE_URL}/` : `${SITE_URL}/${routePath}`;
    const title = meta.title;
    const description = meta.description;
    const ogImage = meta.ogImage || DEFAULT_OG_IMAGE;
    const ogType = meta.ogType || "website";

    // Build the SEO tags
    let seoTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
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

  // 2. Aggregate all blog articles (Static default articles + Dynamic DB articles)
  const allArticlesMap = new Map();

  for (const art of STATIC_BLOG_ARTICLES) {
    allArticlesMap.set(art.slug, art);
  }

  try {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, content, cover_image_url, author, published_at, meta_description")
      .eq("status", "published");

    if (posts && posts.length > 0) {
      for (const p of posts) {
        allArticlesMap.set(p.slug, {
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt || p.meta_description || "Article sur le blog de Bylz.",
          metaDescription: p.meta_description || p.excerpt,
          content: p.content,
          author: p.author || "Équipe Bylz",
          date: p.published_at || new Date().toISOString(),
          coverImageUrl: p.cover_image_url || DEFAULT_OG_IMAGE,
        });
      }
    }
  } catch (err) {
    console.warn("Notice: could not query dynamic DB blog posts for prerender:", err);
  }

  // Generate each blog article page
  for (const [slug, post] of allArticlesMap.entries()) {
    const blogPath = `blog/${slug}`;
    const excerpt = post.metaDescription || post.excerpt || "Découvrez notre article sur le blog de Bylz.";
    const schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": excerpt,
      "image": post.coverImageUrl || DEFAULT_OG_IMAGE,
      "datePublished": post.date || new Date().toISOString(),
      "dateModified": post.date || new Date().toISOString(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${SITE_URL}/blog/${slug}`
      },
      "author": {
        "@type": "Person",
        "name": post.author || "Équipe Bylz"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Bylz",
        "logo": {
          "@type": "ImageObject",
          "url": DEFAULT_OG_IMAGE
        }
      }
    };

    generateFile(blogPath, {
      title: `${post.title} | Blog Bylz`,
      description: excerpt,
      ogType: "article",
      ogImage: post.coverImageUrl || DEFAULT_OG_IMAGE,
      jsonLd: schema,
    });
  }

  console.log("SEO Prerendering completed successfully!");
}

prerender();
