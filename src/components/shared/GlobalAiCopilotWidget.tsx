import { useState } from "react";
import { Bot, X, Sparkles, Send, Mic, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { canUseFeature } from "../../lib/planLimits";

export function GlobalAiCopilotWidget() {
  const { profile, company } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: `Bonjour ${company?.legal_name || ""} ! Comment puis-je vous aider ? (ex: "Créer une facture de 400€ pour Client X", "Quel est mon CA ?")`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const isPro = canUseFeature(profile?.plan, "paymentLinks");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    setTimeout(() => {
      const lower = userText.toLowerCase();
      let reply = "";
      if (lower.includes("facture") && (lower.includes("crée") || lower.includes("creer") || lower.includes("fait"))) {
        reply = "📄 Brouillon de facture prêt ! Répondez OUI pour émettre la facture ou NON pour annuler.";
      } else if (lower.includes("ca") || lower.includes("chiffre")) {
        reply = "📊 Votre CA encaissé s'élève à 3 300,00 €.";
      } else {
        reply = "🤖 Je suis votre assistant IA ! Posez-moi une question ou ouvrez l'onglet Assistant IA complet.";
      }
      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
      setLoading(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 p-3 bg-accent text-accent-foreground rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2 font-bold text-xs border border-accent/40"
        title="Ouvrir l'Assistant IA Bylz Copilot"
      >
        <Bot className="w-5 h-5 text-accent-foreground" />
        <span className="hidden sm:inline">Copilot IA</span>
        <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-bg/30 text-accent-foreground rounded-md">PRO ⚡</span>
      </button>

      {/* Floating Quick Modal */}
      {open && (
        <div className="fixed bottom-36 md:bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] h-[460px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
                🤖
              </div>
              <div>
                <h4 className="text-xs font-bold text-text flex items-center gap-1.5">
                  Bylz Copilot IA
                  <span className="px-1.5 py-0.2 text-[9px] bg-accent text-accent-foreground rounded-md font-extrabold">PRO ⚡</span>
                </h4>
                <p className="text-[10px] text-muted">En ligne & connecté</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/assistant"
                onClick={() => setOpen(false)}
                className="p-1.5 text-muted hover:text-text rounded-lg transition-colors"
                title="Plein écran"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-muted hover:text-text rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-bg/30 text-xs">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed ${
                    m.sender === "user"
                      ? "bg-accent text-accent-foreground rounded-tr-none font-medium"
                      : "bg-card border border-border text-text rounded-tl-none whitespace-pre-line shadow-2xs"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <Sparkles className="w-3.5 h-3.5 text-accent animate-spin" /> Réfléchit...
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-2.5 bg-card border-t border-border flex items-center gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question..."
              className="flex-1 bg-muted/40 text-text placeholder:text-muted border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-accent text-accent-foreground rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
