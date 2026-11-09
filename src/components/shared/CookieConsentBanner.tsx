import React, { useState, useEffect } from "react";
import { Shield, Settings, Check, X } from "lucide-react";
import { Button } from "../ui/Button";

export interface CookiePreferences {
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const STORAGE_KEY = "bylz-consent-preferences";
const CONSENT_VALIDITY_DAYS = 180; // 6 mois

export function getStoredConsent(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: CookiePreferences = JSON.parse(raw);
    const ageDays = (Date.now() - (parsed.timestamp || 0)) / (1000 * 60 * 60 * 24);
    if (ageDays >= CONSENT_VALIDITY_DAYS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(analytics: boolean, marketing: boolean): void {
  if (typeof window === "undefined") return;
  const preferences: CookiePreferences = {
    analytics,
    marketing,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      analytics_storage: analytics ? "granted" : "denied",
      ad_storage: marketing ? "granted" : "denied",
      ad_user_data: marketing ? "granted" : "denied",
      ad_personalization: marketing ? "granted" : "denied",
    });
  }
}

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setIsOpen(true);
    } else {
      setAnalyticsChecked(stored.analytics);
      setMarketingChecked(stored.marketing);
    }

    const handleOpenBanner = () => {
      const current = getStoredConsent();
      setAnalyticsChecked(current ? current.analytics : false);
      setMarketingChecked(current ? current.marketing : false);
      setIsCustomizeOpen(true);
      setIsOpen(true);
    };

    window.addEventListener("bylz-open-cookie-banner", handleOpenBanner);
    return () => {
      window.removeEventListener("bylz-open-cookie-banner", handleOpenBanner);
    };
  }, []);

  if (!isOpen) return null;

  const handleAcceptAll = () => {
    saveConsent(true, true);
    setAnalyticsChecked(true);
    setMarketingChecked(true);
    setIsOpen(false);
    setIsCustomizeOpen(false);
  };

  const handleRefuseAll = () => {
    saveConsent(false, false);
    setAnalyticsChecked(false);
    setMarketingChecked(false);
    setIsOpen(false);
    setIsCustomizeOpen(false);
  };

  const handleSaveCustom = () => {
    saveConsent(analyticsChecked, marketingChecked);
    setIsOpen(false);
    setIsCustomizeOpen(false);
  };

  return (
    <div
      role="region"
      aria-label="Gestion des cookies et du consentement"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="max-w-5xl mx-auto">
        {!isCustomizeOpen ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Respect de votre vie privée & Cookies
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Bylz utilise des cookies strictement nécessaires au fonctionnement du service et, avec votre accord, des traceurs de mesure d'audience (Google Analytics 4) et de suivi des conversions (Google Ads) afin d'améliorer la plateforme. Votre choix est conservé pendant 6 mois et modifiable à tout moment.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
              <button
                type="button"
                onClick={handleRefuseAll}
                className="flex-1 sm:flex-none px-4 py-2.5 min-h-[44px] rounded-lg border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition-colors text-center cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                Tout refuser
              </button>
              <button
                type="button"
                onClick={() => setIsCustomizeOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm transition-colors text-center cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                Personnaliser
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-colors text-center cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                Tout accepter
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Personnalisation des traceurs
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                aria-label="Fermer la personnalisation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-sm">
              {/* Nécessaires */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Strictement nécessaires</span>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Toujours actif
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  Authentification sécurisée, protection CSRF, maintien de session et mémorisation de vos choix.
                </p>
              </div>

              {/* Analytics */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Mesure d'audience (GA4)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsChecked}
                      onChange={(e) => setAnalyticsChecked(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  Permet de mesurer anonymement la fréquentation et de détecter les erreurs de parcours.
                </p>
              </div>

              {/* Marketing */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Publicité & Conversions</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingChecked}
                      onChange={(e) => setMarketingChecked(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  Mesure l'efficacité de nos campagnes Google Ads lors d'une souscription ou inscription.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleRefuseAll}
                className="px-4 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                Tout refuser
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-4 py-2 min-h-[40px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                Enregistrer mes choix
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
