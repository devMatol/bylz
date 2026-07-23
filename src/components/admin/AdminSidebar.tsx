import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Search,
  Users,
  Tag,
  ShieldCheck,
  LifeBuoy,
  FileText,
  ArrowLeft,
  Crown,
  Shield,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";

interface AdminSidebarProps {
  onItemClick?: () => void;
  isMobile?: boolean;
}

export function AdminSidebar({ onItemClick, isMobile = false }: AdminSidebarProps) {
  const { realProfile, profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  const activeProfile = realProfile || profile;
  const isOwnerEmail = user?.email?.toLowerCase() === "matthiasollivier123@gmail.com";
  const isSuperAdmin = activeProfile?.admin_role === "super_admin" || isOwnerEmail;

  const adminNavItems = [
    { label: "Métriques Ventes", path: "/admin/ventes", icon: TrendingUp },
    { label: "Métriques SEO", path: "/admin/seo", icon: Search },
    { label: "Utilisateurs", path: "/admin/users", icon: Users },
    { label: "Offres", path: "/admin/offres", icon: Tag, superAdminOnly: true },
    { label: "Administrateurs", path: "/admin/admins", icon: ShieldCheck, superAdminOnly: true },
    { label: "Support", path: "/admin/support", icon: LifeBuoy },
    { label: "Logs d'audit", path: "/admin/logs", icon: FileText },
  ];

  const handleSignOut = async () => {
    if (onItemClick) onItemClick();
    await signOut();
    navigate("/login");
  };

  const sidebarClasses = isMobile
    ? "flex flex-col h-full bg-slate-950 text-slate-100"
    : "hidden md:flex fixed left-0 top-0 bottom-0 w-[260px] bg-slate-950 border-r border-rose-950/60 flex-col z-30 text-slate-100";

  return (
    <aside className={sidebarClasses}>
      {/* Header with ADMIN badge */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-rose-950/80 bg-rose-950/20">
        <Link to="/admin" onClick={onItemClick} className="flex items-center space-x-2">
          <span className="text-xl font-black tracking-tight text-white">Bylz</span>
          <span className="text-xs font-mono font-black tracking-wider px-2 py-0.5 rounded-pill bg-rose-600/30 text-rose-400 border border-rose-500/40">
            ADMIN
          </span>
        </Link>
        {isSuperAdmin && (
          <span className="p-1 rounded-pill bg-amber-500/20 text-amber-400" title="Super Admin">
            <Crown className="w-4 h-4" />
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-rose-400/80">
          Back-Office
        </div>

        {adminNavItems.map((item) => {
          if (item.superAdminOnly && !isSuperAdmin) return null;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-card text-xs font-semibold transition-all duration-200 border-l-2",
                  isActive
                    ? "bg-rose-950/60 text-white border-rose-500 shadow-md font-bold"
                    : "text-slate-400 border-transparent hover:text-white hover:bg-slate-900"
                )
              }
            >
              <Icon className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{item.label}</span>
              {item.superAdminOnly && (
                <span title="Super Admin uniquement">
                  <Shield className="w-3 h-3 ml-auto text-amber-400/80" />
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Return to app */}
      <div className="p-3 border-t border-rose-950/80 space-y-2 bg-slate-950">
        <Link
          to="/dashboard"
          onClick={onItemClick}
          className="flex items-center justify-between px-3 py-2.5 rounded-card text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors border border-slate-800"
        >
          <span className="flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
            Retour App
          </span>
          <span className="text-[10px] text-slate-500 font-mono">bylz.fr</span>
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-card text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Déconnexion Admin
        </button>
      </div>
    </aside>
  );
}
