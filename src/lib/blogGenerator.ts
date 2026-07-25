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
  const kw = (options.keyword || options.topic).trim();
  const kwLower = kw.toLowerCase();
  const topic = options.topic && options.topic !== options.keyword ? options.topic : kw;

  // Clean slug
  const slug = topic
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Topic classification for specialized content generation
  const isTva = kwLower.includes("tva") || kwLower.includes("franchise") || kwLower.includes("293");
  const isFacturX = kwLower.includes("factur-x") || kwLower.includes("facturx") || kwLower.includes("reforme") || kwLower.includes("2026");
  const isUrssaf = kwLower.includes("urssaf") || kwLower.includes("cotisation") || kwLower.includes("bnc") || kwLower.includes("bic");
  const isQuote = kwLower.includes("devis") || kwLower.includes("signature") || kwLower.includes("eidas");
  const isUnpaid = kwLower.includes("impay") || kwLower.includes("relance") || kwLower.includes("recouvrement");

  // Dynamic Title
  let title = `Guide ${topic.charAt(0).toUpperCase() + topic.slice(1)} : Règles, Conseils et Conformité 2026`;
  if (isTva) {
    title = `Seuils et Franchise de TVA 2026 : Le Guide Pratique pour Micro-Entrepreneurs`;
  } else if (isFacturX) {
    title = `Factur-X 2026 : Comment Adapter Votre Micro-Entreprise à la Facturation Électronique`;
  } else if (isUrssaf) {
    title = `Déclaration URSSAF 2026 : Calcul des Cotisations, Taux et Conseils d'Optimisation`;
  } else if (isQuote) {
    title = `Devis et Signature Électronique en 2026 : Cadre Légal et Bonnes Pratiques`;
  } else if (isUnpaid) {
    title = `Factures Impayées : Procédures de Relance et Délais Légaux en Micro-Entreprise`;
  }

  const excerpt = `Découvrez l'analyse complète d'experts sur "${topic}". Tout ce qu'un auto-entrepreneur doit appliquer pour être en conformité légale et maximiser ses revenus en 2026.`;
  const metaDescription = `Guide pratique ${topic} 2026 pour micro-entrepreneurs. Découvrez les règles fiscales, la conformité Factur-X et les conseils d'experts Bylz.`;

  // Specialized section 1 (Context & Challenge)
  let section1 = "";
  if (isFacturX) {
    section1 = `
<p>La réforme de la facturation électronique 2026 impose l'abandon définitif des factures sous simple format Word ou Excel non certifié pour les transactions B2B en France. Le format <strong>Factur-X</strong> combine un document PDF lisible à l'œil humain et des métadonnées XML structurées directement interprétables par les Plateformes de Dématérialisation Partenaires (PDP) et le Portail Public de Facturation (PPF).</p>
<p>Pour les micro-entrepreneurs, l'enjeu principal consiste à émettre des factures comportant l'ensemble des lignes d'en-tête et des identifiants (SIRET, Numéro de TVA ou mention d'exonération, code acheteur) sans alourdir le processus quotidien de gestion.</p>`;
  } else if (isTva) {
    section1 = `
<p>La franchise en base de TVA (régie par l'article 293 B du Code Général des Impôts) permet aux auto-entrepreneurs de facturer leurs clients en montant Net sans collecter de TVA. Cependant, le respect rigoureux des deux seuils réglementaires (le <strong>seuil de base</strong> et le <strong>seuil majoré</strong>) est impératif pour éviter une régularisation fiscale rétroactive.</p>
<p>En 2026, pour les activités de prestations de services (BNC/BIC), le seuil de base s'établit à <strong>36 800 €</strong> et le seuil majoré à <strong>39 100 €</strong>. Pour la vente de marchandises, ils s'élèvent respectivement à <strong>91 900 €</strong> et <strong>101 000 €</strong>.</p>`;
  } else if (isUrssaf) {
    section1 = `
<p>Chaque mois ou chaque trimestre, les travailleurs indépendants doivent déclarer l'intégralité du chiffre d'affaires réellement encaissé (et non simplement facturé). Les taux de cotisations sociales s'appliquent directement sur ce montant brut brut selon la nature de l'activité exercée.</p>
<p>Pour 2026, les taux indicatifs de cotisations sociales URSSAF sont de <strong>21,1% / 21,2%</strong> pour les prestations de services (BNC et BIC services) et de <strong>12,3%</strong> pour l'achat/revente de marchandises.</p>`;
  } else {
    section1 = `
<p>En tant qu'indépendant ou micro-entrepreneur, la gestion de <strong>"${topic}"</strong> constitue un pilier central pour sécuriser vos revenus et garantir la conformité de votre activité face à l'administration fiscale et à vos clients.</p>
<p>Face à la complexification du cadre légal en 2026, adopter des processus automatisés et certifiés permet de réduire les risques d'erreurs d'écriture et de concentrer 100% de votre temps sur le développement de votre chiffre d'affaires.</p>`;
  }

  // Specialized section 2 (Practical Steps & Rules)
  let section2 = "";
  if (isQuote) {
    section2 = `
<h2>1. Les mentions obligatoires et la valeur juridique du devis</h2>
<p>Avant le début de toute prestation dépassant 1 500 €, la rédaction d'un devis détaillé est légalement obligatoire. Pour avoir valeur de contrat, le devis doit comporter :</p>
<ul>
  <li><strong>La mention "Devis" ou "Proposition Commerciale"</strong> avec un numéro d'identification unique.</li>
  <li><strong>L'identité complète des deux parties :</strong> Raison sociale, SIRET, adresse et email du client.</li>
  <li><strong>Le détail quantitatif et unitaire :</strong> Description précise de chaque prestation, quantité et prix unitaire HT.</li>
  <li><strong>La durée de validité de l'offre :</strong> Généralement fixée à 30 ou 60 jours.</li>
  <li><strong>La signature accompagnée de la date et de la mention manuscrite "Bon pour accord".</strong></li>
</ul>

<div class="my-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
  <p class="font-bold text-sm text-brand-primary">✍️ Le saviez-vous ?</p>
  <p class="text-xs text-slate-400 mt-1">La signature électronique intégrée dans Bylz bénéficie du niveau de certification eIDAS. Elle horodate et scelle le document PDF pour garantir sa valeur probante devant un tribunal en cas de litige.</p>
</div>`;
  } else if (isUnpaid) {
    section2 = `
<h2>1. La procédure graduelle de recouvrement d'une facture en retard</h2>
<p>Lorsqu'une facture dépasse sa date d'échéance légale (généralement 30 jours après émission), la réglementation prévoit des outils stricts pour inciter au règlement :</p>
<ol>
  <li><strong>Relance amiable (J+3 à J+7) :</strong> Envoi d'un rappel courtois par email incluant un lien direct de règlement par carte bancaire.</li>
  <li><strong>Relance formelle (J+15) :</strong> Envoi d'une lettre de relance rappelant l'application des pénalités de retard.</li>
  <li><strong>Mise en demeure (J+30) :</strong> Courrier recommandé avec AR constituant le dernier préalable avant l'injonction de payer.</li>
</ol>

<p>De plein droit, les professionnels peuvent facturer une <strong>indemnité forfaitaire de recouvrement de 40 €</strong> (Article L441-10 du Code de commerce) pour tout retard de paiement entre professionnels.</p>`;
  } else {
    section2 = `
<h2>1. Les 3 règles d'or pour gérer "${topic}" avec succès</h2>
<p>Pour assurer une gestion sans faille et éviter tout redressement fiscal, appliquez rigoureusement les étapes suivantes :</p>

<ul>
  <li><strong>1. Rigueur de numérotation :</strong> Conservez une numérotation chronologique continue et ininterrompue sur l'ensemble de vos documents.</li>
  <li><strong>2. Conservation de 10 ans :</strong> Archivez l'ensemble de vos factures émises et reçues au format électronique probant pendant 10 ans.</li>
  <li><strong>3. Traçabilité des paiements :</strong> Associez chaque encaissement bancaire à la facture correspondante pour justifier votre livre des recettes.</li>
</ul>`;
  }

  // Final section & Call-To-Action
  const content = `
${section1}

<div class="my-6 p-5 rounded-xl bg-brand-primary/10 border border-brand-primary/30 text-brand-primary">
  <p class="font-bold text-sm">💡 L'astuce Bylz pour auto-entrepreneurs :</p>
  <p class="text-xs text-text mt-1">Ne perdez plus votre temps à calculer vos totaux ou vérifier vos mentions légales à la main. <strong>Bylz</strong> génère vos devis et factures conformes Factur-X 2026 en moins de 60 secondes.</p>
</div>

${section2}

<h2>2. Synthèse et Checklist de Récapitulation 2026</h2>
<p>En résumé, voici la feuille de route à suivre pour aborder <em>${kw}</em> en toute confiance :</p>

<table class="w-full text-xs text-left border-collapse my-6 border border-border">
  <thead>
    <tr class="bg-surface border-b border-border">
      <th class="p-3 font-bold text-text">Étape</th>
      <th class="p-3 font-bold text-text">Action Obligatoire</th>
      <th class="p-3 font-bold text-text">Outil recommandé</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-border">
    <tr>
      <td class="p-3 font-semibold text-text">Préparation</td>
      <td class="p-3 text-muted">Vérification des mentions et seuils légaux 2026</td>
      <td class="p-3 text-brand-primary font-bold">Plateforme Bylz</td>
    </tr>
    <tr>
      <td class="p-3 font-semibold text-text">Émission & Signature</td>
      <td class="p-3 text-muted">Génération Factur-X & signature en ligne eIDAS</td>
      <td class="p-3 text-brand-primary font-bold">Bylz Pro Portal</td>
    </tr>
    <tr>
      <td class="p-3 font-semibold text-text">Déclaration</td>
      <td class="p-3 text-muted">Déclaration du CA encaissé et archivage 10 ans</td>
      <td class="p-3 text-brand-primary font-bold">URSSAF + Bylz Cloud</td>
    </tr>
  </tbody>
</table>

<div class="my-8 p-6 rounded-2xl bg-surface border border-border text-center space-y-4 shadow-xl">
  <h3 class="text-xl font-extrabold text-text">Gagnez du temps et sécurisez votre facturation dès aujourd'hui</h3>
  <p class="text-sm text-muted max-w-lg mx-auto">Rejoignez les micro-entrepreneurs qui utilisent Bylz pour éditer leurs devis, encaisser par carte bancaire et piloter leur chiffre d'affaires.</p>
  <a href="/signup" class="inline-block px-6 py-3 rounded-xl bg-brand-primary text-white font-black hover:opacity-90 transition-opacity">Créer mon compte gratuit Bylz 🚀</a>
</div>
  `.trim();

  return {
    title,
    slug,
    excerpt,
    metaDescription,
    category: options.category || "Guides & Fiscalité",
    readTime: `${Math.max(4, Math.ceil(content.split(" ").length / 180))} min de lecture`,
    keywords: [kw],
    content,
  };
}
