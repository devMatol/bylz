import { CheckCircle2, ShieldCheck, Zap, ArrowUpRight, Lock } from "lucide-react";

export function HeroInvoiceMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none py-6">
      {/* Multi-layered Glowing Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-tr from-brand-primary/35 via-purple-500/25 to-brand-accent/35 rounded-full blur-3xl opacity-70 pointer-events-none animate-pulse" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/20 rounded-full blur-2xl pointer-events-none" />

      {/* FLOATING WIDGET 1: Top-Right Stripe Toast (Desktop/Tablet) */}
      <div className="hidden sm:flex absolute -top-2 -right-4 z-20 items-center space-x-3 bg-surface/90 backdrop-blur-xl border border-emerald-500/30 p-3 rounded-2xl shadow-2xl animate-float">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
          <Zap className="w-4 h-4 fill-emerald-500" />
        </div>
        <div className="pr-2">
          <div className="flex items-center text-xs font-bold text-text space-x-1">
            <span>Paiement reçu</span>
            <span className="text-emerald-500 font-mono font-black">+1 500 €</span>
          </div>
          <p className="text-[10px] text-text/70">Il y a 2 min via Stripe Connect</p>
        </div>
      </div>

      {/* FLOATING WIDGET 2: Bottom-Left DGFiP Badge */}
      <div className="hidden sm:flex absolute -bottom-3 -left-4 z-20 items-center space-x-2.5 bg-surface/90 backdrop-blur-xl border border-brand-primary/40 p-3 rounded-2xl shadow-2xl animate-float-reverse">
        <div className="w-8 h-8 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="pr-1 text-xs">
          <p className="font-bold text-text">E-Reporting DGFiP</p>
          <p className="text-[10px] text-brand-accent font-semibold">Statut : Transmis & Certifié</p>
        </div>
      </div>

      {/* Main 3D Floating Card */}
      <div className="relative bg-surface/85 backdrop-blur-2xl border border-white/10 dark:border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl transform rotate-0 lg:rotate-2 hover:rotate-0 transition-all duration-500 glow-primary">
        {/* Card Top bar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-b border-border/70 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              B
            </div>
            <div>
              <p className="font-black text-text text-sm sm:text-base tracking-tight">FACTURE N° FAC-2026-089</p>
              <p className="text-[11px] sm:text-xs text-text/70 font-medium">Émise le 22 Juillet 2026</p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm">
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Factur-X Valide
          </span>
        </div>

        {/* Client details box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-5 p-3.5 rounded-2xl bg-surface-hover/70 border border-border/80">
          <div>
            <p className="text-text/60 font-bold text-[10px] uppercase tracking-wider mb-1">ÉMETTEUR</p>
            <p className="font-bold text-text">Bylz Studio (BNC)</p>
            <p className="text-text/70 text-[11px]">SIRET: 892 419 203 00018</p>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l border-border/60 pt-2 sm:pt-0 sm:pl-3">
            <p className="text-text/60 font-bold text-[10px] uppercase tracking-wider mb-1">CLIENT B2B</p>
            <p className="font-bold text-text">Acme France SAS</p>
            <p className="text-text/70 text-[11px]">TVA: FR893029102</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs text-text/70 font-bold px-1">
            <span>Prestation de service</span>
            <span>Montant HT</span>
          </div>
          <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-surface border border-border/80 shadow-inner">
            <span className="font-semibold text-text truncate mr-2">Développement Web Front-End (3j)</span>
            <span className="font-mono font-black text-text flex-shrink-0">1 500,00 €</span>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-border/80 pt-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-text/70 font-medium">TVA (Franchise art. 293B)</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Exonéré de TVA</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text/70 font-medium">Total Net à Payer</p>
            <p className="text-xl sm:text-2xl font-black text-brand-primary font-mono tracking-tight">1 500,00 €</p>
          </div>
        </div>

        {/* Sub-badge */}
        <div className="mt-4 pt-3.5 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-text/80 font-semibold">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-primary flex-shrink-0" /> Transmission DGFiP automatique
          </span>
          <span className="flex items-center gap-1.5 font-mono text-brand-accent font-bold">
            <Zap className="w-4 h-4 flex-shrink-0 fill-brand-accent/20" /> Paie en 24h via Stripe
          </span>
        </div>
      </div>
    </div>
  );
}
