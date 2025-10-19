import { useState, useEffect } from 'react';

export type ThemeMode = 'default' | 'classic';

interface ThemeColors {
  positive: string;
  negative: string;
  positiveBg: string;
  negativeBg: string;
}

const THEME_MODE_KEY = 'theme:mode';

export function useThemeMode() {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_MODE_KEY);
    return (saved as ThemeMode) || 'default';
  });

  useEffect(() => {
    localStorage.setItem(THEME_MODE_KEY, themeMode);
  }, [themeMode]);

  const getColors = (): ThemeColors => {
    if (themeMode === 'classic') {
      return {
        positive: 'hsl(var(--positive))',
        negative: 'hsl(var(--negative))',
        positiveBg: 'hsl(var(--positive) / 0.1)',
        negativeBg: 'hsl(var(--negative) / 0.1)',
      };
    }
    
    // Default: Blue vs Gray
    return {
      positive: 'hsl(var(--primary))',
      negative: 'hsl(var(--secondary))',
      positiveBg: 'hsl(var(--primary) / 0.1)',
      negativeBg: 'hsl(var(--secondary) / 0.1)',
    };
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  return {
    themeMode,
    setThemeMode,
    colors: getColors(),
    isClassic: themeMode === 'classic',
  };
}
