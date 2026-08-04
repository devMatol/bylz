import { useState, useEffect } from "react";
import { Bell, BellOff, CheckCircle2, ShieldCheck, Send } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useToast } from "../ui/Toast";
import {
  getNotificationPermissionState,
  requestNotificationPermission,
  sendNativePushNotification,
} from "../../lib/pushNotifications";

export function PushNotificationToggle() {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermissionState());
  }, []);

  const handleEnablePush = async () => {
    setLoading(true);
    try {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res === "granted") {
        toast("Notifications Push Mobile activées avec succès !", "success");
        await sendNativePushNotification(
          "🎉 Notifications Bylz Activées",
          "Vous recevrez désormais vos alertes de paiement et rapprochements bancaires en temps réel.",
          "/invoices"
        );
      } else if (res === "denied") {
        toast("Autorisation refusée par votre navigateur ou téléphone.", "warning");
      }
    } catch {
      toast("Erreur lors de l'activation des notifications", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    const success = await sendNativePushNotification(
      "💳 Test de Notification Bylz",
      "Facture FAC-2026-008 payée : 1 250,00 € reçus par carte bancaire !",
      "/invoices"
    );
    if (success) {
      toast("Notification de test envoyée", "success");
    } else {
      toast("Impossible d'envoyer la notification de test", "warning");
    }
  };

  return (
    <Card className="p-6 space-y-4 border border-border bg-surface/90">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text flex items-center gap-2">
              <span>Notifications Push Mobile (Temps réel)</span>
              {permission === "granted" && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Activé
                </span>
              )}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Recevez des alertes instantanées sur votre téléphone/navigateur lorsqu'une facture est payée ou un virement rapproché.
            </p>
          </div>
        </div>

        <div>
          {permission === "granted" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              className="text-xs font-semibold"
              leftIcon={<Send className="w-3.5 h-3.5 text-primary" />}
            >
              Envoyer une alerte de test
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleEnablePush}
              loading={loading}
              className="bylz-glow-cta text-xs font-bold whitespace-nowrap"
              leftIcon={<Bell className="w-4 h-4" />}
            >
              Activer sur ce téléphone
            </Button>
          )}
        </div>
      </div>

      {permission === "denied" && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
          ⚠️ Les notifications sont bloquées dans les paramètres de votre navigateur. Veuillez autoriser les notifications pour Bylz dans les réglages de votre site.
        </p>
      )}
    </Card>
  );
}
