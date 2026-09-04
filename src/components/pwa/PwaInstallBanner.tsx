import { useState, useEffect } from "react";
import { X, Smartphone, Share, PlusSquare, Info } from "lucide-react";
import { Button } from "../ui/Button";

export function triggerPwaInstallModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-pwa-install"));
  }
}

function checkIsIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIosDevice = /iphone|ipad|ipod/.test(ua);
  const isIpadOs = (window.navigator as any).maxTouchPoints > 1 && /macintosh/.test(ua);
  return isIosDevice || isIpadOs;
}

function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    const isStandalone = checkIsStandalone();
    if (isStandalone) {
      setInstalled(true);
      return;
    }

    const isIos = checkIsIos();
    setIsIosDevice(isIos);

    const isDismissed = localStorage.getItem("bylz-dismiss-pwa-banner") === "true";

    // 1. On iOS: Safari does NOT fire beforeinstallprompt.
    // We show the banner if not dismissed and not in standalone mode.
    if (isIos) {
      if (!isDismissed) {
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }

    // 2. On Android / Chrome: listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 3. Custom event to open install modal from settings or mobile menu
    const handleOpenInstall = () => {
      if (checkIsStandalone()) {
        alert("L'application Bylz est déjà installée sur votre écran d'accueil !");
        return;
      }
      if (checkIsIos()) {
        setShowIosModal(true);
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
      } else {
        setShowIosModal(true);
      }
    };

    window.addEventListener("open-pwa-install", handleOpenInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("open-pwa-install", handleOpenInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (isIosDevice || !deferredPrompt) {
      setShowIosModal(true);
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } catch {
      setShowIosModal(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("bylz-dismiss-pwa-banner", "true");
    setShowBanner(false);
  };

  if (installed) return null;

  return (
    <>
      {/* Bottom Sticky Install Banner */}
      {showBanner && (
        <div className="fixed bottom-20 left-4 right-4 sm:bottom-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-subtle">
          <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl space-y-3">
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
                      {isIosDevice ? "iOS / iPhone" : "Mobile PWA"}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isIosDevice
                      ? "Ajoutez Bylz sur votre écran d'accueil iPhone en 2 clics pour un accès plein écran."
                      : "Accès 1-clic depuis votre écran d'accueil & notifications en temps réel."}
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
                leftIcon={<Smartphone className="w-4 h-4 text-white" />}
              >
                {isIosDevice ? "Installer sur mon iPhone" : "Installer sur mon téléphone"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Step-by-Step Installation Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-white space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-black text-lg shadow-md">
                  B
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Installer Bylz sur iPhone</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-primary/20 text-primary font-bold">
                      iOS PWA
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Guide d'installation rapide en 3 étapes simples
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation why there is no automatic popup on iOS */}
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p>
                <strong>Pourquoi pas de notification automatique ?</strong> Apple ne permet pas aux sites web d'afficher des bannières automatiques d'installation sur Safari. L'ajout se fait manuellement via le bouton de partage en 10 secondes.
              </p>
            </div>

            {/* Step-by-Step Guide */}
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <span>Appuyez sur le bouton Partager</span>
                    <span className="p-1 rounded-md bg-slate-700 text-primary inline-flex items-center">
                      <Share className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Dans <strong>Safari</strong>, touchez l'icône de partage (le carré bleu avec une flèche vers le haut) située au centre de la barre en bas de votre écran.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <span>Sélectionnez « Sur l'écran d'accueil »</span>
                    <span className="p-1 rounded-md bg-slate-700 text-emerald-400 inline-flex items-center">
                      <PlusSquare className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Faites défiler le menu d'options vers le bas et appuyez sur la ligne avec le symbole plus <strong>« Sur l'écran d'accueil »</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <span>Touchez « Ajouter »</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary text-white">
                      Ajouter
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    En haut à droite de votre écran, confirmez en appuyant sur <strong>« Ajouter »</strong>. L'icône de Bylz apparaîtra immédiatement avec vos applications !
                  </p>
                </div>
              </div>
            </div>

            {/* In-App Browser Warning */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              ⚡ <strong>Astuce</strong> : Si vous consultez le site depuis WhatsApp, Instagram ou LinkedIn, touchez les trois petits points et faites <strong>« Ouvrir dans Safari »</strong>.
            </div>

            {/* Footer Action */}
            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                className="w-full font-bold text-sm py-2.5"
                onClick={() => setShowIosModal(false)}
              >
                C'est compris, j'installe Bylz
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
