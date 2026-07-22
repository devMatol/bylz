import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export function HeroInvoiceMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Ambient Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-brand-primary/20 to-brand-accent/20 rounded-3xl blur-2xl opacity-60 pointer-events-none animate-pulse" />

      {/* Floating Invoice Card */}
      <div className="relative bg-surface border border-border/80 rounded-2xl p-6 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500 card-shadow">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-lg">
              B
            </div>
            <div>
              <p className="font-bold text-text text-sm">FACTURE N° FAC-2026-089</p>
              <p className="text-xs text-muted">Émise le 22 Juillet 2026</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Conforme Factur-X
          </span>
        </div>

        {/* Client details */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-4 p-3 rounded-xl bg-surface-hover/50 border border-border/50">
          <div>
            <p className="text-muted font-medium mb-1">ÉMETTEUR</p>
            <p className="font-semibold text-text">Bylz Studio (BNC)</p>
            <p className="text-muted">SIRET: 892 419 203 00018</p>
          </div>
          <div>
            <p className="text-muted font-medium mb-1">CLIENT B2B</p>
            <p className="font-semibold text-text">Acme France SAS</p>
            <p className="text-muted">TVA: FR893029102</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs text-muted font-medium px-1">
            <span>Prestation de service</span>
            <span>Montant HT</span>
          </div>
          <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-surface border border-border">
            <span className="font-medium text-text">Développement Web Front-End (3j)</span>
            <span className="font-mono font-semibold text-text">1 500,00 €</span>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-border pt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">TVA (Franchise art. 293B)</p>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Exonéré de TVA</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Total Net à Payer</p>
            <p className="text-xl font-bold text-brand-primary font-mono">1 500,00 €</p>
          </div>
        </div>

        {/* Sub-badge */}
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" /> Transmission DGFiP automatique
          </span>
          <span className="flex items-center gap-1 font-mono text-brand-accent">
            <Zap className="w-3.5 h-3.5" /> Paie en 24h via Stripe
          </span>
        </div>
      </div>
    </div>
  );
}
