import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'theme';
const THEMES = ['classic', 'dark', 'light'];

const ThemeContext = createContext({
  theme: 'classic',
  setTheme: () => {},
  cycleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES.includes(saved) ? saved : 'classic';
  });

  const setTheme = (next) => {
    const value = THEMES.includes(next) ? next : 'classic';
    setThemeState(value);
    localStorage.setItem(THEME_KEY, value);
  };

  const cycleTheme = () => {
    const idx = THEMES.indexOf(theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme) {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, cycleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
