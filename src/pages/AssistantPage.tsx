import { useState, useEffect } from "react";
import { SEO } from "../components/seo/SEO";
import { PageContainer } from "../components/layout/PageContainer";
import { useAuth } from "../contexts/AuthContext";
import { canUseFeature } from "../lib/planLimits";
import { supabase } from "../lib/supabase";
import { WHATSAPP_BOT_LINK } from "../lib/constants";
import { UpgradeModal } from "../components/shared/UpgradeModal";
import { useToast } from "../components/ui/Toast";
import { Bot, Send, Mic, MessageSquare, Sparkles, CheckCircle2, ShieldCheck, QrCode, Phone, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function AssistantPage() {
  const { profile, company, user } = useAuth();
  const { toast } = useToast();
  const [phoneInput, setPhoneInput] = useState(company?.phone || "");
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    if (company?.phone) {
      setPhoneInput(company.phone);
    }
  }, [company?.phone]);

  const handleActivateWhatsApp = async () => {
    if (!phoneInput.trim()) {
      toast("Veuillez saisir votre numéro de téléphone mobile.", "warning");
      return;
    }
    setSavingPhone(true);
    try {
      const clean = phoneInput.trim();
      if (company?.id) {
        await supabase.from("companies").update({ phone: clean }).eq("id", company.id);
      }
      if (user?.id) {
        await supabase.from("profiles").update({ phone: clean }).eq("id", user.id);
      }
      toast("Numéro WhatsApp relié et Pilote IA activé avec succès !", "success");
      window.open(WHATSAPP_BOT_LINK, "_blank");
    } catch (err: any) {
      toast(err.message || "Erreur lors de la liaison du numéro", "danger");
    } finally {
      setSavingPhone(false);
    }
  };
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string; time: string }>>([
    {
      sender: "ai",
      text: `👋 Bonjour ${company?.legal_name || ""} ! Je suis votre assistant IA Bylz Copilot.\n\nJe peux générer vos factures, calculer votre URSSAF, vérifier votre CA ou répondre à vos questions par texte ou à la voix !`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const isPro =
    profile?.is_admin === true ||
    profile?.admin_role === "super_admin" ||
    profile?.plan === "pro" ||
    (profile?.plan as string) === "unlimited" ||
    (profile?.plan as string) === "admin";

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    if (!isPro) {
      setUpgradeModalOpen(true);
      return;
    }

    const userText = input.trim();
    setInput("");
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [...prev, { sender: "user", text: userText, time: userTime }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-webhook", {
        body: {
          text: userText,
          company_id: company?.id,
          is_web_client: true,
        },
      });

      const reply = data?.reply || (error ? `⚠️ Erreur: ${error.message}` : "🤖 Désolé, l'assistant n'a pas pu traiter votre demande.");

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `⚠️ Une erreur s'est produite: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Assistant IA (Bylz Copilot)"
      subtitle="Pilotez votre facturation et votre fiscalité par texte, à la voix ou via WhatsApp"
    >
      <SEO title="Assistant IA Copilot | Bylz" canonical="/assistant" />

      {/* Upgrade Banner for Non-Pro Users */}
      {!isPro && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <div className="text-xs sm:text-sm font-medium">
              L'<strong>Assistant IA Copilot (Web & WhatsApp)</strong> est réservé aux abonnés <strong>PRO ⚡</strong>.
            </div>
          </div>
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            Débloquer le Plan PRO ⚡
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main AI Web Chat Panel */}
        <div className="lg:col-span-2 flex flex-col h-[620px] bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Chat Header */}
          <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text flex items-center gap-2">
                  Bylz Copilot IA
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-accent text-accent-foreground rounded-full">PRO ⚡</span>
                </h3>
                <p className="text-xs text-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  En ligne & connecté aux données de {company?.legal_name || "votre entreprise"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted bg-muted px-2.5 py-1 rounded-lg border border-border flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Données Isolées & Chiffrées
              </span>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-bg/40">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "ai" && (
                  <div className="w-8 h-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none font-medium shadow-sm"
                      : "bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-none whitespace-pre-line shadow-sm"
                  }`}
                >
                  {m.text}
                  <div
                    className={`text-[10px] mt-1.5 font-mono ${
                      m.sender === "user" ? "text-emerald-100/80 text-right" : "text-slate-400"
                    }`}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium bg-slate-900 border border-slate-800 w-max px-3 py-2 rounded-xl">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                L'IA analyse vos instructions...
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => alert("🎙️ Dictée vocale active sur WhatsApp ! Transmettez directement vos notes vocales.")}
              title="Dictée Vocale"
              className="p-2.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-all border border-emerald-500/20 shadow-xs"
            >
              <Mic className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question ou dictez : 'Créer une facture de 400€ pour Client X'..."
              className="flex-1 bg-slate-900/90 text-slate-100 placeholder:text-slate-400 border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none transition-all shadow-inner font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-40 disabled:pointer-events-none active:scale-95 border border-emerald-400/30 cursor-pointer"
            >
              <span>Envoyer</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* WhatsApp Pairing & Integration Sidebar */}
        <div className="space-y-6">
          {/* WhatsApp Copilot Card */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text">WhatsApp Copilot IA</h4>
                <p className="text-xs text-muted">Contrôle vocal 24/7 depuis votre mobile</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-3 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span>Statut du numéro :</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {company?.phone ? "Actif & Relié" : "En attente"}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted mb-1 block">Numéro de mobile WhatsApp :</label>
                <input
                  type="text"
                  placeholder="+33 6 12 34 56 78"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full bg-surface text-text font-mono text-xs px-3 py-2 rounded-lg border border-border focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleActivateWhatsApp}
                disabled={savingPhone}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Phone className="w-4 h-4" />
                {savingPhone ? "Activation..." : "Activer & Ouvrir le Pilote WhatsApp"}
              </button>
              <Link
                to="/settings"
                className="w-full py-2 px-4 bg-muted hover:bg-muted/80 text-text font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-border"
              >
                Gérer dans Paramètres
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Examples Card */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3 shadow-sm">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" /> Exemples de commandes vocales
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-bg border border-border text-muted font-medium">
                🎙️ <em>"Créé une facture de 400€ pour Client X pour de la création de site web"</em>
              </div>
              <div className="p-2.5 rounded-xl bg-bg border border-border text-muted font-medium">
                🎙️ <em>"Quel est mon chiffre d'affaires et mon URSSAF ce mois-ci ?"</em>
              </div>
              <div className="p-2.5 rounded-xl bg-bg border border-border text-muted font-medium">
                🎙️ <em>"Liste moi mes factures en retard de paiement"</em>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature="paymentLinks"
      />
    </PageContainer>
  );
}
