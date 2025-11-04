import { useHapticFeedback } from './useHapticFeedback';

/**
 * Enhanced haptic feedback for gamification events
 * Provides intensity-based vibrations for XP gains and level ups
 */
export const useGamificationHaptics = () => {
  const { vibrate } = useHapticFeedback();
  
  return {
    onXPGain: (amount: number) => {
      if (amount < 50) {
        vibrate('light');      // Micro event
      } else if (amount < 200) {
        vibrate('medium');     // Medium event
      } else {
        vibrate('heavy');      // Large event
      }
    },
    onLevelUp: () => {
      // Double pulse for level up
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([50, 100, 50]);
        } catch (error) {
          console.warn('Haptic feedback not available:', error);
        }
      }
    },
    onFirstUpload: () => {
      // Gentle single pulse
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(50);
        } catch (error) {
          console.warn('Haptic feedback not available:', error);
        }
      }
    },
  };
};
