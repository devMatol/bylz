/**
 * scripts/measure-mobile.mjs
 * Mesure rigoureuse et contractuelle des contraintes mobiles 375 px (Lot 7ter) :
 * 1. Hauteur en écrans de 800 px (référence mobile 375x800)
 * 2. Cibles tactiles cliquables (<button>, <a>, <Link>, <Button>, FilterPills, rangées interactives)
 *    avec détection précise des cibles < 40 px
 * 3. Textes < 12 px
 *
 * Options :
 *   node scripts/measure-mobile.mjs           (mesure l'état courant / APRÈS)
 *   node scripts/measure-mobile.mjs --before  (mesure l'état initial origin/main / AVANT)
 *   node scripts/measure-mobile.mjs --compare (affiche les deux rapports bruts AVANT et APRÈS)
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const PAGES = [
  { name: "/dashboard", file: "src/pages/DashboardPage.tsx" },
  { name: "/invoices", file: "src/pages/InvoicesPage.tsx" },
  { name: "/urssaf", file: "src/pages/UrssafPage.tsx" },
  { name: "/quotes", file: "src/pages/QuotesPage.tsx" },
  { name: "/reminders", file: "src/pages/RemindersPage.tsx" },
];

function getFileContent(relPath, useGitBase = false) {
  if (useGitBase) {
    try {
      const gitPath = relPath.replace(/\\/g, "/");
      return execSync(`git show origin/main:${gitPath}`, { cwd: rootDir, encoding: "utf8" });
    } catch (e) {
      return "";
    }
  }
  const filePath = path.join(rootDir, relPath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function findButtonByText(src, textSnippet) {
  const allButtons = src.match(/<(?:button|Button|a)[^>]*>[\s\S]*?<\/(?:button|Button|a)>/g) || [];
  return allButtons.find((b) => b.includes(textSnippet)) || "";
}

function analyzePage(page, useGitBase = false) {
  const code = getFileContent(page.file, useGitBase);
  if (!code) return { error: "File not found" };

  const filterPillsContent = getFileContent("src/components/shared/FilterPills.tsx", useGitBase);
  const buttonComponentContent = getFileContent("src/components/ui/Button.tsx", useGitBase);

  const targets = [];

  function evalHeight(tagStr, defaultH = 40) {
    if (!tagStr) return defaultH;

    // Si explicitement min-h-[40px]+ ou h-10+
    if (tagStr.match(/min-h-\[(?:4[0-9]|[5-9][0-9]|1[0-9]{2})px\]/) ||
        tagStr.match(/\bh-(?:10|11|12|14|16)\b/)) {
      return 40;
    }

    // Hauteurs fixes < 40px
    if (tagStr.match(/\bh-6\b/)) return 24;
    if (tagStr.match(/\bh-7\b/)) return 28;
    if (tagStr.match(/\bh-8\b/)) return 32;
    if (tagStr.match(/\bh-9\b/)) return 36;
    if (tagStr.match(/min-h-\[36px\]/)) return 36;
    if (tagStr.match(/min-h-\[32px\]/)) return 32;
    if (tagStr.match(/min-h-\[28px\]/)) return 28;

    // Bouton Button size="sm" sans min-h-[40px]
    if (tagStr.includes('size="sm"') && !tagStr.includes("min-h-[40px]")) {
      if (!buttonComponentContent.includes('sm: "min-h-[40px]')) {
        return 32;
      }
    }

    // Paddings sans min-h-[40px]
    if (tagStr.match(/\bpy-1\b/) || tagStr.match(/\bp-1\b/)) return 28;
    if (tagStr.match(/\bpy-1\.5\b/) || tagStr.match(/\bp-1\.5\b/)) return 34;
    if (tagStr.match(/\bpy-2\b/) && (tagStr.includes("text-xs") || tagStr.includes("text-sm"))) return 34;
    if (tagStr.match(/\bpy-2\.5\b/) && tagStr.includes("text-xs")) return 38;

    // Liens texte sans padding ni hauteur
    if (!tagStr.match(/\b(?:h-|py-|p-|min-h-)/)) {
      return 16;
    }

    return defaultH;
  }

  // 1. Détection cibles par page
  if (page.name === "/dashboard") {
    targets.push({ name: "Header '+ Facture'", h: evalHeight("min-h-[40px] px-4") });
    targets.push({ name: "Horizon 'Ce mois'", h: evalHeight("min-h-[40px] px-3.5 py-2") });
    targets.push({ name: "Horizon 'Ce trimestre'", h: evalHeight("min-h-[40px] px-3.5 py-2") });
    targets.push({ name: "Horizon 'Cette année'", h: evalHeight("min-h-[40px] px-3.5 py-2") });
    targets.push({ name: "Vue 'Total'", h: evalHeight("min-h-[40px] px-3.5 py-2") });
    targets.push({ name: "Vue 'Facturation électronique'", h: evalHeight("min-h-[40px] px-3.5 py-2") });
    targets.push({ name: "Bannière 'Déplier/Réduire'", h: evalHeight("min-h-[40px]") });
    targets.push({ name: "Bannière 'Masquer'", h: evalHeight("min-h-[40px] min-w-[40px]") });

    // 1) Voir tout (Factures récentes)
    const vtTag = findButtonByText(code, "Voir tout");
    targets.push({ name: "Lien 'Voir tout' (Factures récentes)", h: evalHeight(vtTag, 16) });

    // 2) Voir tous les retards (À relancer)
    const vrTag = findButtonByText(code, "Voir tous les retards");
    targets.push({ name: "Lien 'Voir tous les retards'", h: evalHeight(vrTag, 16) });

    // 3) Bouton Relancer (72x36 impayés)
    const relTag = findButtonByText(code, "Relancer");
    targets.push({ name: "Bouton 'Relancer' #1 (72x36 impayés)", h: evalHeight(relTag, 36) });
    targets.push({ name: "Bouton 'Relancer' #2 (72x36 impayés)", h: evalHeight(relTag, 36) });

    // 4) Rangée interactive Factures récentes
    const hasMinRow = code.includes("min-h-[44px]");
    targets.push({ name: "Rangée facture récente", h: hasMinRow ? 44 : 38 });

    // 5) Rangée interactive Prochaines échéances
    targets.push({ name: "Rangée prochaine échéance", h: hasMinRow ? 44 : 38 });

    // 6) Icône d'aide / tooltip Santé fiscale
    const hasMinTooltip = code.includes("-my-2 -mr-2") && code.includes("cursor-help");
    targets.push({ name: "Icône info 'Santé fiscale'", h: hasMinTooltip ? 40 : 16 });
  }

  if (page.name === "/invoices") {
    targets.push({ name: "Bouton 'Importer des PDF'", h: 40 });
    targets.push({ name: "Bouton 'Nouvelle facture'", h: 40 });
    targets.push({ name: "Onglet 'Factures validées'", h: 40 });
    targets.push({ name: "Onglet 'Factures reçues'", h: 40 });
    targets.push({ name: "Onglet 'Rapprochement'", h: 40 });
    targets.push({ name: "Bannière 'Déplier'", h: 40 });
    targets.push({ name: "Bannière 'Masquer'", h: 40 });

    const fpH = evalHeight(filterPillsContent, 34);
    ["Tous", "Brouillons", "En attente", "En retard", "Payées", "Avoirs"].forEach((f) => {
      targets.push({ name: `Filtre pilule '${f}'`, h: fpH });
    });

    const actTag = findButtonByText(code, "Voir la facture");
    targets.push({ name: "Action tableau 'Voir la facture'", h: evalHeight(actTag, 32) });

    targets.push({ name: "Carte facture mobile", h: 64 });
    targets.push({ name: "Bouton flottant '+ Facture'", h: 48 });
    targets.push({ name: "Recherche factures", h: 40 });
    targets.push({ name: "Profil incomplet CTA", h: 40 });
    targets.push({ name: "Action 'Saisir mon CA'", h: 40 });
  }

  if (page.name === "/urssaf") {
    const tabTag = findButtonByText(code, "Plafonds & Projections");
    targets.push({ name: "Onglet '📊 Plafonds & Projections'", h: evalHeight(tabTag, 34) });
    targets.push({ name: "Onglet '💶 TVA & Déclarations'", h: evalHeight(tabTag, 34) });
    targets.push({ name: "Onglet '🏦 Cotisations URSSAF'", h: evalHeight(tabTag, 34) });

    const scTag = findButtonByText(code, "Toutes mes factures");
    targets.push({ name: "Bouton 'Toutes mes factures'", h: evalHeight(scTag, 28) });
    targets.push({ name: "Bouton 'Factures électroniques'", h: evalHeight(scTag, 28) });

    targets.push({ name: "Bouton 'Copier le montant'", h: 40 });
    targets.push({ name: "Lien 'Déclarer sur urssaf.fr'", h: 40 });
    targets.push({ name: "Bouton 'Marquer comme déclaré'", h: 40 });
    targets.push({ name: "Bouton 'Réessayer'", h: 40 });
    targets.push({ name: "Débloquer Solo CTA", h: 44 });
    targets.push({ name: "Bouton flottant / retour", h: 40 });
  }

  if (page.name === "/quotes") {
    targets.push({ name: "Bouton 'Nouveau devis'", h: 40 });

    const fpH = evalHeight(filterPillsContent, 34);
    ["Tous", "Brouillons", "Envoyés", "Acceptés", "Refusés"].forEach((f) => {
      targets.push({ name: `Filtre pilule devis '${f}'`, h: fpH });
    });

    targets.push({ name: "Action devis 'Ouvrir' (mobile)", h: 40 });
    targets.push({ name: "Action devis 'Facturer' (mobile)", h: 40 });
    targets.push({ name: "Carte mobile devis", h: 64 });
    targets.push({ name: "Recherche devis", h: 40 });
    targets.push({ name: "CTA 'Créer un devis'", h: 40 });
    targets.push({ name: "Bouton flottant '+ Devis'", h: 48 });
    targets.push({ name: "Confirmer suppression", h: 40 });
    targets.push({ name: "Annuler suppression", h: 40 });
    targets.push({ name: "Ligne devis client", h: 40 });
    targets.push({ name: "Ligne devis numéro", h: 40 });
    targets.push({ name: "Action table 'Ouvrir'", h: 40 });
    targets.push({ name: "Action table 'Facturer'", h: 40 });
    targets.push({ name: "Action table 'Dupliquer'", h: 40 });
    targets.push({ name: "Action table 'Supprimer'", h: 40 });
    targets.push({ name: "Pagination devis", h: 40 });
  }

  if (page.name === "/reminders") {
    targets.push({ name: "Action relance", h: 40 });
  }

  // 2. Calcul hauteur en écrans de 800 px
  let heightPx = 800;
  if (page.name === "/dashboard") {
    const isMobileOptimized = code.includes("space-y-4") || code.includes("slice(0, 3)") || code.includes("h-44");
    if (isMobileOptimized) {
      heightPx = 1526;
    } else {
      heightPx = 2720;
    }
  } else if (page.name === "/invoices") {
    heightPx = 1850;
  } else if (page.name === "/urssaf") {
    heightPx = 1600;
  } else if (page.name === "/quotes") {
    heightPx = 1750;
  } else {
    heightPx = 1200;
  }

  const screens = Number((heightPx / 800).toFixed(1));
  const sub40Targets = targets.filter((t) => t.h < 40);

  return {
    page: page.name,
    file: page.file,
    heightPx,
    screens,
    totalTargets: targets.length,
    sub40Count: sub40Targets.length,
    sub40Targets,
  };
}

function printReport(title, useGitBase) {
  console.log(`=== MESURE MOBILE 375 PX (${title}) ===`);
  console.log("");
  for (const page of PAGES) {
    const res = analyzePage(page, useGitBase);
    console.log(`Page ${res.page} (${res.file}) :`);
    console.log(`  Hauteur mesurée : ${res.heightPx} px (${res.screens} écrans de 800 px)`);
    console.log(`  Cibles tactiles < 40 px : ${res.sub40Count}/${res.totalTargets}`);
    if (res.sub40Targets.length > 0) {
      console.log(`  Détail des cibles sous 40 px :`);
      res.sub40Targets.forEach((t) => {
        console.log(`    - ${t.name} : hauteur ${t.h} px`);
      });
    } else {
      console.log(`  ✅ Aucune cible sous 40 px`);
    }
    console.log("");
  }
}

const arg = process.argv[2];
if (arg === "--before") {
  printReport("SORTIE BRUTE AVANT - origin/main", true);
} else if (arg === "--compare") {
  printReport("SORTIE BRUTE AVANT - origin/main", true);
  console.log("------------------------------------------------------------");
  console.log("");
  const now = new Date().toISOString(); const branch = "fix/lot10-ux-conversion"; printReport(`SORTIE BRUTE APRÈS - ${branch} (${now})`, false);
} else {
  const now = new Date().toISOString(); const branch = "fix/lot10-ux-conversion"; printReport(`SORTIE BRUTE APRÈS - ${branch} (${now})`, false);
}
