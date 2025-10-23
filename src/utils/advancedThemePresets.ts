import { ColorMode } from '@/hooks/useThemeMode';

// Level 3+ themes
export const LEVEL_3_THEMES: ColorMode[] = [
  {
    id: 'wall-street',
    name: 'Wall Street',
    primary: '45 93% 57%', // Gold
    secondary: '220 26% 14%', // Navy
    accent: '45 93% 57%',
    profit: '45 93% 57%',
    loss: '220 26% 14%',
  },
  {
    id: 'focus',
    name: 'Focus Mode',
    primary: '210 16% 88%', // Light gray
    secondary: '215 20% 35%', // Dark gray
    accent: '210 16% 88%',
    profit: '210 16% 88%',
    loss: '215 20% 35%',
  },
  {
    id: 'neon',
    name: 'Neon City',
    primary: '330 81% 60%', // Pink
    secondary: '189 94% 43%', // Cyan
    accent: '330 81% 60%',
    profit: '330 81% 60%',
    loss: '189 94% 43%',
  },
  {
    id: 'forest',
    name: 'Forest',
    primary: '142 71% 45%', // Green
    secondary: '25 46% 38%', // Brown
    accent: '142 71% 45%',
    profit: '142 71% 45%',
    loss: '25 46% 38%',
  },
  {
    id: 'vietnam',
    name: '🇻🇳 Vietnam',
    primary: '358 77% 48%', // Vietnam Red (#DA251D)
    secondary: '60 100% 50%', // Vietnam Yellow (#FFFF00)
    accent: '358 77% 48%',
    profit: '358 77% 48%',
    loss: '60 100% 50%',
  },
];

// Level 4+ themes
export const LEVEL_4_THEMES: ColorMode[] = [
  {
    id: 'sunset',
    name: 'Sunset',
    primary: '14 100% 57%', // Orange
    secondary: '340 82% 52%', // Pink
    accent: '14 100% 57%',
    profit: '14 100% 57%',
    loss: '340 82% 52%',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    primary: '189 75% 75%', // Ice blue
    secondary: '0 0% 100%', // White
    accent: '189 75% 75%',
    profit: '189 75% 75%',
    loss: '200 10% 60%',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    primary: '120 100% 50%', // Terminal green
    secondary: '0 0% 0%', // Black
    accent: '120 100% 50%',
    profit: '120 100% 50%',
    loss: '0 0% 20%',
  },
  {
    id: 'fire',
    name: 'Fire',
    primary: '0 100% 50%', // Red
    secondary: '14 100% 57%', // Orange
    accent: '0 100% 50%',
    profit: '14 100% 57%',
    loss: '0 100% 50%',
  },
];

// Level 5+ themes
export const LEVEL_5_THEMES: ColorMode[] = [
  {
    id: 'galaxy',
    name: 'Galaxy',
    primary: '270 67% 62%', // Purple
    secondary: '240 10% 3%', // Deep black
    accent: '270 67% 62%',
    profit: '270 67% 62%',
    loss: '240 10% 20%',
  },
  {
    id: 'gold-rush',
    name: 'Gold Rush',
    primary: '45 93% 57%', // Gold
    secondary: '0 0% 0%', // Black
    accent: '45 93% 57%',
    profit: '45 93% 57%',
    loss: '0 0% 15%',
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    primary: '300 76% 72%', // Neon pink
    secondary: '280 89% 66%', // Neon purple
    accent: '300 76% 72%',
    profit: '300 76% 72%',
    loss: '280 89% 66%',
  },
];

export const ALL_ADVANCED_THEMES = [
  ...LEVEL_3_THEMES,
  ...LEVEL_4_THEMES,
  ...LEVEL_5_THEMES,
];
