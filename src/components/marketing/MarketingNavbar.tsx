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

  const navLinks = [
    { label: "Fonctionnalités", path: "/fonctionnalites" },
    { label: "Tarifs", path: "/tarifs" },
    { label: "Blog", path: "/blog" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-surface/90 backdrop-blur-md border-b border-border shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
            B
          </div>
          <span className="text-xl font-black tracking-tight text-text">
            Bylz<span className="text-brand-primary">.</span>
          </span>
        </Link>

        {/* Desktop Nav Links with High Contrast */}
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

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-text hover:bg-surface-hover transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-border px-4 pt-4 pb-6 space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-bold text-text hover:text-brand-primary transition-colors py-1"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-border flex flex-col space-y-3">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center text-sm font-bold text-text border border-border py-2.5 rounded-xl hover:bg-surface-hover transition-colors"
            >
              Se connecter
            </Link>
            <Link
              to="/essai"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center text-sm font-bold text-white bg-brand-primary py-2.5 rounded-xl shadow-md flex items-center justify-center space-x-2"
            >
              <span>Essayer gratuitement</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
