import { memo, useState } from 'react';
import { Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDailyVisitStreak } from '@/hooks/useDailyVisitStreak';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const DailyStreakFlameComponent = () => {
  const { currentStreak, longestStreak, isNewRecord, isLoading } = useDailyVisitStreak();
  const [hasShownRecord, setHasShownRecord] = useState(false);

  // Show toast for new record (only once per session)
  if (isNewRecord && !hasShownRecord && currentStreak > 1) {
    setHasShownRecord(true);
    toast.success(`🔥 New Record! ${currentStreak} day streak!`, {
      duration: 5000,
      description: 'You\'re on fire! Keep the momentum going!',
    });
  }

  if (isLoading || currentStreak === 0) {
    return null;
  }

  // Calculate flame intensity based on streak
  const getFlameSize = () => {
    if (currentStreak >= 30) return 'h-10 w-10';
    if (currentStreak >= 14) return 'h-9 w-9';
    if (currentStreak >= 7) return 'h-8 w-8';
    if (currentStreak >= 3) return 'h-7 w-7';
    return 'h-6 w-6';
  };

  const getFlameColor = () => {
    if (currentStreak >= 30) return 'text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]';
    if (currentStreak >= 14) return 'text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.7)]';
    if (currentStreak >= 7) return 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]';
    if (currentStreak >= 3) return 'text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]';
    return 'text-orange-500 drop-shadow-[0_0_4px_rgba(249,115,22,0.4)]';
  };

  const getAnimationIntensity = () => {
    if (currentStreak >= 30) return { scale: [1, 1.3, 1], rotate: [0, 5, -5, 0] };
    if (currentStreak >= 14) return { scale: [1, 1.25, 1], rotate: [0, 4, -4, 0] };
    if (currentStreak >= 7) return { scale: [1, 1.2, 1], rotate: [0, 3, -3, 0] };
    if (currentStreak >= 3) return { scale: [1, 1.15, 1], rotate: [0, 2, -2, 0] };
    return { scale: [1, 1.1, 1], rotate: [0, 2, -2, 0] };
  };

  const getMilestoneMessage = () => {
    if (currentStreak >= 30) return '🔥 LEGENDARY STREAK! 🔥';
    if (currentStreak >= 14) return '💪 Two Week Warrior!';
    if (currentStreak >= 7) return '🎯 Week Streak Master!';
    if (currentStreak >= 3) return '🚀 Building Momentum!';
    return '✨ Keep it going!';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className="relative inline-flex items-center gap-1.5 cursor-pointer group"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: 'spring', 
              stiffness: 260, 
              damping: 20,
              delay: 0.2 
            }}
          >
            <AnimatePresence>
              <motion.div
                animate={getAnimationIntensity()}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Flame 
                  className={`${getFlameSize()} ${getFlameColor()} transition-all duration-300`}
                  fill="currentColor"
                />
              </motion.div>
            </AnimatePresence>
            
            <motion.span
              className="text-lg font-bold text-orange-500 tabular-nums"
              animate={{ 
                scale: currentStreak >= 7 ? [1, 1.05, 1] : 1 
              }}
              transition={{
                duration: 1.5,
                repeat: currentStreak >= 7 ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              {currentStreak}
            </motion.span>

            {/* Particle effects for high streaks */}
            {currentStreak >= 7 && (
              <motion.div
                className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-400"
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-xs glass-strong border-orange-500/20"
        >
          <div className="space-y-2 p-1">
            <p className="font-bold text-orange-500 text-center">
              {getMilestoneMessage()}
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Current Streak:</span>
                <span className="font-semibold text-orange-500">
                  {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Best Streak:</span>
                <span className="font-semibold">
                  {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center pt-1 border-t border-border/50">
              Visit daily to keep your streak alive!
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const DailyStreakFlame = memo(DailyStreakFlameComponent);
