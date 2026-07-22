import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Skeleton } from "../ui/Skeleton";

export function PublicOnlyRoute() {
  const { user, company, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-10">
        <Skeleton height="20rem" width="28rem" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={company ? `/${location.search}` : `/onboarding${location.search}`} replace />;
  }

  return <Outlet />;
}
