import { memo } from 'react';
import { GlassCard } from "@/components/ui/glass-card";
import { Flame, TrendingDown } from "lucide-react";
import { useThemeMode } from "@/hooks/useThemeMode";

interface CurrentStreakCardProps {
  streak: number;
  type: 'winning' | 'losing';
  className?: string;
}

const CurrentStreakCardComponent = ({ streak, type, className }: CurrentStreakCardProps) => {
  const { colors } = useThemeMode();
  const isWinning = type === 'winning';
  
  return (
    <GlassCard 
      hover 
      className={className}
      role="article"
      aria-labelledby="current-streak-title"
      aria-describedby="current-streak-value"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 id="current-streak-title" className="text-sm font-medium text-muted-foreground">
            Current Streak
          </h3>
          <div className={`p-2 rounded-xl ${isWinning ? 'bg-primary/10' : 'bg-secondary/10'}`} aria-hidden="true">
            {isWinning ? (
              <Flame className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-secondary" />
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <p 
            id="current-streak-value"
            className="text-3xl font-bold tracking-tight"
            style={{ color: isWinning ? colors.positive : colors.negative }}
            aria-label={`${streak} ${isWinning ? 'winning' : 'losing'} trades in a row`}
          >
            {streak}
          </p>
          <p className="text-sm text-muted-foreground">
            {isWinning ? 'Winning' : 'Losing'} trades in a row
          </p>
        </div>
      </div>
    </GlassCard>
  );
};

export const CurrentStreakCard = memo(CurrentStreakCardComponent);
