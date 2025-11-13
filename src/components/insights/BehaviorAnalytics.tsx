import { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/formatNumber';
import { 
  calculateAvgHoldingTime, 
  calculateAvgPositionSize, 
  calculateAvgLeverage,
  analyzeHourlyPerformance,
  analyzeDayPerformance
} from '@/utils/insightCalculations';
import type { Trade } from '@/types/trade';
import { useTranslation } from '@/hooks/useTranslation';

interface BehaviorAnalyticsProps {
  trades: Trade[];
}

export const BehaviorAnalytics = memo(({ trades }: BehaviorAnalyticsProps) => {
  const { t } = useTranslation();
  
  // Add defensive check for trades
  if (!trades || trades.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('insights.noDataAvailable') || 'No data available'}</p>
        </div>
      </Card>
    );
  }
  
  const avgHoldingTime = useMemo(() => calculateAvgHoldingTime(trades), [trades]);
  const avgPositionSize = useMemo(() => calculateAvgPositionSize(trades), [trades]);
  const avgLeverage = useMemo(() => calculateAvgLeverage(trades), [trades]);
  const hourlyPerf = useMemo(() => analyzeHourlyPerformance(trades), [trades]);
  const dayPerf = useMemo(() => analyzeDayPerformance(trades), [trades]);

  const getTradingStyle = (hours: number): string => {
    if (hours < 1) return t('insights.scalper');
    if (hours < 4) return t('insights.dayTrader');
    if (hours < 24) return 'Intraday Trader';
    if (hours < 168) return t('insights.swingTrader');
    return t('insights.positionTrader');
  };

  const formatHoldingTime = (hours: number): string => {
    if (hours < 1) return `${(hours * 60).toFixed(0)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const formatHour = (hour: number): string => {
    const endHour = (hour + 1) % 24;
    return `${hour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00 UTC`;
  };

  const bestHour = hourlyPerf[0];
  const worstHour = hourlyPerf[hourlyPerf.length - 1];
  const bestDay = dayPerf[0];
  const worstDay = dayPerf[dayPerf.length - 1];

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {t('insights.behaviorPatterns')}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('insights.understandHabits')}
        </p>
      </div>

      <div className="space-y-4">
        {/* Holding Time */}
        <Card className="p-4 bg-muted/20 border-border transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">{t('insights.avgHoldingTime')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('insights.youreA')} <span className="font-semibold text-primary">{getTradingStyle(avgHoldingTime)}</span>
                </p>
              </div>
            </div>
            <p className="text-lg font-bold">
              {formatHoldingTime(avgHoldingTime)}
            </p>
          </div>
        </Card>

        {/* Position Sizing Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-muted/20 border-border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                {t('insights.avgPositionSize')}
              </p>
            </div>
            <p className="text-xl font-bold">{formatCurrency(avgPositionSize)}</p>
          </Card>

          <Card className="p-3 bg-muted/20 border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                {t('insights.avgLeverage')}
              </p>
            </div>
            <p className="text-xl font-bold">{avgLeverage.toFixed(1)}x</p>
          </Card>
        </div>

        {/* Best/Worst Trading Hours */}
        {bestHour && worstHour && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              {t('insights.bestTradingHours')}
            </p>
            <Card className="p-3 bg-profit/10 border-profit/30 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-profit/20 text-profit border-profit">
                    🏆
                  </Badge>
                  <span className="text-sm font-medium">
                    {formatHour(bestHour.hour)}
                  </span>
                </div>
                <span className="text-sm font-bold text-profit">
                  {bestHour.winRate.toFixed(0)}% {t('insights.wr')}
                </span>
              </div>
            </Card>

            <p className="text-xs font-semibold text-muted-foreground uppercase mt-3">
              {t('insights.worstTradingHours')}
            </p>
            <Card className="p-3 bg-loss/10 border-loss/30 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-loss/20 text-loss border-loss">
                    ⚠️
                  </Badge>
                  <span className="text-sm font-medium">
                    {formatHour(worstHour.hour)}
                  </span>
                </div>
                <span className="text-sm font-bold text-loss">
                  {worstHour.winRate.toFixed(0)}% {t('insights.wr')}
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Best/Worst Day of Week */}
        {bestDay && worstDay && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 bg-profit/10 border-profit/30">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-profit" />
                <p className="text-xs font-medium text-profit">{t('insights.bestDayOfWeek')}</p>
              </div>
              <p className="text-lg font-bold">{bestDay.day}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(bestDay.totalPnL)} • {bestDay.tradeCount} {t('insights.trades')}
              </p>
            </Card>

            <Card className="p-3 bg-loss/10 border-loss/30">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-loss" />
                <p className="text-xs font-medium text-loss">{t('insights.worstDayOfWeek')}</p>
              </div>
              <p className="text-lg font-bold">{worstDay.day}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(worstDay.totalPnL)} • {worstDay.tradeCount} {t('insights.trades')}
              </p>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
});

BehaviorAnalytics.displayName = 'BehaviorAnalytics';
