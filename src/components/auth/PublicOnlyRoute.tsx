import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Skeleton } from "../ui/Skeleton";

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, company, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-10">
        <Skeleton height="20rem" width="28rem" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={company ? "/" : "/onboarding"} replace />;
  }

  return <>{children}</>;
}
