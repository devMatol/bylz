import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  Settings,
  Landmark,
  Package,
  ShieldCheck,
  LifeBuoy,
  LogOut,
  User,
  Crown,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const navigate = useNavigate();
  const { user, profile, company, signOut } = useAuth();

  if (!isOpen) return null;

  const handleSignOut = async () => {
    onClose();
    await signOut();
    navigate("/login");
  };

  const isAdminUser =
    Boolean(profile?.is_admin) ||
    profile?.admin_role === "admin" ||
    profile?.admin_role === "super_admin" ||
    user?.email?.toLowerCase() === "matthiasollivier123@gmail.com";

  const fullName =
    company?.commercial_name ||
    company?.legal_name ||
    user?.email?.split("@")[0] ||
    "Mon Compte";

  const planBadge =
    profile?.plan === "pro" ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold uppercase">
        <Crown className="w-3 h-3" />
        Bylz Pro
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase">
        Formule Gratuite
      </span>
    );

  const drawerLinks = [
    {
      label: "🌐 Voir l'Accueil (Site Public)",
      path: "/",
      icon: ChevronRight,
      desc: "Retourner sur la page d'accueil de Bylz",
    },
    {
      label: "🤖 Assistant IA Copilot",
      path: "/assistant",
      icon: Settings,
      desc: "Dictée vocale, conseils & WhatsApp",
    },
    {
      label: "🏛️ Banque & Synchro",
      path: "/bank",
      icon: Landmark,
      desc: "Rapprochement bancaire automatique 1-clic",
    },
    {
      label: "🔔 Relances Automatiques",
      path: "/reminders",
      icon: Settings,
      desc: "Échéanciers & relances de factures",
    },
    {
      label: "📄 Factures & Devis",
      path: "/invoices",
      icon: Package,
      desc: "Gestion de vos documents commerciaux",
    },
    {
      label: "📊 URSSAF & Cotisations",
      path: "/urssaf",
      icon: Landmark,
      desc: "Suivi du CA & cotisations sociales",
    },
    {
      label: "⚙️ Paramètres du compte",
      path: "/settings",
      icon: Settings,
      desc: "Profil SIRET, facturation & sécurité",
    },
    {
      label: "💬 Support & Assistance",
      path: "/contact",
      icon: LifeBuoy,
      desc: "Contacter l'équipe Bylz",
    },
  ];

  return (
    <div className="md:hidden fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xs bg-bg-sidebar border-l border-border h-full flex flex-col justify-between p-5 z-10 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-250">
        {/* Top User Profile Header */}
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black text-sm">
                {user?.email?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-black text-text truncate max-w-[150px]">
                  {fullName}
                </p>
                <div className="pt-0.5">{planBadge}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface-hover transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Switcher Card (If Admin) */}
          {isAdminUser && (
            <Link
              to="/admin/ventes"
              onClick={onClose}
              className="block p-3 rounded-xl bg-gradient-to-r from-rose-950/60 to-rose-900/30 border border-rose-800/60 hover:border-rose-600 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <div>
                    <p className="text-xs font-black text-white">Espace Admin Back-Office</p>
                    <p className="text-[10px] text-rose-300/80">Tableau de bord super-admin</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          )}

          {/* Navigation Links */}
          <div className="space-y-1.5 pt-2">
            <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider px-2">
              Menu Application
            </p>
            {drawerLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-hover transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-surface border border-border/60 text-muted group-hover:text-primary group-hover:border-primary/40 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-muted">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-text transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom SignOut Action */}
        <div className="pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-4 h-4 text-rose-400" />}
            className="w-full justify-center bg-surface border-border text-rose-400 hover:bg-rose-500 hover:text-white font-bold text-xs py-3"
          >
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}
