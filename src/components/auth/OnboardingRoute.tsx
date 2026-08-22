import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Skeleton } from "../ui/Skeleton";

export function OnboardingRoute() {
  const { user, profile, company, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-10">
        <Skeleton height="30rem" width="36rem" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const params = new URLSearchParams(location.search);
  const allowWizard =
    params.get("mode") === "complete" ||
    params.get("mode") === "edit" ||
    !company?.siret ||
    !company?.address;

  if (company && !params.get("success") && !allowWizard) {
    const isStarter = profile?.plan === "starter";
    const defaultPath = isStarter ? "/invoices" : "/dashboard";
    return <Navigate to={defaultPath} replace />;
  }

  return <Outlet />;
}
