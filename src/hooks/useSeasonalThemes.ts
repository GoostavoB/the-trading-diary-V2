import { useMemo } from 'react';
import { ColorMode } from './useThemeMode';

interface SeasonalTheme extends ColorMode {
  startDate: string; // MM-DD format
  endDate: string;
  description: string;
}

const SEASONAL_THEMES: SeasonalTheme[] = [
  {
    id: 'halloween',
    name: 'Halloween',
    primary: '14 100% 57%', // Orange
    secondary: '0 0% 0%', // Black
    accent: '14 100% 57%',
    profit: '14 100% 57%',
    loss: '0 0% 0%',
    startDate: '10-15',
    endDate: '11-01',
    description: 'Spooky season special',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    primary: '0 84% 60%', // Red
    secondary: '142 76% 58%', // Green
    accent: '45 93% 57%', // Gold
    profit: '142 76% 58%',
    loss: '0 84% 60%',
    startDate: '12-15',
    endDate: '12-26',
    description: 'Festive holiday theme',
  },
  {
    id: 'new-year',
    name: 'New Year',
    primary: '45 93% 57%', // Gold
    secondary: '0 0% 95%', // Silver
    accent: '45 93% 57%',
    profit: '45 93% 57%',
    loss: '240 5% 65%',
    startDate: '12-27',
    endDate: '01-07',
    description: 'Ring in the new year',
  },
  {
    id: 'hanukkah',
    name: 'Hanukkah',
    primary: '217 91% 60%', // Blue
    secondary: '0 0% 100%', // White
    accent: '45 93% 57%', // Gold
    profit: '217 91% 60%',
    loss: '240 5% 65%',
    startDate: '12-18',
    endDate: '12-26',
    description: 'Festival of Lights',
  },
  {
    id: 'diwali',
    name: 'Diwali',
    primary: '45 93% 57%', // Gold
    secondary: '0 84% 60%', // Red
    accent: '14 100% 57%', // Orange
    profit: '45 93% 57%',
    loss: '0 84% 60%',
    startDate: '10-20',
    endDate: '11-05',
    description: 'Festival of Lights',
  },
  {
    id: 'carnival',
    name: 'Carnival',
    primary: '300 76% 72%', // Purple
    secondary: '45 93% 57%', // Gold
    accent: '142 76% 58%', // Green
    profit: '45 93% 57%',
    loss: '300 76% 72%',
    startDate: '02-10',
    endDate: '02-25',
    description: 'Brazilian celebration',
  },
];

export const useSeasonalThemes = () => {
  const activeSeasonalTheme = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();
    const currentDate = `${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

    for (const theme of SEASONAL_THEMES) {
      const [startMonth, startDay] = theme.startDate.split('-').map(Number);
      const [endMonth, endDay] = theme.endDate.split('-').map(Number);

      // Handle year-wrap scenarios (e.g., Dec 27 to Jan 7)
      if (startMonth > endMonth) {
        if (
          (currentMonth === startMonth && currentDay >= startDay) ||
          (currentMonth === endMonth && currentDay <= endDay) ||
          (currentMonth > startMonth || currentMonth < endMonth)
        ) {
          return theme;
        }
      } else {
        // Normal date range
        if (
          (currentMonth === startMonth && currentMonth === endMonth && currentDay >= startDay && currentDay <= endDay) ||
          (currentMonth === startMonth && currentDay >= startDay && startMonth !== endMonth) ||
          (currentMonth === endMonth && currentDay <= endDay && startMonth !== endMonth) ||
          (currentMonth > startMonth && currentMonth < endMonth)
        ) {
          return theme;
        }
      }
    }

    return null;
  }, []);

  const getDaysUntilExpiration = (theme: SeasonalTheme): number => {
    const now = new Date();
    const [endMonth, endDay] = theme.endDate.split('-').map(Number);
    const endDate = new Date(now.getFullYear(), endMonth - 1, endDay);
    
    if (endDate < now) {
      endDate.setFullYear(now.getFullYear() + 1);
    }

    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return {
    activeSeasonalTheme,
    getDaysUntilExpiration: activeSeasonalTheme ? getDaysUntilExpiration(activeSeasonalTheme) : null,
    allSeasonalThemes: SEASONAL_THEMES,
  };
};
