import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/shared/EmptyState";
import { Settings } from "lucide-react";

export function SettingsPage() {
  return (
    <PageContainer title="Paramètres" subtitle="Configurez votre compte">
      <EmptyState
        icon={<Settings className="w-8 h-8" />}
        title="Paramètres"
        description="Les paramètres de votre compte et de votre entreprise seront disponibles ici."
      />
    </PageContainer>
  );
}
