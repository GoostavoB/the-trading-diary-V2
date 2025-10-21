import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ColorMode } from './useThemeMode';
import { PRESET_THEMES } from '@/utils/themePresets';
import { ALL_ADVANCED_THEMES } from '@/utils/advancedThemePresets';

interface ThemeSuggestion {
  theme: ColorMode;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export const useAIThemeSuggestions = () => {
  const { user } = useAuth();

  const suggestion = useMemo((): ThemeSuggestion | null => {
    const hour = new Date().getHours();
    const allThemes = [...PRESET_THEMES, ...ALL_ADVANCED_THEMES];

    // Time-based suggestions
    if (hour >= 22 || hour < 6) {
      // Late night (10 PM - 6 AM)
      const midnightTheme = allThemes.find(t => t.id === 'midnight');
      if (midnightTheme) {
        return {
          theme: midnightTheme,
          reason: "It's late - try a dark theme to reduce eye strain",
          confidence: 'high',
        };
      }
    }

    if (hour >= 18 && hour < 22) {
      // Evening (6 PM - 10 PM)
      const sunsetTheme = allThemes.find(t => t.id === 'sunset');
      if (sunsetTheme) {
        return {
          theme: sunsetTheme,
          reason: 'Evening session - Sunset theme matches the vibe',
          confidence: 'medium',
        };
      }
    }

    if (hour >= 6 && hour < 12) {
      // Morning (6 AM - 12 PM)
      const oceanTheme = allThemes.find(t => t.id === 'ocean');
      if (oceanTheme) {
        return {
          theme: oceanTheme,
          reason: 'Good morning! Fresh Ocean theme to start your day',
          confidence: 'medium',
        };
      }
    }

    // Focus-based suggestion for weekdays during work hours
    const dayOfWeek = new Date().getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isWorkHours = hour >= 9 && hour < 17;
    
    if (isWeekday && isWorkHours) {
      const focusTheme = allThemes.find(t => t.id === 'focus');
      if (focusTheme) {
        return {
          theme: focusTheme,
          reason: 'Weekday trading session - Focus Mode for concentration',
          confidence: 'high',
        };
      }
    }

    // Weekend suggestion
    if (!isWeekday) {
      const neonTheme = allThemes.find(t => t.id === 'neon');
      if (neonTheme) {
        return {
          theme: neonTheme,
          reason: "Weekend vibes - try something different",
          confidence: 'low',
        };
      }
    }

    return null;
  }, [user]);

  return {
    suggestion,
    hasSuggestion: suggestion !== null,
  };
};
