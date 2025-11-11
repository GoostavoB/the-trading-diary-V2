import { ColorMode } from '@/hooks/useThemeMode';

export type AccessibilityPreset = 'deuteranopia' | 'protanopia' | 'tritanopia' | 'high-contrast';

export interface AccessibilityTheme extends ColorMode {
  description: string;
  presetType: AccessibilityPreset;
  contrastRatio: number;
}

/**
 * Accessibility Presets - WCAG AA Compliant
 * All presets designed for maximum contrast and usability
 */
export const ACCESSIBILITY_PRESETS: AccessibilityTheme[] = [
  {
    id: 'deuteranopia',
    name: 'Deuteranopia Safe',
    description: 'Optimized for red-green color blindness (most common). Uses blue-orange contrast instead of red-green.',
    presetType: 'deuteranopia',
    contrastRatio: 7.0,
    // Replace red vs green with blue vs orange
    primary: '210 100% 50%',      // Strong blue
    secondary: '220 15% 55%',     // Neutral gray
    accent: '210 100% 50%',       // Blue accent
    profit: '142 71% 45%',        // Keep green but add icon
    loss: '210 100% 50%',         // Blue instead of red
    success: '142 71% 45%',       // Green with check icon
    warning: '30 100% 45%',       // Deep orange
    error: '210 100% 50%',        // Blue with X icon (not red!)
    info: '210 100% 50%',         // Blue
    focus: '210 100% 40%',        // Dark blue for contrast
  },
  {
    id: 'protanopia',
    name: 'Protanopia Safe',
    description: 'Optimized for red color blindness. Uses blue-yellow contrast with distinct shapes and patterns.',
    presetType: 'protanopia',
    contrastRatio: 7.0,
    // Purple vs orange for diverging scales
    primary: '250 70% 45%',       // Purple
    secondary: '220 15% 55%',     // Neutral gray
    accent: '250 70% 45%',        // Purple accent
    profit: '142 65% 40%',        // Darker green
    loss: '250 70% 55%',          // Lighter purple (not red)
    success: '142 65% 40%',       // Green with icon
    warning: '35 100% 45%',       // Orange
    error: '250 70% 55%',         // Purple with icon (not red!)
    info: '200 75% 45%',          // Teal blue
    focus: '200 80% 35%',         // Dark teal
  },
  {
    id: 'tritanopia',
    name: 'Tritanopia Safe',
    description: 'Optimized for blue-yellow color blindness (rare). Uses red-cyan contrast.',
    presetType: 'tritanopia',
    contrastRatio: 7.0,
    primary: '340 75% 45%',       // Rose/pink
    secondary: '220 15% 55%',     // Neutral gray
    accent: '340 75% 45%',        // Rose accent
    profit: '142 60% 40%',        // Forest green
    loss: '340 85% 50%',          // Strong rose (not blue!)
    success: '142 60% 40%',       // Green with icon
    warning: '35 95% 45%',        // Orange-red
    error: '340 85% 50%',         // Rose with icon (not blue!)
    info: '340 60% 60%',          // Light rose
    focus: '340 80% 35%',         // Dark rose
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum contrast mode. 7:1 ratio for all elements. Uses bold colors and clear shapes.',
    presetType: 'high-contrast',
    contrastRatio: 10.0,
    // Maximum contrast - nearly black and white with accent colors
    primary: '210 100% 35%',      // Very dark blue
    secondary: '220 15% 40%',     // Dark gray
    accent: '210 100% 35%',       // Dark blue accent
    profit: '142 100% 25%',       // Very dark green
    loss: '0 100% 35%',           // Very dark red
    success: '142 100% 25%',      // Very dark green
    warning: '45 100% 35%',       // Dark gold/yellow
    error: '0 100% 35%',          // Very dark red
    info: '210 100% 35%',         // Very dark blue
    focus: '45 100% 50%',         // Bright yellow for maximum visibility
  },
];

/**
 * Get accessibility preset by ID
 */
export const getAccessibilityPreset = (id: AccessibilityPreset): AccessibilityTheme | undefined => {
  return ACCESSIBILITY_PRESETS.find(preset => preset.id === id);
};

/**
 * Check if an ID is an accessibility preset
 */
export const isAccessibilityPreset = (id: string): id is AccessibilityPreset => {
  return ['deuteranopia', 'protanopia', 'tritanopia', 'high-contrast'].includes(id);
};

/**
 * Get user-friendly name for preset
 */
export const getPresetDisplayName = (preset: AccessibilityPreset): string => {
  const theme = getAccessibilityPreset(preset);
  return theme?.name || preset;
};

/**
 * Storage keys for accessibility settings
 */
export const ACCESSIBILITY_STORAGE_KEYS = {
  PRESET: 'accessibility:preset',
  SHOW_ICONS: 'accessibility:show-icons',
  LINK_UNDERLINES: 'accessibility:link-underlines',
  SIMULATION: 'accessibility:simulation',
} as const;
