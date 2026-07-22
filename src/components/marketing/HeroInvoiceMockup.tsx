import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export function HeroInvoiceMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Ambient Glow */}
      <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-brand-primary/20 to-brand-accent/20 rounded-3xl blur-2xl opacity-60 pointer-events-none animate-pulse" />

      {/* Floating Invoice Card */}
      <div className="relative bg-surface border border-border/80 rounded-2xl p-4 sm:p-6 shadow-2xl transform rotate-0 lg:rotate-1 hover:rotate-0 transition-transform duration-500 card-shadow">
        {/* Header */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-b border-border pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-lg flex-shrink-0">
              B
            </div>
            <div className="min-w-0">
              <p className="font-bold text-text text-xs sm:text-sm truncate">FACTURE N° FAC-2026-089</p>
              <p className="text-[11px] sm:text-xs text-text/70">Émise le 22 Juillet 2026</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Conforme Factur-X
          </span>
        </div>

        {/* Client details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4 p-3 rounded-xl bg-surface-hover/60 border border-border/60">
          <div>
            <p className="text-text/60 font-semibold text-[10px] uppercase tracking-wider mb-0.5">ÉMETTEUR</p>
            <p className="font-bold text-text">Bylz Studio (BNC)</p>
            <p className="text-text/70 text-[11px]">SIRET: 892 419 203 00018</p>
          </div>
          <div>
            <p className="text-text/60 font-semibold text-[10px] uppercase tracking-wider mb-0.5">CLIENT B2B</p>
            <p className="font-bold text-text">Acme France SAS</p>
            <p className="text-text/70 text-[11px]">TVA: FR893029102</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs text-text/70 font-semibold px-1">
            <span>Prestation de service</span>
            <span>Montant HT</span>
          </div>
          <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-surface border border-border/80">
            <span className="font-medium text-text truncate mr-2">Développement Web Front-End (3j)</span>
            <span className="font-mono font-bold text-text flex-shrink-0">1 500,00 €</span>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-border/80 pt-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] sm:text-xs text-text/70 font-medium">TVA (Franchise art. 293B)</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Exonéré de TVA</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] sm:text-xs text-text/70 font-medium">Total Net à Payer</p>
            <p className="text-lg sm:text-xl font-black text-brand-primary font-mono">1 500,00 €</p>
          </div>
        </div>

        {/* Sub-badge */}
        <div className="mt-4 pt-3 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-text/70 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" /> Transmission DGFiP automatique
          </span>
          <span className="flex items-center gap-1.5 font-mono text-brand-accent font-semibold">
            <Zap className="w-3.5 h-3.5 flex-shrink-0" /> Paie en 24h via Stripe
          </span>
        </div>
      </div>
    </div>
  );
}
