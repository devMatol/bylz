import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { useAuth } from "../../contexts/AuthContext";
import { Crown, ShieldAlert } from "lucide-react";

export function AdminLayout() {
  const { realProfile, profile, isImpersonating } = useAuth();
  const activeProfile = realProfile || profile;
  const isSuperAdmin = activeProfile?.admin_role === "super_admin";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500/30">
      <ImpersonationBanner />

      {/* Main Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className={`min-h-screen flex flex-col md:ml-[260px] ${isImpersonating ? "pt-12" : ""}`}>
        {/* Topbar for Admin */}
        <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-rose-950/60 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-pill bg-rose-950/80 text-rose-300 border border-rose-800/40">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Espace Administration</span>
            </span>

            {isSuperAdmin && (
              <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] font-extrabold px-2 py-0.5 rounded-pill bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Crown className="w-3 h-3" />
                <span>Super Admin</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs font-semibold text-slate-400">
            <span>Connecté en tant que : <strong className="text-white">{activeProfile?.email}</strong></span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
