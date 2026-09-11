/**
 * Plausible Analytics Helper (100% RGPD, sans cookies, conforme CNIL)
 * Permet de tracker des objectifs et événements de conversion personnalisés en toute sécurité.
 */

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: {
        props?: Record<string, string | number | boolean>;
        callback?: () => void;
      }
    ) => void;
  }
}

/**
 * Envoie un événement personnalisé à Plausible si le script est chargé
 */
export function trackPlausibleEvent(
  eventName: string,
  props?: Record<string, string | number | boolean>
): void {
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    try {
      window.plausible(eventName, { props });
    } catch (err) {
      console.debug("Plausible tracking skipped:", err);
    }
  }
}
