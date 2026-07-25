import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Image as ImageIcon,
  Save,
  Filter,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";
import { formatDateShort } from "../../lib/date";
import type { EmailLog, EmailStatus } from "../../types/database";

export function AdminEmailsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Logo configuration state
  const [tableMissing, setTableMissing] = useState(false);
  const [emailLogoUrl, setEmailLogoUrl] = useState("https://bylz.fr/logo.png");
  const [savingLogo, setSavingLogo] = useState(false);

  const fetchEmailLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (
          error.message.includes("schema cache") ||
          error.code === "PGRST204" ||
          error.code === "PGRST205" ||
          error.message.includes("email_logs")
        ) {
          setTableMissing(true);
        }
        throw error;
      }
      setTableMissing(false);
      setLogs((data as EmailLog[]) || []);
    } catch (err: any) {
      console.error("Error fetching email logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSystemSettings = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "email_logo_url")
        .maybeSingle();

      if (data?.value && typeof data.value === "string") {
        setEmailLogoUrl(data.value);
      }
    } catch (err) {
      console.warn("Could not load system_settings logo:", err);
    }
  }, []);

  useEffect(() => {
    void fetchEmailLogs();
    void fetchSystemSettings();
  }, [fetchEmailLogs, fetchSystemSettings]);

  const handleSaveLogo = async () => {
    if (!emailLogoUrl.trim()) {
      toast("Veuillez saisir une URL de logo valide", "warning");
      return;
    }

    setSavingLogo(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({ key: "email_logo_url", value: JSON.stringify(emailLogoUrl.trim()) });

      if (error) throw error;
      toast("Logo e-mail mis à jour avec succès !", "success");
    } catch (err: any) {
      toast(err.message || "Erreur lors de l'enregistrement du logo", "danger");
    } finally {
      setSavingLogo(false);
    }
  };

  const handleResend = async (log: EmailLog) => {
    setResendingId(log.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: log.recipient,
          subject: log.subject,
          body: `[RENVOI ADMIN] ${log.subject}\n\nE-mail réexpédié manuellement par le support Bylz.`,
          document_type: log.email_type || "support",
          document_id: log.metadata?.document_id || "none",
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Échec du renvoi de l'e-mail");
      }

      toast(`E-mail réexpédié avec succès à ${log.recipient}`, "success");
      void fetchEmailLogs();
    } catch (err: any) {
      toast(err.message || "Erreur lors du renvoi", "danger");
    } finally {
      setResendingId(null);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.recipient.toLowerCase().includes(search.toLowerCase()) ||
      log.subject.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || log.email_type === typeFilter;
    const matchStatus = statusFilter === "all" || log.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const totalSent = logs.filter((l) => l.status === "sent" || l.status === "delivered").length;
  const totalFailed = logs.filter((l) => l.status === "failed").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-rose-500" />
            <span>Centre d'Envoi & Logs E-mails Resend</span>
          </h1>
          <p className="text-xs text-slate-400">
            Suivi des réceptions, statuts d'envoi et configuration de la charte e-mail.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fetchEmailLogs()}
          loading={loading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
        >
          Actualiser les logs
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI Card 1 */}
        <Card className="bg-slate-900 border-slate-800 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>E-mails distribués</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-white">{totalSent}</p>
          <p className="text-[11px] text-slate-500">Transmis avec succès via Resend API</p>
        </Card>

        {/* KPI Card 2 */}
        <Card className="bg-slate-900 border-slate-800 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Échecs d'envoi</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-400">{totalFailed}</p>
          <p className="text-[11px] text-slate-500">Nécessitent un réenvoi ou vérification de l'adresse</p>
        </Card>

        {/* Admin Logo Config Card */}
        <Card className="bg-slate-900 border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-extrabold text-white">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-rose-500" />
              <span>Logo des E-mails Admin</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">system_settings</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 p-1 flex items-center justify-center flex-shrink-0">
              <img
                src={emailLogoUrl}
                alt="Logo preview"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>

            <div className="flex-1 space-y-1">
              <Input
                type="text"
                value={emailLogoUrl}
                onChange={(e) => setEmailLogoUrl(e.target.value)}
                placeholder="https://..."
                className="text-xs font-mono py-1.5"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveLogo}
            loading={savingLogo}
            leftIcon={<Save className="w-3.5 h-3.5" />}
            className="w-full bg-slate-950 border-slate-800 text-slate-200 hover:text-white text-xs font-bold"
          >
            Enregistrer le Logo E-mail
          </Button>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="bg-slate-900 border-slate-800 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par e-mail ou objet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
            >
              <option value="all">Tous les types</option>
              <option value="quote">Devis</option>
              <option value="invoice">Facture</option>
              <option value="urssaf_reminder">URSSAF</option>
              <option value="vat_threshold">Alerte TVA</option>
              <option value="trial_ending">Fin d'essai Pro</option>
              <option value="welcome">Bienvenue</option>
              <option value="support">Support</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="sent">Envoyé / Reçu</option>
              <option value="failed">Échec</option>
              <option value="pending">En attente</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Destinataire & Type</th>
                <th className="py-3 px-4">Objet</th>
                <th className="py-3 px-4">Statut Resend</th>
                <th className="py-3 px-4">ID Resend</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Chargement des logs d'envoi...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Aucun e-mail correspondant aux critères.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isFailed = log.status === "failed";
                  return (
                    <tr key={log.id} className="hover:bg-slate-900/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-mono font-bold text-white">{log.recipient}</p>
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-bold uppercase">
                            {log.email_type}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-slate-300 font-medium">
                        {log.subject}
                      </td>

                      <td className="py-3 px-4">
                        {isFailed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3" />
                            Échec
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Envoyé (200)
                          </span>
                        )}
                        {log.error_message && (
                          <p className="text-[10px] text-rose-400 mt-1 truncate max-w-xs font-mono" title={log.error_message}>
                            {log.error_message}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {log.resend_id ? (
                          <span className="text-rose-300 font-bold">{log.resend_id}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {formatDateShort(log.created_at)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleResend(log)}
                          loading={resendingId === log.id}
                          leftIcon={<Send className="w-3 h-3" />}
                          className="bg-slate-950 border-slate-800 text-rose-400 hover:bg-rose-600 hover:text-white text-[11px] font-bold py-1 px-2.5"
                        >
                          Renvoyer
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
