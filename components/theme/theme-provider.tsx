"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const THEME_KEY = "cleanscape-theme";

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";

  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "dark") return "dark";
    // "light", "system", missing, or anything else → light (app default)
    if (saved === "system") {
      window.localStorage.setItem(THEME_KEY, "light");
    }
  } catch {
    // Ignore storage errors.
  }

  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [ready, theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      window.localStorage.setItem(THEME_KEY, mode);
    } catch {
      // Ignore storage errors (incognito / blocked cookies).
    }
    document.documentElement.classList.toggle("dark", mode === "dark");
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme: theme, setTheme }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
