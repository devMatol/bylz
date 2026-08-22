import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Skeleton } from "../ui/Skeleton";

export function PublicOnlyRoute() {
  const { user, profile, company, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-10">
        <Skeleton height="20rem" width="28rem" />
      </div>
    );
  }

  if (user) {
    const isStarter = profile?.plan === "starter";
    const defaultPath = isStarter ? "/invoices" : "/dashboard";
    return <Navigate to={company ? `${defaultPath}${location.search}` : `/onboarding${location.search}`} replace />;
  }

  return <Outlet />;
}
