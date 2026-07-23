import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LifeBuoy, Send, User, CheckCircle2, Clock, Eye, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority, Profile } from "../../types/database";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { formatDateShort } from "../../lib/date";

interface TicketWithUser extends SupportTicket {
  user_email?: string;
  user_plan?: string;
}

export function AdminSupportPage() {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();

  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketWithUser | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rawTickets, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ticketsList = (rawTickets as SupportTicket[]) || [];
      if (ticketsList.length === 0) {
        setTickets([]);
        setLoading(false);
        return;
      }

      // Fetch user emails for all unique user_ids
      const userIds = Array.from(new Set(ticketsList.map((t) => t.user_id)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, email, plan")
        .in("id", userIds);

      const userMap: Record<string, { email: string; plan: string }> = {};
      if (profs) {
        for (const p of profs) {
          userMap[p.id] = { email: p.email, plan: p.plan };
        }
      }

      const enriched: TicketWithUser[] = ticketsList.map((t) => ({
        ...t,
        user_email: userMap[t.user_id]?.email || "Utilisateur inconnu",
        user_plan: userMap[t.user_id]?.plan || "starter",
      }));

      setTickets(enriched);
      if (enriched.length > 0 && !selectedTicket) {
        setSelectedTicket(enriched[0]);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      toast("Erreur lors du chargement des tickets support", "danger");
    } finally {
      setLoading(false);
    }
  }, [selectedTicket, toast]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  const loadMessages = useCallback(async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data as TicketMessage[]) || []);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      void loadMessages(selectedTicket.id);
    }
  }, [selectedTicket, loadMessages]);

  const handleSendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminUser || !selectedTicket || !replyBody.trim()) return;

    setSending(true);
    try {
      // 1. Insert message
      const { error: msgErr } = await supabase.from("ticket_messages").insert({
        ticket_id: selectedTicket.id,
        author_id: adminUser.id,
        body: replyBody.trim(),
      });

      if (msgErr) throw msgErr;

      // 2. Update status to in_progress or resolved if requested
      await supabase
        .from("support_tickets")
        .update({ status: "in_progress" })
        .eq("id", selectedTicket.id);

      setReplyBody("");
      toast("Réponse envoyée au client", "success");
      void loadMessages(selectedTicket.id);
      void fetchTickets();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur d'envoi", "danger");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: newStatus })
        .eq("id", selectedTicket.id);

      if (error) throw error;
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
      toast(`Statut du ticket mis à jour : ${newStatus}`, "info");
      void fetchTickets();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur de mise à jour", "danger");
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === "all") return true;
    return t.status === statusFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-rose-400" />
            <span>Support Client & Assistance</span>
          </h1>
          <p className="text-xs text-slate-400">
            Traitez les demandes des utilisateurs avec priorité automatique selon leur abonnement.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-card px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-rose-500"
        >
          <option value="all">Tous les statut</option>
          <option value="open">Ouverts (Nouveaux)</option>
          <option value="in_progress">En cours</option>
          <option value="resolved">Résolus</option>
        </select>
      </div>

      {loading ? (
        <Skeleton height="18rem" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tickets Queue List */}
          <div className="lg:col-span-5 space-y-3">
            {filteredTickets.length === 0 ? (
              <Card className="bg-slate-900 border-slate-800 p-8 text-center text-slate-500 text-xs">
                Aucun ticket correspondant
              </Card>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full text-left p-4 rounded-card border transition-all text-xs space-y-2 ${
                      isSelected
                        ? "bg-slate-900 border-rose-500 shadow-xl"
                        : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white truncate max-w-[180px]">
                        {t.user_email}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          t.priority === "high"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : t.priority === "normal"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {t.priority === "high" ? "PRO (Haute)" : t.priority === "normal" ? "SOLO" : "STARTER"}
                      </span>
                    </div>

                    <p className="font-extrabold text-slate-200 text-sm line-clamp-1">{t.subject}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span className="font-mono">{formatDateShort(t.created_at)}</span>
                      <span className="font-bold uppercase text-rose-300">{t.status}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Ticket Detail & Conversation View */}
          <div className="lg:col-span-7">
            {selectedTicket ? (
              <Card className="bg-slate-900 border-slate-800 p-6 space-y-6 shadow-2xl flex flex-col h-full justify-between">
                {/* Header */}
                <div className="space-y-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-black text-white">{selectedTicket.subject}</h2>
                      <p className="text-xs text-slate-400">
                        Par <strong>{selectedTicket.user_email}</strong> (Plan {selectedTicket.user_plan?.toUpperCase()})
                      </p>
                    </div>

                    {/* Impersonate & User link */}
                    <Link
                      to={`/admin/users/${selectedTicket.user_id}`}
                      className="px-3 py-1.5 rounded-card bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-colors text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Fiche Client & Impersonate</span>
                    </Link>
                  </div>

                  {/* Status buttons */}
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-xs font-bold text-slate-400">Statut :</span>
                    {(["open", "in_progress", "resolved"] as TicketStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateStatus(st)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-pill border transition-all uppercase ${
                          selectedTicket.status === st
                            ? "bg-rose-600 text-white border-rose-500 shadow-sm"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Thread */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {messages.map((m) => {
                    const isAdminAuthor = m.author_id === adminUser?.id;
                    return (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-card text-xs space-y-1.5 ${
                          isAdminAuthor
                            ? "bg-rose-950/40 border border-rose-900/60 ml-6"
                            : "bg-slate-950 border border-slate-800 mr-6"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <span className={isAdminAuthor ? "text-rose-300" : "text-slate-300"}>
                            {isAdminAuthor ? " Support Bylz (Vous)" : selectedTicket.user_email}
                          </span>
                          <span className="text-slate-500 font-mono">{formatDateShort(m.created_at)}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                          {m.body}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-800 space-y-3">
                  <textarea
                    required
                    rows={3}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Rédigez votre réponse au client..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-card p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-normal leading-relaxed"
                  />
                  <div className="flex items-center justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={sending}
                      leftIcon={<Send className="w-4 h-4" />}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                    >
                      Envoyer la réponse
                    </Button>
                  </div>
                </form>
              </Card>
            ) : (
              <Card className="bg-slate-900 border-slate-800 p-12 text-center text-slate-500 text-xs">
                Sélectionnez un ticket dans la liste pour afficher la conversation
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
