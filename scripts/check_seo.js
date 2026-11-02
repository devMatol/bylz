import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import { SEO_METADATA } from '../src/lib/seoMeta.ts';

// 1. Read dist/index.html
const distIndexPath = path.resolve('dist/index.html');
if (!fs.existsSync(distIndexPath)) {
  console.error('❌ dist/index.html introuvable. Lancez "npm run build" d\'abord.');
  process.exit(1);
}
const html = fs.readFileSync(distIndexPath, 'utf8');

// 2. Extract JSON-LD script
const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!match) {
  console.error('❌ Aucun script JSON-LD trouvé dans dist/index.html.');
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(match[1]);
} catch (e) {
  console.error('❌ Échec du parse JSON-LD dans dist/index.html:', e.message);
  process.exit(1);
}

// Support both single object and array of objects
const softwareApp = Array.isArray(parsed)
  ? parsed.find(item => item['@type'] === 'SoftwareApplication')
  : (parsed['@type'] === 'SoftwareApplication' ? parsed : null);

if (!softwareApp) {
  console.error('❌ Aucun SoftwareApplication trouvé dans le JSON-LD.');
  process.exit(1);
}

// 3. Read plansData.ts source
const plansDataPath = path.resolve('src/lib/plansData.ts');
if (!fs.existsSync(plansDataPath)) {
  console.error('❌ src/lib/plansData.ts introuvable.');
  process.exit(1);
}
const plansContent = fs.readFileSync(plansDataPath, 'utf8');

// Extract prices from PLANS_DATA
const starterPriceMatch = plansContent.match(/starter:\s*{[\s\S]*?monthlyPrice:\s*([0-9.]+)/);
const soloPriceMatch = plansContent.match(/solo:\s*{[\s\S]*?monthlyPrice:\s*([0-9.]+)/);
const proPriceMatch = plansContent.match(/pro:\s*{[\s\S]*?monthlyPrice:\s*([0-9.]+)/);

if (!starterPriceMatch || !soloPriceMatch || !proPriceMatch) {
  console.error('❌ Impossible d\'extraire les prix mensuels depuis src/lib/plansData.ts');
  process.exit(1);
}

const expectedPrices = {
  Starter: Number(starterPriceMatch[1]).toFixed(2),
  Solo: Number(soloPriceMatch[1]).toFixed(2),
  Pro: Number(proPriceMatch[1]).toFixed(2),
};

const offers = softwareApp.offers;
if (!Array.isArray(offers)) {
  console.error('❌ Les offres JSON-LD ne forment pas un tableau.');
  process.exit(1);
}

let errorCount = 0;
for (const [name, expectedPrice] of Object.entries(expectedPrices)) {
  const offer = offers.find(o => o.name === name);
  if (!offer) {
    console.error(`❌ Offre "${name}" manquante dans le JSON-LD.`);
    errorCount++;
    continue;
  }
  if (offer.price !== expectedPrice) {
    console.error(`❌ Écart de prix pour "${name}" : JSON-LD=${offer.price} € vs plansData=${expectedPrice} €.`);
    errorCount++;
  } else {
    console.log(`✅ Offre "${name}" : ${offer.price} € correspond exactement à src/lib/plansData.ts`);
  }

  // Check priceValidUntil is not in the past if present
  if (offer.priceValidUntil) {
    const validUntilDate = new Date(offer.priceValidUntil);
    const now = new Date();
    if (validUntilDate < now) {
      console.error(`❌ priceValidUntil pour "${name}" est dans le passé : ${offer.priceValidUntil}`);
      errorCount++;
    }
  }
}

// Ensure no fake ratings / reviews
if (softwareApp.aggregateRating || softwareApp.review) {
  console.error('❌ aggregateRating ou review non certifiée présente dans le JSON-LD.');
  errorCount++;
}

// 4. Verify PricingPage uses plansData and has no hardcoded pricing
console.log('\n--- Contrôle de la page Tarifs (src/pages/PricingPage.tsx) ---');
const pricingPagePath = path.resolve('src/pages/PricingPage.tsx');
if (!fs.existsSync(pricingPagePath)) {
  console.error('❌ src/pages/PricingPage.tsx introuvable.');
  errorCount++;
} else {
  const pricingContent = fs.readFileSync(pricingPagePath, 'utf8');

  // Verify import of plansData
  if (!pricingContent.includes('from "../lib/plansData"') && !pricingContent.includes("from '../lib/plansData'")) {
    console.error('❌ src/pages/PricingPage.tsx n\'importe pas PLANS_DATA depuis src/lib/plansData.ts');
    errorCount++;
  } else {
    console.log('✅ src/pages/PricingPage.tsx importe bien PLANS_DATA depuis src/lib/plansData.ts');
  }

  // Verify absence of legacy hardcoded price literals in offers or display
  const suspiciousLiterals = [
    'price: "8.90"',
    'price: "12.90"',
    'price: "50.00"',
    'price: "80.00"',
    '"6,67 €"',
    '"4,17 €"',
    'facturé 8,90 €',
    'facturé 12,90 €',
    'soit 50 € / an',
    'soit 80 € / an',
  ];

  let foundLiteral = false;
  for (const literal of suspiciousLiterals) {
    if (pricingContent.includes(literal)) {
      console.error(`❌ Prix en dur résiduel détecté dans PricingPage.tsx : ${literal}`);
      errorCount++;
      foundLiteral = true;
    }
  }
  if (!foundLiteral) {
    console.log('✅ Aucun prix en dur résiduel dans PricingPage.tsx (tous proviennent de plansData)');
  }
}

// 5. Compare prerendered HTML titles and descriptions against src/lib/seoMeta.ts
console.log('\n--- Comparaison des métadonnées HTML prérendu vs src/lib/seoMeta.ts ---');
const distDir = path.resolve('dist');

for (const [route, expectedMeta] of Object.entries(SEO_METADATA)) {
  const filePath = route === '/'
    ? path.join(distDir, 'index.html')
    : path.join(distDir, route.replace(/^\//, ''), 'index.html');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier prérendu manquant pour la route ${route} (${filePath})`);
    errorCount++;
    continue;
  }

  const pageHtml = fs.readFileSync(filePath, 'utf8');
  const titleMatch = pageHtml.match(/<title>(.*?)<\/title>/);
  const descMatch = pageHtml.match(/<meta name="description" content="(.*?)" \/>/);

  const actualTitle = titleMatch ? titleMatch[1] : '';
  const actualDesc = descMatch ? descMatch[1] : '';

  if (actualTitle !== expectedMeta.title) {
    console.error(`❌ Écart de titre sur ${route} :\n   HTML: "${actualTitle}"\n   Meta: "${expectedMeta.title}"`);
    errorCount++;
  } else if (actualDesc !== expectedMeta.description) {
    console.error(`❌ Écart de description sur ${route} :\n   HTML: "${actualDesc}"\n   Meta: "${expectedMeta.description}"`);
    errorCount++;
  } else {
    console.log(`✅ Route ${route} : Titre et description parfaitement synchronisés.`);
  }
}

// 6. Verify dist/_redirects no longer exists
const distRedirectsPath = path.join(distDir, '_redirects');
if (fs.existsSync(distRedirectsPath)) {
  console.error('❌ dist/_redirects existe encore ! Il doit être supprimé pour laisser netlify.toml gérer les redirections.');
  errorCount++;
} else {
  console.log('✅ dist/_redirects est absent : netlify.toml est bien l\'unique source des redirections.');
}

// 7. Verify sitemap.xml in dist
console.log('\n--- Contrôle du sitemap (dist/sitemap.xml) ---');
const distSitemapPath = path.join(distDir, 'sitemap.xml');
if (!fs.existsSync(distSitemapPath)) {
  console.error('❌ dist/sitemap.xml introuvable.');
  errorCount++;
} else {
  const sitemapXml = fs.readFileSync(distSitemapPath, 'utf8');

  // Must contain all 13 marketing pages
  const expectedMarketingPages = [
    'https://bylz.fr/',
    'https://bylz.fr/tarifs',
    'https://bylz.fr/fonctionnalites',
    'https://bylz.fr/conformite',
    'https://bylz.fr/facturation-electronique',
    'https://bylz.fr/outils/simulateur-urssaf',
    'https://bylz.fr/outils/simulateur-seuil-tva',
    'https://bylz.fr/outils/modele-facture-gratuit',
    'https://bylz.fr/blog',
    'https://bylz.fr/contact',
    'https://bylz.fr/mentions-legales',
    'https://bylz.fr/cgu',
    'https://bylz.fr/confidentialite',
  ];

  let missingPages = 0;
  for (const page of expectedMarketingPages) {
    if (!sitemapXml.includes(`<loc>${page}</loc>`)) {
      console.error(`❌ Page manquante dans dist/sitemap.xml : ${page}`);
      missingPages++;
      errorCount++;
    }
  }
  if (missingPages === 0) {
    console.log('✅ Les 13 pages marketing (dont /cgu) sont présentes dans dist/sitemap.xml');
  }

  // Check that all prerendered blog slugs in dist/blog/ are in sitemap
  const distBlogDir = path.join(distDir, 'blog');
  if (fs.existsSync(distBlogDir)) {
    const entries = fs.readdirSync(distBlogDir, { withFileTypes: true });
    const blogSlugs = entries
      .filter(e => e.isDirectory() && e.name !== '.' && e.name !== '..')
      .map(e => e.name);

    let missingBlogSlugs = 0;
    for (const slug of blogSlugs) {
      const blogUrl = `https://bylz.fr/blog/${slug}`;
      if (!sitemapXml.includes(`<loc>${blogUrl}</loc>`)) {
        console.error(`❌ Article de blog manquant dans dist/sitemap.xml : ${blogUrl}`);
        missingBlogSlugs++;
        errorCount++;
      }
    }
    if (missingBlogSlugs === 0) {
      console.log(`✅ Les ${blogSlugs.length} slugs de blog du site sont présents dans dist/sitemap.xml`);
    }
  }
}

// 8. Verify no forbidden compliance claims in src/, scripts/prerender.js and dist/**/*.html
const forbiddenClaims = [
  'Factur-X Valide',
  'Norme EN 16931',
  'E-Reporting DGFiP',
  'Inviolable',
  'inviolabilité',
  'vous garantit',
  'certifiée Factur-X',
  'Certifié',
  'Garantie légale',
  'Norme EN 16931-1 Active',
  'valeur probante',
  'niveau de certification eIDAS',
  'conformes Factur-X',
  'certification eIDAS',
  'E-Reporting certifiée',
  'légalement conformes',
];

const forbiddenPatterns = [
  /certifi[ée]e?s?\s+Factur-X/i,
  /conformes?\s+(au\s+format\s+)?Factur-X/i,
  /g[ée]n[ée]ration\s+native/i,
  /format\s+Factur-X\s+natif/i,
  /Bylz[^.<]{0,80}garantit/i,
  /garantit[^.<]{0,60}(conformit[ée]|int[ée]grit[ée]|authenticit[ée])/i,
  /\d+(?:,\d+)?\s*€\s*par\s*(?:facture|mention)/i,
  /Factur-X[^<.]{0,25}natif/i,
  /natif[^<.]{0,60}(mis à jour|norme|r[ée]glementaire)/i,
  /Format officiel Factur-X/i,
  /\b(de|des|une|la)\s+sanctions?\s+(administratives|pr[ée]vues)/i,
  /(amendes?|p[ée]nalit[ée]s?)\s+de\s+sanctions/i,
];

function stripCodeComments(sourceText) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.JSX, sourceText);
  let out = '';
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    if (token !== ts.SyntaxKind.SingleLineCommentTrivia && token !== ts.SyntaxKind.MultiLineCommentTrivia) {
      out += scanner.getTokenText();
    }
    token = scanner.scan();
  }
  return out.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
}

function checkContent(filePath, content) {
  for (const forbidden of forbiddenClaims) {
    if (content.includes(forbidden)) {
      console.error(`❌ Allégation interdite trouvée ("${forbidden}") : ${filePath}`);
      errorCount++;
    }
  }
  for (const pattern of forbiddenPatterns) {
    const match = content.match(pattern);
    if (match) {
      console.error(`❌ Motif interdit détecté (${pattern} => "${match[0]}") : ${filePath}`);
      errorCount++;
    }
  }
}

function scanSrcFilesForForbiddenClaims(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanSrcFilesForForbiddenClaims(fullPath);
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      const content = stripCodeComments(fs.readFileSync(fullPath, 'utf8'));
      checkContent(fullPath, content);
    }
  }
}

function scanHtmlFilesForForbiddenClaims(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanHtmlFilesForForbiddenClaims(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      checkContent(fullPath, content);
    }
  }
}

scanSrcFilesForForbiddenClaims(path.resolve('src'));

// Scan scripts/prerender.js as well
const prerenderScriptPath = path.resolve('scripts/prerender.js');
if (fs.existsSync(prerenderScriptPath)) {
  const content = stripCodeComments(fs.readFileSync(prerenderScriptPath, 'utf8'));
  checkContent(prerenderScriptPath, content);
}

scanHtmlFilesForForbiddenClaims(distDir);
console.log('✅ Aucune allégation ni motif interdit dans src/, scripts/prerender.js ni dans dist/**/*.html');

if (errorCount > 0) {
  console.error(`\n❌ Contrôle SEO/Métadonnées échoué avec ${errorCount} erreur(s).`);
  process.exit(1);
}

console.log('\n✅ Toutes les vérifications (prix, JSON-LD, PricingPage, métadonnées SEO, redirections, sitemap) sont validées sans aucun écart.');
