import { memo, useMemo } from 'react';
import { WidgetProps } from '@/types/widget';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface TotalTradesWidgetProps extends WidgetProps {
  totalTrades: number;
  trend?: number;
}

/**
 * Total Trades Widget — rendered as an ASCII dot-matrix.
 * Metaphor: each block = 1 trade. Green dots represent a deterministic
 * "winning" distribution; red dots the losing ones. Capped at 200 visible.
 */
export const TotalTradesWidget = memo(({
  totalTrades,
  trend,
}: TotalTradesWidgetProps) => {
  const { t } = useTranslation();
  const hasTrend = trend !== undefined && trend !== 0;
  const isPositiveTrend = (trend ?? 0) > 0;

  const cap = 200;
  const visible = Math.min(totalTrades, cap);

  // Deterministic pattern — we don't have real win/loss flags here,
  // so we generate a stable mosaic: roughly 60% "wins" feel
  const pattern = useMemo(() => {
    const seed = totalTrades % 131 || 7;
    return Array.from({ length: cap }).map((_, i) => {
      const n = (i * 7 + seed * 3) % 10;
      return n < 6; // true = win
    });
  }, [totalTrades]);

  const winsViz = pattern.slice(0, visible).filter(Boolean).length;
  const lossesViz = visible - winsViz;

  return (
    <div className="relative flex flex-col h-full scanlines overflow-hidden">
      <div className="term-header shrink-0">
        <span className="tracking-widest">TRADES.N // DUMP</span>
        {hasTrend && (
          <span className={cn('status-pill ml-auto', isPositiveTrend ? '' : 'danger')} style={{ fontSize: '0.58rem', padding: '0 0.35rem' }}>
            {isPositiveTrend ? '+' : ''}{trend} {t('widgets.thisWeek')}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-1.5 px-3 py-2 min-h-0">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-phosphor-dim tracking-widest uppercase">
            {t('widgets.totalTrades.title')}
          </span>
          <div className="font-display text-3xl text-phosphor glow-text chromatic tabular-nums leading-none">
            {totalTrades.toString().padStart(4, '0')}
          </div>
        </div>

        {/* Matrix */}
        <div
          className="grid gap-[2px] mt-1"
          style={{ gridTemplateColumns: 'repeat(25, minmax(0, 1fr))' }}
        >
          {Array.from({ length: cap }).map((_, i) => {
            const active = i < visible;
            const isWin = pattern[i];
            return (
              <div
                key={i}
                className={cn(
                  'aspect-square animate-fade-in',
                  !active ? 'bg-phosphor-dim opacity-20' :
                  isWin ? 'bg-phosphor' : 'bg-danger'
                )}
                style={{
                  animationDelay: active ? `${(i % 40) * 8}ms` : '0ms',
                  ...(active ? { boxShadow: '0 0 3px currentColor' } : {}),
                }}
              />
            );
          })}
        </div>

        {/* Stats line */}
        <div className="flex items-center justify-between text-[10px] font-mono pt-1 mt-auto border-t border-phosphor-dim">
          <span className="text-phosphor">
            <span className="text-phosphor-dim">W </span>{winsViz}
          </span>
          <span className="text-danger">
            <span className="text-phosphor-dim">L </span>{lossesViz}
          </span>
          <span className="text-phosphor-dim">
            {visible < totalTrades ? `VIZ=${visible}/${totalTrades}` : `TOTAL=${totalTrades}`}
          </span>
        </div>
      </div>
    </div>
  );
});

TotalTradesWidget.displayName = 'TotalTradesWidget';
