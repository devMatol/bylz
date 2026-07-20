import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { fetchLateInvoicesCount, fetchUrssafDeclarations, computeUrssafPeriods } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { Payment } from "../types/database";

interface NotificationsContextValue {
  lateInvoicesCount: number;
  urssafDueSoon: boolean;
  loading: boolean;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { company } = useAuth();
  const [lateInvoicesCount, setLateInvoicesCount] = useState(0);
  const [urssafDueSoon, setUrssafDueSoon] = useState(false);
  const [loading, setLoading] = useState(true);

  const poll = useCallback(async () => {
    if (!company) {
      setLateInvoicesCount(0);
      setUrssafDueSoon(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const lateCount = await fetchLateInvoicesCount(company.id);

      // Compute URSSAF due soon
      let dueSoon = false;
      try {
        const { data: invoices } = await supabase
          .from("invoices")
          .select("id")
          .eq("company_id", company.id);
        const invoiceIds = (invoices || []).map((i: any) => i.id);
        let payments: Payment[] = [];
        if (invoiceIds.length > 0) {
          const { data: pmt } = await supabase
            .from("payments")
            .select("*")
            .in("invoice_id", invoiceIds);
          payments = (pmt || []) as Payment[];
        }
        const declarations = await fetchUrssafDeclarations(company.id);
        const periods = computeUrssafPeriods(
          company.created_at,
          company.urssaf_frequency,
          payments,
          declarations
        );
        const current = periods.find((p) => !p.declared);
        if (current) {
          const today = new Date().toISOString().slice(0, 10);
          const days = Math.ceil(
            (new Date(current.dueDate).getTime() - new Date(today).getTime()) / 86400000
          );
          dueSoon = days >= 0 && days < 7;
        }
      } catch {
        // ignore URSSAF computation errors for badges
      }

      setLateInvoicesCount(lateCount);
      setUrssafDueSoon(dueSoon);
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => {
    void poll();
  }, [poll]);

  useEffect(() => {
    const onFocus = () => void poll();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [poll]);

  return (
    <NotificationsContext.Provider value={{ lateInvoicesCount, urssafDueSoon, loading }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
