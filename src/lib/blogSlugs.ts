// Mapping for blog slug shortening and redirects
export const BLOG_SLUG_REDIRECTS: Record<string, string> = {
  // Legacy redirects
  "franchise-en-base-de-tva-2026": "franchise-tva-2026-seuils-et-regles",
  "calcul-cotisations-urssaf-bnc-2026": "calcul-cotisations-urssaf-bnc-bic",

  // 4 shortened long slugs (reduced from 86-106 chars to 4-5 concise words)
  "obligation-de-facturation-electronique-pour-les-auto-entrepreneurs-echeances-impacts-et-mise-en-conformite":
    "obligation-facturation-electronique-auto-entrepreneur",
  "logiciel-de-facturation-pour-micro-entrepreneur-conforme-securiser-sa-croissance-et-anticiper-2026":
    "logiciel-facturation-micro-entrepreneur-2026",
  "comment-automatiser-sa-declaration-urssaf-d-auto-entrepreneur-pour-optimiser-sa-tresorerie":
    "automatiser-declaration-urssaf-auto-entrepreneur",
  "modele-devis-facture-artisan-batiment-gratuit-les-risques-caches-pour-votre-tresorerie":
    "devis-facture-artisan-batiment-risques",
};

// Inverse map to lookup original slug in database if needed
export const BLOG_REVERSE_SLUGS: Record<string, string> = Object.entries(
  BLOG_SLUG_REDIRECTS
).reduce((acc, [oldSlug, newSlug]) => {
  acc[newSlug] = oldSlug;
  return acc;
}, {} as Record<string, string>);

/**
 * Returns canonical shortened slug if mapped, or original slug.
 */
export function getCanonicalBlogSlug(slug: string): string {
  return BLOG_SLUG_REDIRECTS[slug] || slug;
}

/**
 * Returns original database slug if mapped, or original slug.
 */
export function getDbBlogSlug(slug: string): string {
  return BLOG_REVERSE_SLUGS[slug] || slug;
}
