import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingDown, Activity, Shield } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { cn } from '@/lib/utils';
import { ExplainMetricButton } from '@/components/ExplainMetricButton';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
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
  const { openWithPrompt } = useAIAssistant();
  const { t } = useTranslation();

  // Add defensive check
  const totalTrades = winCount + lossCount;
  if (totalTrades === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('insights.noDataAvailable') || 'No data available'}</p>
        </div>
      </Card>
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
    <Card className="p-6 bg-card border-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t('insights.tradingQuality')}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('insights.riskManagement')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Risk-to-Reward Ratio */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('insights.riskReward')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-lg font-bold",
                getScoreColor(riskReward, { good: 1.5, ok: 1 })
              )}>
                {riskReward.toFixed(2)}:1
              </span>
              <ExplainMetricButton
                metricName={t('insights.riskReward')}
                metricValue={`${riskReward.toFixed(2)}:1`}
                onExplain={openWithPrompt}
                className="h-6 w-6"
              />
            </div>
          </div>
          <Progress 
            value={Math.min(riskReward * 50, 100)} 
            className={cn("h-2", getProgressColor(riskReward, { good: 1.5, ok: 1 }))}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('insights.avgWin')}: {formatCurrency(avgWin)} • {t('insights.avgLoss')}: {formatCurrency(Math.abs(avgLoss))}
          </p>
        </div>

        {/* Win/Loss Distribution */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('insights.winDistribution')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">
                <span className="text-profit">{winCount}W</span>
                <span className="text-muted-foreground"> | </span>
                <span className="text-loss">{lossCount}L</span>
              </span>
              <ExplainMetricButton
                metricName={t('insights.winDistribution')}
                metricValue={`${winCount} wins, ${lossCount} losses`}
                onExplain={openWithPrompt}
                className="h-6 w-6"
              />
            </div>
          </div>
          <Progress 
            value={winRatePercent} 
            className={cn("h-2", getProgressColor(winRatePercent, { good: 60, ok: 50 }))}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formatPercent(winRatePercent)} {t('dashboard.winRate').toLowerCase()}
          </p>
        </div>

        {/* Max Drawdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('insights.maxDrawdown')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-lg font-bold",
                maxDrawdownPercent > 30 ? 'text-loss' : 
                maxDrawdownPercent > 20 ? 'text-yellow-500' : 
                'text-profit'
              )}>
                -{formatPercent(maxDrawdownPercent)}
              </span>
              <ExplainMetricButton
                metricName={t('insights.maxDrawdown')}
                metricValue={`-${formatPercent(maxDrawdownPercent)}`}
                onExplain={openWithPrompt}
                className="h-6 w-6"
              />
            </div>
          </div>
          <Progress 
            value={Math.min(maxDrawdownPercent, 100)} 
            className={cn(
              "h-2",
              maxDrawdownPercent > 30 ? '[&>div]:bg-loss' : 
              maxDrawdownPercent > 20 ? '[&>div]:bg-yellow-500' : 
              '[&>div]:bg-profit'
            )}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(Math.abs(maxDrawdownAmount))} from peak
          </p>
        </div>

        {/* Profit Factor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('insights.profitFactor')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-lg font-bold",
                getScoreColor(profitFactor, { good: 1.5, ok: 1 })
              )}>
                {profitFactor.toFixed(2)}
              </span>
              <ExplainMetricButton
                metricName={t('insights.profitFactor')}
                metricValue={profitFactor.toFixed(2)}
                onExplain={openWithPrompt}
                className="h-6 w-6"
              />
            </div>
          </div>
          <Progress 
            value={Math.min(profitFactor * 50, 100)} 
            className={cn("h-2", getProgressColor(profitFactor, { good: 1.5, ok: 1 }))}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {profitFactor >= 1.5 ? 'Strong' : profitFactor >= 1 ? 'Fair' : 'Weak'} performance
          </p>
        </div>
      </div>
    </Card>
  );
});

TradingQualityMetrics.displayName = 'TradingQualityMetrics';
