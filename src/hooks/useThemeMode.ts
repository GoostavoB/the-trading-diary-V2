import { useState, useEffect } from 'react';
import { useSeasonalThemes } from './useSeasonalThemes';
import { ADVANCED_THEME_COLORS, PRESET_THEME_COLORS } from '@/utils/unifiedThemes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { validateThemeContrast } from '@/utils/contrastValidation';
import { toast } from 'sonner';
import { useAccessibilityMode } from './useAccessibilityMode';

export type ThemeMode = 'default' | 'classic' | string;

export interface ColorMode {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  profit: string;
  loss: string;
  // Semantic state tokens for accessibility
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
  focus?: string;
}

// DEFAULT_THEME: Always used as fallback for missing tokens
const DEFAULT_THEME: ColorMode = {
  id: 'default',
  name: 'Default',
  primary: '221 83% 53%',      // Blue
  secondary: '215 20% 65%',    // Gray
  accent: '221 83% 53%',
  profit: '142 71% 45%',       // Green
  loss: '0 84% 60%',           // Red
  // Semantic state tokens (WCAG AA compliant)
  success: '142 71% 45%',      // Green - same as profit
  warning: '38 92% 50%',       // Orange
  error: '0 84% 60%',          // Red - same as loss
  info: '221 83% 53%',         // Blue - same as primary
  focus: '221 83% 53%',        // Blue - high contrast for focus rings
};

const PRESET_THEMES = PRESET_THEME_COLORS;
const ALL_ADVANCED_THEMES = ADVANCED_THEME_COLORS;

export function useThemeMode() {
  const [currentMode, setCurrentMode] = useState<string>('default');
  const [customModes, setCustomModes] = useState<ColorMode[]>([]);
  const { activeSeasonalTheme } = useSeasonalThemes();
  const { user } = useAuth();
  const { activePresetTheme } = useAccessibilityMode();

  // Load custom themes from database
  useEffect(() => {
    const loadCustomThemes = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_custom', true);

      if (error) {
        console.error('Failed to load custom themes:', error);
        return;
      }

      if (data) {
        const customThemeModes: ColorMode[] = data.map(theme => {
          const tokens = theme.tokens as Record<string, string>;
          return {
            id: theme.id,
            name: theme.name,
            primary: tokens.primary || DEFAULT_THEME.primary,
            secondary: tokens.secondary || DEFAULT_THEME.secondary,
            accent: tokens.accent || DEFAULT_THEME.accent,
            profit: tokens.profit || DEFAULT_THEME.profit,
            loss: tokens.loss || DEFAULT_THEME.loss,
          };
        });
        setCustomModes(customThemeModes);
      }
    };

    loadCustomThemes();
  }, [user]);

  // Load and apply saved theme on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('theme:mode');
    const modeToApply = savedMode || 'default';
    setCurrentMode(modeToApply);
    applyMode(modeToApply);
  }, [customModes]);

  // Merge theme with DEFAULT_THEME as fallback
  const mergeWithDefault = (theme: Partial<ColorMode>): ColorMode => {
    return {
      id: theme.id || DEFAULT_THEME.id,
      name: theme.name || DEFAULT_THEME.name,
      primary: theme.primary || DEFAULT_THEME.primary,
      secondary: theme.secondary || DEFAULT_THEME.secondary,
      accent: theme.accent || DEFAULT_THEME.accent,
      profit: theme.profit || DEFAULT_THEME.profit,
      loss: theme.loss || DEFAULT_THEME.loss,
      success: theme.success || DEFAULT_THEME.success,
      warning: theme.warning || DEFAULT_THEME.warning,
      error: theme.error || DEFAULT_THEME.error,
      info: theme.info || DEFAULT_THEME.info,
      focus: theme.focus || DEFAULT_THEME.focus,
    };
  };

  const applyMode = (modeId: string, customModesList?: ColorMode[]) => {
    const customList = customModesList || customModes;
    let allModes = [...PRESET_THEMES, ...ALL_ADVANCED_THEMES, ...customList];
    
    if (activeSeasonalTheme) {
      allModes = [...allModes, activeSeasonalTheme];
    }
    
    const foundMode = allModes.find(m => m.id === modeId);

    if (foundMode) {
      // Merge with DEFAULT_THEME for missing tokens
      let mode = mergeWithDefault(foundMode);
      
      // If accessibility preset is active, override with accessibility colors
      if (activePresetTheme) {
        mode = mergeWithDefault({ ...mode, ...activePresetTheme });
      }

      // WCAG AA Contrast Validation (4.5:1 minimum)
      const contrastValidation = validateThemeContrast({
        primary: mode.primary,
        secondary: mode.secondary,
        accent: mode.accent,
        profit: mode.profit,
        loss: mode.loss,
      });

      if (!contrastValidation.isValid) {
        toast.warning('Theme Contrast Warning', {
          description: `Low contrast detected (${contrastValidation.score.toFixed(2)}:1). Some text may be hard to read.`,
        });
      }

      setCurrentMode(modeId);
      
      requestAnimationFrame(() => {
        const root = document.documentElement;
        
        const isManualSwitch = root.style.getPropertyValue('--primary') !== '';
        if (isManualSwitch) {
          root.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        
        root.style.setProperty('--primary', mode.primary);
        root.style.setProperty('--secondary', mode.secondary);
        root.style.setProperty('--accent', mode.accent);
        root.style.setProperty('--profit', mode.profit);
        root.style.setProperty('--loss', mode.loss);
        root.style.setProperty('--chart-1', mode.accent);
        root.style.setProperty('--chart-2', mode.primary);
        root.style.setProperty('--chart-3', mode.secondary);
        
        root.style.setProperty('--neon-green', mode.profit);
        root.style.setProperty('--neon-red', mode.loss);
        
        // Apply semantic state tokens
        root.style.setProperty('--state-success', mode.success!);
        root.style.setProperty('--state-warning', mode.warning!);
        root.style.setProperty('--state-error', mode.error!);
        root.style.setProperty('--state-info', mode.info!);
        root.style.setProperty('--state-focus', mode.focus!);
        
        if (isManualSwitch) {
          setTimeout(() => {
            root.style.transition = '';
          }, 500);
        }
      });
    } else {
      console.warn('⚠️ Theme mode not found:', modeId);
      // Fallback to default
      applyMode('default', customModesList);
    }
  };

  const setThemeMode = (modeId: string) => {
    applyMode(modeId);
    localStorage.setItem('theme:mode', modeId);
  };

  const addCustomMode = async (mode: Omit<ColorMode, 'id'>) => {
    if (!user) {
      throw new Error('User must be authenticated to create custom themes');
    }

    // Merge with DEFAULT_THEME before validation
    const mergedMode = mergeWithDefault(mode);

    // WCAG AA Validation before saving
    const contrastValidation = validateThemeContrast({
      primary: mergedMode.primary,
      secondary: mergedMode.secondary,
      accent: mergedMode.accent,
      profit: mergedMode.profit,
      loss: mergedMode.loss,
    });

    if (!contrastValidation.isValid) {
      throw new Error(`Theme contrast too low (${contrastValidation.score.toFixed(2)}:1). Minimum 4.5:1 required for WCAG AA.`);
    }

    const { data, error } = await supabase
      .from('themes')
      .insert({
        user_id: user.id,
        name: mergedMode.name,
        tokens: {
          primary: mergedMode.primary,
          secondary: mergedMode.secondary,
          accent: mergedMode.accent,
          profit: mergedMode.profit,
          loss: mergedMode.loss,
        },
        is_custom: true,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    const newMode: ColorMode = {
      id: data.id,
      name: data.name,
      primary: (data.tokens as Record<string, string>).primary,
      secondary: (data.tokens as Record<string, string>).secondary,
      accent: (data.tokens as Record<string, string>).accent,
      profit: (data.tokens as Record<string, string>).profit,
      loss: (data.tokens as Record<string, string>).loss,
    };

    setCustomModes(prev => [...prev, newMode]);
    return newMode;
  };

  const deleteCustomMode = async (modeId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', modeId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete theme:', error);
      throw error;
    }

    setCustomModes(prev => prev.filter(m => m.id !== modeId));

    if (currentMode === modeId) {
      setThemeMode('default');
    }
  };

  const updateCustomMode = async (modeId: string, updates: Partial<ColorMode>) => {
    if (!user) return;

    // Get current theme to merge updates
    const currentTheme = customModes.find(m => m.id === modeId);
    if (!currentTheme) return;

    const updatedTheme = mergeWithDefault({ ...currentTheme, ...updates });

    // WCAG AA Validation before updating
    const contrastValidation = validateThemeContrast({
      primary: updatedTheme.primary,
      secondary: updatedTheme.secondary,
      accent: updatedTheme.accent,
      profit: updatedTheme.profit,
      loss: updatedTheme.loss,
    });

    if (!contrastValidation.isValid) {
      throw new Error(`Theme contrast too low (${contrastValidation.score.toFixed(2)}:1). Minimum 4.5:1 required for WCAG AA.`);
    }

    const { error } = await supabase
      .from('themes')
      .update({
        name: updatedTheme.name,
        tokens: {
          primary: updatedTheme.primary,
          secondary: updatedTheme.secondary,
          accent: updatedTheme.accent,
          profit: updatedTheme.profit,
          loss: updatedTheme.loss,
        },
      })
      .eq('id', modeId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to update theme:', error);
      throw error;
    }

    const updatedModes = customModes.map(m => 
      m.id === modeId ? updatedTheme : m
    );
    setCustomModes(updatedModes);

    if (currentMode === modeId) {
      applyMode(modeId, updatedModes);
    }
  };

  return {
    themeMode: currentMode,
    setThemeMode,
    presetModes: PRESET_THEMES,
    customModes,
    addCustomMode,
    deleteCustomMode,
    updateCustomMode,
    allModes: [...PRESET_THEMES, ...customModes],
    isClassic: currentMode === 'classic',
    colors: {
      positive: 'hsl(var(--profit))',
      negative: 'hsl(var(--loss))',
      positiveBg: 'hsl(var(--profit) / 0.1)',
      negativeBg: 'hsl(var(--loss) / 0.1)',
    },
  };
}

// Helper function to convert hex to HSL
export function hexToHsl(hex: string): string {
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}
