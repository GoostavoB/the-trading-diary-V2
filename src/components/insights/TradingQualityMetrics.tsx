import { memo } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingDown, Activity, Shield } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { getRiskRewardRatio } from '@/utils/insightCalculations';

interface TradingQualityMetricsProps {
  avgWin: number;
  avgLoss: number;
  winCount: number;
  lossCount: number;
  maxDrawdownPercent: number;
  maxDrawdownAmount: number;
  profitFactor: number;
}

export const TradingQualityMetrics = memo(({
  avgWin,
  avgLoss,
  winCount,
  lossCount,
  maxDrawdownPercent,
  maxDrawdownAmount,
  profitFactor
}: TradingQualityMetricsProps) => {
  const { t } = useTranslation();

  const totalTrades = winCount + lossCount;
  if (totalTrades === 0) {
    return (
      <PremiumCard className="h-full bg-card border-border">
        <div className="p-3 text-center py-4">
          <p className="text-xs text-muted-foreground">{t('insights.noDataAvailable') || 'No data available'}</p>
        </div>
      </PremiumCard>
    );
  }

  const riskReward = getRiskRewardRatio(avgWin, avgLoss);
  const winRatePercent = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

  const getScoreColor = (score: number, thresholds: { good: number; ok: number }) => {
    if (score >= thresholds.good) return 'text-profit';
    if (score >= thresholds.ok) return 'text-yellow-500';
    return 'text-loss';
  };

  const getProgressColor = (score: number, thresholds: { good: number; ok: number }) => {
    if (score >= thresholds.good) return '[&>div]:bg-profit';
    if (score >= thresholds.ok) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-loss';
  };

  return (
    <PremiumCard className="h-full bg-card border-border flex flex-col">
      <div className="p-3 flex flex-col h-full">
        {/* Compact header */}
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">{t('insights.tradingQuality')}</h3>
        </div>

        {/* 2x2 Grid of metrics */}
        <div className="grid grid-cols-2 gap-2 flex-1">
          {/* Risk-to-Reward */}
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">R:R</span>
            </div>
            <div className={cn("text-base font-bold", getScoreColor(riskReward, { good: 1.5, ok: 1 }))}>
              {riskReward.toFixed(2)}:1
            </div>
            <Progress
              value={Math.min(riskReward * 50, 100)}
              className={cn("h-1 mt-1", getProgressColor(riskReward, { good: 1.5, ok: 1 }))}
            />
          </div>

          {/* Win/Loss Distribution */}
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">W/L</span>
            </div>
            <div className="text-base font-bold">
              <span className="text-profit">{winCount}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-loss">{lossCount}</span>
            </div>
            <Progress
              value={winRatePercent}
              className={cn("h-1 mt-1", getProgressColor(winRatePercent, { good: 60, ok: 50 }))}
            />
          </div>

          {/* Max Drawdown */}
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">DD</span>
            </div>
            <div className={cn(
              "text-base font-bold",
              maxDrawdownPercent > 30 ? 'text-loss' :
                maxDrawdownPercent > 20 ? 'text-yellow-500' : 'text-profit'
            )}>
              -{formatPercent(maxDrawdownPercent)}
            </div>
            <Progress
              value={Math.min(maxDrawdownPercent, 100)}
              className={cn(
                "h-1 mt-1",
                maxDrawdownPercent > 30 ? '[&>div]:bg-loss' :
                  maxDrawdownPercent > 20 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-profit'
              )}
            />
          </div>

          {/* Profit Factor */}
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">PF</span>
            </div>
            <div className={cn("text-base font-bold", getScoreColor(profitFactor, { good: 1.5, ok: 1 }))}>
              {profitFactor.toFixed(2)}
            </div>
            <Progress
              value={Math.min(profitFactor * 50, 100)}
              className={cn("h-1 mt-1", getProgressColor(profitFactor, { good: 1.5, ok: 1 }))}
            />
          </div>
        </div>
      </div>
    </PremiumCard>
  );
});

TradingQualityMetrics.displayName = 'TradingQualityMetrics';
