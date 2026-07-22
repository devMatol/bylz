import { Link } from "react-router-dom";
import { ShieldCheck, Heart } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="bg-surface/90 border-t border-border pt-16 pb-12 text-sm text-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-border">
          {/* Col 1: Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-base shadow-sm">
                B
              </div>
              <span className="text-xl font-black tracking-tight text-text">
                Bylz<span className="text-brand-primary">.</span>
              </span>
            </Link>
            <p className="text-xs text-muted max-w-sm leading-relaxed">
              La solution intégrée de facturation conforme Factur-X et de pilotage fiscal automatisé pour les micro-entrepreneurs et indépendants en France.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Conforme à la réforme DGFiP 2026 & E-Reporting</span>
            </div>
          </div>

          {/* Col 2: Produit */}
          <div className="space-y-3">
            <h4 className="font-bold text-text text-xs uppercase tracking-wider">Produit</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/fonctionnalites" className="hover:text-text transition-colors">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link to="/tarifs" className="hover:text-text transition-colors">
                  Tarifs & Abonnements
                </Link>
              </li>
              <li>
                <Link to="/essai" className="hover:text-text transition-colors text-brand-primary font-semibold">
                  Mode Essai Gratuit (Sans CB)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Ressources */}
          <div className="space-y-3">
            <h4 className="font-bold text-text text-xs uppercase tracking-wider">Ressources & SEO</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/blog" className="hover:text-text transition-colors">
                  Blog & Guides Fiscaux
                </Link>
              </li>
              <li>
                <Link to="/blog/reforme-factur-x-2026-auto-entrepreneurs" className="hover:text-text transition-colors">
                  Guide Réforme Factur-X 2026
                </Link>
              </li>
              <li>
                <Link to="/blog/franchise-tva-2026-seuils-et-regles" className="hover:text-text transition-colors">
                  Seuils de TVA Micro-entreprise
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Légales & Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-text text-xs uppercase tracking-wider">Informations</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/contact" className="hover:text-text transition-colors">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="hover:text-text transition-colors">
                  Mentions Légales
                </Link>
              </li>
              <li>
                <Link to="/cgu" className="hover:text-text transition-colors">
                  CGU & Conditions
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="hover:text-text transition-colors">
                  Politique de Confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} Bylz Technologies. Tous droits réservés.</p>
          <p className="flex items-center space-x-1">
            <span>Conçu avec</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>pour les entrepreneurs en France</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
