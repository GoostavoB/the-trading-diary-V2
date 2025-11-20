import { ColorMode } from '@/hooks/useThemeMode';

/**
 * Theming MVP - Subscription tier-based theme system
 * 6 prebuilt themes gated by subscription tier
 */

export type ThemeTier = 'free' | 'starter' | 'pro' | 'elite';

export interface ThemeDefinition extends ColorMode {
  description: string;
  requiredTier: ThemeTier;
  isPrebuilt: true;
}

// MVP: 6 prebuilt themes with tier gating
export const UNIFIED_THEMES: ThemeDefinition[] = [
  // STARTER TIER (free/basic) - Available to all users
  {
    id: 'default',
    name: 'Default',
    description: 'Blue and gray professional theme',
    primary: '221 83% 53%',      // Blue #4A90E2
    secondary: '215 20% 65%',    // Gray #64748B
    accent: '221 83% 53%',
    profit: '142 71% 45%',       // Green
    loss: '0 84% 60%',           // Red
    requiredTier: 'free',
    isPrebuilt: true,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Green for positive, red for negative',
    primary: '142 76% 36%',      // Green #22C55E
    secondary: '215 20% 65%',
    accent: '142 76% 36%',
    profit: '142 76% 36%',       // Green #22C55E
    loss: '0 72% 51%',           // Red #EF4444
    requiredTier: 'free',
    isPrebuilt: true,
  },
  
  // PRO TIER - Requires Pro or Elite subscription
  {
    id: 'night',
    name: 'Night',
    description: 'High contrast neutral theme',
    primary: '220 13% 91%',      // Light gray #E5E7EB
    secondary: '217 33% 17%',    // Dark gray #1F2937
    accent: '220 13% 91%',
    profit: '142 71% 45%',
    loss: '0 84% 60%',
    requiredTier: 'pro',
    isPrebuilt: true,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Teal accents for a calm interface',
    primary: '173 80% 40%',      // Teal #14B8A6
    secondary: '175 84% 32%',    // Darker teal #0D9488
    accent: '173 80% 40%',
    profit: '142 71% 45%',
    loss: '0 84% 60%',
    requiredTier: 'pro',
    isPrebuilt: true,
  },
  {
    id: 'solar',
    name: 'Solar',
    description: 'Warm accents for energy',
    primary: '38 92% 50%',       // Amber #F59E0B
    secondary: '24 95% 53%',     // Orange #EA580C
    accent: '38 92% 50%',
    profit: '142 71% 45%',
    loss: '0 84% 60%',
    requiredTier: 'pro',
    isPrebuilt: true,
  },
  {
    id: 'mono',
    name: 'Mono',
    description: 'Grayscale only for focus',
    primary: '220 9% 46%',       // Gray #6B7280
    secondary: '215 25% 27%',    // Darker gray #374151
    accent: '220 9% 46%',
    profit: '220 9% 46%',        // Use same gray
    loss: '220 9% 46%',          // Use same gray
    requiredTier: 'pro',
    isPrebuilt: true,
  },
];

// Helper to get theme by ID
export const getThemeById = (id: string): ThemeDefinition | undefined => {
  return UNIFIED_THEMES.find(t => t.id === id);
};

// Helper to check if theme is unlocked based on subscription tier
export const isThemeUnlocked = (
  theme: ThemeDefinition,
  userTier: ThemeTier
): boolean => {
  const tierHierarchy: ThemeTier[] = ['free', 'starter', 'pro', 'elite'];
  const userTierIndex = tierHierarchy.indexOf(userTier);
  const requiredTierIndex = tierHierarchy.indexOf(theme.requiredTier);
  
  return userTierIndex >= requiredTierIndex;
};

// Export for backwards compatibility
export const PRESET_THEME_COLORS: ColorMode[] = UNIFIED_THEMES;
export const ADVANCED_THEME_COLORS: ColorMode[] = [];
