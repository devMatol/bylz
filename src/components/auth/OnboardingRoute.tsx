import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Skeleton } from "../ui/Skeleton";

export function OnboardingRoute() {
  const { user, company, loading } = useAuth();

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

  if (company) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
