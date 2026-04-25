import { memo, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { Trade } from '@/types/trade';

interface AvgROIPerTradeWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  avgROIPerTrade: number;
  totalTrades: number;
  trades?: Trade[];
}

/**
 * Avg ROI Per Trade Widget — Apple Premium.
 * Hero number + 7-bar mini chart of last-7-trade ROIs.
 * No more 270° gauge ring — ROI isn't a fraction of a circle.
 */
export const AvgROIPerTradeWidget = memo(({
  avgROIPerTrade,
  totalTrades,
  trades = [],
}: AvgROIPerTradeWidgetProps) => {
  const { t } = useTranslation();
  const isPositive = avgROIPerTrade >= 0;

  // Last 7 trades (chronological order, oldest first)
  const last7 = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    const sorted = [...trades]
      .filter((t) => typeof t.roi === 'number' && !Number.isNaN(t.roi))
      .sort((a, b) => {
        const aT = a.closed_at || a.opened_at || a.trade_date || a.created_at || '';
        const bT = b.closed_at || b.opened_at || b.trade_date || b.created_at || '';
        return new Date(aT).getTime() - new Date(bT).getTime();
      });
    return sorted.slice(-7);
  }, [trades]);

  // Best / worst across full history
  const { bestROI, worstROI } = useMemo(() => {
    if (!trades || trades.length === 0) return { bestROI: null as number | null, worstROI: null as number | null };
    const rois = trades
      .map((t) => t.roi)
      .filter((r): r is number => typeof r === 'number' && !Number.isNaN(r));
    if (rois.length === 0) return { bestROI: null, worstROI: null };
    return { bestROI: Math.max(...rois), worstROI: Math.min(...rois) };
  }, [trades]);

  // Scale bars to max 32px height
  const maxBarPx = 32;
  const maxAbs = useMemo(() => {
    if (last7.length === 0) return 1;
    const m = Math.max(...last7.map((t) => Math.abs(t.roi || 0)));
    return m > 0 ? m : 1;
  }, [last7]);

  const formatPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-medium text-space-300">
          Avg ROI per trade
        </span>
        <span className="text-[10px] text-space-400 font-num tabular-nums">
          n = {totalTrades}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-center gap-3 px-4 pb-4 min-h-0">
        {/* Hero number */}
        <div className="flex items-baseline gap-2">
          <span className={cn(
            'font-display font-semibold text-3xl leading-none tabular-nums font-num',
            isPositive ? 'text-gradient-electric' : 'text-apple-red'
          )}>
            {isPositive ? '+' : '−'}{Math.abs(avgROIPerTrade).toFixed(2)}%
          </span>
          <span className="text-xs text-space-400">/ trade</span>
        </div>

        {/* Mini bar chart — last 7 trades */}
        {last7.length === 0 ? (
          <div className="flex items-end justify-center h-10">
            <span className="text-space-400 text-sm">—</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div
              className="flex items-end gap-1"
              style={{ height: maxBarPx }}
              aria-label="Last 7 trades ROI"
            >
              {last7.map((t, i) => {
                const roi = t.roi || 0;
                const h = Math.max(2, (Math.abs(roi) / maxAbs) * maxBarPx);
                const isUp = roi >= 0;
                return (
                  <div
                    key={t.id || i}
                    className={cn(
                      'rounded-sm transition-all duration-500',
                      isUp ? 'bg-apple-green' : 'bg-apple-red'
                    )}
                    style={{ width: 8, height: h }}
                    title={`${t.symbol || 'Trade'}: ${formatPct(roi)}`}
                  />
                );
              })}
              {/* placeholders if < 7 */}
              {Array.from({ length: Math.max(0, 7 - last7.length) }).map((_, i) => (
                <div
                  key={`ph-${i}`}
                  className="rounded-sm bg-space-600/40"
                  style={{ width: 8, height: 4 }}
                />
              ))}
            </div>
            <span className="text-[10px] text-space-400">Last 7 trades</span>
          </div>
        )}

        {/* Best / worst */}
        <div className="text-[11px] text-space-400 tabular-nums font-num">
          {bestROI !== null && worstROI !== null ? (
            <>
              <span className="text-apple-green">Best: {formatPct(bestROI)}</span>
              <span className="text-space-500"> · </span>
              <span className="text-apple-red">Worst: {formatPct(worstROI)}</span>
            </>
          ) : (
            <span>Best: — · Worst: —</span>
          )}
        </div>
      </div>
    </div>
  );
});

AvgROIPerTradeWidget.displayName = 'AvgROIPerTradeWidget';
