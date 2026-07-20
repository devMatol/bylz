import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Zap, LogOut } from "lucide-react";
import { NAV_ITEMS } from "../../lib/constants";
import { ThemeToggle } from "../shared/ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationsContext";
import { cn } from "../../lib/utils";

export function Sidebar() {
  const { user, profile, signOut } = useAuth();
  const { lateInvoicesCount, urssafDueSoon } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const email = user?.email || profile?.email || "";
  const initial = email.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    navigate("/login");
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[280px] bg-bg-sidebar border-r border-border flex-col z-30">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-border">
        <span className="text-2xl font-bold text-text">Bylz</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-semibold bg-primary/15 text-primary">
          SOLO <Zap className="w-3 h-3" />
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-200 border-l-[3px]",
                  isActive
                    ? "bg-primary/10 text-primary border-primary bylz-glow-primary"
                    : "text-muted border-transparent hover:text-text hover:bg-surface-hover"
                )
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
              {item.path === "/invoices" && lateInvoicesCount > 0 && (
                <span className="ml-auto w-2 h-2 rounded-full bg-danger flex-shrink-0" />
              )}
              {item.path === "/urssaf" && urssafDueSoon && (
                <span className="ml-auto w-2 h-2 rounded-full bg-danger flex-shrink-0" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="relative flex items-center gap-3 p-4 border-t border-border" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:bg-surface-hover rounded p-1 -m-1 transition-colors"
        >
          <div className="w-9 h-9 rounded-pill bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text truncate">{email || "Utilisateur"}</p>
            <p className="text-xs text-muted truncate">{profile?.plan?.toUpperCase() || "STARTER"}</p>
          </div>
        </button>
        <ThemeToggle />

        {menuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-surface border border-border rounded-card shadow-lg p-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-text hover:bg-surface-hover transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
