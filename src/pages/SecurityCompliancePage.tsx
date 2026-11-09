import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  FileCheck,
  CreditCard,
  Server,
  CheckCircle2,
  Download,
  ArrowRight,
} from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { SEO_METADATA } from "../lib/seoMeta";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { Button } from "../components/ui/Button";

export function SecurityCompliancePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <SEO
        title={SEO_METADATA["/conformite"].title}
        description={SEO_METADATA["/conformite"].description}
        canonical={SEO_METADATA["/conformite"].canonical}
      />
      <MarketingNavbar theme="light" />

      <main id="main-content" className="pt-28 pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-700" /> Factures Factur-X générées et validées
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            Sécurité & Conformité Légale
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
            Bylz est conçu dès l'origine pour vous apporter une gestion rigoureuse face à la réglementation fiscale française, la tenue du livre des recettes et la transition vers la facturation électronique.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Anti-Fraude TVA */}
          <div className="p-6 space-y-4 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-emerald-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Livre des recettes</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Livre chronologique des recettes</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Bylz enregistre chronologiquement vos encaissements et permet d'exporter à tout moment votre livre des recettes au format CSV.
              </p>
            </div>
            <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>Données légales figées à l'émission dans le document</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>Numérotation chronologique ininterrompue</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Norme EN 16931 / Factur-X */}
          <div className="p-6 space-y-4 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-blue-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Évolution réglementaire</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Factures Factur-X générées et validées, transmission partenaire en cours d'activation</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Bylz intègre aujourd'hui les mentions légales essentielles sur vos factures PDF et prépare activement l'intégration du standard Factur-X.
              </p>
            </div>
            <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-700 flex-shrink-0" />
                <span>Factures PDF avec mentions légales essentielles</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-700 flex-shrink-0" />
                <span>Factures Factur-X générées et validées, transmission via partenaire en cours d'activation</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: Hébergement & Données */}
          <div className="p-6 space-y-4 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-slate-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Infrastructure</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Hébergement en Europe & Sécurité</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Vos données sont chiffrées au repos et en transit (TLS 1.3), avec sauvegardes quotidiennes et isolation stricte.
              </p>
            </div>
            <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>Base de données hébergée en Europe</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>Sauvegardes chiffrées automatiques</span>
              </li>
            </ul>
          </div>

          {/* Pillar 4: Paiements Stripe */}
          <div className="p-6 space-y-4 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-slate-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Transactions financières</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Paiements sécurisés Stripe</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Les paiements par carte bancaire sont traités par Stripe (certifié PCI-DSS Niveau 1). Aucune coordonnée bancaire ne transite par nos serveurs.
              </p>
            </div>
            <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>Certification PCI-DSS Niveau 1 par Stripe</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>3D Secure 2 et conformité DSP2</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-slate-900">Besoin d'un export pour votre comptable ?</h3>
            <p className="text-xs text-slate-600">Exportez en 1 clic l'intégralité de vos factures et devis au format CSV conforme.</p>
          </div>
          <Link to="/essai">
            <Button variant="primary" className="min-h-[44px] px-6 py-3 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Tester le livre des recettes
            </Button>
          </Link>
        </div>
      </main>

      <MarketingFooter theme="light" />
    </div>
  );
}
