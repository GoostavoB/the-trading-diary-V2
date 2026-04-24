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

  // NEW THEMES — Synthwave, Private Banking, Creative Product
  {
    id: 'neon',
    name: 'Neon',
    description: 'Synthwave magenta and cyan on space gray',
    primary: '278 69% 63%',      // Apple purple #BF5AF2 (electric)
    secondary: '190 100% 66%',   // Apple cyan #64D2FF
    accent: '348 100% 65%',      // Apple pink #FF375F
    profit: '145 63% 51%',       // Apple green
    loss: '348 100% 65%',        // Pink red
    success: '145 63% 51%',
    warning: '35 100% 52%',
    error: '348 100% 65%',
    info: '278 69% 63%',
    focus: '278 69% 63%',
    requiredTier: 'pro',
    isPrebuilt: true,
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    description: 'Champagne gold on warm near-black — private banking',
    primary: '46 65% 52%',       // Champagne gold #D4AF37
    secondary: '340 69% 32%',    // Deep burgundy #8B1A3A
    accent: '46 65% 52%',        // Gold
    profit: '46 65% 52%',        // Gold (positive)
    loss: '340 69% 32%',         // Burgundy (negative)
    success: '145 50% 48%',
    warning: '38 95% 55%',       // Copper
    error: '340 69% 32%',
    info: '46 65% 52%',
    focus: '46 65% 52%',
    requiredTier: 'pro',
    isPrebuilt: true,
  },
  {
    id: 'sunset-wave',
    name: 'Sunset Wave',
    description: 'Coral and teal — creative product vibe',
    primary: '11 100% 67%',      // Coral orange #FF7A59
    secondary: '350 100% 81%',   // Sunset pink #FF9EB1
    accent: '172 66% 50%',       // Teal
    profit: '172 66% 50%',       // Teal
    loss: '11 100% 67%',         // Coral red-orange
    success: '145 63% 51%',
    warning: '48 95% 60%',       // Yellow
    error: '11 100% 67%',
    info: '350 100% 81%',
    focus: '11 100% 67%',
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
