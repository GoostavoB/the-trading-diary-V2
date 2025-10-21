import { ColorMode } from '@/hooks/useThemeMode';

export const PRESET_THEMES: ColorMode[] = [
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    primary: '189 94% 43%', // Cyan
    secondary: '217 91% 60%', // Blue
    accent: '189 94% 43%',
    profit: '189 94% 43%',
    loss: '217 91% 60%',
  },
  {
    id: 'purple',
    name: 'Purple Haze',
    primary: '270 67% 62%', // Purple
    secondary: '239 84% 67%', // Indigo
    accent: '270 67% 62%',
    profit: '270 67% 62%',
    loss: '239 84% 67%',
  },
  {
    id: 'classic',
    name: 'Classic Trader',
    primary: '142 76% 58%', // Green
    secondary: '0 91% 61%', // Red
    accent: '142 76% 58%',
    profit: '142 76% 58%',
    loss: '0 91% 61%',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    primary: '217 91% 60%', // Blue
    secondary: '215 16% 47%', // Gray
    accent: '217 91% 60%',
    profit: '217 91% 60%',
    loss: '215 16% 47%',
  },
];

export const getThemeColors = (theme: ColorMode) => {
  return [
    `hsl(${theme.primary})`,
    `hsl(${theme.secondary})`,
    `hsl(${theme.accent})`,
  ];
};
