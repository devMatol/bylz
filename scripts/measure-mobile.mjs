/**
 * scripts/measure-mobile.mjs
 * Script de mesure réutilisable pour les contraintes mobiles 375 px (Lot 7bis) :
 * 1. Textes < 12 px (ex: text-[10px], text-[11px], fontSize < 12)
 * 2. Cibles tactiles cliquables < 40 px (ex: h-8, h-7, h-6, p-1 sans min-h-[40px])
 * 3. État replié de la bannière d'historique sur mobile (sm:hidden bar)
 * 4. Barre fixe unique sur les écrans d'édition (/invoices/new, /quotes/new)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const PAGES_TO_ANALYZE = [
  { name: "/dashboard", file: "src/pages/DashboardPage.tsx" },
  { name: "/urssaf", file: "src/pages/UrssafPage.tsx" },
  { name: "/invoices", file: "src/pages/InvoicesPage.tsx" },
  { name: "/quotes", file: "src/pages/QuotesPage.tsx" },
  { name: "/reminders", file: "src/pages/RemindersPage.tsx" },
];

const SHARED_COMPONENTS = [
  "src/components/layout/BottomNav.tsx",
  "src/components/shared/StatCard.tsx",
  "src/components/fiscal/FiscalCharts.tsx",
  "src/components/fiscal/ThresholdGaugeCard.tsx",
  "src/components/fiscal/TvaBreakdownCard.tsx",
  "src/components/fiscal/LivreRecettesSection.tsx",
  "src/components/settings/AutoRemindersSection.tsx",
  "src/components/settings/ComplianceSection.tsx",
];

function analyzeFile(relPath) {
  const filePath = path.join(rootDir, relPath);
  if (!fs.existsSync(filePath)) {
    return { error: "File not found" };
  }
  const code = fs.readFileSync(filePath, "utf8");

  // 1. Text sizes < 12px
  // Tailwind text-[Xpx] where X < 12
  const smallTextTailwind = code.match(/text-\[(?:[0-9]|1[0-1])px\]/g) || [];
  // SVG fontSize={X} or fontSize="X" where X < 12
  const svgSmallText = code.match(/fontSize=(?:["'](?:[0-9]|1[0-1])["']|\{(?:[0-9]|1[0-1])\})/g) || [];
  const textUnder12px = smallTextTailwind.length + svgSmallText.length;

  // 2. Clickable touch targets < 40px
  // Matches buttons or links with h-6, h-7, h-8, py-1, p-1 without min-h-[40px]
  const buttonTags = code.match(/<(?:button|a|Link)[\s\S]*?>/g) || [];
  let touchTargetsUnder40px = 0;
  for (const tag of buttonTags) {
    if (tag.includes("min-h-[40px]") || tag.includes("min-h-[44px]") || tag.includes("h-10") || tag.includes("h-11") || tag.includes("h-12")) {
      continue;
    }
    if (tag.match(/\b(?:h-6|h-7|h-8|h-5|p-1|py-1)\b/)) {
      touchTargetsUnder40px++;
    }
  }

  // 3. Banner collapsible check
  const hasCollapsibleBanner = code.includes("historyExpanded") || code.includes("sm:hidden");

  return {
    file: relPath,
    textUnder12px,
    smallTextSamples: [...smallTextTailwind, ...svgSmallText],
    touchTargetsUnder40px,
    hasCollapsibleBanner,
  };
}

console.log("=== MESURE MOBILE 375 PX (RAPPORT STATIQUE ET CONTRACTUEL) ===");
console.log("");
console.log("Pages cibles :");
let totalSmallText = 0;
let totalSub40Touch = 0;

for (const p of PAGES_TO_ANALYZE) {
  const res = analyzeFile(p.file);
  totalSmallText += res.textUnder12px;
  totalSub40Touch += res.touchTargetsUnder40px;
  console.log(`- ${p.name} (${p.file}) :`);
  console.log(`    Textes < 12px : ${res.textUnder12px} ${res.textUnder12px === 0 ? "✅" : "⚠️ (" + res.smallTextSamples.join(", ") + ")"}`);
  console.log(`    Zones tactiles < 40px : ${res.touchTargetsUnder40px} ${res.touchTargetsUnder40px === 0 ? "✅" : "⚠️"}`);
  if (p.name === "/dashboard" || p.name === "/invoices") {
    console.log(`    Bannière repliable mobile (1 ligne) : ${res.hasCollapsibleBanner ? "OUI ✅" : "NON ❌"}`);
  }
}

console.log("");
console.log("Composants partagés clés :");
for (const comp of SHARED_COMPONENTS) {
  const res = analyzeFile(comp);
  totalSmallText += res.textUnder12px;
  totalSub40Touch += res.touchTargetsUnder40px;
  console.log(`- ${comp} : Textes < 12px = ${res.textUnder12px}, Touch < 40px = ${res.touchTargetsUnder40px}`);
}

// 4. Check BottomNav visibility on /invoices/new and /quotes/new
const bottomNavCode = fs.readFileSync(path.join(rootDir, "src/components/layout/BottomNav.tsx"), "utf8");
const hidesOnEditor =
  bottomNavCode.includes('pathname.startsWith("/invoices/new")') ||
  bottomNavCode.includes('pathname.includes("/invoices/new")') ||
  bottomNavCode.includes('isEditorPage');
console.log("");
console.log(`BottomNav masquée sur pages de création (/new, /edit) : ${hidesOnEditor ? "OUI (Barre fixe unique ✅)" : "NON ❌"}`);

console.log("");
console.log(`TOTAL RÉSIDUEL sur le périmètre Lot 7bis :`);
console.log(`- Textes sous 12 px : ${totalSmallText} ${totalSmallText === 0 ? "✅" : "⚠️"}`);
console.log(`- Zones tactiles sous 40 px : ${totalSub40Touch} ${totalSub40Touch === 0 ? "✅" : "⚠️"}`);
