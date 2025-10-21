import { memo } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface XPProgressBarProps {
  currentXP: number;
  currentLevel: number;
  xpForNextLevel: number;
  showDetails?: boolean;
  className?: string;
}

const XPProgressBarComponent = ({ 
  currentXP, 
  currentLevel, 
  xpForNextLevel,
  showDetails = true,
  className = ''
}: XPProgressBarProps) => {
  const progress = (currentXP / xpForNextLevel) * 100;
  const xpNeeded = xpForNextLevel - currentXP;

  return (
    <div className={`space-y-2 ${className}`}>
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-1.5 rounded-lg bg-primary/10"
            >
              <Zap className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="font-semibold">Level {currentLevel}</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-help">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="font-medium">{currentXP.toLocaleString()} XP</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold mb-1">Experience Points</p>
                <p className="text-xs">{xpNeeded.toLocaleString()} XP needed for level {currentLevel + 1}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      <div className="relative">
        <Progress value={progress} className="h-3 bg-muted/30" />
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div 
            className="h-full bg-gradient-to-r from-primary/20 via-primary/30 to-transparent"
            style={{ width: `${progress}%` }}
          />
        </motion.div>
      </div>

      {showDetails && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress.toFixed(1)}% to next level</span>
          <span>{xpNeeded.toLocaleString()} XP needed</span>
        </div>
      )}
    </div>
  );
};

export const XPProgressBar = memo(XPProgressBarComponent);
