import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) return stored;

    // Si no hay tema guardado, usar system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [isDark, setIsDark] = useState(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        setIsDark(mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;

    // Aplicar clases de Tailwind
    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');

    // Aplicar clases adicionales para mejor compatibilidad
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Guardar preferencia
    localStorage.setItem('theme', theme);
  }, [theme, isDark]);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      setIsDark(true);
    } else if (theme === 'dark') {
      setTheme('system');
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      setTheme('light');
      setIsDark(false);
    }
  };

  const setThemeMode = (newTheme: Theme) => {
    setTheme(newTheme);
    if (newTheme === 'system') {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      setIsDark(newTheme === 'dark');
    }
  };

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme: setThemeMode,
    themeIcon: theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🖥️'
  };
};
