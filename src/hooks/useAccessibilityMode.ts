import { useState, useEffect } from 'react';
import { 
  AccessibilityPreset, 
  ACCESSIBILITY_PRESETS, 
  getAccessibilityPreset,
  isAccessibilityPreset,
  ACCESSIBILITY_STORAGE_KEYS 
} from '@/utils/accessibilityPresets';
import { ColorMode } from './useThemeMode';

interface AccessibilitySettings {
  preset: AccessibilityPreset | null;
  showIconsWithColor: boolean;
  linkUnderlines: boolean;
  simulation: AccessibilityPreset | null;
}

export function useAccessibilityMode() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    preset: null,
    showIconsWithColor: true,
    linkUnderlines: true,
    simulation: null,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      const savedPreset = localStorage.getItem(ACCESSIBILITY_STORAGE_KEYS.PRESET);
      const savedShowIcons = localStorage.getItem(ACCESSIBILITY_STORAGE_KEYS.SHOW_ICONS);
      const savedLinkUnderlines = localStorage.getItem(ACCESSIBILITY_STORAGE_KEYS.LINK_UNDERLINES);
      const savedSimulation = localStorage.getItem(ACCESSIBILITY_STORAGE_KEYS.SIMULATION);

      setSettings({
        preset: savedPreset && isAccessibilityPreset(savedPreset) ? savedPreset : null,
        showIconsWithColor: savedShowIcons !== 'false', // default true
        linkUnderlines: savedLinkUnderlines !== 'false', // default true
        simulation: savedSimulation && isAccessibilityPreset(savedSimulation) ? savedSimulation : null,
      });
    };

    loadSettings();
  }, []);

  // Apply link underlines setting
  useEffect(() => {
    if (settings.linkUnderlines) {
      document.documentElement.classList.add('accessibility-link-underlines');
    } else {
      document.documentElement.classList.remove('accessibility-link-underlines');
    }
  }, [settings.linkUnderlines]);

  // Apply simulation filter
  useEffect(() => {
    const root = document.documentElement;
    if (settings.simulation) {
      root.setAttribute('data-color-simulation', settings.simulation);
    } else {
      root.removeAttribute('data-color-simulation');
    }
  }, [settings.simulation]);

  const setPreset = (preset: AccessibilityPreset | null) => {
    setSettings(prev => ({ ...prev, preset }));
    if (preset) {
      localStorage.setItem(ACCESSIBILITY_STORAGE_KEYS.PRESET, preset);
    } else {
      localStorage.removeItem(ACCESSIBILITY_STORAGE_KEYS.PRESET);
    }
  };

  const setShowIconsWithColor = (show: boolean) => {
    setSettings(prev => ({ ...prev, showIconsWithColor: show }));
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEYS.SHOW_ICONS, String(show));
  };

  const setLinkUnderlines = (underline: boolean) => {
    setSettings(prev => ({ ...prev, linkUnderlines: underline }));
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEYS.LINK_UNDERLINES, String(underline));
  };

  const setSimulation = (simulation: AccessibilityPreset | null) => {
    setSettings(prev => ({ ...prev, simulation }));
    if (simulation) {
      localStorage.setItem(ACCESSIBILITY_STORAGE_KEYS.SIMULATION, simulation);
    } else {
      localStorage.removeItem(ACCESSIBILITY_STORAGE_KEYS.SIMULATION);
    }
  };

  const getActivePresetTheme = (): ColorMode | null => {
    if (!settings.preset) return null;
    return getAccessibilityPreset(settings.preset) || null;
  };

  const clearPreset = () => {
    setPreset(null);
  };

  return {
    settings,
    presets: ACCESSIBILITY_PRESETS,
    activePreset: settings.preset,
    activePresetTheme: getActivePresetTheme(),
    setPreset,
    clearPreset,
    showIconsWithColor: settings.showIconsWithColor,
    setShowIconsWithColor,
    linkUnderlines: settings.linkUnderlines,
    setLinkUnderlines,
    simulation: settings.simulation,
    setSimulation,
  };
}
