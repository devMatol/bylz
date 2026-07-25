export interface KeywordIdea {
  keyword: string;
  volume: string;
  difficulty: "Faible" | "Moyenne" | "Élevée";
  intent: "Transactionnel" | "Informationnel" | "Guide Pratique";
  suggestedTitle: string;
  category: string;
}

export const SUGGESTED_KEYWORDS: KeywordIdea[] = [
  {
    keyword: "factur-x 2026 auto entrepreneur",
    volume: "12,400/mois",
    difficulty: "Faible",
    intent: "Informationnel",
    suggestedTitle: "Factur-X 2026 : Le Guide Complet de la Réforme pour Micro-Entrepreneurs",
    category: "Législation & Conformité",
  },
  {
    keyword: "franchise en base de tva 2026",
    volume: "18,200/mois",
    difficulty: "Moyenne",
    intent: "Guide Pratique",
    suggestedTitle: "Plafonds & Dépassement de TVA 2026 : Règles et Stratégies Auto-Entrepreneur",
    category: "Fiscalité Micro-entreprise",
  },
  {
    keyword: "mentions obligatoires devis facture 2026",
    volume: "8,900/mois",
    difficulty: "Faible",
    intent: "Guide Pratique",
    suggestedTitle: "Mentions Obligatoires sur Devis et Facture en 2026 : Checklist & Pièges à Éviter",
    category: "Facturation & Devis",
  },
  {
    keyword: "signature electronique devis gratuit",
    volume: "6,500/mois",
    difficulty: "Faible",
    intent: "Transactionnel",
    suggestedTitle: "Comment Faire Signer un Devis en Ligne Gratuitement et Légalement",
    category: "Productivité & Outils",
  },
  {
    keyword: "calcul cotisations urssaf bnc 2026",
    volume: "14,100/mois",
    difficulty: "Moyenne",
    intent: "Informationnel",
    suggestedTitle: "Calcul Cotisations URSSAF 2026 : Taux, ACRE et Déclaration en Ligne",
    category: "Gestion & Cotisations",
  },
  {
    keyword: "relance facture impayee auto entrepreneur",
    volume: "5,300/mois",
    difficulty: "Faible",
    intent: "Guide Pratique",
    suggestedTitle: "Factures Impayées : Modèles de Relance et Pénalités Légales de Retard",
    category: "Facturation & Devis",
  },
];

export interface SeoAnalysisResult {
  score: number;
  checks: {
    label: string;
    passed: boolean;
    recommendation?: string;
  }[];
  wordCount: number;
  estimatedReadTime: string;
}

export function analyzeArticleSeo(article: {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  keywords: string[];
}): SeoAnalysisResult {
  const checks = [];
  let points = 0;

  // Title length check (40 - 70 chars)
  const titleLen = article.title.trim().length;
  const titleOk = titleLen >= 40 && titleLen <= 70;
  if (titleOk) points += 20;
  checks.push({
    label: `Titre SEO (${titleLen} caractères)`,
    passed: titleOk,
    recommendation: titleOk ? undefined : "Viser entre 40 et 70 caractères pour un affichage optimal Google.",
  });

  // Meta Description check (120 - 165 chars)
  const metaLen = (article.metaDescription || "").trim().length;
  const metaOk = metaLen >= 120 && metaLen <= 165;
  if (metaOk) points += 20;
  checks.push({
    label: `Meta Description (${metaLen} caractères)`,
    passed: metaOk,
    recommendation: metaOk ? undefined : "Rédiger une meta description entre 120 et 165 caractères.",
  });

  // Slug check
  const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug);
  if (slugOk) points += 15;
  checks.push({
    label: "Format du Slug URL (mots séparés par des tirets)",
    passed: slugOk,
    recommendation: slugOk ? undefined : "Le slug doit être en minuscules et sans caractères spéciaux (kebab-case).",
  });

  // Word count check
  const cleanText = article.content.replace(/<[^>]*>/g, " ");
  const words = cleanText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lengthOk = wordCount >= 350;
  if (lengthOk) points += 25;
  checks.push({
    label: `Longueur de l'article (${wordCount} mots)`,
    passed: lengthOk,
    recommendation: lengthOk ? undefined : "Un article performant en SEO doit contenir au moins 350 mots.",
  });

  // Keyword in title & content check
  const primaryKw = article.keywords?.[0]?.toLowerCase() || "";
  const kwInTitle = primaryKw ? article.title.toLowerCase().includes(primaryKw) : false;
  const kwInContent = primaryKw ? cleanText.toLowerCase().includes(primaryKw) : false;
  const kwOk = kwInTitle || kwInContent;
  if (kwOk) points += 20;
  checks.push({
    label: primaryKw ? `Mot-clé principal ("${primaryKw}") présent` : "Mot-clé renseigné",
    passed: kwOk,
    recommendation: kwOk ? undefined : "Inclure le mot-clé cible dans le titre et le corps de l'article.",
  });

  const minutes = Math.max(1, Math.ceil(wordCount / 200));

  return {
    score: points,
    checks,
    wordCount,
    estimatedReadTime: `${minutes} min de lecture`,
  };
}

export function generateAiArticle(options: {
  topic: string;
  keyword: string;
  category: string;
}): {
  title: string;
  slug: string;
  excerpt: string;
  metaDescription: string;
  category: string;
  readTime: string;
  keywords: string[];
  content: string;
} {
  const kw = options.keyword.toLowerCase();
  const cleanTopic = options.topic || options.keyword;

  const slug = cleanTopic
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const title = `Guide ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)} : Règles, Conseils et Bonnes Pratiques en 2026`;
  
  const excerpt = `Découvrez notre guide complet sur ${cleanTopic}. Tout ce qu'un auto-entrepreneur doit savoir pour être en conformité et optimiser sa gestion en 2026.`;
  
  const metaDescription = `Guide pratique ${cleanTopic} pour auto-entrepreneurs en 2026. Découvrez les règles fiscales, la facture Factur-X et les conseils d'experts Bylz.`;

  const content = `
<h2>Pourquoi le sujet "${cleanTopic}" est primordial pour les micro-entrepreneurs en 2026</h2>
<p>En tant qu'indépendant ou auto-entrepreneur, la maîtrise de votre facturation et de vos obligations légales est un levier majeur de sérénité et de rentabilité. Avec les évolutions réglementaires de 2026 (notamment la généralisation du format <strong>Factur-X</strong>), maîtriser <em>${kw}</em> devient indispensable pour éviter les sanctions et pénalités fiscales.</p>

<div class="my-6 p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
  <p class="font-bold text-sm">💡 L'astuce Bylz pour gagner du temps :</p>
  <p class="text-xs text-text mt-1">Utiliser un logiciel certifié comme <strong>Bylz</strong> vous permet d'automatiser l'édition de vos devis, l'envoi de vos factures au format officiel et le suivi de votre chiffre d'affaires URSSAF en 1 clic.</p>
</div>

<h2>1. Les principes fondamentaux à connaître</h2>
<p>Lorsque vous traitez de <strong>${cleanTopic}</strong>, il convient d'appliquer des règles claires et rigoureuses dès le démarrage de votre activité :</p>

<ul>
  <li><strong>Numérotation chronologique continue :</strong> Vos factures doivent être numérotées selon une séquence ininterrompue sans trous.</li>
  <li><strong>Mentions d'exonération de TVA :</strong> En franchise de TVA (article 293 B du CGI), la mention légale obligatoire doit obligatoirement figurer sur chaque document.</li>
  <li><strong>Conformité au format électronique Factur-X :</strong> La facture doit comporter les métadonnées lisibles par les plateformes de dématérialisation partenaires (PDP).</li>
</ul>

<h2>2. Dévis et Factures : Comment éviter les impayés et sécuriser vos prestations ?</h2>
<p>L'un des principaux pièges pour les travailleurs indépendants réside dans le délai de paiement des clients. Faire signer un devis électroniquement avant tout début de mission constitue votre meilleure protection juridique.</p>

<p>Avec la plateforme <strong>Bylz</strong>, vous pouvez proposer la signature électronique certifiée eIDAS directement sur une vue client dédiée, et accepter le règlement par carte bancaire de manière ultra-sécurisée.</p>

<h2>3. Synthèse des obligations et conseils pratiques</h2>
<p>En résumé, pour garantir la conformité de votre micro-entreprise autour de <em>${kw}</em> :</p>
<ol>
  <li>Vérifiez systématiquement vos seuils de chiffre d'affaires et de TVA.</li>
  <li>Conservez un double au format PDF/A certifié de l'ensemble de vos factures d'émissions pendant 10 ans.</li>
  <li>Automatisez le suivi des paiements pour relancer les clients dès le premier jour de retard.</li>
</ol>

<div class="my-8 p-6 rounded-2xl bg-surface border border-border text-center space-y-4 shadow-lg">
  <h3 class="text-xl font-extrabold text-text">Facturez et faites signer vos devis en toute sérénité</h3>
  <p class="text-sm text-muted max-w-lg mx-auto">Rejoignez des milliers de freelances qui utilisent Bylz pour gérer leurs devis, factures certifiées Factur-X et déclarations URSSAF.</p>
  <a href="/signup" class="inline-block px-6 py-3 rounded-xl bg-brand-primary text-white font-black hover:opacity-90 transition-opacity">Créer mon compte gratuit Bylz 🚀</a>
</div>
  `.trim();

  return {
    title,
    slug,
    excerpt,
    metaDescription,
    category: options.category || "Guides & Fiscalité",
    readTime: "5 min de lecture",
    keywords: [options.keyword],
    content,
  };
}
