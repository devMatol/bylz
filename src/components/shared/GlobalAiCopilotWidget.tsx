import { useState } from "react";
import { Bot, X, Sparkles, Send, Mic, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { canUseFeature } from "../../lib/planLimits";
import { supabase } from "../../lib/supabase";
import { UpgradeModal } from "./UpgradeModal";

export function GlobalAiCopilotWidget() {
  const { profile, company } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: `Bonjour ${company?.legal_name || ""} ! Comment puis-je vous aider ? (ex: "Créer une facture de 400€ pour Client X", "Quel est mon CA ?")`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  if (dismissed) return null;

  const isPro =
    profile?.is_admin === true ||
    profile?.admin_role === "super_admin" ||
    profile?.plan === "pro" ||
    (profile?.plan as string) === "unlimited" ||
    (profile?.plan as string) === "admin";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);

    if (!isPro) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚡ *L'Assistant IA Bylz Copilot (Web & WhatsApp) est réservé aux abonnés PRO ⚡ !*\n\nPour générer vos factures à la voix, calculer vos cotisations URSSAF et piloter votre activité à distance, passez au Plan PRO !\n\n👉 Cliquez ici ou allez sur la page Tarifs pour débloquer le Plan PRO ⚡."
        }
      ]);
      setUpgradeModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-webhook", {
        body: {
          text: userText,
          company_id: company?.id,
          is_web_client: true,
        },
      });

      const reply = data?.reply || (error ? `⚠️ Error: ${error.message}` : "🤖 Désolé, l'assistant n'a pas pu traiter votre demande.");
      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { sender: "ai", text: `⚠️ Une erreur s'est produite: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button (Desktop only - hidden on mobile) */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-1.5">
        <button
          onClick={() => setOpen(!open)}
          className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-black text-xs border border-emerald-400/30 bylz-glow-accent"
          title="Ouvrir l'Assistant IA Bylz Copilot"
        >
          <Bot className="w-5 h-5 text-white" />
          <span className="hidden sm:inline tracking-wide">Copilot IA</span>
          <span className="px-1.5 py-0.5 text-[9px] font-black bg-black/30 text-emerald-200 rounded-md border border-white/10">PRO ⚡</span>
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="p-2 bg-card/90 text-muted hover:text-text rounded-full shadow-md border border-border text-xs transition-colors hover:bg-surface-hover"
          title="Masquer le bouton IA"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Copilot Modal (100% Opaque Solid - Fullscreen on Mobile, Floating on Desktop) */}
      {open && (
        <div className="fixed inset-0 md:inset-auto md:bottom-20 md:right-6 z-50 w-full h-full md:w-[380px] md:h-[480px] bg-slate-900 border-0 md:border md:border-slate-700 md:rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                🤖
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Bylz Copilot IA
                  <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md font-black">PRO ⚡</span>
                </h4>
                <p className="text-[10px] text-slate-400">En ligne & connecté</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/assistant"
                onClick={() => setOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-slate-800"
                title="Plein écran"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container (100% Solid Opaque) */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-900 text-xs">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none font-semibold shadow-md"
                      : "bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none whitespace-pre-line shadow-md"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Réfléchit...
              </div>
            )}
          </div>

          {/* Input Form Bar */}
          <form onSubmit={handleSend} className="p-3 pb-6 md:pb-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question..."
              className="flex-1 bg-slate-900 text-white placeholder:text-slate-500 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature="paymentLinks"
      />
    </>
  );
}
