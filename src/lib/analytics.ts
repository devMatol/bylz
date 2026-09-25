/**
 * Analytics Event Helper (GA4 / Google Ads / Gtag integration)
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(
  eventName: string,
  props?: Record<string, any>
): void {
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
  trackEvent("sign_up", { method });
}

/**
 * Standard GA4 / Google Ads: User initiates checkout
 */
export function trackBeginCheckout(plan: string, billingCycle: string, value: number) {
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
  trackEvent("purchase", {
    transaction_id: transactionId || `bylz_${Date.now()}`,
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
}

/**
 * User starts a free trial
 */
export function trackTrialStart(plan: string) {
  trackEvent("start_trial", { plan });
}

/**
 * User emits a certified invoice
 */
export function trackInvoiceEmitted(invoiceId: string, amount: number) {
  trackEvent("invoice_emitted", {
    invoice_id: invoiceId,
    value: amount,
    currency: "EUR",
  });
}


