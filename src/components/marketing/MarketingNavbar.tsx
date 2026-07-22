import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";

export function MarketingNavbar() {
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
          ? "bg-surface/95 backdrop-blur-md border-b border-border shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center space-x-2.5 group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
            B
          </div>
          <span className="text-xl font-black tracking-tight text-text">
            Bylz<span className="text-brand-primary">.</span>
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
                  isActive
                    ? "text-brand-primary font-bold"
                    : "text-text/80 hover:text-brand-primary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            to="/login"
            className="text-sm font-bold text-text hover:text-brand-primary bg-surface-hover/50 hover:bg-surface-hover border border-border/80 px-4 py-2 rounded-full transition-all"
          >
            Se connecter
          </Link>
          <Link
            to="/essai"
            className="inline-flex items-center justify-center space-x-2 text-sm font-bold text-white bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-indigo-600 hover:to-brand-primary px-5 py-2.5 rounded-full shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/45 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
            <span>Essayer gratuitement</span>
          </Link>
        </div>

        {/* Mobile menu button (44px min touch area) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 rounded-xl text-text hover:bg-surface-hover transition-colors focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-brand-primary" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Full Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[61px] bottom-0 bg-surface/98 backdrop-blur-xl z-50 flex flex-col justify-between p-6 shadow-2xl overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-4 pt-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg font-bold py-2 border-b border-border/40 transition-colors flex items-center justify-between ${
                    isActive ? "text-brand-primary" : "text-text hover:text-brand-primary"
                  }`}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-4 h-4 text-text/40" />
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 pb-8 space-y-3 border-t border-border">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full block text-center text-base font-bold text-text bg-surface-hover border border-border py-3.5 rounded-xl shadow-sm hover:bg-border/60 transition-colors"
            >
              Se connecter
            </Link>
            <Link
              to="/essai"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full block text-center text-base font-black text-white bg-gradient-to-r from-brand-primary via-indigo-600 to-brand-primary py-3.5 rounded-xl shadow-lg shadow-brand-primary/30 flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
              <span>Essayer gratuitement</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
