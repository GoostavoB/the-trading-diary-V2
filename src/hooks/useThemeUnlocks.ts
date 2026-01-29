import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { UNIFIED_THEMES, getThemeById, ThemeTier } from '@/utils/unifiedThemes';
import { useUserTier } from './useUserTier';
import { useThemeMode } from './useThemeMode';

export interface UnlockableTheme {
  id: string;
  name: string;
  description: string;
  previewColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  requiredTier: ThemeTier;
  isUnlocked: boolean;
}

// Helper to convert HSL to hex for preview colors
const hslToHex = (hsl: string): string => {
  const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
  const lightness = l / 100;
  const saturation = s / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = chroma; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = chroma; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = chroma; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = chroma; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = chroma; }
  else if (h >= 300 && h < 360) { r = chroma; g = 0; b = x; }
  
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const useThemeUnlocks = () => {
  const { user } = useAuth();
  const { activeSubAccount } = useSubAccount();
  const { tier } = useUserTier();
  const { setThemeMode } = useThemeMode();
  const [themes, setThemes] = useState<UnlockableTheme[]>([]);
  const [activeTheme, setActiveTheme] = useState<string>('default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && activeSubAccount) {
      fetchUnlocks();
    }
  }, [user, activeSubAccount, tier]);

  const fetchUnlocks = async () => {
    if (!user || !activeSubAccount) return;

    try {
      // Fetch user preferences from database
      const { data: preferences } = await supabase
        .from('user_customization_preferences')
        .select('active_theme')
        .eq('sub_account_id', activeSubAccount.id)
        .single();

      // Try database first, fallback to localStorage, then default
      const dbTheme = preferences?.active_theme;
      const localTheme = localStorage.getItem('active_theme');
      const activeThemeId = dbTheme || localTheme || 'default';
      
      console.log('[ThemeUnlocks] Loading theme:', { dbTheme, localTheme, activeThemeId });
      
      setActiveTheme(activeThemeId);
      
      // Apply theme to document immediately
      document.documentElement.setAttribute('data-theme', activeThemeId);
      
      // IMPORTANT: Also apply CSS variables via useThemeMode
      setThemeMode(activeThemeId);
      
      // Sync localStorage with database value if they differ
      if (dbTheme && dbTheme !== localTheme) {
        localStorage.setItem('active_theme', dbTheme);
      }

      // Map themes with unlock status based on tier
      const themeTier = tier as ThemeTier;
      const tierHierarchy: ThemeTier[] = ['free', 'starter', 'pro', 'elite'];
      const userTierIndex = tierHierarchy.indexOf(themeTier);

      const themesWithUnlockStatus: UnlockableTheme[] = UNIFIED_THEMES.map(theme => {
        const requiredTierIndex = tierHierarchy.indexOf(theme.requiredTier);
        const isUnlocked = userTierIndex >= requiredTierIndex;

        return {
          id: theme.id,
          name: theme.name,
          description: theme.description,
          previewColors: {
            primary: hslToHex(theme.primary),
            secondary: hslToHex(theme.secondary),
            accent: hslToHex(theme.accent),
          },
          requiredTier: theme.requiredTier,
          isUnlocked,
        };
      });

      setThemes(themesWithUnlockStatus);
      setLoading(false);
    } catch (error) {
      console.error('[ThemeUnlocks] Error fetching theme unlocks:', error);
      
      // On error, try to load from localStorage
      const localTheme = localStorage.getItem('active_theme');
      if (localTheme) {
        console.log('[ThemeUnlocks] Using localStorage theme:', localTheme);
        setActiveTheme(localTheme);
        document.documentElement.setAttribute('data-theme', localTheme);
      }
      
      setLoading(false);
    }
  };

  const activateTheme = async (themeId: string) => {
    if (!user) return;

    const theme = getThemeById(themeId);
    if (!theme) {
      console.error('[ThemeUnlocks] Theme not found:', themeId);
      return;
    }

    try {
      console.log('[ThemeUnlocks] Activating theme:', themeId);
      
      // Apply theme to document immediately for instant feedback
      document.documentElement.setAttribute('data-theme', themeId);
      setActiveTheme(themeId);
      
      // IMPORTANT: Apply CSS variables via useThemeMode for visual change
      setThemeMode(themeId);
      
      // Then persist to database
      const { error } = await supabase
        .from('user_customization_preferences')
        .upsert({
          user_id: user.id,
          sub_account_id: activeSubAccount!.id,
          active_theme: themeId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'sub_account_id'
        });

      if (error) {
        console.error('[ThemeUnlocks] Database error:', error);
        throw error;
      }

      // Also store in localStorage as backup
      localStorage.setItem('active_theme', themeId);
      
      console.log('[ThemeUnlocks] ✅ Theme activated and saved:', themeId);
    } catch (error) {
      console.error('[ThemeUnlocks] Error activating theme:', error);
      throw error;
    }
  };

  const refresh = () => {
    fetchUnlocks();
  };

  return {
    themes,
    activeTheme,
    loading,
    activateTheme,
    refresh,
  };
};
