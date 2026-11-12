/**
 * Analytics Event Helper (GA4 / Google Ads / Gtag integration)
 * Strictement conditionné au recueil du consentement utilisateur (Consent Mode v2)
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

const STORAGE_KEY = "bylz-consent-preferences";
const CONSENT_VALIDITY_DAYS = 180; // 6 mois

/**
 * Vérifie si l'utilisateur a explicitement consenti aux cookies d'analyse (GA4)
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const ageDays = (Date.now() - (parsed.timestamp || 0)) / (1000 * 60 * 60 * 24);
    if (ageDays >= CONSENT_VALIDITY_DAYS) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return Boolean(parsed.analytics);
  } catch {
    return false;
  }
}

/**
 * Vérifie si l'utilisateur a explicitement consenti aux cookies publicitaires (Google Ads)
 */
export function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const ageDays = (Date.now() - (parsed.timestamp || 0)) / (1000 * 60 * 60 * 24);
    if (ageDays >= CONSENT_VALIDITY_DAYS) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return Boolean(parsed.marketing);
  } catch {
    return false;
  }
}

export function trackEvent(
  eventName: string,
  props?: Record<string, any>
): void {
  // Garde-fou strict : aucun événement sans consentement préalable d'analyse
  if (!hasAnalyticsConsent()) {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Consentement analytics absent. Événement ignoré : ${eventName}`, props);
    }
    return;
  }

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, props);
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Event tracked: ${eventName}`, props);
    }
  }
}

/**
 * Standard GA4 / Google Ads: User creates an account
 */
export function trackSignUp(method: "email" | "google" = "email") {
  if (!hasAnalyticsConsent()) return;
  trackEvent("sign_up", { method });

  // Google Ads conversion event: Inscription (nécessite consentement marketing)
  if (hasMarketingConsent() && typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: "AW-18465275177/sjQfCKe00YQdEKn69uRE",
    });
  }
}

/**
 * Standard GA4 / Google Ads: User initiates checkout
 */
export function trackBeginCheckout(plan: string, billingCycle: string, value: number) {
  if (!hasAnalyticsConsent()) return;
  trackEvent("begin_checkout", {
    currency: "EUR",
    value,
    items: [
      {
        item_name: `Bylz ${plan}`,
        item_category: billingCycle,
        price: value,
        quantity: 1,
      },
    ],
  });
}

/**
 * Standard GA4 / Google Ads: User completes a purchase / subscription
 */
export function trackPurchase(plan: string, value: number, transactionId?: string) {
  if (!hasAnalyticsConsent()) return;
  const txId = transactionId || `bylz_${Date.now()}`;
  trackEvent("purchase", {
    transaction_id: txId,
    value,
    currency: "EUR",
    items: [
      {
        item_name: `Bylz ${plan}`,
        price: value,
        quantity: 1,
      },
    ],
  });

  // Google Ads conversion event: Abonnement (nécessite consentement marketing)
  if (hasMarketingConsent() && typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "ads_conversion_Abonnement_1", {
      value,
      currency: "EUR",
      transaction_id: txId,
    });
  }
}

/**
 * User starts a free trial
 */
export function trackTrialStart(plan: string) {
  if (!hasAnalyticsConsent()) return;
  trackEvent("start_trial", { plan });
}

/**
 * User emits a certified invoice
 */
export function trackInvoiceEmitted(invoiceId: string, amount: number) {
  if (!hasAnalyticsConsent()) return;
  trackEvent("invoice_emitted", {
    invoice_id: invoiceId,
    value: amount,
    currency: "EUR",
  });
}

/**
 * User creates their first invoice
 */
export function trackFirstInvoice(invoiceId: string, amount: number) {
  if (!hasAnalyticsConsent()) return;
  trackEvent("first_invoice", {
    invoice_id: invoiceId,
    value: amount,
    currency: "EUR",
  });
}

/**
 * User clicks an upgrade touchpoint
 */
export function trackUpgradeClick(plan: string, location: string) {
  if (!hasAnalyticsConsent()) return;
  trackEvent("upgrade_click", {
    plan,
    location,
  });
}

/**
 * User successfully completes Stripe checkout
 */
export function trackCheckoutSuccess(plan: string, value?: number) {
  if (!hasAnalyticsConsent()) return;
  trackEvent("checkout_success", {
    plan,
    value,
    currency: "EUR",
  });
  if (value) {
    trackPurchase(plan, value);
  }
}

/**
 * Mesure Lot 11 - Conversion & Parcours (Strictement conditionné au consentement Analytics)
 */

export function trackScrollDepth(percent: 25 | 50 | 75 | 100) {
  if (!hasAnalyticsConsent()) return;
  trackEvent("scroll_depth", { percent });
}

export function trackCtaClick(emplacement: "hero" | "tarifs" | "bas de page" | "navbar" | "milieu") {
  if (!hasAnalyticsConsent()) return;
  trackEvent("cta_click", { emplacement });
}

export function trackDemoStart() {
  if (!hasAnalyticsConsent()) return;
  trackEvent("demo_start");
}

export function trackDemoLockedClick(feature?: string) {
  if (!hasAnalyticsConsent()) return;
  trackEvent("demo_locked_click", { feature });
}

export function trackSignupView() {
  if (!hasAnalyticsConsent()) return;
  trackEvent("signup_view");
}

export function trackSignupSubmit(plan?: string) {
  if (!hasAnalyticsConsent()) return;
  trackEvent("signup_submit", { plan });
}
