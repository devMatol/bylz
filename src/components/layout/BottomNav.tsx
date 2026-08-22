import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { NAV_ITEMS } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { MobileDrawer } from "./MobileDrawer";

export function BottomNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainItems = NAV_ITEMS.slice(0, 4);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-sidebar/95 backdrop-blur-xl border-t border-border flex items-center justify-around z-30 h-16 px-1">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isAssistant = item.path === "/assistant";

          if (isAssistant) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-black transition-all relative",
                    isActive ? "text-emerald-400 font-black scale-105" : "text-emerald-400/90 hover:text-emerald-300"
                  )
                }
              >
                <div className="relative p-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/30 bylz-glow-accent">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="truncate max-w-full font-black flex items-center gap-0.5">
                  Assistant IA <span className="px-1 py-0.2 text-[8px] bg-emerald-500/30 text-emerald-300 rounded font-black">PRO</span>
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-semibold transition-colors",
                  isActive ? "text-primary font-extrabold" : "text-muted hover:text-text"
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-full">{item.label}</span>
            </NavLink>
          );
        })}

        {/* 5th Tab: Plus Menu */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-semibold text-muted hover:text-text transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="truncate max-w-full">Plus</span>
        </button>
      </nav>

      {/* Slide-Over Drawer */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
