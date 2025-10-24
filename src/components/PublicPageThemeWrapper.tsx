import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { PRESET_THEMES } from '@/utils/themePresets';

/**
 * PublicPageThemeWrapper - Forces dark mode and default theme colors on public pages
 * Always uses dark mode with default blue/gray theme regardless of user's saved preferences
 */
export const PublicPageThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { setTheme } = useTheme();
  
  useEffect(() => {
    // Force dark mode on all public pages
    setTheme('dark');
    
    // Force default theme colors on public pages
    const defaultTheme = PRESET_THEMES.find(t => t.id === 'default');
    
    if (defaultTheme) {
      const root = document.documentElement;
      root.style.setProperty('--primary', defaultTheme.primary);
      root.style.setProperty('--secondary', defaultTheme.secondary);
      root.style.setProperty('--accent', defaultTheme.accent);
      root.style.setProperty('--profit', defaultTheme.profit);
      root.style.setProperty('--loss', defaultTheme.loss);
      root.style.setProperty('--chart-1', defaultTheme.accent);
      root.style.setProperty('--chart-2', defaultTheme.primary);
      root.style.setProperty('--chart-3', defaultTheme.secondary);
      root.style.setProperty('--neon-green', defaultTheme.profit);
      root.style.setProperty('--neon-red', defaultTheme.loss);
    }
  }, [setTheme]);
  
  return <>{children}</>;
};
