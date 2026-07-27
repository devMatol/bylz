import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  Clock,
  AlertTriangle,
  Receipt,
  Mail,
  Landmark,
  ShieldCheck,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  DollarSign,
  FileText,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { supabase } from "../../lib/supabase";
import { computeUrssafPeriods, fetchUrssafDeclarations, VAT_THRESHOLDS } from "../../lib/api";
import { todayISO, formatDateLong } from "../../lib/date";
import { formatAmount } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { ReminderModal } from "../documents/ReminderModal";

export interface AppNotification {
  id: string;
  category: "invoice" | "urssaf" | "vat" | "ereporting";
  priority: "high" | "normal";
  title: string;
  message: string;
  date: string;
  read: boolean;
  actionType?: "mark_paid" | "remind_client" | "copy_urssaf" | "view_ereporting";
  targetId?: string;
  data?: any;
}

export function NotificationCenter() {
  const { company } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Quick Action Modal States
  const [payModalData, setPayModalData] = useState<{ invoiceId: string; number: string; amount: number } | null>(null);
  const [remindModalData, setRemindModalData] = useState<{ invoiceId: string; number: string; amount: number; clientName: string; clientEmail?: string } | null>(null);

  // Pay Modal Form
  const [payDate, setPayDate] = useState(todayISO());
  const [payMethod, setPayMethod] = useState<string>("transfer");
  const [payAmount, setPayAmount] = useState<string>("");
  const [savingPay, setSavingPay] = useState(false);

  // Remind Modal Form
  const [remindSubject, setRemindSubject] = useState("");
  const [remindBody, setRemindBody] = useState("");
  const [sendingRemind, setSendingRemind] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Load actionable notifications from real database records
  const loadNotifications = useCallback(async () => {
    if (!company) return;
    setLoading(true);

    const items: AppNotification[] = [];

    try {
      // 1. Scan unpaid and overdue invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, number, status, due_date, total_ttc, paid_amount, clients(name, email)")
        .eq("company_id", company.id)
        .neq("status", "paid")
        .neq("status", "draft");

      const todayStr = todayISO();
      for (const inv of invoices || []) {
        const amt = Number(inv.total_ttc) || 0;
        const clientName = (inv.clients as any)?.name || "Client";
        const clientEmail = (inv.clients as any)?.email;

        if (inv.status === "late" || (inv.due_date && inv.due_date < todayStr)) {
          items.push({
            id: `inv-late-${inv.id}`,
            category: "invoice",
            priority: "high",
            title: `Facture ${inv.number} en retard`,
            message: `${clientName} • ${formatAmount(amt)} de retard (Échéance : ${inv.due_date})`,
            date: inv.due_date,
            read: false,
            actionType: "remind_client",
            targetId: inv.id,
            data: { invoiceId: inv.id, number: inv.number, amount: amt, clientName, clientEmail },
          });
        } else if (inv.due_date && inv.due_date >= todayStr) {
          items.push({
            id: `inv-pending-${inv.id}`,
            category: "invoice",
            priority: "normal",
            title: `Facture ${inv.number} à échéance proche`,
            message: `${clientName} • ${formatAmount(amt)} (Échéance : ${inv.due_date})`,
            date: inv.due_date,
            read: false,
            actionType: "mark_paid",
            targetId: inv.id,
            data: { invoiceId: inv.id, number: inv.number, amount: amt, clientName, clientEmail },
          });
        }
      }

      // 2. Scan URSSAF deadlines
      const { data: pmtData } = await supabase
        .from("payments")
        .select("id, invoice_id, amount, paid_at")
        .in("invoice_id", (invoices || []).map((i) => i.id));

      const declarations = await fetchUrssafDeclarations(company.id);
      const periods = computeUrssafPeriods(company.created_at, company.urssaf_frequency, (pmtData || []) as any, declarations);
      const upcomingUrssaf = periods.find((p) => !p.declared);

      if (upcomingUrssaf && upcomingUrssaf.revenue > 0) {
        items.push({
          id: `urssaf-${upcomingUrssaf.periodStart}`,
          category: "urssaf",
          priority: "high",
          title: `Déclaration URSSAF : ${upcomingUrssaf.label}`,
          message: `Montant estimé : ${formatAmount(upcomingUrssaf.estimatedAmount)} (sur ${formatAmount(upcomingUrssaf.revenue)} de CA). À faire avant le ${upcomingUrssaf.dueDate}`,
          date: upcomingUrssaf.dueDate,
          read: false,
          actionType: "copy_urssaf",
          targetId: upcomingUrssaf.periodStart,
          data: upcomingUrssaf,
        });
      }

      // 3. Scan E-Reporting inbound invoices
      const { data: eInvoices } = await supabase
        .from("invoices")
        .select("id, number, total_ttc, created_at, clients(name)")
        .eq("company_id", company.id)
        .eq("ereporting_status", "submitted")
        .order("created_at", { ascending: false })
        .limit(3);

      for (const eInv of eInvoices || []) {
        items.push({
          id: `ereporting-${eInv.id}`,
          category: "ereporting",
          priority: "normal",
          title: `Facture E-Reporting certifiée`,
          message: `Facture ${eInv.number} (${formatAmount(Number(eInv.total_ttc))}) transmise à la DGFiP.`,
          date: eInv.created_at.slice(0, 10),
          read: true,
          actionType: "view_ereporting",
          targetId: eInv.id,
        });
      }

      setNotifications(items);
    } catch (e) {
      console.warn("Error loading notifications:", e);
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Action handlers
  const handleOpenPayModal = (data: any) => {
    setPayModalData(data);
    setPayAmount(data.amount ? String(data.amount) : "");
    setPayDate(todayISO());
    setPayMethod("transfer");
    setOpen(false);
  };

  const handleOpenRemindModal = (data: any) => {
    setRemindModalData(data);
    setRemindSubject(`Rappel : Facture ${data.number} en attente de règlement`);
    setRemindBody(`Bonjour ${data.clientName},\n\nSauf erreur de notre part, la facture ${data.number} d'un montant de ${formatAmount(data.amount)} n'a pas encore été réglée.\n\nNous vous remercions de bien vouloir procéder au règlement dans les meilleurs délais.\n\nCordialement,`);
    setOpen(false);
  };

  const handleSavePayment = async () => {
    if (!payModalData || !company) return;
    setSavingPay(true);
    try {
      const amt = parseFloat(payAmount) || payModalData.amount;

      // Insert payment line
      await supabase.from("payments").insert({
        invoice_id: payModalData.invoiceId,
        amount: amt,
        method: payMethod,
        paid_at: payDate,
        source: "manual",
      });

      // Update invoice status to paid
      await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_at: payDate,
          paid_amount: amt,
          payment_method: payMethod,
        })
        .eq("id", payModalData.invoiceId);

      toast(`Facture ${payModalData.number} marquée comme payée !`, "success");
      setPayModalData(null);
      void loadNotifications();
    } catch (e: any) {
      toast(e.message || "Erreur lors de l'enregistrement du paiement", "danger");
    } finally {
      setSavingPay(false);
    }
  };

  const handleSendReminder = async () => {
    if (!remindModalData || !company) return;
    setSendingRemind(true);
    try {
      if (!remindModalData.clientEmail) {
        toast("Ce client n'a pas d'adresse e-mail renseignée.", "warning");
        setSendingRemind(false);
        return;
      }

      const { data: res, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: remindModalData.clientEmail,
          subject: remindSubject,
          html: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
            <p>${remindBody.replace(/\n/g, "<br/>")}</p>
          </div>`,
        },
      });

      if (error) throw error;

      toast(`Relance e-mail envoyée à ${remindModalData.clientEmail} !`, "success");
      setRemindModalData(null);
    } catch (e: any) {
      toast(e.message || "Erreur lors de l'envoi de la relance", "danger");
    } finally {
      setSendingRemind(false);
    }
  };

  const handleCopyUrssaf = async (data: any) => {
    try {
      await navigator.clipboard.writeText(String(data.estimatedAmount.toFixed(2)));
      toast(`Montant de ${formatAmount(data.estimatedAmount)} copié dans le presse-papiers !`, "success");
      window.open("https://www.autoentrepreneur.urssaf.fr", "_blank");
    } catch {
      toast("Impossible de copier automatiquement", "danger");
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Icon Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-pill text-muted hover:text-text hover:bg-surface-hover transition-colors flex items-center justify-center"
        aria-label="Centre de notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-bg animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-[360px] sm:w-[420px] bg-surface border border-border rounded-card shadow-2xl z-50 overflow-hidden flex flex-col max-h-[520px]">
          {/* Popover Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-surface-hover/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-text">Centre de notifications</h3>
            </div>
            {unreadCount > 0 && (
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-pill">
                {unreadCount} urgente(s)
              </span>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {notifications.length === 0 ? (
              <div className="py-8 text-center space-y-2 text-muted">
                <Check className="w-8 h-8 mx-auto text-emerald-500/70" />
                <p className="text-xs font-semibold">Aucune alerte en attente !</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-card border transition-all space-y-2.5 ${
                    n.priority === "high"
                      ? "bg-amber-500/5 border-amber-500/30"
                      : "bg-surface border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {n.category === "invoice" ? (
                        <Receipt className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      ) : n.category === "urssaf" ? (
                        <Landmark className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      )}
                      <h4 className="text-xs font-bold text-text leading-snug">{n.title}</h4>
                    </div>
                  </div>

                  <p className="text-xs text-muted leading-relaxed font-medium">{n.message}</p>

                  {/* Quick Action Buttons */}
                  <div className="pt-1 flex items-center gap-2">
                    {n.actionType === "mark_paid" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenPayModal(n.data)}
                          className="text-[11px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-pill hover:bg-emerald-600 transition-colors shadow-xs"
                        >
                          Marquer payée
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRemindModal(n.data)}
                          className="text-[11px] font-bold bg-surface-hover text-text border border-border px-2.5 py-1 rounded-pill hover:bg-surface-hover/80 transition-colors"
                        >
                          Relancer
                        </button>
                      </>
                    )}

                    {n.actionType === "remind_client" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenPayModal(n.data)}
                          className="text-[11px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-pill hover:bg-emerald-600 transition-colors shadow-xs"
                        >
                          Marquer payée
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRemindModal(n.data)}
                          className="text-[11px] font-bold bg-primary text-white px-2.5 py-1 rounded-pill hover:bg-primary-hover transition-colors shadow-xs"
                        >
                          Relancer le client
                        </button>
                      </>
                    )}

                    {n.actionType === "copy_urssaf" && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate("/urssaf");
                        }}
                        className="text-[11px] font-bold bg-primary text-white px-3 py-1 rounded-pill hover:bg-primary-hover transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Ouvrir</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* QUICK PAY MODAL */}
      {payModalData && (
        <Modal open={true} onClose={() => setPayModalData(null)} title={`Enregistrer le paiement ${payModalData.number}`}>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted">
              Marquez la facture <strong className="text-text">{payModalData.number}</strong> comme réglée.
            </p>
            <Input
              label="Montant reçu (€)"
              type="number"
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              required
            />
            <Input
              label="Date d'encaissement"
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              required
            />
            <Select
              label="Mode de règlement"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
            >
              <option value="transfer">Virement bancaire</option>
              <option value="stripe">Carte bancaire (Stripe)</option>
              <option value="check">Chèque</option>
              <option value="cash">Espèces</option>
            </Select>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setPayModalData(null)}>
                Annuler
              </Button>
              <Button variant="primary" size="sm" onClick={handleSavePayment} disabled={savingPay} className="bylz-glow-cta font-bold">
                Valider l'encaissement
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* QUICK REMINDER MODAL */}
      {remindModalData && (
        <ReminderModal
          open={true}
          onClose={() => setRemindModalData(null)}
          clientName={remindModalData.clientName}
          clientEmail={remindModalData.clientEmail}
          invoiceNumber={remindModalData.number}
          invoiceAmount={remindModalData.amount}
          onSend={async (subject, body) => {
            if (!remindModalData.clientEmail) return;
            const { error } = await supabase.functions.invoke("send-email", {
              body: {
                to: remindModalData.clientEmail,
                subject,
                html: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
                  <p>${body.replace(/\n/g, "<br/>")}</p>
                </div>`,
              },
            });
            if (error) throw error;
            toast(`Relance e-mail envoyée à ${remindModalData.clientEmail} !`, "success");
            setRemindModalData(null);
          }}
        />
      )}
    </div>
  );
}
