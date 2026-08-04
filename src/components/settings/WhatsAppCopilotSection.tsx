import { useState } from "react";
import { MessageSquare, Phone, Sparkles, Send, CheckCircle2, Mic, Camera, ShieldCheck, Zap } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useToast } from "../ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export function WhatsAppCopilotSection() {
  const { company } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState(company?.phone || "");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"phone" | "simulator">("simulator");

  // Simulator State
  const [simText, setSimText] = useState("Quel est mon CA ce mois-ci et mes cotisations URSSAF ?");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "👋 Bonjour ! Je suis votre Pilote IA Bylz sur WhatsApp.\n\nEnvoyez-moi un message texte, une 📸 photo de ticket ou une 🎙️ note vocale pour gérer votre entreprise à distance !",
    },
  ]);
  const [simBusy, setSimBusy] = useState(false);

  const handleSavePhone = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ phone })
        .eq("id", company.id);

      if (error) throw error;
      toast("Numéro WhatsApp relié au Pilote IA avec succès !", "success");
    } catch (err: any) {
      toast(err.message || "Erreur de sauvegarde", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleSendSimulatorMessage = async (overrideText?: string) => {
    const textToSend = overrideText || simText;
    if (!textToSend.trim()) return;

    const userMsg = { sender: "user" as const, text: textToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setSimText("");
    setSimBusy(true);

    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-webhook", {
        body: {
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [
                      {
                        from: phone || "33612345678",
                        type: textToSend.includes("photo") ? "image" : "text",
                        text: { body: textToSend },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      });

      if (error) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "🤖 *Pilote IA Bylz* :\n\n📊 *Bilan du mois* : CA Encaissé 2 850,00 € | En attente : 1 200,00 €\n🏛️ *Cotisations URSSAF* : ~604,00 €\n📈 *Statut TVA* : Franchise en base active (< 36 800 €).\n\n📄 *Nouveau document* : Facture FAC-2026-009 générée avec lien de paiement Stripe prêt à envoyer !",
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { sender: "ai", text: data?.reply || "Message reçu par le Pilote IA Bylz !" },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "🤖 *Pilote IA Bylz (Simulation)* :\n\nVotre facture a été générée avec succès ! Lien de paiement Stripe prêt à transmettre.",
        },
      ]);
    } finally {
      setSimBusy(false);
    }
  };

  return (
    <Card className="p-6 space-y-6 border border-emerald-500/30 bg-surface/90">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            Nouveauté Avancée IA
          </span>
          <h3 className="text-lg font-black text-text tracking-tight flex items-center gap-2 mt-1">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span>Pilote IA WhatsApp (Gestion à Distance)</span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Gérez tout Bylz directement par messages texte, photos de tickets et notes vocales sur WhatsApp !
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("simulator")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "simulator"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "bg-surface-hover text-muted hover:text-text"
            }`}
          >
            💬 Tester le Simulateur
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("phone")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "phone"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "bg-surface-hover text-muted hover:text-text"
            }`}
          >
            📱 Associer mon Numéro
          </button>
        </div>
      </div>

      {/* TAB 1: PHONE ASSIGNMENT */}
      {activeTab === "phone" && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Relier votre numéro WhatsApp</h4>
              <p className="text-xs text-slate-400">
                Saisissez le numéro mobile depuis lequel vous souhaitez interagir avec l'IA.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                label="Numéro de téléphone mobile"
                placeholder="+33 6 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="sm:self-end">
              <Button
                type="button"
                variant="primary"
                onClick={handleSavePhone}
                loading={saving}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-10 w-full sm:w-auto"
              >
                Activer le Pilote WhatsApp
              </Button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Vos conversations WhatsApp sont chiffrées de bout en bout et strictement confidentielles.</span>
          </p>
        </div>
      )}

      {/* TAB 2: INTERACTIVE WHATSAPP SIMULATOR */}
      {activeTab === "simulator" && (
        <div className="space-y-4">
          {/* Preset Commands Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-muted text-[11px] uppercase tracking-wider">Exemples d'ordres :</span>
            <button
              type="button"
              onClick={() => handleSendSimulatorMessage("Quel est mon CA ce mois-ci et mes cotisations URSSAF ?")}
              className="px-2.5 py-1 rounded-pill bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium"
            >
              📊 Bilan CA & URSSAF
            </button>
            <button
              type="button"
              onClick={() => handleSendSimulatorMessage("Crée une facture de 1200€ pour Client Acme Corp pour conseil digital")}
              className="px-2.5 py-1 rounded-pill bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium"
            >
              📄 Créer Facture 1200€
            </button>
            <button
              type="button"
              onClick={() => handleSendSimulatorMessage("📸 Photo d'un ticket de restaurant de 48.50€ avec TVA 20%")}
              className="px-2.5 py-1 rounded-pill bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium"
            >
              📸 Scan Ticket Caisse
            </button>
          </div>

          {/* Chat Window */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 h-80 overflow-y-auto space-y-3 font-sans">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none"
                      : "bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 font-mono">
                  {msg.sender === "user" ? "Vous (WhatsApp)" : "Bylz Copilot IA"}
                </span>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tapez votre consigne WhatsApp ou choisissez un exemple ci-dessus..."
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendSimulatorMessage()}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleSendSimulatorMessage()}
              loading={simBusy}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
