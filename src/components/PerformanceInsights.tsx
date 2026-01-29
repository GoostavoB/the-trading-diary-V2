import { memo } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Trophy, Target } from 'lucide-react';
import type { Trade } from '@/types/trade';
import { formatPercent } from '@/utils/formatNumber';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { useCurrency } from '@/contexts/CurrencyContext';
import { calculateTradePnL, calculateTotalPnL } from '@/utils/pnl';

interface PerformanceInsightsProps {
  trades: Trade[];
}

export const PerformanceInsights = memo(({ trades }: PerformanceInsightsProps) => {
  const { formatAmount } = useCurrency();
  if (!trades.length) return null;

  // Calculate insights
  const totalPnl = calculateTotalPnL(trades, { includeFees: true });
  const winningTrades = trades.filter(t => calculateTradePnL(t, { includeFees: true }) > 0);
  const losingTrades = trades.filter(t => calculateTradePnL(t, { includeFees: true }) < 0);
  const winRate = (winningTrades.length / trades.length) * 100;

  const avgWin = winningTrades.length > 0
    ? calculateTotalPnL(winningTrades, { includeFees: true }) / winningTrades.length
    : 0;

  const avgLoss = losingTrades.length > 0
    ? Math.abs(calculateTotalPnL(losingTrades, { includeFees: true }) / losingTrades.length)
    : 0;

  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

  // Best and worst trades
  const bestTrade = trades.reduce((best, t) =>
    calculateTradePnL(t, { includeFees: true }) > calculateTradePnL(best, { includeFees: true }) ? t : best
    , trades[0]);

  const worstTrade = trades.reduce((worst, t) =>
    calculateTradePnL(t, { includeFees: true }) < calculateTradePnL(worst, { includeFees: true }) ? t : worst
    , trades[0]);

  // Generate insights
  const insights: Array<{
    type: 'success' | 'warning' | 'danger' | 'info';
    icon: any;
    title: string;
    message: string;
  }> = [];

  // Win rate insight
  if (winRate >= 70) {
    insights.push({
      type: 'success',
      icon: Trophy,
      title: 'Excellent Win Rate',
      message: `You're crushing it with a ${formatPercent(winRate)} win rate! Keep your discipline.`
    });
  } else if (winRate >= 50) {
    insights.push({
      type: 'info',
      icon: Target,
      title: 'Solid Win Rate',
      message: `${formatPercent(winRate)} win rate shows consistency. Focus on risk management.`
    });
  } else {
    insights.push({
      type: 'warning',
      icon: AlertCircle,
      title: 'Win Rate Below 50%',
      message: `At ${formatPercent(winRate)}, review your strategy and cut losses faster.`
    });
  }

  // Profit factor insight
  if (profitFactor >= 2) {
    insights.push({
      type: 'success',
      icon: CheckCircle2,
      title: 'Strong Profit Factor',
      message: `Your average win is ${profitFactor.toFixed(1)}x your average loss. Excellent risk/reward!`
    });
  } else if (profitFactor >= 1.5) {
    insights.push({
      type: 'info',
      icon: TrendingUp,
      title: 'Good Profit Factor',
      message: `Profit factor of ${profitFactor.toFixed(1)} is solid. Aim to increase your average wins.`
    });
  } else if (profitFactor > 0) {
    insights.push({
      type: 'warning',
      icon: AlertCircle,
      title: 'Low Profit Factor',
      message: `At ${profitFactor.toFixed(1)}, your average wins aren't much bigger than losses. Tighten your stops.`
    });
  }

  // Overall performance
  if (totalPnl > 0) {
    insights.push({
      type: 'success',
      icon: TrendingUp,
      title: 'Profitable Overall',
      message: `Total P&L of ${formatAmount(totalPnl)}. Stay consistent with your winning strategy.`
    });
  } else if (totalPnl < 0) {
    insights.push({
      type: 'danger',
      icon: TrendingDown,
      title: 'Drawdown Alert',
      message: `Down ${formatAmount(Math.abs(totalPnl))}. Take a break, review your trades, and refocus.`
    });
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-neon-green/30 bg-neon-green/5';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'danger':
        return 'border-neon-red/30 bg-neon-red/5';
      default:
        return 'border-primary/30 bg-primary/5';
    }
  };

  const getIconStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-neon-green';
      case 'warning':
        return 'text-yellow-500';
      case 'danger':
        return 'text-neon-red';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold" id="performance-insights">Performance Insights</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <PremiumCard
              key={index}
              className={`p-4 ${getTypeStyles(insight.type)} border-2 transition-all duration-300 hover:scale-[1.02] animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
              role="article"
              aria-labelledby={`insight-${index}-title`}
            >
              <div className="flex gap-3">
                <div className={`flex-shrink-0 ${getIconStyles(insight.type)}`} aria-hidden="true">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 id={`insight-${index}-title`} className="font-semibold text-sm">{insight.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.message}
                  </p>
                </div>
              </div>
            </PremiumCard>
          );
        })}
      </div>

      {/* Best & Worst Trade Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <PremiumCard className="p-4 bg-gradient-to-br from-neon-green/10 to-transparent border-neon-green/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-neon-green" aria-hidden="true" />
              <h4 className="font-semibold text-sm">Best Trade</h4>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Symbol</span>
              <Badge variant="outline" className="text-xs">{bestTrade.symbol}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">P&L</span>
              <span className="text-sm font-bold text-neon-green">
                <BlurredCurrency amount={bestTrade.profit_loss || 0} />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ROI</span>
              <span className="text-sm font-bold text-neon-green">
                +{formatPercent(bestTrade.roi || 0)}
              </span>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-4 bg-gradient-to-br from-neon-red/10 to-transparent border-neon-red/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-neon-red" aria-hidden="true" />
              <h4 className="font-semibold text-sm">Worst Trade</h4>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Symbol</span>
              <Badge variant="outline" className="text-xs">{worstTrade.symbol}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">P&L</span>
              <span className="text-sm font-bold text-neon-red">
                <BlurredCurrency amount={worstTrade.profit_loss || 0} />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ROI</span>
              <span className="text-sm font-bold text-neon-red">
                {formatPercent(worstTrade.roi || 0)}
              </span>
            </div>
          </div>
        </PremiumCard>
      </div>
    </div>
  );
});

PerformanceInsights.displayName = 'PerformanceInsights';
