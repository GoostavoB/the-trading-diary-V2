import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, Target, DollarSign, BarChart3, ThumbsUp, Zap, Scale } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import type { Trade } from '@/types/trade';

interface WeeklyReviewProps {
  trades: Trade[];
}

interface WeeklyStats {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  avgWin: number;
  avgLoss: number;
  bestDay: { date: string; pnl: number };
  worstDay: { date: string; pnl: number };
  topAsset: { symbol: string; pnl: number };
  weekStart: Date;
  weekEnd: Date;
}

const WeeklyReviewComponent = ({ trades }: WeeklyReviewProps) => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const weeklyStats = useMemo(() => {
    const today = new Date();
    const targetDate = addWeeks(today, currentWeekOffset);
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 }); // Sunday

    const weekTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.trade_date);
      return tradeDate >= weekStart && tradeDate <= weekEnd;
    });

    if (weekTrades.length === 0) {
      return {
        totalPnl: 0,
        winRate: 0,
        totalTrades: 0,
        avgWin: 0,
        avgLoss: 0,
        bestDay: { date: '', pnl: 0 },
        worstDay: { date: '', pnl: 0 },
        topAsset: { symbol: '', pnl: 0 },
        weekStart,
        weekEnd,
      };
    }

    const totalPnl = weekTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningTrades = weekTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = weekTrades.filter(t => (t.pnl || 0) < 0);
    const winRate = (winningTrades.length / weekTrades.length) * 100;

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
      : 0;

    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
      : 0;

    // Daily performance
    const dailyPnl: Record<string, number> = {};
    weekTrades.forEach(trade => {
      const day = new Date(trade.trade_date).toDateString();
      dailyPnl[day] = (dailyPnl[day] || 0) + (trade.pnl || 0);
    });

    const days = Object.entries(dailyPnl);
    const bestDay = days.reduce((best, [date, pnl]) => 
      pnl > best.pnl ? { date, pnl } : best
    , { date: '', pnl: -Infinity });

    const worstDay = days.reduce((worst, [date, pnl]) => 
      pnl < worst.pnl ? { date, pnl } : worst
    , { date: '', pnl: Infinity });

    // Asset performance
    const assetPnl: Record<string, number> = {};
    weekTrades.forEach(trade => {
      assetPnl[trade.symbol] = (assetPnl[trade.symbol] || 0) + (trade.pnl || 0);
    });

    const topAsset = Object.entries(assetPnl).reduce((top, [symbol, pnl]) => 
      pnl > top.pnl ? { symbol, pnl } : top
    , { symbol: '', pnl: -Infinity });

    return {
      totalPnl,
      winRate,
      totalTrades: weekTrades.length,
      avgWin,
      avgLoss,
      bestDay: bestDay.pnl !== -Infinity ? bestDay : { date: '', pnl: 0 },
      worstDay: worstDay.pnl !== Infinity ? worstDay : { date: '', pnl: 0 },
      topAsset: topAsset.pnl !== -Infinity ? topAsset : { symbol: '', pnl: 0 },
      weekStart,
      weekEnd,
    };
  }, [trades, currentWeekOffset]);

  const goToPreviousWeek = useCallback(() => setCurrentWeekOffset(prev => prev - 1), []);
  const goToNextWeek = useCallback(() => setCurrentWeekOffset(prev => prev + 1), []);
  const goToCurrentWeek = useCallback(() => setCurrentWeekOffset(0), []);

  if (!weeklyStats) return null;

  const isCurrentWeek = currentWeekOffset === 0;

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Weekly Review
          </h3>
          <p className="text-sm text-muted-foreground">
            {format(weeklyStats.weekStart, 'MMM dd')} - {format(weeklyStats.weekEnd, 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={goToPreviousWeek}>
            Previous
          </Button>
          {!isCurrentWeek && (
            <Button size="sm" variant="outline" onClick={goToCurrentWeek}>
              Current Week
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={goToNextWeek}
            disabled={isCurrentWeek}
          >
            Next
          </Button>
        </div>
      </div>

      {weeklyStats.totalTrades === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No trades recorded for this week</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={`p-4 ${
              weeklyStats.totalPnl > 0 
                ? 'bg-neon-green/10 border-neon-green/30' 
                : weeklyStats.totalPnl < 0
                ? 'bg-neon-red/10 border-neon-red/30'
                : 'bg-muted/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total P&L</span>
              </div>
              <div className={`text-2xl font-bold ${
                weeklyStats.totalPnl > 0 
                  ? 'text-neon-green' 
                  : weeklyStats.totalPnl < 0
                  ? 'text-neon-red'
                  : ''
              }`}>
                ${weeklyStats.totalPnl.toFixed(2)}
              </div>
            </Card>

            <Card className="p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Win Rate</span>
              </div>
              <div className={`text-2xl font-bold ${
                weeklyStats.winRate >= 70 ? 'text-neon-green' : ''
              }`}>
                {weeklyStats.winRate.toFixed(1)}%
              </div>
            </Card>

            <Card className="p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total Trades</span>
              </div>
              <div className="text-2xl font-bold">
                {weeklyStats.totalTrades}
              </div>
            </Card>

            <Card className="p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-neon-green" />
                <span className="text-xs text-muted-foreground">Avg Win</span>
              </div>
              <div className="text-2xl font-bold text-neon-green">
                ${weeklyStats.avgWin.toFixed(2)}
              </div>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-neon-green/10 to-transparent border-neon-green/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-neon-green" />
                <h4 className="font-semibold text-sm">Best Day</h4>
              </div>
              {weeklyStats.bestDay.date ? (
                <>
                  <p className="text-xs text-muted-foreground mb-1">
                    {format(new Date(weeklyStats.bestDay.date), 'EEEE, MMM dd')}
                  </p>
                  <p className="text-xl font-bold text-neon-green">
                    +${weeklyStats.bestDay.pnl.toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No data</p>
              )}
            </Card>

            <Card className="p-4 bg-gradient-to-br from-neon-red/10 to-transparent border-neon-red/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-neon-red" />
                <h4 className="font-semibold text-sm">Worst Day</h4>
              </div>
              {weeklyStats.worstDay.date ? (
                <>
                  <p className="text-xs text-muted-foreground mb-1">
                    {format(new Date(weeklyStats.worstDay.date), 'EEEE, MMM dd')}
                  </p>
                  <p className="text-xl font-bold text-neon-red">
                    ${weeklyStats.worstDay.pnl.toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No data</p>
              )}
            </Card>

            <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-sm">Top Asset</h4>
              </div>
              {weeklyStats.topAsset.symbol ? (
                <>
                  <Badge variant="outline" className="mb-2">
                    {weeklyStats.topAsset.symbol}
                  </Badge>
                  <p className="text-xl font-bold text-neon-green">
                    +${weeklyStats.topAsset.pnl.toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No data</p>
              )}
            </Card>
          </div>

          {/* Performance Analysis */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Week Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Win:</span>
                <span className="font-medium text-neon-green">
                  ${weeklyStats.avgWin.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Loss:</span>
                <span className="font-medium text-neon-red">
                  ${weeklyStats.avgLoss.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Win/Loss Ratio:</span>
                <span className="font-medium">
                  {weeklyStats.avgLoss > 0 
                    ? (weeklyStats.avgWin / weeklyStats.avgLoss).toFixed(2) 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </Card>

          {/* Weekly Insights */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
            <h4 className="font-semibold mb-3">💡 Key Insights</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {weeklyStats.totalPnl > 0 ? (
                <p>✅ Great week! You're up ${weeklyStats.totalPnl.toFixed(2)}. Keep executing your strategy.</p>
              ) : (
                <p>⚠️ Down ${Math.abs(weeklyStats.totalPnl).toFixed(2)} this week. Review what went wrong and adjust.</p>
              )}
              
              {weeklyStats.winRate >= 70 ? (
                <p><Target className="inline h-4 w-4 mr-1 text-primary" />Excellent {weeklyStats.winRate.toFixed(1)}% win rate! You're in the zone.</p>
              ) : weeklyStats.winRate >= 50 ? (
                <p><ThumbsUp className="inline h-4 w-4 mr-1 text-primary" />Solid {weeklyStats.winRate.toFixed(1)}% win rate. Focus on improving risk/reward.</p>
              ) : (
                <p><TrendingDown className="inline h-4 w-4 mr-1 text-secondary" />Win rate at {weeklyStats.winRate.toFixed(1)}%. Time to review your setups and cut losses faster.</p>
              )}
              
              {weeklyStats.avgWin > weeklyStats.avgLoss * 2 ? (
                <p><Zap className="inline h-4 w-4 mr-1 text-primary" />Your average wins are more than 2x your average losses. Excellent risk management!</p>
              ) : (
                <p><Scale className="inline h-4 w-4 mr-1 text-muted-foreground" />Work on letting winners run. Your average win should be at least 2x your average loss.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};

export const WeeklyReview = memo(WeeklyReviewComponent);
