/**
 * Motifs d'allégations et tournures interdites partagés entre scripts/check_seo.js
 * et scripts/post_deploy_check.js.
 */
export const forbiddenPatterns = [
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
