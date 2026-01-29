import { memo } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Badge } from '@/components/ui/badge';
import { Trophy, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import type { Trade } from '@/types/trade';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { useTranslation } from '@/hooks/useTranslation';
import { findBestWorstDays } from '@/utils/insightCalculations';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import { calculateTradePnL } from '@/utils/pnl';

interface PerformanceHighlightsProps {
  trades: Trade[];
  bestTrade?: Trade;
  worstTrade?: Trade;
  currentStreak: { type: 'win' | 'loss'; count: number };
}

export const PerformanceHighlights = memo(({
  trades,
  bestTrade,
  worstTrade,
  currentStreak
}: PerformanceHighlightsProps) => {
  const { t } = useTranslation();

  if (!trades || trades.length === 0 || !bestTrade || !worstTrade) return null;

  const { best: bestDay, worst: worstDay } = findBestWorstDays(trades);
  const bestTradePnL = calculateTradePnL(bestTrade, { includeFees: true });
  const worstTradePnL = calculateTradePnL(worstTrade, { includeFees: true });
  const isSameDay = bestDay && worstDay && bestDay.date === worstDay.date;

  return (
    <PremiumCard className="h-full bg-card border-border flex flex-col overflow-hidden">
      <div className="p-3 flex flex-col h-full overflow-hidden">
        {/* Compact header */}
        <div className="flex items-center gap-2 mb-2 shrink-0">
          <Trophy className="w-4 h-4 text-profit" />
          <h3 className="text-sm font-semibold">{t('insights.performanceHighlights')}</h3>
        </div>

        {/* 2x2 grid that adapts to available space */}
        <div className="grid grid-cols-2 grid-rows-2 gap-2 flex-1 min-h-0 overflow-hidden">
          {/* Best Trade */}
          <div className="p-2 rounded-lg bg-profit/10 border border-profit/30 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-profit shrink-0" />
              <span className="text-[10px] font-medium text-profit uppercase truncate">{t('insights.bestTrade')}</span>
            </div>
            <Badge variant="outline" className="text-[10px] w-fit mb-1 px-1.5 py-0 shrink-0">
              {bestTrade.symbol || bestTrade.symbol_temp}
            </Badge>
            <div className="text-sm font-bold text-profit mt-auto">
              <BlurredCurrency amount={bestTradePnL} className="inline" />
            </div>
            <span className="text-[10px] text-profit">+{formatPercent(bestTrade.roi || 0)}</span>
          </div>

          {/* Worst Trade */}
          <div className="p-2 rounded-lg bg-loss/10 border border-loss/30 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-1 mb-1">
              <AlertCircle className="w-3 h-3 text-loss shrink-0" />
              <span className="text-[10px] font-medium text-loss uppercase truncate">{t('insights.worstTrade')}</span>
            </div>
            <Badge variant="outline" className="text-[10px] w-fit mb-1 px-1.5 py-0 shrink-0">
              {worstTrade.symbol || worstTrade.symbol_temp}
            </Badge>
            <div className="text-sm font-bold text-loss mt-auto">
              <BlurredCurrency amount={worstTradePnL} className="inline" />
            </div>
            <span className="text-[10px] text-loss">{formatPercent(worstTrade.roi || 0)}</span>
          </div>

          {/* Best Day */}
          <div className="p-2 rounded-lg bg-profit/10 border border-profit/30 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-profit shrink-0" />
              <span className="text-[10px] font-medium text-profit uppercase truncate">{t('insights.bestDay')}</span>
            </div>
            {bestDay ? (
              <>
                <span className="text-[10px] text-muted-foreground mb-1 truncate">
                  {new Date(bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="text-sm font-bold text-profit mt-auto">
                  <BlurredCurrency amount={bestDay.totalPnL} className="inline" />
                </div>
              </>
            ) : (
              <span className="text-xs text-muted-foreground mt-auto">N/A</span>
            )}
          </div>

          {/* Worst Day */}
          <div className="p-2 rounded-lg bg-loss/10 border border-loss/30 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-loss shrink-0" />
              <span className="text-[10px] font-medium text-loss uppercase truncate">{t('insights.worstDay')}</span>
            </div>
            {worstDay && !isSameDay ? (
              <>
                <span className="text-[10px] text-muted-foreground mb-1 truncate">
                  {new Date(worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="text-sm font-bold text-loss mt-auto">
                  <BlurredCurrency amount={worstDay.totalPnL} className="inline" />
                </div>
              </>
            ) : (
              <span className="text-xs text-muted-foreground mt-auto">Same as best</span>
            )}
          </div>
        </div>
      </div>
    </PremiumCard>
  );
});

PerformanceHighlights.displayName = 'PerformanceHighlights';
