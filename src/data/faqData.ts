export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS_LIST: FaqItem[] = [
  {
    q: "Comment Bylz prépare la facturation électronique ?",
    a: "Bylz intègre aujourd'hui les mentions légales essentielles sur vos factures PDF. Le format électronique structuré Factur-X est actuellement en cours de préparation.",
  },
  {
    q: "Puis-je utiliser Bylz gratuitement ?",
    a: "Absolument. Notre formule gratuite est permanente jusqu'à 3 factures par mois. Vous n'avez pas besoin de renseigner de carte bancaire pour démarrer.",
  },
  {
    q: "Comment fonctionne le calcul des cotisations URSSAF ?",
    a: "Bylz applique les barèmes officiels 2026 selon la nature de votre activité (services BNC, prestations BIC ou vente) pour calculer votre charge sociale réelle au centime près.",
  },
  {
    q: "Où sont hébergées mes données ?",
    a: "Votre base de données et vos factures sont hébergées en Europe chez Supabase (infrastructure AWS), avec sauvegardes quotidiennes.",
  },
  {
    q: "Puis-je importer mes anciennes factures ?",
    a: "Tout à fait. Bylz dispose d'un outil d'import qui analyse vos anciens fichiers PDF ou tableurs pour reconstituer votre historique sans repartir de zéro.",
  },
  {
    q: "Que se passe-t-il si je dépasse le seuil de franchise de TVA ?",
    a: "Une alerte vous prévient dès que vous approchez des seuils légaux 2026 (37 500 € en services, 85 000 € en vente). L'application vous guide ensuite pour basculer facilement en facturation avec TVA sans risque de pénalité fiscale.",
  },
  {
    q: "Y a-t-il un engagement de durée ?",
    a: "Aucun. Toutes nos offres payantes sont sans engagement. Vous pouvez changer de formule ou résilier à tout moment d'un simple clic depuis vos paramètres.",
  },
  {
    q: "Mes factures sont-elles valables en cas de contrôle fiscal ?",
    a: "Oui. Bylz génère des pièces avec numérotation chronologique séquentielle sans rupture et tient votre livre chronologique des recettes.",
  },
];
