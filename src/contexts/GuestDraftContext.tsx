import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { ClientType, ItemNature } from "../types/database";

export interface GuestInvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  nature: ItemNature;
}

export interface GuestInvoiceDraft {
  clientName: string;
  clientEmail: string;
  clientType: ClientType;
  lines: GuestInvoiceLine[];
  issueDate: string;
  dueDate: string;
  paymentTerms: string;
  note: string;
}

const LOCAL_STORAGE_KEY = "bylz-guest-draft";

const defaultDraft = (): GuestInvoiceDraft => ({
  clientName: "",
  clientEmail: "",
  clientType: "b2b",
  lines: [{ description: "", quantity: 1, unitPrice: 0, nature: "service" }],
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date().toISOString().slice(0, 10),
  paymentTerms: "30d",
  note: "",
});

interface GuestDraftContextValue {
  draft: GuestInvoiceDraft;
  updateDraft: (patch: Partial<GuestInvoiceDraft>) => void;
  clearDraft: () => void;
}

const GuestDraftContext = createContext<GuestDraftContextValue | null>(null);

export function GuestDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<GuestInvoiceDraft>(() => {
    const fallback = defaultDraft();
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          return {
            clientName: typeof parsed.clientName === "string" ? parsed.clientName : fallback.clientName,
            clientEmail: typeof parsed.clientEmail === "string" ? parsed.clientEmail : fallback.clientEmail,
            clientType: parsed.clientType === "b2b" || parsed.clientType === "b2c" ? parsed.clientType : fallback.clientType,
            lines: Array.isArray(parsed.lines)
              ? parsed.lines.map((l: any) => ({
                  description: l && typeof l.description === "string" ? l.description : "",
                  quantity: l && typeof l.quantity === "number" ? l.quantity : 1,
                  unitPrice: l && typeof l.unitPrice === "number" ? l.unitPrice : 0,
                  nature: l && (l.nature === "goods" || l.nature === "service") ? l.nature : "service",
                }))
              : fallback.lines,
            issueDate: typeof parsed.issueDate === "string" ? parsed.issueDate : fallback.issueDate,
            dueDate: typeof parsed.dueDate === "string" ? parsed.dueDate : fallback.dueDate,
            paymentTerms: typeof parsed.paymentTerms === "string" ? parsed.paymentTerms : fallback.paymentTerms,
            note: typeof parsed.note === "string" ? parsed.note : fallback.note,
          };
        }
      }
    } catch (e) {
      console.error("Error reading guest draft from localStorage", e);
    }
    return fallback;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const updateDraft = (patch: Partial<GuestInvoiceDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const clearDraft = () => {
    setDraft(defaultDraft());
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <GuestDraftContext.Provider value={{ draft, updateDraft, clearDraft }}>
      {children}
    </GuestDraftContext.Provider>
  );
}

export function useGuestDraft() {
  const context = useContext(GuestDraftContext);
  if (!context) {
    throw new Error("useGuestDraft must be used within a GuestDraftProvider");
  }
  return context;
}
