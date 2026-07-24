import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../ui/Toast";

export function FactPulseModeToggle() {
  const [mode, setMode] = useState<"sandbox" | "production">("sandbox");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchMode = async () => {
    try {
      const { data, error } = await supabase
        .from("factpulse_status")
        .select("mode")
        .eq("id", "default")
        .maybeSingle();

      if (!error && data && data.mode) {
        setMode(data.mode === "production" ? "production" : "sandbox");
      }
    } catch (e) {
      console.warn("Could not fetch factpulse_status mode:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMode();
  }, []);

  const handleToggleMode = async (newMode: "sandbox" | "production") => {
    if (newMode === mode || updating) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from("factpulse_status")
        .upsert({
          id: "default",
          mode: newMode,
          last_checked_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMode(newMode);
      if (newMode === "sandbox") {
        toast("🛡️ Mode Test Sandbox activé : toutes les transmissions sont simulées (0 envoi DGFiP).", "info");
      } else {
        toast("🔴 Mode Production Réel activé : les transmissions seront envoyées officiellement à la DGFiP.", "warning");
      }
    } catch (e: any) {
      toast(e?.message || "Impossible de mettre à jour le mode.", "danger");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-xs text-slate-400 py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
        <span>Chargement de la configuration PDP...</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-card p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
            Mode d'exécution PDP / DGFiP
          </h4>
        </div>
        <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-pill bg-slate-800 text-slate-300 border border-slate-700">
          Super Admin
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Contrôle global du mode de transmission des factures B2B à la plateforme FactPulse et à l'administration fiscale (DGFiP).
      </p>

      {/* Illuminated Toggle Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleToggleMode("sandbox")}
          disabled={updating}
          className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-card text-xs font-bold transition-all duration-200 border ${
            mode === "sandbox"
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/30"
              : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${mode === "sandbox" ? "text-emerald-400" : "text-slate-500"}`} />
          <div className="text-left">
            <div className="leading-none">Mode Test Sandbox</div>
            <div className="text-[9px] font-normal text-emerald-400/80 mt-0.5">0 envoi DGFiP (Sécurisé)</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleToggleMode("production")}
          disabled={updating}
          className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-card text-xs font-bold transition-all duration-200 border ${
            mode === "production"
              ? "bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-lg shadow-rose-950/50 ring-2 ring-rose-500/30"
              : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${mode === "production" ? "text-rose-400" : "text-slate-500"}`} />
          <div className="text-left">
            <div className="leading-none">Mode Production</div>
            <div className="text-[9px] font-normal text-rose-400/80 mt-0.5">Envois réels DGFiP</div>
          </div>
        </button>
      </div>
    </div>
  );
}
