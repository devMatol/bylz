import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  FileCheck,
  Landmark,
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
        description="Découvrez les garanties de conformité de Bylz : Loi Anti-Fraude TVA Art. 286 CGI, Norme Européenne EN 16931 Factur-X, Agrément DSP2 Banque de France et hébergement sécurisé en France."
        canonical="/conformite"
      />
      <MarketingNavbar />

      <main className="pt-28 pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> 100% Conforme DGFiP & UE
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text">
            Sécurité, Certifications & Conformité Légale
          </h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed font-medium">
            Bylz est conçu dès l'origine pour vous garantir une sérénité totale face à la réglementation fiscale française, la loi anti-fraude à la TVA et la réforme 2026.
          </p>
        </div>

        {/* 5 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pillar 1: Anti-Fraude TVA */}
          <Card className="p-6 space-y-4 border border-emerald-500/30 bg-surface/90 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Code Général des Impôts</span>
              <h3 className="text-lg font-bold text-text mt-0.5">Loi Anti-Fraude TVA (Art. 286 CGI)</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Bylz garantit les 4 conditions légales imposées par l'administration fiscale : <strong>Inviolabilité</strong>, <strong>Sécurisation</strong>, <strong>Conservation</strong> et <strong>Archivage</strong> des données de facturation.
              </p>
            </div>
            <ul className="text-xs text-muted space-y-1.5 pt-2 border-t border-border/50">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Empreinte numérique cryptographique SHA-256</span>
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
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Norme Européenne</span>
              <h3 className="text-lg font-bold text-text mt-0.5">Norme EN 16931-1 (Factur-X)</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Chaque facture générée sur Bylz contient le fichier hybride <strong>Factur-X (PDF + XML CII)</strong> conforme aux normes de la réforme DGFiP 2026.
              </p>
            </div>
            <ul className="text-xs text-muted space-y-1.5 pt-2 border-t border-border/50">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Format hybride lisible par l'humain et l'ordinateur</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Télétransmission certifiée vers le réseau PDP</span>
              </li>
            </ul>
          </Card>

          {/* Pillar 3: Open Banking DSP2 */}
          <Card className="p-6 space-y-4 border border-border bg-surface/90 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Agrément Banque de France</span>
              <h3 className="text-lg font-bold text-text mt-0.5">Open Banking DSP2 (Bridge)</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                La synchronisation bancaire est opérée via notre partenaire agréé <strong>Bridge API</strong>, établissement de paiement régulé par l'<strong>ACPR / Banque de France</strong>.
              </p>
            </div>
            <ul className="text-xs text-muted space-y-1.5 pt-2 border-t border-border/50">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Connexion sécurisée en lecture seule</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Aucun accès aux ordres de virement</span>
              </li>
            </ul>
          </Card>

          {/* Pillar 4: Stripe Connect */}
          <Card className="p-6 space-y-4 border border-border bg-surface/90 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Norme PCI-DSS Level 1</span>
              <h3 className="text-lg font-bold text-text mt-0.5">Paiements Sécurisés Stripe</h3>
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

          {/* Pillar 5: Hébergement Souverain */}
          <Card className="p-6 space-y-4 border border-border bg-surface/90 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Souveraineté & RGPD</span>
              <h3 className="text-lg font-bold text-text mt-0.5">Hébergement Sécurisé en France</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Vos données et documents sont hébergés sur des serveurs certifiés <strong>ISO 27001</strong> au sein de l'Union Européenne (France) avec sauvegardes quotidiennes.
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
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Attestation Utilisateur</span>
              <h3 className="text-lg font-bold text-text mt-0.5">Attestation de Conformité</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Chaque utilisateur de Bylz dispose d'une attestation individuelle certifiant la conformité du logiciel en cas de contrôle de l'administration fiscale.
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
