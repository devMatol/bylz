import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../lib/constants";
import { cn } from "../../lib/utils";

export function BottomNav() {
  const mainItems = NAV_ITEMS.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-sidebar border-t border-border flex items-center justify-around z-30 h-16">
      {mainItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors",
                isActive ? "text-primary" : "text-muted"
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span className="truncate max-w-full px-1">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
