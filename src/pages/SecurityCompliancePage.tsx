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
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function SecurityCompliancePage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <SEO
        title="Conformité Légale & Sécurité des Données | Bylz"
        description="Découvrez les garanties de sécurité de Bylz : tenue du livre chronologique des recettes, paiements sécurisés Stripe et base de données hébergée en Europe."
        canonical="/conformite"
      />
      <MarketingNavbar />

      <main className="pt-28 pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Facturation électronique en préparation
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text">
            Sécurité & Conformité Légale
          </h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed font-medium">
            Bylz est conçu dès l'origine pour vous apporter une gestion rigoureuse face à la réglementation fiscale française, la tenue du livre des recettes et la transition vers la facturation électronique.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Anti-Fraude TVA */}
          <Card className="p-6 space-y-4 border border-emerald-500/30 bg-surface/90 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Livre des recettes</span>
              <h3 className="text-lg font-bold text-text mt-0.5">Livre chronologique des recettes</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Bylz enregistre chronologiquement vos encaissements et permet d'exporter à tout moment votre livre des recettes au format CSV.
              </p>
            </div>
            <ul className="text-xs text-muted space-y-1.5 pt-2 border-t border-border/50">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Données légales figées à l'émission dans le document</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Numérotation chronologique ininterrompue</span>
              </li>
            </ul>
          </Card>

          {/* Pillar 2: Norme EN 16931 / Factur-X */}
          <Card className="p-6 space-y-4 border border-primary/30 bg-surface/90 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Évolution réglementaire</span>
              <h3 className="text-lg font-bold text-text mt-0.5">Facturation électronique en préparation</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Bylz intègre aujourd'hui les mentions légales essentielles sur vos factures PDF et prépare activement l'intégration du standard Factur-X.
              </p>
            </div>
            <ul className="text-xs text-muted space-y-1.5 pt-2 border-t border-border/50">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Factures PDF avec mentions légales essentielles</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {/* TODO: Télétransmission PDP partenaire */}
                <span>Format Factur-X en cours de préparation</span>
              </li>
            </ul>
            <div className="pt-2 border-t border-border/50">
              <Link
                to="/facturation-electronique"
                className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
              >
                <span>Dossier officiel : facturation électronique 2026</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Pillar 3: Stripe Connect */}
          <Card className="p-6 space-y-4 border border-border bg-surface/90 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Via Stripe (certifié PCI-DSS Level 1)</span>
              <h3 className="text-lg font-bold text-text mt-0.5">Paiement par carte via Stripe</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Les encaissements par carte bancaire sont directement traités par Stripe Connect avec chiffrement SSL/TLS et protocole <strong>3D-Secure 2.0</strong>.
              </p>
            </div>
            <ul className="text-xs text-muted space-y-1.5 pt-2 border-t border-border/50">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span>Virements directs sur votre compte sous 48h</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span>Aucune donnée bancaire stockée sur nos serveurs</span>
              </li>
            </ul>
          </Card>

          {/* Pillar 4: Base de données hébergée en Europe */}
          <Card className="p-6 space-y-4 border border-border bg-surface/90 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Europe & RGPD</span>
              <h3 className="text-lg font-bold text-text mt-0.5">Base de données hébergée en Europe</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Vos données et documents sont stockés sur une base de données PostgreSQL gérée par Supabase (datacenter situé en Union Européenne) en Europe, avec sauvegardes régulières.
              </p>
            </div>
            <ul className="text-xs text-muted space-y-1.5 pt-2 border-t border-border/50">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                <span>Chiffrement complet des données au repos et en transit</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                <span>Export complet de vos données à tout moment</span>
              </li>
            </ul>
          </Card>

          {/* Pillar 6: Registre DGFiP & Attestation */}
          <Card className="p-6 space-y-4 border border-emerald-500/30 bg-gradient-to-br from-surface to-emerald-950/20 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Tenue de registre</span>
              <h3 className="text-lg font-bold text-text mt-0.5">Livre chronologique des recettes, exportable en CSV</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Bylz tient automatiquement votre livre chronologique des recettes encaissées, exportable en un clic au format CSV.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/essai">
                <Button variant="primary" size="sm" className="w-full text-xs font-bold bylz-glow-cta">
                  Tester gratuitement Bylz <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
