import { useEffect, useState, useCallback } from "react";

type Theme = "dark" | "light";

export const THEME_STORAGE_KEY_V2 = "bylz-theme-v2";
const LEGACY_STORAGE_KEY = "bylz-theme";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const storedV2 = window.localStorage.getItem(THEME_STORAGE_KEY_V2);
    if (storedV2 === "light" || storedV2 === "dark") {
      return storedV2;
    }
    // Migration unique vers clair : l'ancien défaut avait écrit "bylz-theme=dark".
    // On migre une seule fois vers "light" dans la clé versionnée v2,
    // puis tout choix explicite fait ensuite avec le bouton est persisté et respecté.
    window.localStorage.setItem(THEME_STORAGE_KEY_V2, "light");
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
}

// Initialisation immédiate au chargement du module pour éviter tout flash sombre
if (typeof window !== "undefined") {
  applyTheme(getInitialTheme());
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY_V2, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
