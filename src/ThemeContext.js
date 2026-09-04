import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSettings, setTheme as saveTheme, setCurrency as saveCurrency } from './storage';

export const DARK_COLORS = {
  bg: '#0F1115',
  bgSoft: '#14171D',
  card: '#1A1D24',
  cardAlt: '#20242C',
  primary: '#4F8CFF',
  primaryDark: '#3A6FDB',
  success: '#3DD68C',
  warning: '#FFB020',
  danger: '#FF5C5C',
  text: '#F5F6FA',
  textMuted: '#9AA1B1',
  border: '#2A2E38',
};

export const LIGHT_COLORS = {
  bg: '#F5F6FA',
  bgSoft: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#EEF1F6',
  primary: '#3A6FDB',
  primaryDark: '#2E58B0',
  success: '#1FA971',
  warning: '#B97600',
  danger: '#E14545',
  text: '#14171D',
  textMuted: '#6B7280',
  border: '#E1E4EA',
};
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('dark');
  const [currency, setCurrencyState] = useState('\u09f3');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setThemeName(s.theme || 'dark');
      setCurrencyState(s.currency || '\u09f3');
      setReady(true);
    })();
  }, []);

  const toggleTheme = useCallback(async () => {
    setThemeName((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      saveTheme(next);
      return next;
    });
  }, []);

  const changeCurrency = useCallback(async (symbol) => {
    setCurrencyState(symbol);
    await saveCurrency(symbol);
  }, []);

  const colors = themeName === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider
      value={{ colors, themeName, toggleTheme, currency, setCurrency: changeCurrency, ready }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useApp must be used within a ThemeProvider');
  return ctx;
}