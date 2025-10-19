import { CheckCircle, TrendingUp, Award, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Trade } from '@/types/trade';
import { startOfMonth, endOfMonth } from 'date-fns';

interface MonthSummaryInsightsProps {
  trades: Trade[];
}

export const MonthSummaryInsights = ({ trades }: MonthSummaryInsightsProps) => {
  // Get current month trades
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthTrades = trades.filter(t => {
    const tradeDate = new Date(t.trade_date);
    return tradeDate >= monthStart && tradeDate <= monthEnd;
  });

  if (monthTrades.length === 0) return null;

  const totalPnl = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = monthTrades.filter(t => (t.pnl || 0) > 0);
  const losingTrades = monthTrades.filter(t => (t.pnl || 0) < 0);
  const winRate = monthTrades.length > 0 ? (winningTrades.length / monthTrades.length) * 100 : 0;

  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
    : 0;
  
  const avgLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
    : 0;

  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

  // Generate insights
  const insights = [];
  
  if (totalPnl > 0) {
    insights.push({
      icon: CheckCircle,
      text: `Great month! You finished with $${totalPnl.toFixed(2)} profit. Keep executing your plan.`,
      color: 'text-neon-green'
    });
  } else if (totalPnl < 0) {
    insights.push({
      icon: CheckCircle,
      text: `Challenging month with $${Math.abs(totalPnl).toFixed(2)} loss. Review and adjust.`,
      color: 'text-muted-foreground'
    });
  }

  if (winRate >= 70) {
    insights.push({
      icon: TrendingUp,
      text: `Outstanding ${winRate.toFixed(1)}% win rate! You're trading at an elite level.`,
      color: 'text-neon-green'
    });
  } else if (winRate >= 50) {
    insights.push({
      icon: TrendingUp,
      text: `Solid ${winRate.toFixed(1)}% win rate. Focus on letting winners run.`,
      color: 'text-muted-foreground'
    });
  }

  if (profitFactor >= 2) {
    insights.push({
      icon: Award,
      text: `Excellent ${profitFactor.toFixed(2)} profit factor. Your winners outweigh your losers.`,
      color: 'text-neon-green'
    });
  }

  // Show max 3 insights
  const displayInsights = insights.slice(0, 3);

  if (displayInsights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
      {displayInsights.map((insight, idx) => {
        const Icon = insight.icon;
        return (
          <div
            key={idx}
            className="p-3 lg:p-4 rounded-xl bg-muted/30 backdrop-blur-sm flex items-start gap-3 transition-all hover:bg-muted/40 relative group"
          >
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${insight.color}`} />
            <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">
              {insight.text}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="glass-strong max-w-xs">
                  <p className="font-semibold mb-1">Performance Insight</p>
                  <p className="text-xs mb-2">AI-generated analysis based on your trading patterns this month.</p>
                  <p className="text-xs text-accent">Why it matters: Helps identify strengths and areas for improvement.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      })}
    </div>
  );
};