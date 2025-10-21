import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

export type FeedbackEvent = 
  | 'trade_win' 
  | 'trade_loss' 
  | 'xp_gain' 
  | 'level_up'
  | 'achievement_unlock'
  | 'streak_milestone'
  | 'challenge_complete'
  | 'mystery_reward';

export type VisualEffect = 
  | 'pulse_green' 
  | 'pulse_gray' 
  | 'confetti' 
  | 'shimmer'
  | 'glow'
  | 'float_xp';

interface DopamineFeedbackOptions {
  soundEnabled?: boolean;
  animationsEnabled?: boolean;
}

const THROTTLE_MS = 500; // Prevent feedback overload

export const useDopamineFeedback = (options: DopamineFeedbackOptions = {}) => {
  const { soundEnabled = true, animationsEnabled = true } = options;
  const lastTriggerRef = useRef<Record<string, number>>({});

  const shouldThrottle = useCallback((eventType: string): boolean => {
    const now = Date.now();
    const lastTime = lastTriggerRef.current[eventType] || 0;
    if (now - lastTime < THROTTLE_MS) {
      return true;
    }
    lastTriggerRef.current[eventType] = now;
    return false;
  }, []);

  const triggerMicroFeedback = useCallback((
    eventType: FeedbackEvent,
    value: number = 0,
    description?: string
  ) => {
    if (shouldThrottle(eventType)) return;

    // Visual feedback via toast with icons
    if (animationsEnabled) {
      switch (eventType) {
        case 'trade_win':
          toast.success(`+$${value.toFixed(2)}`, {
            description: description || 'Winning trade',
            icon: '✅',
            duration: 2000,
          });
          break;
        case 'trade_loss':
          toast.error(`-$${Math.abs(value).toFixed(2)}`, {
            description: description || 'Learning opportunity',
            icon: '📊',
            duration: 2000,
          });
          break;
        case 'xp_gain':
          toast.success(`+${value} XP`, {
            description: description || 'Experience earned',
            icon: '⚡',
            duration: 1500,
          });
          break;
        case 'level_up':
          toast.success(`Level ${value}!`, {
            description: description || 'You leveled up!',
            icon: '🎉',
            duration: 4000,
          });
          break;
        case 'achievement_unlock':
          toast.success('Achievement Unlocked!', {
            description: description || 'New badge earned',
            icon: '🏆',
            duration: 3000,
          });
          break;
        case 'streak_milestone':
          toast.success(`${value} Day Streak!`, {
            description: description || 'Keep it going!',
            icon: '🔥',
            duration: 3000,
          });
          break;
        case 'challenge_complete':
          toast.success('Challenge Complete!', {
            description: description || `+${value} XP`,
            icon: '✨',
            duration: 2500,
          });
          break;
        case 'mystery_reward':
          toast.success('Mystery Reward!', {
            description: description || `+${value} XP`,
            icon: '🎁',
            duration: 3000,
          });
          break;
      }
    }

    // Sound feedback (placeholder for future sound system)
    if (soundEnabled) {
      // TODO: Integrate soundManager when implemented
      // playSound(getSoundForEvent(eventType));
    }
  }, [shouldThrottle, animationsEnabled, soundEnabled]);

  const showVisualEffect = useCallback((
    effectType: VisualEffect,
    targetElement?: HTMLElement,
    duration: number = 1000
  ) => {
    if (!animationsEnabled) return;

    // Visual effects are handled by individual components
    // This is a hook for triggering them
    const event = new CustomEvent('dopamine-effect', {
      detail: { effectType, targetElement, duration }
    });
    window.dispatchEvent(event);
  }, [animationsEnabled]);

  return {
    triggerMicroFeedback,
    showVisualEffect,
  };
};
