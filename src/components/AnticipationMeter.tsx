import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target } from 'lucide-react';

interface AnticipationMeterProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
  description?: string;
  className?: string;
}

export const AnticipationMeter = ({
  title,
  current,
  target,
  unit = '',
  description,
  className = '',
}: AnticipationMeterProps) => {
  const progress = (current / target) * 100;
  const remaining = target - current;
  const isClose = progress >= 80;
  const isVeryClose = progress >= 95;

  return (
    <div className={`p-4 glass rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Target className="w-4 h-4" />
          {title}
        </h3>
        <span className="text-xs text-muted-foreground">
          {remaining.toFixed(0)} {unit} remaining
        </span>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
      )}

      <div className="space-y-2">
        <div className="relative">
          <Progress 
            value={progress} 
            className="h-3"
          />
          {isVeryClose && (
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  '0 0 0 rgba(139, 92, 246, 0)',
                  '0 0 20px rgba(139, 92, 246, 0.6)',
                  '0 0 0 rgba(139, 92, 246, 0)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className={isClose ? 'text-primary font-medium' : 'text-muted-foreground'}>
            {current.toFixed(0)} / {target} {unit}
          </span>
          <motion.span
            className="flex items-center gap-1"
            animate={isVeryClose ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <TrendingUp className="w-3 h-3" />
            {progress.toFixed(1)}%
          </motion.span>
        </div>

        {isClose && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-primary font-medium text-center"
          >
            {isVeryClose ? '🎉 Almost there!' : '💪 Getting close!'}
          </motion.div>
        )}
      </div>
    </div>
  );
};
