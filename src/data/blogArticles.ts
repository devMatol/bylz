export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
  category: string;
  content: string;
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "reforme-factur-x-2026-auto-entrepreneurs",
    title: "Réforme Factur-X 2026 : Ce qui change pour les auto-entrepreneurs et micro-entreprises",
    excerpt:
      "La réforme de la facturation électronique entre en vigueur en France. Découvrez les obligations du format Factur-X et du E-Reporting pour les indépendants.",
    date: "15 Juillet 2026",
    readTime: "5 min de lecture",
    author: "Équipe Fiscale Bylz",
    category: "Législation & Conformité",
    content: `
      <h2>Qu'est-ce que la réforme de la facturation électronique 2026 ?</h2>
      <p>À partir de 2026, la réglementation française impose l'abandon progressif des simples factures PDF transmises par e-mail au profit de factures électroniques certifiées et structurées dites <strong>Factur-X</strong>.</p>
      <p>Cette réforme s'applique à l'ensemble des assujettis à la TVA en France, y compris les micro-entrepreneurs réalisant des prestations ou ventes B2B (Business to Business).</p>

      <h3>Les 2 volets fondamentaux de la réforme :</h3>
      <ul>
        <li><strong>Le E-Invoicing (Facturation électronique B2B) :</strong> Transmission des factures inter-entreprises dans un format hybride contenant des données lisibles par l'homme (PDF) et un fichier XML structuré pour les ordinateurs.</li>
        <li><strong>Le E-Reporting (Transmission des données de ventes) :</strong> Transmission à l'administration fiscale des données relatives aux ventes B2C ou aux transactions internationales.</li>
      </ul>

      <h3>Quelles sanctions en cas de non-conformité ?</h3>
      <p>L'administration fiscale prévoit des amendes forfaitaires (jusqu'à 15 € par facture non conforme). Utiliser un outil compatible Factur-X comme Bylz vous garantit une conformité sans coût supplémentaire.</p>
    `,
  },
  {
    slug: "franchise-tva-2026-seuils-et-regles",
    title: "Franchise en base de TVA 2026 : Nouveaux seuils, tolérance et règles de dépassement",
    excerpt:
      "Tout savoir sur les plafonds de TVA en micro-entreprise : seuil de base, seuil majoré, facturation de la TVA et basculement du régime.",
    date: "10 Juillet 2026",
    readTime: "6 min de lecture",
    author: "Équipe Fiscale Bylz",
    category: "Fiscalité Micro-entreprise",
    content: `
      <h2>Comprendre la franchise en base de TVA</h2>
      <p>Par défaut, un auto-entrepreneur bénéficie du système de la <strong>franchise en base de TVA</strong> (article 293 B du CGI). Cela signifie qu'il ne facture pas la TVA à ses clients et ne la récupère pas sur ses achats.</p>

      <h3>Les plafonds actuels de TVA :</h3>
      <ul>
        <li><strong>Prestations de services (BNC / BIC) :</strong> Seuil de base à 39 100 € (seuil majoré à 42 500 €).</li>
        <li><strong>Vente de marchandises (BIC) :</strong> Seuil de base à 101 000 € (seuil majoré à 110 000 €).</li>
      </ul>

      <h3>Que se passe-t-il en cas de dépassement ?</h3>
      <p>Si vous dépassez le seuil de base mais restez sous le seuil majoré, vous conservez la franchise jusqu'à la fin de l'année. En revanche, si vous dépassez le seuil majoré, vous devenez redevable de la TVA dès le premier jour du mois de dépassement.</p>

      <p>Le module de pilotage fiscal de Bylz inclut une jauge en temps réel qui vous alerte automatiquement à l'approche de ces plafonds.</p>
    `,
  },
  {
    slug: "calcul-cotisations-urssaf-bnc-bic",
    title: "Comment calculer ses cotisations URSSAF et son bénéfice net en BNC et BIC en 2026",
    excerpt:
      "Apprenez à calculer exactement le montant de vos cotisations sociales et votre résultat net après impôt en micro-entreprise.",
    date: "02 Juillet 2026",
    readTime: "4 min de lecture",
    author: "Équipe Fiscale Bylz",
    category: "Gestion & Cotisations",
    content: `
      <h2>Les taux de cotisations sociales URSSAF</h2>
      <p>Les cotisations sociales en micro-entreprise sont calculées en appliquant un pourcentage fixe sur le chiffre d'affaires brut encaissé (et non sur le bénéfice) :</p>
      <ul>
        <li><strong>Professions libérales (BNC) & Prestations de services :</strong> Taux de cotisation à 23,1% (ou taux ACacre réduit la 1ère année).</li>
        <li><strong>Vente de marchandises (BIC) :</strong> Taux de cotisation à 12,3%.</li>
      </ul>

      <h2>L'abattement forfaitaire pour le calcul de l'impôt</h2>
      <p>Pour déterminer votre revenu imposable (bénéfice net), les impôts appliquent un abattement forfaitaire représentatif de vos charges :</p>
      <ul>
        <li>34% d'abattement pour les activités BNC (libérales).</li>
        <li>50% d'abattement pour les prestations de service BIC.</li>
        <li>71% d'abattement pour les ventes de marchandises BIC.</li>
      </ul>

      <p>Bylz intègre ces moteurs de calcul et simule instantanément votre reste à vivre net après cotisations et impôt estimé.</p>
    `,
  },
];
