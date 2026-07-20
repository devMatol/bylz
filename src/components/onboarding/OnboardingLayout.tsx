import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";

interface OnboardingLayoutProps {
  step: 1 | 2 | 3;
  onBack?: () => void;
  wide?: boolean;
  children: ReactNode;
}

const STEP_PERCENTS: Record<1 | 2 | 3, string> = {
  1: "33%",
  2: "66%",
  3: "100%",
};

export function OnboardingLayout({ step, onBack, wide = false, children }: OnboardingLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const email = user?.email || "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 py-10">
      <div className={cn("w-full transition-[max-width] duration-500 ease-in-out", wide ? "max-w-[960px]" : "max-w-[560px]")}>
        <div
          className={cn(
            "sticky top-0 z-50 -mx-4 px-4 pt-2 pb-3 mb-4 bg-bg/80 backdrop-blur-md transition-shadow duration-200",
            scrolled ? "shadow-[0_1px_0_0_var(--border)]" : ""
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-bold text-text">Bylz</span>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted hover:text-text transition-colors"
              >
                <span className="max-w-[160px] truncate">{email}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-card shadow-lg p-1 min-w-[160px] z-50">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-text hover:bg-surface-hover transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="h-1 w-full rounded-full bg-border overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: STEP_PERCENTS[step] }}
            />
          </div>
          <p className="text-center text-xs text-muted">
            Étape {step} sur 3
          </p>
        </div>

        <div className="bg-surface border border-border rounded-card p-8 shadow-xl relative">
          {onBack && step > 1 && (
            <button
              onClick={onBack}
              className="absolute top-6 left-6 text-sm text-muted hover:text-text transition-colors flex items-center gap-1"
            >
              ← Retour
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
