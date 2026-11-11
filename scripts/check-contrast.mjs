/**
 * scripts/check-contrast.mjs
 * Test automatique de contraste WCAG 2.x AA (seuil 4.5:1 pour le texte normal)
 * Vérifie les pages du back-office :
 * 1. /dashboard
 * 2. /invoices (factures)
 * 3. /urssaf
 * 4. /quotes (devis)
 * 5. /reminders (relances)
 * 6. /settings (paramètres)
 * 7. /invoices/new (nouvelle facture)
 * En mode clair (data-theme="light") ET en mode sombre (data-theme="dark").
 */

export function parseHex(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function luminance([r, g, b]) {
  const [rl, gl, bl] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function getContrast(fg, bg) {
  const L1 = luminance(parseHex(fg));
  const L2 = luminance(parseHex(bg));
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export const CONTRAST_TEST_SUITE = [
  // --- 1. DASHBOARD ---
  {
    page: "dashboard",
    component: "Bannière Rattraper Historique - Titre",
    light: { fg: "#082f49", bg: "#eff6ff", desc: "blue-950 sur bg-blue-500/5" },
    dark: { fg: "#bfdbfe", bg: "#141c38", desc: "blue-200 sur dark surface" },
  },
  {
    page: "dashboard",
    component: "Bannière Rattraper Historique - Sous-titre",
    light: { fg: "#334155", bg: "#eff6ff", desc: "slate-700 sur bg-blue-500/5" },
    dark: { fg: "#cbd5e1", bg: "#141c38", desc: "slate-300 sur dark surface" },
  },
  {
    page: "dashboard",
    component: "Checklist Premiers Pas - Titre étape terminée",
    light: { fg: "#475569", bg: "#f0fdf4", desc: "slate-600 sur emerald-50/50" },
    dark: { fg: "#cbd5e1", bg: "#142526", desc: "slate-300 sur emerald-950/30" },
  },
  {
    page: "dashboard",
    component: "Checklist Premiers Pas - Description étape terminée",
    light: { fg: "#64748b", bg: "#ffffff", desc: "text-muted sur surface" },
    dark: { fg: "#94a3b8", bg: "#141c38", desc: "slate-400 sur dark surface" },
  },
  {
    page: "dashboard",
    component: "Checklist Premiers Pas - Badge N étapes",
    light: { fg: "#1d4ed8", bg: "#eff6ff", desc: "blue-700 sur blue-50" },
    dark: { fg: "#93c5fd", bg: "#0c1938", desc: "blue-300 sur blue-950/50" },
  },
  {
    page: "dashboard",
    component: "Sidebar - Badge PRO ambre",
    light: { fg: "#92400e", bg: "#ffffff", desc: "amber-800 sur surface claire" },
    dark: { fg: "#fbbf24", bg: "#0f1426", desc: "amber-400 sur dark sidebar" },
  },

  // --- 2. FACTURES ---
  {
    page: "factures",
    component: "Bannière Historique Invoices - Titre",
    light: { fg: "#082f49", bg: "#eff6ff", desc: "blue-950 sur bg-blue-500/5" },
    dark: { fg: "#bfdbfe", bg: "#141c38", desc: "blue-200 sur dark surface" },
  },
  {
    page: "factures",
    component: "StatusBadge - Avoir non imputé",
    light: { fg: "#6d28d9", bg: "#f8fafc", desc: "violet-700 sur surface-hover" },
    dark: { fg: "#c4b5fd", bg: "#1c274c", desc: "violet-300 sur surface-hover dark" },
  },
  {
    page: "factures",
    component: "Badge Achat électronique",
    light: { fg: "#5b21b6", bg: "#f5f3ff", desc: "violet-800 sur violet-500/15" },
    dark: { fg: "#c4b5fd", bg: "#1f1b3c", desc: "violet-300 sur violet-500/15 dark" },
  },
  {
    page: "factures",
    component: "Montant Achat électronique (- XXX €)",
    light: { fg: "#6d28d9", bg: "#ffffff", desc: "violet-700 sur surface" },
    dark: { fg: "#c4b5fd", bg: "#141c38", desc: "violet-300 sur dark surface" },
  },

  // --- 3. URSSAF ---
  {
    page: "urssaf",
    component: "ThresholdGaugeCard - Badge Périmètre Sécurisé",
    light: { fg: "#065f46", bg: "#f0fdf4", desc: "emerald-800 sur emerald-500/10" },
    dark: { fg: "#34d399", bg: "#132c32", desc: "emerald-400 sur dark surface" },
  },
  {
    page: "urssaf",
    component: "ThresholdGaugeCard - Vigilance Seuil",
    light: { fg: "#92400e", bg: "#fef9ee", desc: "amber-800 sur amber-500/10" },
    dark: { fg: "#fbbf24", bg: "#2b2426", desc: "amber-400 sur dark surface" },
  },
  {
    page: "urssaf",
    component: "ThresholdGaugeCard - Reste disponible / Montant",
    light: { fg: "#047857", bg: "#ffffff", desc: "emerald-700 sur surface" },
    dark: { fg: "#34d399", bg: "#141c38", desc: "emerald-400 sur dark surface" },
  },
  {
    page: "urssaf",
    component: "TvaBreakdownCard - TVA collectée",
    light: { fg: "#047857", bg: "#ffffff", desc: "emerald-700 sur surface" },
    dark: { fg: "#34d399", bg: "#141c38", desc: "emerald-400 sur dark surface" },
  },
  {
    page: "urssaf",
    component: "TvaBreakdownCard - TVA déductible (achats)",
    light: { fg: "#6d28d9", bg: "#ffffff", desc: "violet-700 sur surface" },
    dark: { fg: "#c4b5fd", bg: "#141c38", desc: "violet-300 sur dark surface" },
  },
  {
    page: "urssaf",
    component: "UrssafPage - Échéance provisionnelle estimée",
    light: { fg: "#047857", bg: "#ffffff", desc: "emerald-700 sur surface" },
    dark: { fg: "#34d399", bg: "#141c38", desc: "emerald-400 sur dark surface" },
  },

  // --- 4. DEVIS ---
  {
    page: "devis",
    component: "QuoteDetailPage - Mention devis validé / converti",
    light: { fg: "#065f46", bg: "#f0fdf4", desc: "emerald-800 sur emerald-500/10" },
    dark: { fg: "#34d399", bg: "#132c32", desc: "emerald-400 sur dark surface" },
  },
  {
    page: "devis",
    component: "QuotesPage - StatusBadge devis accepté",
    light: { fg: "#047857", bg: "#f8fafc", desc: "success (emerald-700) sur surface-hover" },
    dark: { fg: "#10b981", bg: "#1c274c", desc: "success dark (emerald-500) sur surface-hover dark" },
  },

  // --- 5. RELANCES ---
  {
    page: "relances",
    component: "AutoRemindersSection - Ton Amical",
    light: { fg: "#065f46", bg: "#f0fdf4", desc: "emerald-800 sur emerald-500/15" },
    dark: { fg: "#34d399", bg: "#132c32", desc: "emerald-400 sur dark surface" },
  },
  {
    page: "relances",
    component: "AutoRemindersSection - Ton Ferme",
    light: { fg: "#92400e", bg: "#fef9ee", desc: "amber-800 sur amber-500/15" },
    dark: { fg: "#fbbf24", bg: "#2b2426", desc: "amber-400 sur dark surface" },
  },
  {
    page: "relances",
    component: "AutoRemindersSection - Ton Formel",
    light: { fg: "#9f1239", bg: "#fff1f2", desc: "rose-800 sur rose-500/15" },
    dark: { fg: "#fb7185", bg: "#2b1926", desc: "rose-400 sur dark surface" },
  },

  // --- 6. PARAMETRES ---
  {
    page: "parametres",
    component: "SettingsPage - Pénalités de retard aperçu",
    light: { fg: "#475569", bg: "#ffffff", desc: "slate-600 sur fond facture blanc" },
    dark: { fg: "#94a3b8", bg: "#141c38", desc: "slate-400 sur dark surface" },
  },
  {
    page: "parametres",
    component: "ComplianceSection - Badge Loi Anti-fraude TVA",
    light: { fg: "#065f46", bg: "#f0fdf4", desc: "emerald-800 sur emerald-500/15" },
    dark: { fg: "#34d399", bg: "#132c32", desc: "emerald-400 sur dark surface" },
  },
  {
    page: "parametres",
    component: "BankSyncSection - Compte connecté synchronisé",
    light: { fg: "#065f46", bg: "#f0fdf4", desc: "emerald-800 sur emerald-500/15" },
    dark: { fg: "#34d399", bg: "#132c32", desc: "emerald-400 sur dark surface" },
  },

  // --- 7. NOUVELLE FACTURE ---
  {
    page: "nouvelle-facture",
    component: "InvoiceNewPage - Bannière TVA non applicable",
    light: { fg: "#082f49", bg: "#eff6ff", desc: "blue-950 sur bg-blue-500/5" },
    dark: { fg: "#bfdbfe", bg: "#141c38", desc: "blue-200 sur dark surface" },
  },
  {
    page: "nouvelle-facture",
    component: "InvoiceNewPage - Total Net à Payer",
    light: { fg: "#0f172a", bg: "#ffffff", desc: "text principal sur surface" },
    dark: { fg: "#ffffff", bg: "#141c38", desc: "text dark sur surface dark" },
  },
];

export function runContrastAudit() {
  const MIN_RATIO = 4.5;
  let totalChecked = 0;
  let failed = 0;
  const rows = [];

  for (const item of CONTRAST_TEST_SUITE) {
    // Mode Clair
    const lightRatio = getContrast(item.light.fg, item.light.bg);
    const lightPass = lightRatio >= MIN_RATIO;
    totalChecked++;
    if (!lightPass) failed++;
    rows.push({
      page: item.page,
      component: item.component,
      theme: "light",
      fg: item.light.fg,
      bg: item.light.bg,
      ratio: lightRatio.toFixed(2),
      status: lightPass ? "PASS" : "FAIL",
      note: item.light.desc,
    });

    // Mode Sombre
    const darkRatio = getContrast(item.dark.fg, item.dark.bg);
    const darkPass = darkRatio >= MIN_RATIO;
    totalChecked++;
    if (!darkPass) failed++;
    rows.push({
      page: item.page,
      component: item.component,
      theme: "dark",
      fg: item.dark.fg,
      bg: item.dark.bg,
      ratio: darkRatio.toFixed(2),
      status: darkPass ? "PASS" : "FAIL",
      note: item.dark.desc,
    });
  }

  return { totalChecked, failed, rows };
}

import { pathToFileURL } from "url";

// CLI execution
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log("================================================================================");
  console.log("  TEST AUTOMATIQUE DE CONTRASTE WCAG 2.x AA (Seuil normal text >= 4.5:1)");
  console.log("  Pages auditées : dashboard, factures, urssaf, devis, relances, parametres, nouvelle facture");
  console.log("================================================================================\n");

  const { totalChecked, failed, rows } = runContrastAudit();

  for (const r of rows) {
    const statusSign = r.status === "PASS" ? "✔ PASS" : "✖ FAIL";
    console.log(
      `[${r.page.padEnd(16)}] [${r.theme.padEnd(5)}] ${statusSign} (${r.ratio}:1) - ${r.component}`
    );
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log(`Total tests : ${totalChecked} | Succès : ${totalChecked - failed} | Échecs : ${failed}`);
  console.log("--------------------------------------------------------------------------------");

  if (failed > 0) {
    console.error(`\n❌ Échec : ${failed} élément(s) ne respectent pas le seuil de 4.5:1.`);
    process.exit(1);
  } else {
    console.log("\n✅ Tous les éléments testés en mode clair et sombre respectent le seuil de 4.5:1.");
  }
}
