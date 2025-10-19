import { CheckCircle2, AlertCircle, Trophy, Target, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Trade } from '@/types/trade';

interface TradingStreaksProps {
  trades: Trade[];
}

export const TradingStreaks = ({ trades }: TradingStreaksProps) => {
  if (trades.length === 0) return null;

  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
  );

  // Calculate current streak
  let currentStreak = 0;
  let currentStreakType: 'win' | 'loss' | null = null;
  
  for (let i = sortedTrades.length - 1; i >= 0; i--) {
    const trade = sortedTrades[i];
    const isWin = (trade.pnl || 0) > 0;
    
    if (currentStreakType === null) {
      currentStreakType = isWin ? 'win' : 'loss';
      currentStreak = 1;
    } else if ((currentStreakType === 'win' && isWin) || (currentStreakType === 'loss' && !isWin)) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streaks
  let longestWinStreak = 0;
  let currentWinStreak = 0;
  let longestLossStreak = 0;
  let currentLossStreak = 0;

  sortedTrades.forEach(trade => {
    const isWin = (trade.pnl || 0) > 0;
    
    if (isWin) {
      currentWinStreak++;
      currentLossStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
    }
  });

  // Find consecutive trading days
  const tradingDays = new Set(sortedTrades.map(t => 
    new Date(t.trade_date).toDateString()
  ));
  
  const sortedDays = Array.from(tradingDays).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  let consecutiveDays = 1;
  let maxConsecutiveDays = 1;
  
  for (let i = 1; i < sortedDays.length; i++) {
    const prevDate = new Date(sortedDays[i - 1]);
    const currDate = new Date(sortedDays[i]);
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      consecutiveDays++;
      maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays);
    } else {
      consecutiveDays = 1;
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {/* Current Streak */}
      <div className={`p-3 lg:p-4 rounded-xl glass-subtle flex flex-col justify-center min-h-[80px] lg:min-h-[90px] transition-all hover:scale-[1.02] relative group`}>
        <div className="flex items-center gap-2 mb-2">
          {currentStreakType === 'win' ? (
            <CheckCircle2 className="w-4 h-4 text-neon-green" />
          ) : (
            <AlertCircle className="w-4 h-4 text-neon-red" />
          )}
          <span className="text-xs text-muted-foreground">Current Streak</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl lg:text-3xl font-bold ${
            currentStreakType === 'win' ? 'text-neon-green' : 'text-neon-red'
          }`}>
            {currentStreak}
          </span>
          <span className="text-xs text-muted-foreground">
            {currentStreakType === 'win' ? 'wins' : 'losses'}
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Info className="h-3 w-3 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="glass-strong max-w-xs">
              <p className="font-semibold mb-1">Current Streak</p>
              <p className="text-xs mb-2">Number of consecutive winning or losing trades from your most recent positions.</p>
              <p className="text-xs text-accent">Why it matters: Helps track momentum and emotional state in your trading.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Longest Win Streak */}
      <div className="p-3 lg:p-4 rounded-xl glass-subtle flex flex-col justify-center min-h-[80px] lg:min-h-[90px] transition-all hover:scale-[1.02] relative group">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-neon-green" />
          <span className="text-xs text-muted-foreground">Best Streak</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold text-neon-green">{longestWinStreak}</span>
          <span className="text-xs text-muted-foreground">wins</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Info className="h-3 w-3 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="glass-strong max-w-xs">
              <p className="font-semibold mb-1">Best Win Streak</p>
              <p className="text-xs mb-2">Your longest run of consecutive profitable trades.</p>
              <p className="text-xs text-accent">Why it matters: Represents your peak performance and strategy effectiveness.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Longest Loss Streak */}
      <div className="p-3 lg:p-4 rounded-xl glass-subtle flex flex-col justify-center min-h-[80px] lg:min-h-[90px] transition-all hover:scale-[1.02] relative group">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-neon-red" />
          <span className="text-xs text-muted-foreground">Max Drawdown</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold text-neon-red">{longestLossStreak}</span>
          <span className="text-xs text-muted-foreground">losses</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Info className="h-3 w-3 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="glass-strong max-w-xs">
              <p className="font-semibold mb-1">Maximum Drawdown Streak</p>
              <p className="text-xs mb-2">Your longest run of consecutive losing trades.</p>
              <p className="text-xs text-accent">Why it matters: Critical for risk management and maintaining discipline during tough periods.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Consecutive Trading Days */}
      <div className="p-3 lg:p-4 rounded-xl glass-subtle flex flex-col justify-center min-h-[80px] lg:min-h-[90px] transition-all hover:scale-[1.02] relative group">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Trading Days</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold text-primary">{maxConsecutiveDays}</span>
          <span className="text-xs text-muted-foreground">days</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Info className="h-3 w-3 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="glass-strong max-w-xs">
              <p className="font-semibold mb-1">Consecutive Trading Days</p>
              <p className="text-xs mb-2">Your longest streak of back-to-back trading days.</p>
              <p className="text-xs text-accent">Why it matters: Shows consistency and commitment to your trading routine.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
