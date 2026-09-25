"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/** Mundoria is light-branded only — dark mode is not supported. */
export type ThemeMode = "light";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const THEME_KEY = "mundoria-theme";

function forceLightDocument() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    forceLightDocument();
    try {
      // Migrate any leftover dark / system preference to light.
      const saved = window.localStorage.getItem(THEME_KEY);
      if (saved && saved !== "light") {
        window.localStorage.setItem(THEME_KEY, "light");
      }
    } catch {
      // Ignore storage errors.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    forceLightDocument();
  }, [ready]);

  const setTheme = (_mode: ThemeMode) => {
    forceLightDocument();
    try {
      window.localStorage.setItem(THEME_KEY, "light");
    } catch {
      // Ignore storage errors.
    }
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: "light", resolvedTheme: "light", setTheme }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
