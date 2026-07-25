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
