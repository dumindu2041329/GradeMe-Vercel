import { createContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system" | "time-based";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentAppearance: "dark" | "light";
};

export const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18; // Dark from 6pm to 6am
}

export function ThemeProvider({
  children,
  defaultTheme = "time-based",
  storageKey = "grademe-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [currentAppearance, setCurrentAppearance] = useState<"dark" | "light">("dark");
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      setCurrentAppearance(systemTheme);
    } else if (theme === "time-based") {
      const timeBasedTheme = isNightTime() ? "dark" : "light";
      root.classList.add(timeBasedTheme);
      setCurrentAppearance(timeBasedTheme);
    } else {
      root.classList.add(theme);
      setCurrentAppearance(theme);
    }
  }, [theme]);

  // Update theme every hour for time-based theme
  useEffect(() => {
    if (theme !== "time-based") return;

    const updateTimeBasedTheme = () => {
      const root = window.document.documentElement;
      const timeBasedTheme = isNightTime() ? "dark" : "light";
      
      root.classList.remove("light", "dark");
      root.classList.add(timeBasedTheme);
      setCurrentAppearance(timeBasedTheme);
    };

    const interval = setInterval(() => {
      updateTimeBasedTheme();
    }, 60 * 60 * 1000); // Check every hour

    // Initial check
    updateTimeBasedTheme();

    return () => clearInterval(interval);
  }, [theme]);

  const value = {
    theme,
    currentAppearance,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
