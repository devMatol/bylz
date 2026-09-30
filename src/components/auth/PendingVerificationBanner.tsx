import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, X, RefreshCw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { resendConfirmationEmail } from "../../lib/auth";

export function PendingVerificationBanner({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("bylz-dismiss-pending-banner") === "true";
    } catch {
      return false;
    }
  });
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const isPending =
    !!user &&
    !user.email_confirmed_at &&
    user.app_metadata?.provider === "email";

  if (!isPending || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("bylz-dismiss-pending-banner", "true");
    } catch {
      // ignore
    }
  };

  const handleResend = async () => {
    if (!user?.email || resending || cooldown > 0) return;
    setResending(true);
    setResendSuccess(false);
    try {
      const { error } = await resendConfirmationEmail(user.email);
      if (error) {
        console.error("Resend error:", error);
      } else {
        setResendSuccess(true);
        setCooldown(60);
      }
    } catch (err) {
      console.error("Resend confirmation error:", err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      role="alert"
      className={`w-full bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-orange-500/20 border-b border-amber-500/35 px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-amber-100 flex items-center justify-between gap-3 shadow-sm ${className}`}
    >
      <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-amber-300">
            Compte en attente de confirmation
          </p>
          <p className="text-amber-200/90 text-xs sm:text-[13px] leading-snug">
            Un email de confirmation a été envoyé à{" "}
            <strong className="text-white underline">{user?.email}</strong>. Cliquez sur le lien pour valider votre compte et garantir la conformité de vos factures.
          </p>
          {resendSuccess && (
            <p className="text-[11px] sm:text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Nouveau lien envoyé ! Pensez à vérifier vos courriers indésirables (spams).
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          {resending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          <span>
            {cooldown > 0
              ? `Renvoyer (${cooldown}s)`
              : "Renvoyer l'email"}
          </span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-amber-300/70 hover:text-white hover:bg-amber-500/20 transition-colors"
          title="Masquer pour cette session"
          aria-label="Fermer l'alerte"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
