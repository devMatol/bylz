import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, Crown, CheckCircle2, ShieldCheck, Zap, ArrowRight, Star } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export function PaymentSuccessModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [planType, setPlanType] = useState<string>("Pro");

  useEffect(() => {
    const isCheckoutSuccess = searchParams.get("checkout") === "success";
    const isPaymentSuccess = searchParams.get("payment") === "success";
    const isPaid = searchParams.get("paid") === "true";
    const planParam = searchParams.get("plan");

    if (isCheckoutSuccess || isPaymentSuccess || isPaid) {
      if (planParam) {
        setPlanType(planParam.toUpperCase());
      }
      setOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setOpen(false);
    // Clean URL query parameters without page reload
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("checkout");
    newParams.delete("payment");
    newParams.delete("paid");
    newParams.delete("plan");
    newParams.delete("session_id");
    setSearchParams(newParams, { replace: true });
  };

  const unlockedFeatures = [
    {
      icon: ShieldCheck,
      title: "Transmission E-Invoicing PDP FactPulse",
      desc: "Conformité réglementaire B2B, émission AFNOR et suivi chronologique en temps réel.",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      icon: Zap,
      title: "Génération PDF & Factur-X Illimitée",
      desc: "Création instantanée de devis et factures conformes avec QR codes et IBAN émetteur.",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: Star,
      title: "Intégration SEO & Google Search Console",
      desc: "Tableau de bord de performance de vos ventes et de votre visibilité en direct.",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: Sparkles,
      title: "E-Reporting B2C & Support Prioritaire 7j/7",
      desc: "Télétransmission mensuelle automatique des ventes aux particuliers et assistance VIP.",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <Modal open={open} onClose={handleClose} title="">
      <div className="text-center space-y-6 pt-2 pb-2">
        {/* Glowing Animated Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-rose-500 to-amber-500 blur-xl opacity-50 animate-pulse" />
          <div className="relative w-16 h-16 rounded-full bg-slate-900 border-2 border-amber-400/80 flex items-center justify-center shadow-2xl">
            <Crown className="w-8 h-8 text-amber-400 animate-bounce" />
          </div>
        </div>

        {/* Title & Thank You Note */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-amber-500/15 text-amber-400 text-xs font-black uppercase tracking-wider border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Formule {planType} Activée</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Merci pour votre confiance !
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            Votre compte est désormais entièrement à jour. Toutes les fonctionnalités de votre formule sont immédiatement débloquées.
          </p>
        </div>

        {/* Feature Unlocked Cards */}
        <div className="grid grid-cols-1 gap-2.5 text-left pt-2">
          {unlockedFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-3 rounded-card bg-slate-900/90 border border-slate-800 flex items-start space-x-3 transition-all hover:border-slate-700"
              >
                <div className={`p-2 rounded-card border ${feat.color} flex-shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>{feat.title}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto flex-shrink-0" />
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleClose}
            className="w-full justify-center bylz-glow-cta font-bold text-sm py-3"
          >
            <span>Accéder à mon espace Bylz</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
