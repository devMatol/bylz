export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("Service Worker registered successfully with scope:", registration.scope);
    return registration;
  } catch (err) {
    console.warn("Service Worker registration failed:", err);
    return null;
  }
}

export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export function getNotificationPermissionState(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await registerServiceWorker();
    }
    return permission;
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return "denied";
  }
}

export async function sendNativePushNotification(
  title: string,
  body: string,
  url = "/invoices",
  icon = "/pwa-icon-192.png"
): Promise<boolean> {
  if (!isPushNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg && reg.showNotification) {
      await reg.showNotification(title, {
        body,
        icon,
        badge: icon,
        vibrate: [100, 50, 100],
        data: { url },
      });
      return true;
    } else {
      // Fallback
      new Notification(title, { body, icon });
      return true;
    }
  } catch (err) {
    console.warn("Failed to trigger push notification:", err);
    return false;
  }
}
