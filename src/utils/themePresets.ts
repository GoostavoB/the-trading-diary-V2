import { ColorMode } from '@/hooks/useThemeMode';

export const PRESET_THEMES: ColorMode[] = [
  {
    id: 'default',
    name: 'Default Theme',
    primary: '210 90% 58%', // Blue
    secondary: '215 16% 47%', // Gray
    accent: '210 90% 58%',
    profit: '210 90% 58%',
    loss: '215 16% 47%',
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
