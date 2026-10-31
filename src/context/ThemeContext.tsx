import React, { createContext, useContext, useEffect, type ReactNode } from 'react';

type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme: Theme = 'light';

  useEffect(() => {
    try {
      localStorage.setItem('xpenser_theme', 'light');
    } catch {
      // ignore
    }

    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark-mode');
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-bs-theme', 'light');
  }, []);

  const toggleTheme = () => {
    // Light mode only - dark mode removed per user request
  };

  const setTheme = () => {
    // Light mode only - dark mode removed per user request
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: false, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
