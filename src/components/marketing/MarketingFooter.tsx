import { Link } from "react-router-dom";
import { ShieldCheck, Heart } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="bg-surface/95 border-t border-border pt-16 pb-12 text-sm text-muted">
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
            <p className="text-xs text-text/70 max-w-sm leading-relaxed font-normal">
              La solution intégrée de facturation conforme Factur-X et de pilotage fiscal automatisé pour les micro-entrepreneurs et indépendants en France.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Conforme à la réforme DGFiP 2026 & E-Reporting</span>
            </div>
          </div>

          {/* Col 2: Produit */}
          <div className="space-y-3">
            <h4 className="font-bold text-text text-xs uppercase tracking-wider">Produit</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/fonctionnalites" className="text-text/80 hover:text-brand-primary transition-colors">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link to="/tarifs" className="text-text/80 hover:text-brand-primary transition-colors">
                  Tarifs & Abonnements
                </Link>
              </li>
              <li>
                <Link to="/essai" className="text-brand-primary font-bold hover:underline">
                  Mode Essai Gratuit (Sans CB)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Outils Fiscaux & Blog */}
          <div className="space-y-3">
            <h4 className="font-bold text-text text-xs uppercase tracking-wider">Outils & Blog SEO</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/outils/simulateur-urssaf" className="text-text/80 hover:text-brand-primary transition-colors font-bold">
                  🧮 Simulateur URSSAF 2026
                </Link>
              </li>
              <li>
                <Link to="/outils/simulateur-seuil-tva" className="text-text/80 hover:text-brand-primary transition-colors font-bold">
                  📊 Calculateur Seuil TVA
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-text/80 hover:text-brand-primary transition-colors">
                  Blog & Guides Fiscaux
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Légales & Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-text text-xs uppercase tracking-wider">Informations</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/contact" className="text-text/80 hover:text-brand-primary transition-colors">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="text-text/80 hover:text-brand-primary transition-colors">
                  Mentions Légales
                </Link>
              </li>
              <li>
                <Link to="/cgu" className="text-text/80 hover:text-brand-primary transition-colors">
                  CGU & Conditions
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="text-text/80 hover:text-brand-primary transition-colors">
                  Politique de Confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-text/70 space-y-4 md:space-y-0 font-medium">
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
