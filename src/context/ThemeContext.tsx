import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type ThemeContextType = { dark: boolean; toggle: () => void };

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('acil-theme', 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ dark: false, toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
