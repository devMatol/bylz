#!/usr/bin/env node

/**
 * Script de validation post-déploiement de la vitrine Bylz.
 * Node 22, fetch natif, aucune dépendance externe.
 *
 * Usage :
 *   node scripts/post_deploy_check.js https://URL_A_TESTER
 */

import fs from 'node:fs';
import path from 'node:path';
import { forbiddenPatterns } from './forbidden_patterns.js';

const targetArg = process.argv[2];
if (!targetArg) {
  console.error("Usage: node scripts/post_deploy_check.js <URL_A_TESTER>");
  process.exit(1);
}

const baseUrl = targetArg.replace(/\/+$/, '');
const isLocalTest = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function report(name, success, message = '') {
  totalChecks++;
  if (success) {
    passedChecks++;
    console.log(`[OK] ${name}${message ? ' - ' + message : ''}`);
  } else {
    failedChecks++;
    console.error(`[ÉCHEC] ${name}${message ? ' - ' + message : ''}`);
  }
}

// 1. Lire les redirections depuis _redirects (dist/ ou public/)
function parseRedirectsFile() {
  const redirectsPath = fs.existsSync(path.resolve('dist/_redirects'))
    ? path.resolve('dist/_redirects')
    : path.resolve('public/_redirects');
  if (!fs.existsSync(redirectsPath)) {
    throw new Error('_redirects introuvable dans dist/ ou public/');
  }
  const content = fs.readFileSync(redirectsPath, 'utf8');
  const lines = content.split('\n');
  const redirects = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const from = parts[0];
      const to = parts[1];
      const statusRaw = parts[2] || '301';
      const status = parseInt(statusRaw.replace('!', ''), 10);
      redirects.push({ from, to, status });
    }
  }
  return redirects;
}

async function main() {
  console.log(`=== Contrôle Post-Déploiement Bylz sur : ${baseUrl} ===\n`);

  // --- ÉTAPE 1 : Pages clés (200, <title>, canonical) ---
  const keyPages = [
    '/',
    '/tarifs',
    '/cgu',
    '/facturation-electronique',
    '/mentions-legales',
    '/blog',
    '/outils/simulateur-urssaf',
  ];

  for (const route of keyPages) {
    const url = `${baseUrl}${route}`;
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const body = await res.text();

      // Statut 200
      report(`Page ${route} - Statut HTTP`, res.status === 200, `Reçu: ${res.status}`);

      // <title> présent
      const titleMatch = body.match(/<title[^>]*>([^<]+)<\/title>/i);
      const hasTitle = Boolean(titleMatch && titleMatch[1].trim().length > 0);
      report(`Page ${route} - Balise <title>`, hasTitle, hasTitle ? `"${titleMatch[1].trim()}"` : 'Titre manquant');

      // <link rel="canonical">
      const canonicalMatch = body.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
                             body.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
      const canonicalHref = canonicalMatch ? canonicalMatch[1] : null;

      let canonicalValid = false;
      if (canonicalHref) {
        try {
          const parsed = new URL(canonicalHref);
          const expectedPath = route === '/' ? '/' : route;
          canonicalValid = parsed.pathname === expectedPath || parsed.pathname === `${expectedPath}/`;
        } catch {
          canonicalValid = false;
        }
      }
      report(`Page ${route} - Canonical URL`, canonicalValid, canonicalHref || 'Canonical manquant');

      // Vérification absence de "localhost"
      if (!isLocalTest) {
        const hasLocalhost = body.toLowerCase().includes('localhost');
        report(`Page ${route} - Absence de 'localhost'`, !hasLocalhost);
      }
    } catch (err) {
      report(`Page ${route} - Chargement`, false, err.message);
    }
  }

  // --- ÉTAPE 2 : Redirection /cgv -> /cgu (301) ---
  try {
    const resCgv = await fetch(`${baseUrl}/cgv`, { redirect: 'manual' });
    const is301 = resCgv.status === 301 || resCgv.status === 308;
    const location = resCgv.headers.get('location') || '';
    const redirectsToCgu = location.endsWith('/cgu') || location === '/cgu';
    report('Redirection /cgv vers /cgu (301)', is301 && redirectsToCgu, `Statut: ${resCgv.status}, Location: ${location}`);
  } catch (err) {
    report('Redirection /cgv vers /cgu (301)', false, err.message);
  }

  // --- ÉTAPE 3 : Redirections d'anciens slugs (netlify.toml) ---
  const allRedirects = parseRedirectsFile();
  const blogRedirects = allRedirects.filter(r => r.from.startsWith('/blog/') && r.status === 301);

  for (const r of blogRedirects) {
    try {
      const res = await fetch(`${baseUrl}${r.from}`, { redirect: 'manual' });
      const is301 = res.status === 301 || res.status === 308;
      const location = res.headers.get('location') || '';
      const matchesTarget = location.endsWith(r.to) || location === r.to;
      report(`Redirection ${r.from} -> ${r.to}`, is301 && matchesTarget, `Statut: ${res.status}, Location: ${location}`);
    } catch (err) {
      report(`Redirection ${r.from} -> ${r.to}`, false, err.message);
    }
  }

  // --- ÉTAPE 4 : /robots.txt ---
  try {
    const resRobots = await fetch(`${baseUrl}/robots.txt`);
    const textRobots = await resRobots.text();
    const hasDisallowV = textRobots.includes('Disallow: /v/');
    const hasSitemap = /Sitemap:\s*https?:\/\//i.test(textRobots);
    report('/robots.txt - Présence Disallow: /v/', hasDisallowV);
    report('/robots.txt - Présence directive Sitemap', hasSitemap);
  } catch (err) {
    report('/robots.txt', false, err.message);
  }

  // --- ÉTAPE 5 : /sitemap.xml ---
  let blogArticleUrls = [];
  try {
    const resSitemap = await fetch(`${baseUrl}/sitemap.xml`);
    const xml = await resSitemap.text();
    const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

    const countOk = locMatches.length === 30;
    report('/sitemap.xml - Exactement 30 URLs', countOk, `Trouvé: ${locMatches.length}`);

    const noPrivateV = !locMatches.some(u => u.includes('/v/'));
    report('/sitemap.xml - Aucune URL privée /v/', noPrivateV);

    const allHttpsBylz = locMatches.every(u => u.startsWith('https://bylz.fr'));
    report('/sitemap.xml - Toutes les URLs commencent par https://bylz.fr', allHttpsBylz);

    blogArticleUrls = locMatches.filter(u => u.includes('/blog/') && u !== 'https://bylz.fr/blog');
    report('/sitemap.xml - 17 articles de blog trouvés', blogArticleUrls.length === 17, `Articles: ${blogArticleUrls.length}`);
  } catch (err) {
    report('/sitemap.xml', false, err.message);
  }

  // --- ÉTAPE 6 : /v/test-token (en-têtes noindex et Referrer-Policy) ---
  try {
    const resV = await fetch(`${baseUrl}/v/test-token`, { redirect: 'manual' });
    const robotsHeader = resV.headers.get('x-robots-tag') || '';
    const referrerHeader = resV.headers.get('referrer-policy') || '';

    const hasNoindex = robotsHeader.toLowerCase().includes('noindex');
    report('/v/test-token - X-Robots-Tag contient noindex', hasNoindex, `Header: "${robotsHeader}"`);

    const hasNoReferrer = referrerHeader.toLowerCase() === 'no-referrer';
    report('/v/test-token - Referrer-Policy = no-referrer', hasNoReferrer, `Header: "${referrerHeader}"`);
  } catch (err) {
    report('/v/test-token - Headers de sécurité', false, err.message);
  }

  // --- ÉTAPE 7 : Motifs interdits sur les pages marketing et les 17 articles ---
  const pagesToScan = [
    '/',
    '/tarifs',
    '/facturation-electronique',
    '/blog',
    ...blogArticleUrls.map(u => {
      try { return new URL(u).pathname; } catch { return u; }
    }),
  ];

  console.log(`\n--- Scan des motifs interdits sur ${pagesToScan.length} pages ---`);

  for (const pagePath of pagesToScan) {
    try {
      const url = `${baseUrl}${pagePath}`;
      const res = await fetch(url);
      const html = await res.text();

      // Nettoyer balises de script/style et commentaires HTML pour le contrôle du texte affiché
      const cleanHtml = html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

      let pageViolation = null;
      for (const pattern of forbiddenPatterns) {
        const match = cleanHtml.match(pattern);
        if (match) {
          pageViolation = { pattern: pattern.toString(), snippet: match[0] };
          break;
        }
      }

      report(
        `Motifs interdits : ${pagePath}`,
        pageViolation === null,
        pageViolation ? `Détecté: "${pageViolation.snippet}" (${pageViolation.pattern})` : 'Aucun motif'
      );

      if (!isLocalTest) {
        const hasLocalhost = html.toLowerCase().includes('localhost');
        if (hasLocalhost) {
          report(`Page ${pagePath} - Absence de 'localhost'`, false, "Présence inattendue de 'localhost'");
        }
      }
    } catch (err) {
      report(`Motifs interdits : ${pagePath}`, false, err.message);
    }
  }

  console.log(`\n=== Résumé : ${passedChecks}/${totalChecks} vérifications réussies, ${failedChecks} échec(s) ===`);

  if (failedChecks > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error("Erreur fatale d'exécution :", err);
  process.exit(1);
});
