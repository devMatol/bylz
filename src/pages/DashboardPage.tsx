import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/shared/EmptyState";
import { Receipt } from "lucide-react";

export function DashboardPage() {
  return (
    <PageContainer
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre activité"
    >
      <EmptyState
        icon={<Receipt className="w-8 h-8" />}
        title="Aucune donnée à afficher"
        description="Créez votre première facture pour commencer à suivre votre activité."
        ctaLabel="Créer une facture"
        onCta={() => {}}
      />
    </PageContainer>
  );
}
