import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded flex items-center justify-center text-muted hover:text-text hover:bg-surface-hover transition-colors"
      aria-label={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
