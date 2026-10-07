import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { guardarTema, leerTema, type Tema } from '@/services/storage/preferencias';

interface ThemeContextValue {
  theme: Tema;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Tema>(leerTema);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    guardarTema(theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
