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
  {
    slug: "modele-facture-auto-entrepreneur-gratuit",
    title: "Modèle de Facture Auto-Entrepreneur Gratuit 2026 : Exemples Word, Excel et Format Conforme",
    excerpt:
      "Téléchargez un modèle de facture officiel pour micro-entrepreneur. Mentions obligatoires, franchise en base de TVA (art. 293 B) et pourquoi éviter les modèles Word et Excel en 2026.",
    date: "04 Septembre 2026",
    readTime: "6 min de lecture",
    author: "Équipe Fiscale Bylz",
    category: "Devis & Facturation",
    content: `
      <h2>Quelles sont les obligations de facturation pour un auto-entrepreneur ?</h2>
      <p>En tant qu'auto-entrepreneur (micro-entrepreneur), vous êtes soumis à des règles strictes de facturation dès votre premier euro de chiffre d'affaires. Une facture doit être délivrée pour toute prestation de service ou vente réalisée à destination d'un professionnel (B2B), ainsi que pour les particuliers (B2C) dès que le montant dépasse 25 € TTC ou sur demande du client.</p>

      <h2>Les mentions obligatoires d'un modèle de facture auto-entrepreneur</h2>
      <p>Pour être parfaitement valable aux yeux de l'administration fiscale et de l'URSSAF, chaque facture doit comporter :</p>
      <ul>
        <li><strong>Identité complète de votre micro-entreprise :</strong> Vos nom et prénom légaux (suivis obligatoirement de la mention « EI » ou « Entrepreneur Individuel »), votre adresse professionnelle et votre numéro SIRET à 14 chiffres.</li>
        <li><strong>Coordonnées du client :</strong> Nom de la société ou du particulier, adresse de facturation (et adresse de livraison si différente).</li>
        <li><strong>Numérotation continue et chronologique :</strong> Votre séquence de numérotation ne doit comporter aucun trou ni doublon (ex : <code>FAC-2026-001</code>, <code>FAC-2026-002</code>).</li>
        <li><strong>Dates clés :</strong> Date d'émission de la facture et date limite de paiement (échéance).</li>
        <li><strong>Détail des prestations :</strong> Description précise de la prestation ou marchandise, quantité et prix unitaire hors taxes.</li>
        <li><strong>Mention TVA obligatoire :</strong> Si vous êtes en franchise en base, la mention légale incontournable <em>« TVA non applicable, art. 293 B du CGI »</em> doit obligatoirement figurer.</li>
        <li><strong>Conditions de règlement :</strong> Taux des pénalités de retard applicables et indemnité forfaitaire pour frais de recouvrement de 40 € (pour les clients professionnels).</li>
      </ul>

      <h2>Pourquoi les modèles Word et Excel gratuits sont-ils déconseillés en 2026 ?</h2>
      <p>Pendant longtemps, de nombreux indépendants ont téléchargé des modèles gratuits de facture au format Excel (XLSX) ou Word (DOCX). Cependant, cette pratique présente aujourd'hui trois risques majeurs :</p>
      <ul>
        <li><strong>Amendes fiscales pour numérotation non conforme :</strong> En modifiant manuellement des fichiers Word, le risque de créer deux factures portant le même numéro ou d'omettre une facture dans la séquence est très élevé. L'administration sanctionne ces irrégularités par une amende de 15 € par mention manquante ou inexacte.</li>
        <li><strong>Erreurs de calcul de TVA et cotisations :</strong> Une erreur de formule dans un tableur Excel peut fausser vos déclarations URSSAF trimestrielles ou mensuelles et entraîner des redressements.</li>
        <li><strong>La réforme Factur-X et facturation électronique 2026 :</strong> Les factures au format papier ou simple PDF généré sur Word ne répondent pas aux normes de transmission électronique obligatoire. Utiliser un outil conforme comme Bylz vous garantit une transition sans stress.</li>
      </ul>

      <h2>Générez votre facture gratuite et conforme ci-dessous</h2>
      <p>Utilisez notre configurateur interactif ci-dessous pour remplir vos informations, personnaliser vos couleurs et télécharger gratuitement votre facture au format PDF officiel Factur-X.</p>
    `,
  },
];

