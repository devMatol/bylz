import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function FactPulseTokenBanner() {
  const [isTokenValid, setIsTokenValid] = useState<boolean>(true);
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("factpulse_status")
        .select("token_valid")
        .eq("id", "default")
        .maybeSingle();

      if (!error && data) {
        setIsTokenValid(data.token_valid);
      }
    } catch (e) {
      console.warn("Error fetching factpulse_status:", e);
    }
  };

  useEffect(() => {
    void checkStatus();
  }, []);

  const handleTestToken = async () => {
    setChecking(true);
    try {
      await supabase.functions.invoke("check-factpulse-token");
      await checkStatus();
    } catch (e) {
      console.error("Error invoking check-factpulse-token:", e);
    } finally {
      setChecking(false);
    }
  };

  if (isTokenValid) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white px-4 py-2.5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 z-[9998] border-b border-amber-700 text-xs font-semibold">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-200 flex-shrink-0 animate-pulse" />
        <span>
          <strong>⚠️ Token FactPulse expiré</strong> — Régénérez votre token sur le dashboard FactPulse et mettez à jour le secret <code className="font-mono bg-black/30 px-1 py-0.5 rounded">FACTPULSE_API_TOKEN</code>.
        </span>
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0">
        <a
          href="https://factpulse.fr/api/dashboard/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 bg-black/20 hover:bg-black/40 text-white px-2.5 py-1 rounded text-[11px] font-bold border border-white/20 transition-colors"
        >
          <span>Dashboard FactPulse</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <button
          type="button"
          onClick={handleTestToken}
          disabled={checking}
          className="inline-flex items-center space-x-1 bg-white text-slate-900 hover:bg-amber-100 px-2.5 py-1 rounded text-[11px] font-bold transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
          <span>Tester à nouveau</span>
        </button>
      </div>
    </div>
  );
}
