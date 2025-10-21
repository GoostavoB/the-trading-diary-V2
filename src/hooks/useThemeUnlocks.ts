import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UnlockableTheme {
  id: string;
  name: string;
  description: string;
  previewColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  unlockRequirement: {
    type: 'level' | 'rank' | 'achievement';
    value: string | number;
  };
  isUnlocked: boolean;
}

const THEME_CATALOG: Omit<UnlockableTheme, 'isUnlocked'>[] = [
  {
    id: 'default',
    name: 'Default Theme',
    description: 'Clean and professional',
    previewColors: { primary: '#3B82F6', secondary: '#6B7280', accent: '#3B82F6' },
    unlockRequirement: { type: 'level', value: 1 }
  },
  {
    id: 'neon-nights',
    name: 'Neon Nights',
    description: 'Vibrant cyberpunk aesthetics',
    previewColors: { primary: '#FF00FF', secondary: '#00FFFF', accent: '#FFFF00' },
    unlockRequirement: { type: 'level', value: 5 }
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Calm blue tones',
    previewColors: { primary: '#0EA5E9', secondary: '#06B6D4', accent: '#22D3EE' },
    unlockRequirement: { type: 'level', value: 10 }
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm orange and pink hues',
    previewColors: { primary: '#F97316', secondary: '#EC4899', accent: '#FBBF24' },
    unlockRequirement: { type: 'level', value: 15 }
  },
  {
    id: 'cyber-punk',
    name: 'Cyber Punk',
    description: 'Futuristic dark theme',
    previewColors: { primary: '#A855F7', secondary: '#06B6D4', accent: '#F43F5E' },
    unlockRequirement: { type: 'rank', value: 'elite_trader' }
  },
  {
    id: 'gold-rush',
    name: 'Gold Rush',
    description: 'Luxurious gold accents',
    previewColors: { primary: '#EAB308', secondary: '#F59E0B', accent: '#FBBF24' },
    unlockRequirement: { type: 'rank', value: 'legend_trader' }
  }
];

export const useThemeUnlocks = () => {
  const { user } = useAuth();
  const [themes, setThemes] = useState<UnlockableTheme[]>([]);
  const [activeTheme, setActiveTheme] = useState<string>('default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUnlocks();
    }
  }, [user]);

  const fetchUnlocks = async () => {
    if (!user) return;

    try {
      // Fetch user progression
      const { data: progression } = await supabase
        .from('user_xp_levels')
        .select('current_level')
        .eq('user_id', user.id)
        .single();

      const { data: userProgression } = await supabase
        .from('user_progression')
        .select('rank')
        .eq('user_id', user.id)
        .single();

      // Fetch user preferences
      const { data: preferences } = await supabase
        .from('user_customization_preferences')
        .select('active_theme, unlocked_themes')
        .eq('user_id', user.id)
        .single();

      const currentLevel = progression?.current_level || 1;
      const currentRank = userProgression?.rank || 'rookie_trader';
      const unlockedThemes = preferences?.unlocked_themes || ['default'];
      const activeThemeId = preferences?.active_theme || 'default';

      setActiveTheme(activeThemeId);

      // Check which themes are unlocked
      const themesWithUnlocks = THEME_CATALOG.map(theme => {
        let isUnlocked = unlockedThemes.includes(theme.id);
        
        if (!isUnlocked) {
          if (theme.unlockRequirement.type === 'level') {
            isUnlocked = currentLevel >= (theme.unlockRequirement.value as number);
          } else if (theme.unlockRequirement.type === 'rank') {
            const rankOrder = ['rookie_trader', 'active_trader', 'consistent_trader', 'pro_trader', 'elite_trader', 'legend_trader'];
            const requiredRankIndex = rankOrder.indexOf(theme.unlockRequirement.value as string);
            const currentRankIndex = rankOrder.indexOf(currentRank);
            isUnlocked = currentRankIndex >= requiredRankIndex;
          }
        }

        return { ...theme, isUnlocked };
      });

      setThemes(themesWithUnlocks);
    } catch (error) {
      console.error('Error fetching theme unlocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateTheme = async (themeId: string) => {
    if (!user) return;

    const theme = themes.find(t => t.id === themeId);
    if (!theme?.isUnlocked) return;

    try {
      // Update active theme in database
      const { error } = await supabase
        .from('user_customization_preferences')
        .upsert({
          user_id: user.id,
          active_theme: themeId
        }, {
          onConflict: 'user_id'
        });

      if (!error) {
        setActiveTheme(themeId);
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', themeId);
      }
    } catch (error) {
      console.error('Error activating theme:', error);
    }
  };

  return {
    themes,
    activeTheme,
    loading,
    activateTheme,
    refresh: fetchUnlocks
  };
};
