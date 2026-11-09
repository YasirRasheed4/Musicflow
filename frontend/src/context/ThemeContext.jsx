import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export const THEMES = [
  {
    id: "obsidian",
    name: "Obsidian Slate",
    subtitle: "Modern deep slate & electric emerald",
    icon: "🌌",
    accentColor: "#10B981",
    bgPreview: "#0B0F17",
    cardPreview: "#111827",
  },
  {
    id: "oled",
    name: "Midnight OLED",
    subtitle: "Pure pitch black with vibrant neon",
    icon: "🌑",
    accentColor: "#06B6D4",
    bgPreview: "#000000",
    cardPreview: "#0D0D0D",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    subtitle: "Deep violet & electric magenta",
    icon: "⚡",
    accentColor: "#F43F5E",
    bgPreview: "#0D0B18",
    cardPreview: "#171226",
  },
  {
    id: "light",
    name: "Studio Light",
    subtitle: "Clean executive minimalist light",
    icon: "☀️",
    accentColor: "#6366F1",
    bgPreview: "#F8FAFC",
    cardPreview: "#FFFFFF",
  },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("musicflow_theme") || "obsidian";
  });

  useEffect(() => {
    const root = document.documentElement;
    THEMES.forEach((t) => root.classList.remove(`theme-${t.id}`));
    root.classList.add(`theme-${theme}`);
    localStorage.setItem("musicflow_theme", theme);
  }, [theme]);

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex((t) => t.id === theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex].id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
