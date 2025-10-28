import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { PRESET_THEMES } from '@/utils/themePresets';

/**
 * PublicPageThemeWrapper - Forces dark mode and default brand colors on public pages
 * Ensures consistent blue/gray branding across all public routes
 */
export const PublicPageThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { setTheme } = useTheme();
  
  useEffect(() => {
    // Force dark mode and default theme on all public pages
    setTheme('dark');
    
    // Force default brand colors by setting data-theme attribute
    const root = document.documentElement;
    const previousTheme = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'default');
    
    // Cleanup: restore previous theme when component unmounts
    return () => {
      if (previousTheme) {
        root.setAttribute('data-theme', previousTheme);
      } else {
        root.removeAttribute('data-theme');
      }
    };
  }, [setTheme]);
  
  return <>{children}</>;
};
