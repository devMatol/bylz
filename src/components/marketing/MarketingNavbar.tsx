import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, Sparkles, LayoutDashboard } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";

export function MarketingNavbar() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

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
    { label: "Tarifs", path: "/tarifs" },
    { label: "Blog", path: "/blog" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileMenuOpen
          ? "bg-surface/95 backdrop-blur-xl border-b border-border shadow-lg py-3.5"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center space-x-2.5 group focus:outline-none z-50"
        >
          <div className="w-9 h-9 rounded-card bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
            B
          </div>
          <span className="text-xl font-black tracking-tight text-text">
            Bylz<span className="text-primary">.</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-colors ${
                  isActive ? "text-primary font-bold" : "text-muted hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <Link to="/dashboard">
              <Button variant="primary" size="sm" className="bylz-glow-cta font-bold">
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                Mon tableau de bord
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Se connecter
                </Button>
              </Link>
              <Link to="/essai">
                <Button variant="primary" size="sm" className="bylz-glow-cta">
                  <Sparkles className="w-4 h-4 mr-1.5 text-accent animate-pulse" />
                  Essayer gratuitement
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Burger Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden p-2.5 rounded-card text-text hover:bg-surface-hover transition-colors focus:outline-none z-50 flex items-center justify-center min-w-[44px] min-h-[44px]"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-primary stroke-[2.5]" />
          ) : (
            <Menu className="w-6 h-6 text-text stroke-[2.5]" />
          )}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] bg-surface/98 backdrop-blur-2xl z-40 flex flex-col justify-between p-6 shadow-2xl overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 border-t border-border">
          <nav className="flex flex-col space-y-3 pt-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg font-bold py-3 px-2 border-b border-border/40 transition-colors flex items-center justify-between rounded-card ${
                    isActive ? "text-primary bg-primary/10" : "text-text hover:text-primary hover:bg-surface-hover"
                  }`}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-5 h-5 text-muted" />
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 pb-8 space-y-3 border-t border-border flex flex-col">
            {user ? (
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full justify-center bylz-glow-cta font-bold text-sm py-3">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Mon tableau de bord
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center text-sm py-3 font-bold">
                    Se connecter
                  </Button>
                </Link>
                <Link to="/essai" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full justify-center bylz-glow-cta text-sm py-3 font-bold">
                    <Sparkles className="w-4 h-4 mr-2 text-accent" />
                    Essayer gratuitement
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
