import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { Logo } from "../shared/Logo";

interface MarketingNavbarProps {
  theme?: "light" | "dark";
}

export function MarketingNavbar({ theme }: MarketingNavbarProps) {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const isLight = theme !== "dark";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: "Fonctionnalités", path: "/fonctionnalites" },
    { label: "Conformité & Sécurité", path: "/conformite" },
    { label: "Facturation 2026", path: "/facturation-electronique" },
    { label: "Tarifs", path: "/tarifs" },
    { label: "Blog", path: "/blog" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-blue-700 focus:text-white focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 font-bold text-sm"
      >
        Aller au contenu principal
      </a>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isLight
            ? scrolled || mobileMenuOpen
              ? "bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm py-3.5"
              : "bg-white/80 backdrop-blur-md border-b border-slate-100 py-4"
            : scrolled || mobileMenuOpen
            ? "bg-surface/95 backdrop-blur-xl border-b border-border shadow-lg py-3.5"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Logo variant={isLight ? "navy" : "white"} height={32} />

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center space-x-5 lg:space-x-7">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              if (isLight) {
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`whitespace-nowrap text-sm font-semibold transition-colors ${
                      isActive
                        ? "text-blue-700 font-bold"
                        : "text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`whitespace-nowrap text-sm font-semibold transition-colors ${
                    isActive ? "text-primary font-bold" : "text-muted hover:text-text"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden xl:flex items-center space-x-3">
            {user ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm" className="font-bold">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Mon tableau de bord
                </Button>
              </Link>
            ) : isLight ? (
              <>
                <Link
                  to="/login"
                  className="whitespace-nowrap px-3.5 py-1.5 text-sm font-bold text-blue-700 hover:bg-blue-50 border-2 border-blue-600 rounded-lg transition-colors"
                >
                  Se connecter
                </Link>
                <Link
                  to="/signup"
                  className="whitespace-nowrap px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Créer mon compte gratuit
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Se connecter
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">
                    Créer mon compte gratuit
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Burger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`xl:hidden p-2.5 rounded-lg transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:focus-visible:outline-primary flex items-center justify-center min-w-[44px] min-h-[44px] ${
              isLight
                ? "text-slate-800 hover:bg-slate-100"
                : "text-text hover:bg-surface-hover"
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className={`w-6 h-6 stroke-[2.5] ${isLight ? "text-blue-700" : "text-primary"}`} />
            ) : (
              <Menu className="w-6 h-6 stroke-[2.5]" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay Portal */}
      {mobileMenuOpen && (
        <div
          className={`xl:hidden fixed inset-0 z-[999] flex flex-col justify-between p-6 overflow-y-auto animate-in fade-in duration-200 ${
            isLight ? "bg-white text-slate-900" : "bg-bg/98 backdrop-blur-2xl text-text"
          }`}
        >
          {/* Top Bar inside Overlay */}
          <div className={`flex items-center justify-between pb-6 border-b ${isLight ? "border-slate-200" : "border-border"}`}>
            <Logo variant={isLight ? "navy" : "white"} height={32} onClick={() => setMobileMenuOpen(false)} />

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-2.5 rounded-lg transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:focus-visible:outline-primary flex items-center justify-center min-w-[44px] min-h-[44px] ${
                isLight ? "text-slate-800 hover:bg-slate-100" : "text-primary hover:bg-surface-hover"
              }`}
              aria-label="Fermer le menu"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Links */}
          <nav className="flex flex-col space-y-3 py-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg font-bold min-h-[44px] py-3 px-4 border-b transition-colors flex items-center justify-between rounded-lg ${
                    isLight
                      ? isActive
                        ? "text-blue-700 bg-blue-50 border-blue-100"
                        : "text-slate-800 hover:text-blue-700 hover:bg-slate-50 border-slate-100"
                      : isActive
                      ? "text-primary bg-primary/10 border-border/40"
                      : "text-text hover:text-primary hover:bg-surface-hover border-border/40"
                  }`}
                >
                  <span>{link.label}</span>
                  <ArrowRight className={`w-5 h-5 ${isLight ? "text-slate-400" : "text-muted"}`} />
                </Link>
              );
            })}
          </nav>

          {/* Bottom CTAs */}
          <div className={`pt-6 pb-6 space-y-3 border-t flex flex-col ${isLight ? "border-slate-200" : "border-border"}`}>
            {user ? (
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full justify-center font-bold text-sm py-3.5">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Mon tableau de bord
                </Button>
              </Link>
            ) : isLight ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3.5 rounded-lg border-2 border-blue-600 font-bold text-blue-700 hover:bg-blue-50 text-sm transition-colors"
                >
                  Se connecter
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold text-white text-sm shadow-sm transition-colors"
                >
                  Créer mon compte gratuit
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center text-sm py-3.5 font-bold">
                    Se connecter
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full justify-center text-sm py-3.5 font-bold">
                    Créer mon compte gratuit
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}