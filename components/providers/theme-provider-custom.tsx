"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

const defaultThemes: Record<string, Theme> = {
  default: {
    name: "Padrão",
    colors: {
      primary: "#0066ff",
      secondary: "#6366f1",
      success: "#10b981",
      warning: "#f59e0b",
      danger: "#ef4444",
      info: "#0ea5e9"
    }
  },
  ocean: {
    name: "Oceano",
    colors: {
      primary: "#0369a1",
      secondary: "#0284c7",
      success: "#059669",
      warning: "#d97706",
      danger: "#dc2626",
      info: "#0891b2"
    }
  },
  forest: {
    name: "Floresta",
    colors: {
      primary: "#15803d",
      secondary: "#16a34a",
      success: "#22c55e",
      warning: "#ca8a04",
      danger: "#dc2626",
      info: "#0f766e"
    }
  },
  sunset: {
    name: "Pôr do Sol",
    colors: {
      primary: "#ea580c",
      secondary: "#f97316",
      success: "#84cc16",
      warning: "#eab308",
      danger: "#dc2626",
      info: "#f43f5e"
    }
  }
};

interface ThemeContextType {
  currentTheme: Theme;
  currentThemeKey: string;
  themes: Record<string, Theme>;
  setTheme: (themeName: string) => void;
  createCustomTheme: (name: string, colors: ThemeColors) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function hexToRgb(hex: string) {
  const sanitized = hex.replace("#", "");
  const normalized = sanitized.length === 3 ? sanitized.split("").map((char) => char + char).join("") : sanitized;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function alpha(hex: string, opacity: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function shade(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const next = (value: number) => Math.max(0, Math.min(255, Math.round(value + (255 - value) * amount)));
  return `rgb(${next(r)}, ${next(g)}, ${next(b)})`;
}

export function CustomThemeProvider({ children, defaultTheme = "default" }: { children: React.ReactNode; defaultTheme?: string }) {
  const [themes, setThemes] = useState<Record<string, Theme>>(defaultThemes);
  const [currentThemeName, setCurrentThemeName] = useState(defaultTheme);

  const currentTheme = useMemo(() => themes[currentThemeName] || themes.default, [currentThemeName, themes]);

  useEffect(() => {
    const root = document.documentElement;
    const { primary, secondary, success, warning, danger, info } = currentTheme.colors;

    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-hover", shade(primary, -0.12));
    root.style.setProperty("--primary-soft", alpha(primary, 0.12));
    root.style.setProperty("--secondary", secondary);
    root.style.setProperty("--secondary-hover", shade(secondary, -0.08));
    root.style.setProperty("--success", success);
    root.style.setProperty("--success-soft", alpha(success, 0.12));
    root.style.setProperty("--warning", warning);
    root.style.setProperty("--warning-soft", alpha(warning, 0.12));
    root.style.setProperty("--danger", danger);
    root.style.setProperty("--danger-soft", alpha(danger, 0.12));
    root.style.setProperty("--info", info);
    root.style.setProperty("--info-soft", alpha(info, 0.12));
    root.style.setProperty("--icon-active", primary);

    localStorage.setItem("preferred-theme", currentThemeName);
  }, [currentTheme, currentThemeName]);

  useEffect(() => {
    const saved = localStorage.getItem("preferred-theme");
    if (saved && themes[saved]) {
      setCurrentThemeName(saved);
    }
  }, [themes]);

  const setTheme = (themeName: string) => {
    if (themes[themeName]) {
      setCurrentThemeName(themeName);
    }
  };

  const createCustomTheme = (name: string, colors: ThemeColors) => {
    const key = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!key) return;
    setThemes((prev) => ({ ...prev, [key]: { name, colors } }));
    setCurrentThemeName(key);
  };

  return <ThemeContext.Provider value={{ currentTheme, currentThemeKey: currentThemeName, themes, setTheme, createCustomTheme }}>{children}</ThemeContext.Provider>;
}

export function useCustomTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useCustomTheme must be used within CustomThemeProvider");
  }
  return context;
}

export function ThemeSelector() {
  const { currentThemeKey, currentTheme, themes, setTheme } = useCustomTheme();

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[var(--text-primary)]">Tema de acento</label>
      <select value={currentThemeKey} onChange={(e) => setTheme(e.target.value)} className="select-base text-sm outline-none">
        {Object.entries(themes).map(([key, theme]) => (
          <option key={key} value={key}>
            {theme.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Object.entries(currentTheme.colors).map(([key, color]) => (
          <div key={key} className="space-y-1">
            <div className="h-11 rounded-[var(--radius-control)] border" style={{ backgroundColor: color, borderColor: "var(--border)" }} />
            <p className="text-[11px] font-medium capitalize text-[var(--text-tertiary)]">{key}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
