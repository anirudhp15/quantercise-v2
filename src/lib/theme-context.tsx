"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "student" | "teacher";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("student");

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("theme", theme);
    // Update CSS variables based on theme
    const root = document.documentElement;
    if (theme === "teacher") {
      root.style.setProperty("--primary", "#FFFFFF"); // blue-400
      root.style.setProperty("--accent", "#1e40af"); // blue-800
      root.style.setProperty("--muted", "#1e3a8a"); // blue-900
    } else {
      root.style.setProperty("--primary", "#FFFFFF"); // green-300
      root.style.setProperty("--accent", "#374151"); // gray-700
      root.style.setProperty("--muted", "#374151"); // gray-700
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
