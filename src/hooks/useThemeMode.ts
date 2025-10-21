import { useState, useEffect } from 'react';
import { useSeasonalThemes } from './useSeasonalThemes';
import { ALL_ADVANCED_THEMES } from '@/utils/advancedThemePresets';
import { PRESET_THEMES } from '@/utils/themePresets';

export type ThemeMode = 'default' | 'classic' | string;

export interface ColorMode {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  profit: string;
  loss: string;
}

export function useThemeMode() {
  const [currentMode, setCurrentMode] = useState<string>('ocean');
  const [customModes, setCustomModes] = useState<ColorMode[]>([]);
  const { activeSeasonalTheme } = useSeasonalThemes();

  useEffect(() => {
    loadColorModes();
  }, []);

  const loadColorModes = () => {
    const savedMode = localStorage.getItem('theme:mode');
    const savedCustomModes = localStorage.getItem('theme:custom-modes');

    if (savedCustomModes) {
      try {
        const parsedModes = JSON.parse(savedCustomModes);
        setCustomModes(parsedModes);
        
        if (savedMode) {
          applyMode(savedMode, parsedModes);
        } else {
          applyMode('ocean', parsedModes);
        }
      } catch (e) {
        console.error('Failed to parse custom modes', e);
        applyMode('ocean', []);
      }
    } else if (savedMode) {
      setCurrentMode(savedMode);
      applyMode(savedMode, []);
    } else {
      applyMode('ocean', []);
    }
  };

  const applyMode = (modeId: string, customModesList?: ColorMode[]) => {
    const customList = customModesList || customModes;
    let allModes = [...PRESET_THEMES, ...ALL_ADVANCED_THEMES, ...customList];
    
    // Add seasonal theme if active
    if (activeSeasonalTheme) {
      allModes = [...allModes, activeSeasonalTheme];
    }
    
    const mode = allModes.find(m => m.id === modeId);

    if (mode) {
      setCurrentMode(modeId);
      
      // Apply with smooth transition
      const root = document.documentElement;
      root.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      
      root.style.setProperty('--primary', mode.primary);
      root.style.setProperty('--secondary', mode.secondary);
      root.style.setProperty('--accent', mode.accent);
      root.style.setProperty('--profit', mode.profit);
      root.style.setProperty('--loss', mode.loss);
      root.style.setProperty('--chart-1', mode.accent);
      root.style.setProperty('--chart-2', mode.primary);
      root.style.setProperty('--chart-3', mode.secondary);
      
      // Update neon colors to match profit/loss
      root.style.setProperty('--neon-green', mode.profit);
      root.style.setProperty('--neon-red', mode.loss);
      
      // Remove transition after animation
      setTimeout(() => {
        root.style.transition = '';
      }, 500);
    }
  };

  const setThemeMode = (modeId: string) => {
    applyMode(modeId);
    localStorage.setItem('theme:mode', modeId);
  };

  const addCustomMode = (mode: Omit<ColorMode, 'id'>) => {
    if (customModes.length >= 3) {
      throw new Error('Maximum 3 custom modes allowed');
    }

    const newMode: ColorMode = {
      ...mode,
      id: `custom-${Date.now()}`,
    };

    const updatedModes = [...customModes, newMode];
    setCustomModes(updatedModes);
    localStorage.setItem('theme:custom-modes', JSON.stringify(updatedModes));
    
    return newMode;
  };

  const deleteCustomMode = (modeId: string) => {
    const updatedModes = customModes.filter(m => m.id !== modeId);
    setCustomModes(updatedModes);
    localStorage.setItem('theme:custom-modes', JSON.stringify(updatedModes));

    if (currentMode === modeId) {
      setThemeMode('ocean');
    }
  };

  const updateCustomMode = (modeId: string, updates: Partial<ColorMode>) => {
    const updatedModes = customModes.map(m => 
      m.id === modeId ? { ...m, ...updates } : m
    );
    setCustomModes(updatedModes);
    localStorage.setItem('theme:custom-modes', JSON.stringify(updatedModes));

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
