import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Skeleton } from "../ui/Skeleton";

export function ProtectedRoute() {
  const { user, company, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-10">
        <div className="w-full max-w-md flex flex-col gap-3">
          <Skeleton height="2rem" width="40%" />
          <Skeleton height="1rem" />
          <Skeleton height="1rem" width="80%" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!company && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
