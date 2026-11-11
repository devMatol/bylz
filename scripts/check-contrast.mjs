/**
 * scripts/check-contrast.mjs
 * Test automatique de contraste WCAG AA (seuil >= 4.5:1) RENDU en conditions réelles avec Playwright.
 *
 * Teste les 4 combinaisons croisées :
 * 1. emulateMedia({ colorScheme: 'light' }) + data-theme="light"
 * 2. emulateMedia({ colorScheme: 'dark'  }) + data-theme="light"  (OS sombre + App clair - cas du bug prod)
 * 3. emulateMedia({ colorScheme: 'light' }) + data-theme="dark"   (OS clair + App sombre)
 * 4. emulateMedia({ colorScheme: 'dark'  }) + data-theme="dark"   (OS sombre + App sombre)
 *
 * Sur les 7 pages du back-office :
 * - /dashboard
 * - /invoices (factures)
 * - /urssaf
 * - /quotes (devis)
 * - /reminders (relances)
 * - /settings (paramètres)
 * - /invoices/new (nouvelle facture)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import { preview } from "vite";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function getEnv() {
  const envPath = path.join(rootDir, ".env");
  if (!fs.existsSync(envPath)) {
    throw new Error(`.env introuvable dans ${rootDir}`);
  }
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
  return env;
}

export const PAGES = [
  { name: "dashboard", route: "/dashboard" },
  { name: "factures", route: "/invoices" },
  { name: "urssaf", route: "/urssaf" },
  { name: "devis", route: "/quotes" },
  { name: "relances", route: "/reminders" },
  { name: "parametres", route: "/settings" },
  { name: "nouvelle facture", route: "/invoices/new" },
];

export const COMBINATIONS = [
  { id: "light-light", label: "1. OS light | App light", colorScheme: "light", dataTheme: "light" },
  { id: "dark-light",  label: "2. OS dark  | App light", colorScheme: "dark",  dataTheme: "light" },
  { id: "light-dark",  label: "3. OS light | App dark",  colorScheme: "light", dataTheme: "dark" },
  { id: "dark-dark",   label: "4. OS dark  | App dark",   colorScheme: "dark",  dataTheme: "dark" },
];

export const AUDIT_SCRIPT = `
(() => {
  function parseRgba(str) {
    if (!str) return [0, 0, 0, 1];
    const m = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
    if (!m) return [0, 0, 0, 1];
    return [
      parseInt(m[1], 10),
      parseInt(m[2], 10),
      parseInt(m[3], 10),
      m[4] !== undefined ? parseFloat(m[4]) : 1
    ];
  }

  function getEffectiveBg(el) {
    let r = 255, g = 255, b = 255;
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      r = 10; g = 14; b = 26; // #0a0e1a
    }

    const bgStack = [];
    let curr = el;
    while (curr && curr !== document.documentElement) {
      const style = window.getComputedStyle(curr);
      const bg = style.backgroundColor;
      if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
        const parsed = parseRgba(bg);
        if (parsed[3] > 0) bgStack.unshift(parsed);
      }
      curr = curr.parentElement;
    }

    let curR = r, curG = g, curB = b;
    for (const [sr, sg, sb, sa] of bgStack) {
      curR = Math.round(sr * sa + curR * (1 - sa));
      curG = Math.round(sg * sa + curG * (1 - sa));
      curB = Math.round(sb * sa + curB * (1 - sa));
    }
    return [curR, curG, curB];
  }

  function luminance([r, g, b]) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }

  function getContrast(fg, bg) {
    const L1 = luminance(fg);
    const L2 = luminance(bg);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Key selector targets for specific components
  const KEY_PATTERNS = [
    "Rattraper votre historique",
    "Premier client",
    "Avoir",
    "Périmètre Sécurisé",
    "Amical",
    "Ferme",
    "Formel",
    "Pénalités de retard",
    "Solo",
    "Pro",
    "77 100",
    "36 900"
  ];

  const results = [];
  const processed = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let textNode;

  while ((textNode = walker.nextNode())) {
    const text = textNode.nodeValue?.trim();
    if (!text || text.length < 2) continue;

    const el = textNode.parentElement;
    if (!el || processed.has(el)) continue;
    processed.add(el);

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) < 0.1) continue;

    const fgRgba = parseRgba(style.color);
    if (fgRgba[3] < 0.2) continue;

    const bgRgb = getEffectiveBg(el);
    const fgRgb = fgRgba.slice(0, 3);
    const ratio = Math.round(getContrast(fgRgb, bgRgb) * 100) / 100;

    const fontSize = parseFloat(style.fontSize) || 14;
    const fontWeight = parseInt(style.fontWeight, 10) || 400;
    const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
    const threshold = isLarge ? 3.0 : 4.5;

    const isKey = KEY_PATTERNS.some(k => text.includes(k));

    results.push({
      text: text.slice(0, 60),
      tag: el.tagName.toLowerCase(),
      fontSize: Math.round(fontSize),
      fontWeight,
      fgRgb,
      bgRgb,
      fgHex: "rgb(" + fgRgb.join(",") + ")",
      bgHex: "rgb(" + bgRgb.join(",") + ")",
      ratio,
      threshold,
      pass: ratio >= threshold,
      isKey,
    });
  }

  return results;
})()
`;

export async function runRenderedContrastAudit() {
  const env = getEnv();

  // 1. Authentification Supabase
  const adminClient = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: "matthiasollivier123@gmail.com",
  });
  if (linkErr) throw new Error("generateLink error: " + linkErr.message);

  const anonClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const { data: sessionData, error: sessionErr } = await anonClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });
  if (sessionErr) throw new Error("verifyOtp error: " + sessionErr.message);
  const sessionStr = JSON.stringify(sessionData.session);

  // 2. Démarrage de Vite Preview sur port 5198
  const server = await preview({
    root: rootDir,
    preview: { port: 5198, host: "127.0.0.1" },
  });
  const baseUrl = "http://127.0.0.1:5198";

  // 3. Playwright Chromium
  const browser = await chromium.launch({ headless: true });
  const allResults = [];

  try {
    for (const comb of COMBINATIONS) {
      const combData = {
        combination: comb.label,
        colorScheme: comb.colorScheme,
        dataTheme: comb.dataTheme,
        pages: [],
        totalChecked: 0,
        totalPassed: 0,
        totalFailed: 0,
        minRatio: 999,
        keySamples: [],
        failures: [],
      };

      const context = await browser.newContext({
        colorScheme: comb.colorScheme,
      });

      await context.addInitScript(
        ({ sessionStr, theme }) => {
          try {
            window.localStorage.setItem("sb-sbwbjkzustnlnnilkogm-auth-token", sessionStr);
            window.localStorage.setItem("bylz-theme-v2", theme);
            window.sessionStorage.setItem("bylz-first-landing-done", "true");
            document.documentElement.setAttribute("data-theme", theme);
            if (theme === "dark") document.documentElement.classList.add("dark");
            else document.documentElement.classList.remove("dark");
          } catch (e) {}
        },
        { sessionStr, theme: comb.dataTheme }
      );

      const page = await context.newPage();
      await page.emulateMedia({ colorScheme: comb.colorScheme });

      for (const p of PAGES) {
        await page.goto(`${baseUrl}${p.route}`, { waitUntil: "networkidle" });
        await page.evaluate((theme) => {
          document.documentElement.setAttribute("data-theme", theme);
          if (theme === "dark") document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
        }, comb.dataTheme);

        await page.waitForTimeout(300);

        const pageResults = await page.evaluate(AUDIT_SCRIPT);
        const passed = pageResults.filter(r => r.pass).length;
        const failed = pageResults.filter(r => !r.pass);
        const minRatio = pageResults.reduce((min, r) => Math.min(min, r.ratio), 999);

        combData.totalChecked += pageResults.length;
        combData.totalPassed += passed;
        combData.totalFailed += failed.length;
        combData.minRatio = Math.min(combData.minRatio, minRatio);

        const keyItems = pageResults.filter(r => r.isKey);
        combData.keySamples.push(...keyItems.map(k => ({ page: p.name, ...k })));

        if (failed.length > 0) {
          combData.failures.push(...failed.map(f => ({ page: p.name, ...f })));
        }

        combData.pages.push({
          page: p.name,
          checked: pageResults.length,
          passed,
          failed: failed.length,
          minRatio: minRatio === 999 ? "N/A" : minRatio,
        });
      }

      await context.close();
      allResults.push(combData);
    }
  } finally {
    await browser.close();
    server.httpServer.close();
  }

  return allResults;
}

// Execution CLI
if (process.argv[1] && process.argv[1].endsWith("check-contrast.mjs")) {
  console.log("Exécution de l'audit de contraste Playwright (7 pages x 4 combinaisons)...");
  runRenderedContrastAudit().then((results) => {
    console.log("\n=======================================================================");
    console.log("RÉSULTATS DE L'AUDIT DE CONTRASTE PLAYWRIGHT RENDU (WCAG AA >= 4.5:1)");
    console.log("=======================================================================\n");

    let allPass = true;
    for (const r of results) {
      console.log(`=======================================================================`);
      console.log(`COMBINAISON : ${r.combination}`);
      console.log(`=======================================================================`);
      console.log(`Total éléments texte vérifiés : ${r.totalChecked}`);
      console.log(`Conformes WCAG AA (>= 4.5:1 ou >= 3.0:1 grand texte) : ${r.totalPassed}`);
      console.log(`Échecs : ${r.totalFailed}`);
      console.log(`Ratio minimal global observé : ${r.minRatio}:1`);
      console.log("\nDétail par page :");
      for (const p of r.pages) {
        console.log(`  - /${p.page.padEnd(16)} : ${String(p.passed).padStart(3)}/${String(p.checked).padStart(3)} OK (min: ${p.minRatio}:1)`);
      }

      console.log("\nÉchantillons des composants clés audités :");
      for (const k of r.keySamples.slice(0, 8)) {
        console.log(`  * [${k.page}] "${k.text}" -> fg=${k.fgHex} bg=${k.bgHex} ratio=${k.ratio}:1 (seuil ${k.threshold}:1) [${k.pass ? "PASS" : "FAIL"}]`);
      }

      if (r.failures.length > 0) {
        allPass = false;
        console.log("\nDÉTAILS DES ÉCHECS :");
        for (const f of r.failures) {
          console.log(`  ❌ [${f.page}] "${f.text}" fg=${f.fgHex} bg=${f.bgHex} ratio=${f.ratio}:1 (seuil ${f.threshold}:1)`);
        }
      }
      console.log("\n");
    }

    if (!allPass) {
      console.error("❌ ÉCHEC : Des éléments ne respectent pas le seuil WCAG AA.");
      process.exit(1);
    } else {
      console.log("✅ SUCCÈS : 100% des éléments audités respectent le seuil WCAG AA dans les 4 combinaisons !");
    }
  }).catch((err) => {
    console.error("Erreur audit Playwright:", err);
    process.exit(1);
  });
}
