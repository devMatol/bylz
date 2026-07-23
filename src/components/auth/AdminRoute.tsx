import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { Skeleton } from "../ui/Skeleton";

interface AdminRouteProps {
  requireSuperAdmin?: boolean;
}

export function AdminRoute({ requireSuperAdmin = false }: AdminRouteProps) {
  const { realProfile, profile, user, loading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  // Use realProfile if available, fallback to profile
  const activeProfile = realProfile || profile;
  const isOwnerEmail = user?.email?.toLowerCase() === "matthiasollivier123@gmail.com";
  const isAdmin = activeProfile?.is_admin === true || isOwnerEmail;
  const isSuperAdmin = activeProfile?.admin_role === "super_admin" || isOwnerEmail;

  useEffect(() => {
    if (!loading && user) {
      if (!isAdmin) {
        toast("Accès réservé", "danger");
      } else if (requireSuperAdmin && !isSuperAdmin) {
        toast("Accès réservé au super admin", "danger");
      }
    }
  }, [loading, user, isAdmin, requireSuperAdmin, isSuperAdmin, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-10">
        <Skeleton height="20rem" width="28rem" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
