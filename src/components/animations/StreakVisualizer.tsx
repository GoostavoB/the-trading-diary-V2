import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakVisualizerProps {
  streakDays: number;
  isAtRisk?: boolean;
  className?: string;
}

export const StreakVisualizer = ({ 
  streakDays, 
  isAtRisk = false,
  className = '' 
}: StreakVisualizerProps) => {
  const getFlameColor = () => {
    if (isAtRisk) return 'text-orange-500';
    if (streakDays >= 30) return 'text-purple-500';
    if (streakDays >= 14) return 'text-yellow-500';
    if (streakDays >= 7) return 'text-orange-500';
    return 'text-red-500';
  };

  const getIntensity = () => {
    if (streakDays >= 30) return 'high';
    if (streakDays >= 7) return 'medium';
    return 'low';
  };

  const intensity = getIntensity();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        animate={{
          scale: intensity === 'high' ? [1, 1.2, 1] : intensity === 'medium' ? [1, 1.1, 1] : [1, 1.05, 1],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Flame className={`w-6 h-6 ${getFlameColor()}`} fill="currentColor" />
      </motion.div>

      <div className="flex flex-col">
        <motion.span
          className="text-2xl font-bold"
          animate={isAtRisk ? { color: ['#f97316', '#ef4444', '#f97316'] } : {}}
          transition={{ duration: 1, repeat: isAtRisk ? Infinity : 0 }}
        >
          {streakDays}
        </motion.span>
        <span className="text-xs text-muted-foreground">
          {isAtRisk ? 'At Risk!' : 'Day Streak'}
        </span>
      </div>

      {isAtRisk && (
        <motion.div
          className="text-xs text-orange-500 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Trade today!
        </motion.div>
      )}
    </div>
  );
};
