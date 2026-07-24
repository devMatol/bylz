import { useEffect, useState } from "react";
import { CreditCard, ShieldCheck, Zap, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../ui/Toast";

export function StripeModeToggle() {
  const [stripeMode, setStripeMode] = useState<"test" | "live">("test");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchStripeMode = async () => {
    try {
      const { data, error } = await supabase
        .from("factpulse_status")
        .select("stripe_mode")
        .eq("id", "default")
        .maybeSingle();

      if (!error && data && data.stripe_mode) {
        setStripeMode(data.stripe_mode === "live" ? "live" : "test");
      }
    } catch (e) {
      console.warn("Could not fetch stripe_mode:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStripeMode();
  }, []);

  const handleToggleStripeMode = async (newMode: "test" | "live") => {
    if (newMode === stripeMode || updating) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from("factpulse_status")
        .upsert({
          id: "default",
          stripe_mode: newMode,
          last_checked_at: new Date().toISOString(),
        });

      if (error) throw error;

      setStripeMode(newMode);
      if (newMode === "test") {
        toast("🧪 Mode Test Stripe activé : utilisez les cartes 4242... (0 prélèvement bancaire).", "info");
      } else {
        toast("💳 Mode Production Live Stripe activé : les paiements par carte bleue seront réellement prélevés.", "warning");
      }
    } catch (e: any) {
      toast(e?.message || "Impossible de mettre à jour le mode Stripe.", "danger");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-xs text-slate-400 py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
        <span>Chargement de la configuration Stripe...</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-card p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
            Mode d'exécution Stripe (Paiements & Abonnements)
          </h4>
        </div>
        <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-pill bg-slate-800 text-slate-300 border border-slate-700">
          Super Admin
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Basculez entre le Mode Test (Simulations cartes 4242...) et le Mode Production (Transactions bancaires réelles).
      </p>

      {/* Illuminated Toggle Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleToggleStripeMode("test")}
          disabled={updating}
          className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-card text-xs font-bold transition-all duration-200 border ${
            stripeMode === "test"
              ? "bg-purple-950/80 text-purple-300 border-purple-500/60 shadow-lg shadow-purple-950/50 ring-2 ring-purple-500/30"
              : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${stripeMode === "test" ? "text-purple-400" : "text-slate-500"}`} />
          <div className="text-left">
            <div className="leading-none">Mode Test Stripe</div>
            <div className="text-[9px] font-normal text-purple-400/80 mt-0.5">Cartes 4242... (0€ prélevé)</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleToggleStripeMode("live")}
          disabled={updating}
          className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-card text-xs font-bold transition-all duration-200 border ${
            stripeMode === "live"
              ? "bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-950/50 ring-2 ring-amber-500/30"
              : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Zap className={`w-4 h-4 ${stripeMode === "live" ? "text-amber-400" : "text-slate-500"}`} />
          <div className="text-left">
            <div className="leading-none">Mode Production Live</div>
            <div className="text-[9px] font-normal text-amber-400/80 mt-0.5">Transactions bancaires réelles</div>
          </div>
        </button>
      </div>
    </div>
  );
}
