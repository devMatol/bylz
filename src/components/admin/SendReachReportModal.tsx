import { useState } from "react";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sparkles,
  KeyRound,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useToast } from "../ui/Toast";
import { supabase } from "../../lib/supabase";

export interface ReachReportData {
  periodLabel: string;
  totalReach: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  conversionRate: number;
  growthRate: number;
  topPages: { page: string; title: string; views: number; percentage: number }[];
  topQueries: { query: string; impressions: number; clicks: number }[];
  acquisitionChannels: { label: string; percentage: number; count: number }[];
}

interface SendReachReportModalProps {
  open: boolean;
  onClose: () => void;
  reportData: ReachReportData;
  defaultEmail?: string;
}

export function SendReachReportModal({
  open,
  onClose,
  reportData,
  defaultEmail = "matthiasollivier123@gmail.com",
}: SendReachReportModalProps) {
  const { toast } = useToast();
  const [recipient, setRecipient] = useState(defaultEmail);
  const [subject, setSubject] = useState(
    `📊 Rapport de Performance & Reach — Bylz (${reportData.periodLabel})`
  );
  const [customNote, setCustomNote] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  // In-modal Resend Key setup state
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [resendApiKey, setResendApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  const getReportPlainText = () => {
    return `Bonjour,

Voici le rapport officiel de portée et de visibilité (Reach) pour Bylz sur la période : ${reportData.periodLabel}.

${customNote ? `${customNote}\n\n` : ""}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÉSUMÉ EXÉCUTIF DU REACH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Portée globale (Visiteurs uniques) : ${reportData.totalReach.toLocaleString("fr-FR")} (${reportData.growthRate >= 0 ? "+" : ""}${reportData.growthRate}% vs période précédente)
• Impressions de recherche Google : ${reportData.totalImpressions.toLocaleString("fr-FR")}
• Clics & Visites directes : ${reportData.totalClicks.toLocaleString("fr-FR")}
• Nouveaux Prospects & Leads collectés : ${reportData.totalLeads.toLocaleString("fr-FR")}
• Taux de conversion Visiteurs ➔ Leads : ${reportData.conversionRate}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOP CONTENUS LES PLUS VUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${reportData.topPages.slice(0, 4).map((p, i) => `${i + 1}. ${p.title} (${p.page}) — ${p.views.toLocaleString("fr-FR")} visites (${p.percentage}%)`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANAUX D'ACQUISITION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${reportData.acquisitionChannels.map((c) => `• ${c.label} : ${c.percentage}% (${c.count.toLocaleString("fr-FR")})`).join("\n")}

Consultez le cockpit complet en direct sur : https://bylz.fr/admin/reach
`;
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(getReportPlainText());
      setCopied(true);
      toast("Rapport copié dans le presse-papier !", "success");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast("Impossible de copier automatiquement dans le presse-papier.", "warning");
    }
  };

  const handleSaveResendKey = async () => {
    const key = resendApiKey.trim();
    if (!key.startsWith("re_")) {
      toast("La clé API Resend doit commencer par 're_'.", "warning");
      return;
    }

    setSavingKey(true);
    try {
      const { error } = await supabase.from("system_settings").upsert({
        key: "resend_api_key",
        value: key,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast("Clé API Resend enregistrée avec succès !", "success");
      setShowKeyConfig(false);
      setResendApiKey("");
    } catch (err: any) {
      toast(err.message || "Erreur lors de l'enregistrement de la clé.", "danger");
    } finally {
      setSavingKey(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !recipient.includes("@")) {
      toast("Veuillez saisir une adresse email valide.", "warning");
      return;
    }

    setSending(true);

    try {
      const bodyText = getReportPlainText();

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: recipient.trim(),
          subject: subject.trim(),
          body: bodyText,
          document_type: "support",
          document_id: "none",
        },
      });

      if (error) {
        let msg = error.message;
        try {
          if ((error as any).context && typeof (error as any).context.json === "function") {
            const json = await (error as any).context.json();
            if (json?.error) msg = json.error;
          }
        } catch {}
        throw new Error(msg);
      }

      toast(`Rapport envoyé avec succès à ${recipient} !`, "success");
      onClose();
    } catch (err: any) {
      console.error("Error sending reach report email:", err);
      const msg = err?.message || "Impossible d'envoyer l'e-mail.";
      toast(msg, "danger");

      // If missing Resend key, suggest opening the config
      if (msg.toLowerCase().includes("resend") || msg.toLowerCase().includes("clé")) {
        setShowKeyConfig(true);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 space-y-5 text-white max-w-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Envoyer le Rapport de Reach
              </h3>
              <p className="text-xs text-slate-400">
                Synthèse exécutive envoyée par e-mail ou copiable
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Adresse e-mail du destinataire
            </label>
            <Input
              type="email"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="client@exemple.com"
              className="bg-slate-900 border-slate-700 text-sm text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Objet du message
            </label>
            <Input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-slate-900 border-slate-700 text-sm text-white font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Commentaire ou note personnalisée (optionnel)
            </label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ex: Bonjour, voici les chiffres clés de visibilité Bylz pour ce mois-ci..."
              className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-xs text-white placeholder:text-slate-500 focus:border-rose-500 focus:outline-none resize-none"
            />
          </div>

          {/* Quick Metrics Preview Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Aperçu des données envoyées</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                {reportData.periodLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Portée / Visiteurs</div>
                <div className="font-bold text-white font-mono text-sm">
                  {reportData.totalReach.toLocaleString("fr-FR")}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Impressions Google</div>
                <div className="font-bold text-amber-400 font-mono text-sm">
                  {reportData.totalImpressions.toLocaleString("fr-FR")}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Clics du site</div>
                <div className="font-bold text-rose-400 font-mono text-sm">
                  {reportData.totalClicks.toLocaleString("fr-FR")}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Leads Capturés</div>
                <div className="font-bold text-emerald-400 font-mono text-sm">
                  {reportData.totalLeads.toLocaleString("fr-FR")} ({reportData.conversionRate}%)
                </div>
              </div>
            </div>
          </div>

          {/* Optional In-Modal Resend API Key Setup */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-semibold transition-colors"
            >
              <KeyRound className="w-3 h-3 text-rose-400" />
              <span>Configurer ou mettre à jour la clé API Resend</span>
              {showKeyConfig ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </button>

            {showKeyConfig && (
              <div className="mt-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Collez votre clé Resend valide (commençant par <code className="text-emerald-400 font-mono">re_</code>) pour activer l'envoi d'e-mails :
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    placeholder="re_123456789..."
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-xs font-mono text-white h-8"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveResendKey}
                    loading={savingKey}
                    className="h-8 text-xs font-bold border-slate-700 text-emerald-400 hover:bg-slate-900 flex-shrink-0"
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyReport}
              leftIcon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
            >
              {copied ? "Rapport copié !" : "Copier le rapport"}
            </Button>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={sending}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={sending}
                leftIcon={<Send className="w-4 h-4" />}
                className="bylz-glow-cta text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Envoyer par email
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
