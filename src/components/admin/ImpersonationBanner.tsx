import { Eye, LogOut, Clock } from "lucide-react";
import { useImpersonation } from "../../contexts/ImpersonationContext";
import { Button } from "../ui/Button";

export function ImpersonationBanner() {
  const { isImpersonating, targetUser, remainingSeconds, stopImpersonation } = useImpersonation();

  if (!isImpersonating || !targetUser) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white px-4 py-2.5 shadow-2xl flex items-center justify-between gap-4 text-xs font-bold animate-in fade-in slide-in-from-top duration-200">
      <div className="flex items-center space-x-2 min-w-0">
        <Eye className="w-4 h-4 text-amber-200 animate-pulse flex-shrink-0" />
        <span className="truncate">
          🔍 Vous consultez le compte de <strong className="underline decoration-amber-300">{targetUser.email}</strong> (Mode Support & Inspection)
        </span>
      </div>

      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="flex items-center space-x-1.5 bg-black/20 px-2.5 py-1 rounded-pill border border-white/20 font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-200" />
          <span>{timeFormatted}</span>
        </div>

        <button
          type="button"
          onClick={() => void stopImpersonation()}
          className="bg-white text-rose-700 hover:bg-amber-100 font-extrabold px-3 py-1.5 rounded-pill shadow-md transition-all duration-200 flex items-center space-x-1 hover:scale-105 active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Quitter la simulation</span>
        </button>
      </div>
    </div>
  );
}
