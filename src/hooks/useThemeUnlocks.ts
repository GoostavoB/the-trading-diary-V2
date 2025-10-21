import { useEffect, useState } from 'react';
import { useXPSystem } from './useXPSystem';
import { ColorMode } from './useThemeMode';

export interface ThemeUnlock {
  themeId: string;
  requiredLevel: number;
  unlocked: boolean;
}

// Level-based theme unlocks
export const THEME_UNLOCK_REQUIREMENTS: Record<string, number> = {
  // Level 1-2: Always available
  'ocean': 1,
  'purple': 1,
  'classic': 1,
  'midnight': 1,
  
  // Level 3+: Consistent Trader
  'wall-street': 3,
  'focus': 3,
  'neon': 3,
  'forest': 3,
  
  // Level 4+: Expert Trader
  'sunset': 4,
  'arctic': 4,
  'matrix': 4,
  'fire': 4,
  
  // Level 5+: Master Trader
  'galaxy': 5,
  'gold-rush': 5,
  'synthwave': 5,
};

export const useThemeUnlocks = () => {
  const { xpData } = useXPSystem();
  const level = xpData.currentLevel;
  const [newlyUnlockedThemes, setNewlyUnlockedThemes] = useState<string[]>([]);
  const [previousLevel, setPreviousLevel] = useState(level);

  useEffect(() => {
    // Check if level increased
    if (level > previousLevel) {
      const newUnlocks = Object.entries(THEME_UNLOCK_REQUIREMENTS)
        .filter(([themeId, requiredLevel]) => 
          requiredLevel === level && requiredLevel > previousLevel
        )
        .map(([themeId]) => themeId);
      
      if (newUnlocks.length > 0) {
        setNewlyUnlockedThemes(newUnlocks);
        
        // Clear after 5 seconds
        setTimeout(() => {
          setNewlyUnlockedThemes([]);
        }, 5000);
      }
      
      setPreviousLevel(level);
    }
  }, [level, previousLevel]);

  const isThemeUnlocked = (themeId: string): boolean => {
    const requiredLevel = THEME_UNLOCK_REQUIREMENTS[themeId] || 1;
    return level >= requiredLevel;
  };

  const getUnlockedThemes = (allThemes: ColorMode[]): ColorMode[] => {
    return allThemes.filter(theme => isThemeUnlocked(theme.id));
  };

  const getLockedThemes = (allThemes: ColorMode[]): ColorMode[] => {
    return allThemes.filter(theme => !isThemeUnlocked(theme.id));
  };

  const getNextUnlockLevel = (currentLevel: number): number | null => {
    const nextLevels = Object.values(THEME_UNLOCK_REQUIREMENTS)
      .filter(reqLevel => reqLevel > currentLevel)
      .sort((a, b) => a - b);
    
    return nextLevels.length > 0 ? nextLevels[0] : null;
  };

  return {
    isThemeUnlocked,
    getUnlockedThemes,
    getLockedThemes,
    newlyUnlockedThemes,
    getNextUnlockLevel,
    currentLevel: level,
  };
};
