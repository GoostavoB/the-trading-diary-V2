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
    <PremiumCard className="h-full bg-card border-border flex flex-col overflow-hidden">
      <div className="p-3 flex flex-col h-full overflow-hidden">
        {/* Compact 2x3 grid for stacked layout */}
        <div className="grid grid-cols-3 grid-rows-2 gap-2 flex-1 min-h-0">
          {/* Avg Holding Time */}
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center min-h-0">
            <Clock className="w-3.5 h-3.5 text-primary mb-0.5" />
            <span className="text-xs font-bold truncate">{avgHoldingTime}</span>
            <span className="text-[8px] text-muted-foreground uppercase">{t('insights.avgHoldingTime') || 'HOLD'}</span>
          </div>

          {/* Avg Position Size */}
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center min-h-0">
            <DollarSign className="w-3.5 h-3.5 text-primary mb-0.5" />
            <span className="text-xs font-bold truncate">{formatCurrency(avgPositionSize)}</span>
            <span className="text-[8px] text-muted-foreground uppercase">{t('insights.avgPositionSize') || 'SIZE'}</span>
          </div>

          {/* Avg Leverage */}
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center min-h-0">
            <Activity className="w-3.5 h-3.5 text-primary mb-0.5" />
            <span className="text-xs font-bold">{avgLeverage.toFixed(1)}x</span>
            <span className="text-[8px] text-muted-foreground uppercase">{t('insights.avgLeverage') || 'LEVER'}</span>
          </div>

          {/* Best Day of Week */}
          <div className="p-2 rounded-lg bg-profit/10 border border-profit/30 flex flex-col items-center justify-center text-center min-h-0 col-span-1">
            <TrendingUp className="w-3.5 h-3.5 text-profit mb-0.5" />
            <span className="text-xs font-bold text-profit">{bestDay.day}</span>
            <span className="text-[8px] text-muted-foreground uppercase">{t('insights.bestDayOfWeek') || 'BEST'}</span>
          </div>

          {/* Worst Day of Week */}
          <div className="p-2 rounded-lg bg-loss/10 border border-loss/30 flex flex-col items-center justify-center text-center min-h-0 col-span-1">
            <TrendingDown className="w-3.5 h-3.5 text-loss mb-0.5" />
            <span className="text-xs font-bold text-loss">{worstDay.day}</span>
            <span className="text-[8px] text-muted-foreground uppercase">{t('insights.worstDayOfWeek') || 'WORST'}</span>
          </div>

          {/* Total days placeholder */}
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center min-h-0">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
            <span className="text-xs font-bold">{trades.length}</span>
            <span className="text-[8px] text-muted-foreground uppercase">TRADES</span>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
});

BehaviorAnalytics.displayName = 'BehaviorAnalytics';
