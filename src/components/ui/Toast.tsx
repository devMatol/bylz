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

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: any, variant: ToastVariant = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      const extractText = (val: any): string => {
        if (!val) return "";
        if (typeof val === "string") return val;
        if (typeof val === "number" || typeof val === "boolean") return String(val);
        if (val instanceof Error) return val.message || val.name || String(val);
        if (typeof val === "object") {
          const possible = val.message || val.error || val.details || val.description || val.reason || val.data;
          if (possible && typeof possible === "string") return possible;
          if (possible && typeof possible === "object") return extractText(possible);
          try {
            return JSON.stringify(val);
          } catch {
            return "";
          }
        }
        return String(val);
      };

      let strMsg = extractText(message) || "Une erreur est survenue.";

      // Clean up string concatenation like "Erreur: [object Object]" or raw "[object Object]"
      if (strMsg.includes("[object Object]")) {
        strMsg = strMsg.replace(/\[object Object\]/g, "").trim();
        if (!strMsg || strMsg === "Erreur:" || strMsg === "Erreur") {
          strMsg = "Erreur de traitement lors de la requête.";
        }
      }

      setToasts((prev) => [...prev, { id, message: strMsg, variant }]);
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
