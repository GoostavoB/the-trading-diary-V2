import { memo, useMemo } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Clock, DollarSign, Activity, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/formatNumber';
import {
  calculateAvgHoldingTime,
  calculateAvgPositionSize,
  calculateAvgLeverage,
  analyzeDayPerformance
} from '@/utils/insightCalculations';
import type { Trade } from '@/types/trade';
import { useTranslation } from '@/hooks/useTranslation';

interface BehaviorAnalyticsProps {
  trades: Trade[];
}

export const BehaviorAnalytics = memo(({ trades }: BehaviorAnalyticsProps) => {
  const { t } = useTranslation();

  if (!trades || trades.length === 0) {
    return (
      <PremiumCard className="h-full bg-card border-border">
        <div className="p-3 text-center py-4">
          <p className="text-xs text-muted-foreground">{t('insights.noDataAvailable') || 'No data available'}</p>
        </div>
      </PremiumCard>
    );
  }

  const avgHoldingTime = useMemo(() => calculateAvgHoldingTime(trades), [trades]);
  const avgPositionSize = useMemo(() => calculateAvgPositionSize(trades), [trades]);
  const avgLeverage = useMemo(() => calculateAvgLeverage(trades), [trades]);
  const dayPerf = useMemo(() => analyzeDayPerformance(trades), [trades]);

  const { bestDay, worstDay } = useMemo(() => {
    if (!dayPerf || dayPerf.length === 0) {
      return {
        bestDay: { day: 'N/A', totalPnL: 0, tradeCount: 0 },
        worstDay: { day: 'N/A', totalPnL: 0, tradeCount: 0 }
      };
    }
    const sorted = [...dayPerf].sort((a, b) => b.totalPnL - a.totalPnL);
    return {
      bestDay: sorted[0],
      worstDay: sorted[sorted.length - 1]
    };
  }, [dayPerf]);

  return (
    <PremiumCard className="h-full bg-card border-border flex flex-col">
      <div className="p-3 flex flex-col h-full">
        {/* Single row with 5 stat chips */}
        <div className="flex gap-2 flex-1 items-stretch">
          {/* Avg Holding Time */}
          <div className="flex-1 p-2 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center">
            <Clock className="w-4 h-4 text-primary mb-1" />
            <span className="text-sm font-bold">{avgHoldingTime}</span>
            <span className="text-[9px] text-muted-foreground uppercase">{t('insights.avgHoldingTime') || 'Hold Time'}</span>
          </div>

          {/* Avg Position Size */}
          <div className="flex-1 p-2 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center">
            <DollarSign className="w-4 h-4 text-primary mb-1" />
            <span className="text-sm font-bold">{formatCurrency(avgPositionSize)}</span>
            <span className="text-[9px] text-muted-foreground uppercase">{t('insights.avgPositionSize') || 'Avg Size'}</span>
          </div>

          {/* Avg Leverage */}
          <div className="flex-1 p-2 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center">
            <Activity className="w-4 h-4 text-primary mb-1" />
            <span className="text-sm font-bold">{avgLeverage.toFixed(1)}x</span>
            <span className="text-[9px] text-muted-foreground uppercase">{t('insights.avgLeverage') || 'Avg Lever'}</span>
          </div>

          {/* Best Day of Week */}
          <div className="flex-1 p-2 rounded-lg bg-profit/10 border border-profit/30 flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-4 h-4 text-profit mb-1" />
            <span className="text-sm font-bold text-profit">{bestDay.day}</span>
            <span className="text-[9px] text-muted-foreground uppercase">{t('insights.bestDayOfWeek') || 'Best Day'}</span>
          </div>

          {/* Worst Day of Week */}
          <div className="flex-1 p-2 rounded-lg bg-loss/10 border border-loss/30 flex flex-col items-center justify-center text-center">
            <TrendingDown className="w-4 h-4 text-loss mb-1" />
            <span className="text-sm font-bold text-loss">{worstDay.day}</span>
            <span className="text-[9px] text-muted-foreground uppercase">{t('insights.worstDayOfWeek') || 'Worst Day'}</span>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
});

BehaviorAnalytics.displayName = 'BehaviorAnalytics';
