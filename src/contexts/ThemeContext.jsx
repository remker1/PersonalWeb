import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext();

const DAY_MODE_KEY = "pw_day_mode";

function getThemeByTime() {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 18) ? "light" : "dark";
}

export function ThemeProvider({ children }) {
  const [dayMode, setDayMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(DAY_MODE_KEY) || "auto";
    }
    return "auto";
  });

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const mode = localStorage.getItem(DAY_MODE_KEY) || "auto";
      if (mode === "auto") return getThemeByTime();
      return mode;
    }
    return "dark";
  });

  useEffect(() => {
    if (dayMode !== "auto") return;
    const check = () => setTheme(getThemeByTime());
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [dayMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  const setDayModeValue = useCallback((mode) => {
    setDayMode(mode);
    localStorage.setItem(DAY_MODE_KEY, mode);
    if (mode === "auto") {
      setTheme(getThemeByTime());
    } else {
      setTheme(mode);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setDayModeValue(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, dayMode, setDayMode: setDayModeValue }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
