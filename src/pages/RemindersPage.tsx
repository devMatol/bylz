import { SEO } from "../components/seo/SEO";
import { PageContainer } from "../components/layout/PageContainer";
import { AutoRemindersSection } from "../components/settings/AutoRemindersSection";

export function RemindersPage() {
  return (
    <PageContainer
      title="Relances Automatiques & Paiements"
      subtitle="Configurez les règles de relance automatique (J+3, J+15) et les notifications de paiement"
    >
      <SEO title="Relances Automatiques & Paiements | Bylz" canonical="/reminders" />
      <div className="space-y-6">
        <AutoRemindersSection />
      </div>
    </PageContainer>
  );
}
