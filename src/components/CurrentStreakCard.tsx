import { GlassCard } from "@/components/ui/glass-card";
import { Flame, TrendingDown } from "lucide-react";
import { useThemeMode } from "@/hooks/useThemeMode";

interface CurrentStreakCardProps {
  streak: number;
  type: 'winning' | 'losing';
  className?: string;
}

export const CurrentStreakCard = ({ streak, type, className }: CurrentStreakCardProps) => {
  const { colors } = useThemeMode();
  const isWinning = type === 'winning';
  
  return (
    <GlassCard hover className={className}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
          <div className={`p-2 rounded-xl ${isWinning ? 'bg-primary/10' : 'bg-secondary/10'}`}>
            {isWinning ? (
              <Flame className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-secondary" />
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <p 
            className="text-3xl font-bold tracking-tight"
            style={{ color: isWinning ? colors.positive : colors.negative }}
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
