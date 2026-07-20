import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/shared/EmptyState";
import { Landmark } from "lucide-react";

export function UrssafPage() {
  return (
    <PageContainer title="URSSAF" subtitle="Vos déclarations URSSAF">
      <EmptyState
        icon={<Landmark className="w-8 h-8" />}
        title="Aucune déclaration"
        description="Vos déclarations URSSAF apparaîtront ici automatiquement."
      />
    </PageContainer>
  );
}
