import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Heart, ChevronDown } from "lucide-react";
import { Logo } from "../shared/Logo";

interface MarketingFooterProps {
  theme?: "light" | "dark";
}

export function MarketingFooter({ theme }: MarketingFooterProps = {}) {
  const location = useLocation();
  const isLight = theme !== "dark";

  // Accordion state for mobile (< md) - collapsed by default to save ~800px on mobile
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <footer
      className={`pt-6 pb-6 md:pt-16 md:pb-12 text-sm transition-colors border-t ${
        isLight
          ? "bg-slate-50 border-slate-200 text-slate-700"
          : "bg-[#0a0e1a] border-slate-800 text-slate-300"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10 pb-8 md:pb-12 border-b ${
            isLight ? "border-slate-200" : "border-slate-800"
          }`}
        >
          {/* Col 1: Brand */}
          <div className="md:col-span-2 space-y-3 md:space-y-4">
            <Logo variant={isLight ? "navy" : "white"} height={32} />
            <p
              className={`text-xs max-w-sm leading-relaxed font-normal ${
                isLight ? "text-slate-700" : "text-slate-400"
              }`}
            >
              La solution intégrée de facturation PDF et de pilotage fiscal automatisé pour les indépendants, micro-entreprises et sociétés (SASU, EURL, SAS, SARL) en France.
            </p>
            <div
              className={`flex items-center space-x-2 text-xs font-bold ${
                isLight ? "text-emerald-800" : "text-emerald-400"
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${isLight ? "text-emerald-700" : "text-emerald-400"}`} />
              <span>Factures Factur-X générées et validées, transmission via partenaire en cours d'activation</span>
            </div>
          </div>

          {/* Col 2: Produit (Accordéon mobile) */}
          <div className="border-t border-slate-200/60 md:border-t-0 pt-3 md:pt-0">
            <button
              type="button"
              onClick={() => toggleSection("produit")}
              className="w-full flex items-center justify-between py-2 md:py-0 md:cursor-default text-left font-bold text-xs uppercase tracking-wider"
              aria-expanded={!!openSections.produit}
            >
              <span className={isLight ? "text-slate-900" : "text-white"}>Produit</span>
              <ChevronDown
                className={`w-4 h-4 md:hidden transition-transform duration-200 ${
                  openSections.produit ? "rotate-180" : ""
                } ${isLight ? "text-slate-600" : "text-slate-400"}`}
              />
            </button>
            <ul
              className={`${
                openSections.produit ? "block" : "hidden"
              } md:!block space-y-1 sm:space-y-2 text-xs font-medium pt-2 md:pt-3`}
            >
              <li>
                <Link
                  to="/fonctionnalites"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-slate-700 hover:text-blue-700 focus-visible:outline-blue-600"
                      : "text-slate-300 hover:text-white focus-visible:outline-primary"
                  }`}
                >
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link
                  to="/conformite"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-slate-700 hover:text-blue-700 focus-visible:outline-blue-600"
                      : "text-slate-300 hover:text-white focus-visible:outline-primary"
                  }`}
                >
                  Conformité & Sécurité
                </Link>
              </li>
              <li>
                <Link
                  to="/facturation-electronique"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors font-bold focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-blue-700 hover:text-blue-900 focus-visible:outline-blue-600"
                      : "text-primary hover:text-white focus-visible:outline-primary"
                  }`}
                >
                  Facturation électronique 2026
                </Link>
              </li>
              <li>
                <Link
                  to="/tarifs"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-slate-700 hover:text-blue-700 focus-visible:outline-blue-600"
                      : "text-slate-300 hover:text-white focus-visible:outline-primary"
                  }`}
                >
                  Tarifs & Abonnements
                </Link>
              </li>
              <li>
                <Link
                  to="/essai"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded font-bold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-blue-700 focus-visible:outline-blue-600"
                      : "text-primary focus-visible:outline-primary"
                  }`}
                >
                  Essayer sans compte
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Outils Fiscaux & Blog (Accordéon mobile) */}
          <div className="border-t border-slate-200/60 md:border-t-0 pt-3 md:pt-0">
            <button
              type="button"
              onClick={() => toggleSection("outils")}
              className="w-full flex items-center justify-between py-2 md:py-0 md:cursor-default text-left font-bold text-xs uppercase tracking-wider"
              aria-expanded={!!openSections.outils}
            >
              <span className={isLight ? "text-slate-900" : "text-white"}>Outils & Guides Gratuits</span>
              <ChevronDown
                className={`w-4 h-4 md:hidden transition-transform duration-200 ${
                  openSections.outils ? "rotate-180" : ""
                } ${isLight ? "text-slate-600" : "text-slate-400"}`}
              />
            </button>
            <ul
              className={`${
                openSections.outils ? "block" : "hidden"
              } md:!block space-y-1 sm:space-y-2 text-xs font-medium pt-2 md:pt-3`}
            >
              <li>
                <Link
                  to="/outils/simulateur-urssaf"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-slate-700 hover:text-blue-700 focus-visible:outline-blue-600 font-bold"
                      : "text-slate-300 hover:text-white focus-visible:outline-primary font-bold"
                  }`}
                >
                  Simulateur URSSAF 2026
                </Link>
              </li>
              <li>
                <Link
                  to="/outils/simulateur-seuil-tva"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-slate-700 hover:text-blue-700 focus-visible:outline-blue-600 font-bold"
                      : "text-slate-300 hover:text-white focus-visible:outline-primary font-bold"
                  }`}
                >
                  Calculateur Seuil TVA
                </Link>
              </li>
              <li>
                <Link
                  to="/outils/modele-facture-gratuit"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 font-bold ${
                    isLight
                      ? "text-emerald-800 hover:text-emerald-950 focus-visible:outline-blue-600"
                      : "text-emerald-400 hover:text-white focus-visible:outline-primary"
                  }`}
                >
                  Modèle Facture Gratuit
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-slate-700 hover:text-blue-700 focus-visible:outline-blue-600"
                      : "text-slate-300 hover:text-white focus-visible:outline-primary"
                  }`}
                >
                  Blog & Guides Fiscaux
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Légales & Contact (Accordéon mobile) */}
          <div className="border-t border-slate-200/60 md:border-t-0 pt-3 md:pt-0">
            <button
              type="button"
              onClick={() => toggleSection("infos")}
              className="w-full flex items-center justify-between py-2 md:py-0 md:cursor-default text-left font-bold text-xs uppercase tracking-wider"
              aria-expanded={!!openSections.infos}
            >
              <span className={isLight ? "text-slate-900" : "text-white"}>Informations</span>
              <ChevronDown
                className={`w-4 h-4 md:hidden transition-transform duration-200 ${
                  openSections.infos ? "rotate-180" : ""
                } ${isLight ? "text-slate-600" : "text-slate-400"}`}
              />
            </button>
            <ul
              className={`${
                openSections.infos ? "block" : "hidden"
              } md:!block space-y-1 sm:space-y-2 text-xs font-medium pt-2 md:pt-3`}
            >
              <li>
                <Link
                  to="/contact"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-slate-700 hover:text-blue-700 focus-visible:outline-blue-600"
                      : "text-slate-300 hover:text-white focus-visible:outline-primary"
                  }`}
                >
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link
                  to="/mentions-legales"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-slate-700 hover:text-blue-700 focus-visible:outline-blue-600"
                      : "text-slate-300 hover:text-white focus-visible:outline-primary"
                  }`}
                >
                  Mentions Légales
                </Link>
              </li>
              <li>
                <Link
                  to="/cgu"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-slate-700 hover:text-blue-700 focus-visible:outline-blue-600"
                      : "text-slate-300 hover:text-white focus-visible:outline-primary"
                  }`}
                >
                  CGU & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/confidentialite"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-slate-700 hover:text-blue-700 focus-visible:outline-blue-600"
                      : "text-slate-300 hover:text-white focus-visible:outline-primary"
                  }`}
                >
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("bylz-open-cookie-banner"))}
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors text-left focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-slate-700 hover:text-blue-700 focus-visible:outline-blue-600"
                      : "text-slate-300 hover:text-white focus-visible:outline-primary"
                  }`}
                >
                  Gérer les cookies
                </button>
              </li>
              <li>
                <a
                  href="https://lumisweb.fr"
                  target="_blank"
                  rel="noopener"
                  className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-2 sm:py-0.5 rounded transition-colors font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "text-slate-700 hover:text-blue-700 focus-visible:outline-blue-600"
                      : "text-slate-300 hover:text-white focus-visible:outline-primary"
                  }`}
                  title="Lumisweb - Agence Web & Création sur mesure"
                >
                  <span>Création par Lumisweb</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className={`pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between text-xs space-y-3 md:space-y-0 font-medium ${
            isLight ? "text-slate-600" : "text-slate-400"
          }`}
        >
          <p>© {new Date().getFullYear()} ARABACI HOLDING. Tous droits réservés.</p>
          <p className="flex items-center space-x-1.5">
            <span>Conçu avec</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>par la technologie</span>
            <a
              href="https://lumisweb.fr"
              target="_blank"
              rel="noopener"
              className={`inline-flex items-center min-h-[44px] sm:min-h-0 py-1.5 sm:py-0 font-extrabold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 rounded transition-colors ${
                isLight
                  ? "text-slate-900 hover:text-blue-700 decoration-slate-400 focus-visible:outline-blue-600"
                  : "text-white hover:text-primary decoration-primary/50 focus-visible:outline-primary"
              }`}
              title="Lumisweb - Création de site web & applications"
            >
              Lumisweb.fr
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
