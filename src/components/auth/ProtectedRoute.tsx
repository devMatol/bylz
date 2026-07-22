import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Skeleton } from "../ui/Skeleton";
import { useEffect, useState } from "react";

export function ProtectedRoute() {
  const { user, company, loading } = useAuth();
  const location = useLocation();
  const [migratedId, setMigratedId] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    if (loading || !user || !company) return;

    const params = new URLSearchParams(location.search);
    const isGuest = params.get("guest") === "true";
    const guestDraft = localStorage.getItem("bylz-guest-draft");

    if (isGuest && guestDraft && !migrating && !migratedId) {
      setMigrating(true);
      import("../../lib/api").then(async ({ migrateGuestDraft }) => {
        try {
          const newInvoiceId = await migrateGuestDraft(company.id);
          if (newInvoiceId) {
            setMigratedId(newInvoiceId);
          } else {
            setMigrating(false);
          }
        } catch (e) {
          console.error("Migration in ProtectedRoute failed", e);
          setMigrating(false);
        }
      });
    }
  }, [loading, user, company, location.search, migrating, migratedId]);

  if (loading || migrating) {
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

  if (migratedId) {
    return <Navigate to={`/invoices/${migratedId}`} replace />;
  }

  if (!company && location.pathname !== "/onboarding") {
    return <Navigate to={`/onboarding${location.search}`} replace />;
  }

  return <Outlet />;
}
