"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ThemeId, ThemeTokens } from "./themeTokens";
import { THEMES, THEME_LIST } from "./themeTokens";

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  tokens: ThemeTokens;
  themes: ThemeId[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "木色",
  setTheme: () => {},
  tokens: THEMES["木色"],
  themes: THEME_LIST,
});

export function ThemeProvider({
  children,
  defaultTheme = "木色",
}: {
  children: React.ReactNode;
  defaultTheme?: ThemeId;
}) {
  const [theme, setThemeState] = useState<ThemeId>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("yuting-theme", t);
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    let initial: ThemeId = defaultTheme;
    try {
      const saved = localStorage.getItem("yuting-theme") as ThemeId | null;
      if (saved && THEMES[saved]) {
        initial = saved;
      }
    } catch {
      // localStorage unavailable
    }
    document.documentElement.setAttribute("data-theme", initial);
    setThemeState(initial);
    setMounted(true);
  }, [defaultTheme]);

  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{ theme: defaultTheme, setTheme, tokens: THEMES[defaultTheme], themes: THEME_LIST }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, tokens: THEMES[theme], themes: THEME_LIST }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
