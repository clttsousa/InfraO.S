"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type OrdersDensity = "comfortable" | "compact";
export type DashboardCardsMode = "expanded" | "compact";

export type SystemPreferences = {
  ordersDensity: OrdersDensity;
  dashboardCardsMode: DashboardCardsMode;
  showCommandPaletteHint: boolean;
  emphasizeOperationalAlerts: boolean;
};

const STORAGE_KEY = "infraos:system-preferences";

const defaultPreferences: SystemPreferences = {
  ordersDensity: "comfortable",
  dashboardCardsMode: "expanded",
  showCommandPaletteHint: true,
  emphasizeOperationalAlerts: true
};

type SystemPreferencesContextValue = {
  preferences: SystemPreferences;
  updatePreferences: (patch: Partial<SystemPreferences>) => void;
  resetPreferences: () => void;
};

const SystemPreferencesContext = createContext<SystemPreferencesContextValue | undefined>(undefined);

function parsePreferences(raw: string | null): SystemPreferences {
  if (!raw) return defaultPreferences;

  try {
    const parsed = JSON.parse(raw) as Partial<SystemPreferences>;
    return {
      ordersDensity: parsed.ordersDensity === "compact" ? "compact" : defaultPreferences.ordersDensity,
      dashboardCardsMode: parsed.dashboardCardsMode === "compact" ? "compact" : defaultPreferences.dashboardCardsMode,
      showCommandPaletteHint: typeof parsed.showCommandPaletteHint === "boolean" ? parsed.showCommandPaletteHint : defaultPreferences.showCommandPaletteHint,
      emphasizeOperationalAlerts: typeof parsed.emphasizeOperationalAlerts === "boolean" ? parsed.emphasizeOperationalAlerts : defaultPreferences.emphasizeOperationalAlerts
    };
  } catch {
    return defaultPreferences;
  }
}

export function SystemPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<SystemPreferences>(defaultPreferences);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPreferences(parsePreferences(localStorage.getItem(STORAGE_KEY)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

    const root = document.documentElement;
    root.dataset.ordersDensity = preferences.ordersDensity;
    root.dataset.dashboardCards = preferences.dashboardCardsMode;
    root.dataset.showCommandHint = preferences.showCommandPaletteHint ? "1" : "0";
    root.dataset.emphasizeAlerts = preferences.emphasizeOperationalAlerts ? "1" : "0";
  }, [hydrated, preferences]);

  const value = useMemo<SystemPreferencesContextValue>(
    () => ({
      preferences,
      updatePreferences: (patch) => setPreferences((current) => ({ ...current, ...patch })),
      resetPreferences: () => setPreferences(defaultPreferences)
    }),
    [preferences]
  );

  return <SystemPreferencesContext.Provider value={value}>{children}</SystemPreferencesContext.Provider>;
}

export function useSystemPreferences() {
  const context = useContext(SystemPreferencesContext);
  if (!context) {
    throw new Error("useSystemPreferences must be used within SystemPreferencesProvider");
  }
  return context;
}
