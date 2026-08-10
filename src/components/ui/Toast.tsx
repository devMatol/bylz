import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

type ToastVariant = "success" | "warning" | "danger" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: any, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; color: string }
> = {
  success: { icon: CheckCircle2, color: "text-success" },
  warning: { icon: AlertTriangle, color: "text-warning" },
  danger: { icon: XCircle, color: "text-danger" },
  info: { icon: Info, color: "text-accent" },
};

// Patterns that only ever appear in internal database / API errors. Messages
// matching them are replaced by a neutral one so schema, constraint and policy
// details are never shown to a visitor.
const INTERNAL_ERROR_PATTERNS = [
  /row[- ]level security/i,
  /violates .*constraint/i,
  /duplicate key value/i,
  /permission denied/i,
  /relation "/i,
  /column "/i,
  /function .*does not exist/i,
  /PGRST\d+/i,
  /^\s*\{/,
  /\bJWT\b/,
  /supabase\.co/i,
  /^[0-9A-Z]{5}:/,
];

function looksInternal(msg: string): boolean {
  if (!msg) return true;
  if (msg.length > 300) return true;
  return INTERNAL_ERROR_PATTERNS.some((re) => re.test(msg));
}

// Server-side rules raise short machine codes; translate the ones a user can
// legitimately hit into plain French instead of a generic error.
const KNOWN_SERVER_RULES: Array<[RegExp, string]> = [
  [
    /plan_invoice_limit_reached/,
    "Vous avez atteint le nombre de factures inclus dans votre offre ce mois-ci. Passez à une offre supérieure pour continuer.",
  ],
  [
    /plan_client_limit_reached/,
    "Vous avez atteint le nombre de clients inclus dans votre offre. Passez à une offre supérieure pour en ajouter davantage.",
  ],
  [/not_authorized/, "Vous n'avez pas les droits nécessaires pour cette action."],
];

function knownRuleMessage(raw: string): string | null {
  for (const [re, text] of KNOWN_SERVER_RULES) {
    if (re.test(raw)) return text;
  }
  return null;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: any, variant: ToastVariant = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const GENERIC = "Une erreur est survenue. Veuillez réessayer.";
      let strMsg = GENERIC;
      if (typeof message === "string") {
        strMsg = knownRuleMessage(message) ?? (looksInternal(message) ? GENERIC : message);
        if (strMsg === GENERIC && message) console.error("Toast (masked):", message);
      } else if (message && typeof message === "object") {
        // Never render a raw database or network error object: its message,
        // details, hint and code leak table names, constraints and policy
        // structure. Log it for developers and show a neutral message instead.
        console.error("Toast error payload:", message);
        let raw = "";
        try {
          raw = JSON.stringify(message);
        } catch {
          raw = String((message as any)?.message ?? "");
        }
        strMsg = knownRuleMessage(raw) ?? GENERIC;
      }
      setToasts((prev) => [...prev, { id, message: String(strMsg), variant }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => {
          const { icon: Icon, color } = variantConfig[t.variant];
          return (
            <div
              key={t.id}
              className={cn(
                "flex items-start gap-3 bg-surface border border-border rounded-card p-4 shadow-lg animate-in"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", color)} />
              <p className="text-sm text-text flex-1">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="text-muted hover:text-text transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
