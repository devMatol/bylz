import { useState, useEffect } from "react";
import { Download, X, Smartphone, Bell, CheckCircle } from "lucide-react";
import { Button } from "../ui/Button";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if dismissed before
    const isDismissed = localStorage.getItem("bylz-dismiss-pwa-banner") === "true";
    if (isDismissed) return;

    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show iOS / safari manual installation tip
      alert(
        "Pour installer Bylz sur iOS / Safari :\n1. Appuyez sur le bouton de partage [ ⎋ ] dans votre navigateur\n2. Sélectionnez 'Sur l'écran d'accueil' [ ⊕ ]"
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("bylz-dismiss-pwa-banner", "true");
    setShowBanner(false);
  };

  if (!showBanner || installed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-subtle">
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl space-y-3">
        {/* Glow Accent */}
        <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-primary/20 blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0">
              B
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Installer l'application Bylz</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-pill bg-primary/20 text-primary border border-primary/30">
                  Mobile PWA
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Accès 1-clic depuis votre écran d'accueil & notifications de paiement.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            title="Masquer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5"
          >
            Plus tard
          </button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleInstallClick}
            className="bylz-glow-cta text-xs font-bold"
            leftIcon={<Smartphone className="w-4 h-4" />}
          >
            Installer sur mon téléphone
          </Button>
        </div>
      </div>
    </div>
  );
}
