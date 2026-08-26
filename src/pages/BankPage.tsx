import { Navigate } from "react-router-dom";
import { SEO } from "../components/seo/SEO";
import { PageContainer } from "../components/layout/PageContainer";
import { BankSyncSection } from "../components/settings/BankSyncSection";
import { useAuth } from "../contexts/AuthContext";

export function BankPage() {
  const { user, profile } = useAuth();
  const isMatthias =
    user?.email?.toLowerCase() === "matthiasollivier123@gmail.com" ||
    profile?.email?.toLowerCase() === "matthiasollivier123@gmail.com";

  if (!isMatthias) {
    return <Navigate to="/dashboard" replace />;
  }

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
