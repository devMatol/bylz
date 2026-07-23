import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { useAuth } from "../../contexts/AuthContext";
import { Crown, ShieldAlert, Menu, X, ArrowLeft } from "lucide-react";

import { FactPulseTokenBanner } from "./FactPulseTokenBanner";

export function AdminLayout() {
  const { realProfile, profile, user, isImpersonating } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const activeProfile = realProfile || profile;
  const isOwnerEmail = user?.email?.toLowerCase() === "matthiasollivier123@gmail.com";
  const isSuperAdmin = activeProfile?.admin_role === "super_admin" || isOwnerEmail;

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500/30">
      <ImpersonationBanner />
      <FactPulseTokenBanner />

      {/* Main Desktop Admin Sidebar */}
      <AdminSidebar />

      {/* Mobile Slide-Over Admin Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-4 h-16 border-b border-rose-950/80 bg-slate-950">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight text-white">Bylz</span>
              <span className="text-xs font-mono font-black tracking-wider px-2 py-0.5 rounded-pill bg-rose-600/30 text-rose-400 border border-rose-500/40">
                ADMIN
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-card text-rose-400 hover:bg-rose-950/40 focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Fermer le menu admin"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <AdminSidebar isMobile onItemClick={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`min-h-screen flex flex-col md:ml-[260px] ${isImpersonating ? "pt-12" : ""}`}>
        {/* Topbar for Admin (Mobile & Desktop) */}
        <header className="h-16 bg-slate-950/90 backdrop-blur-md border-b border-rose-950/60 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            {/* Mobile Burger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-card text-rose-400 hover:bg-rose-950/40 border border-rose-900/60 focus:outline-none flex items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="Ouvrir le menu admin"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="inline-flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-pill bg-rose-950/80 text-rose-300 border border-rose-800/40">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Espace Admin</span>
            </span>

            {isSuperAdmin && (
              <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] font-extrabold px-2 py-0.5 rounded-pill bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Crown className="w-3 h-3" />
                <span>Super Admin</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs font-semibold text-slate-400">
            <span className="hidden sm:inline">
              Connecté : <strong className="text-white">{activeProfile?.email || user?.email || "matthiasollivier123@gmail.com"}</strong>
            </span>
            <Link
              to="/dashboard"
              className="md:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-card bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
              <span>App</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
