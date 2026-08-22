import { SEO } from "../components/seo/SEO";
import { PageContainer } from "../components/layout/PageContainer";
import { BankSyncSection } from "../components/settings/BankSyncSection";

export function BankPage() {
  return (
    <PageContainer
      title="Banque & Rapprochement Automatique"
      subtitle="Connectez votre compte pro, synchronisez vos virement réels et rapprochez vos factures en 1-clic"
    >
      <SEO title="Banque & Rapprochement Automatique | Bylz" canonical="/bank" />
      <div className="space-y-6">
        <BankSyncSection />
      </div>
    </PageContainer>
  );
}
