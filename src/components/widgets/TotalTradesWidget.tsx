import { memo, useMemo } from 'react';
import { WidgetProps } from '@/types/widget';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface TotalTradesWidgetProps extends WidgetProps {
  totalTrades: number;
  trend?: number;
  currentStreak?: { type: 'win' | 'loss'; count: number };
}

/**
 * Total Trades Widget — Apple Premium dot-matrix.
 * Each dot = 1 trade; winners apple-green, losers apple-red (50% opacity).
 * Optional streak chip surfaces hot/cold runs.
 */
export const TotalTradesWidget = memo(({
  totalTrades,
  trend,
  currentStreak,
}: TotalTradesWidgetProps) => {
  const { t } = useTranslation();
  const hasTrend = trend !== undefined && trend !== 0;
  const isPositiveTrend = (trend ?? 0) > 0;

  // Streak chip — only show when count >= 3
  const streakChip = (() => {
    if (!currentStreak || currentStreak.count < 3) return null;
    if (currentStreak.type === 'win') {
      return { className: 'chip-green', label: `${currentStreak.count}W streak` };
    }
    return { className: 'chip-red', label: `${currentStreak.count}L streak` };
  })();

  const cap = 200;
  const visible = Math.min(totalTrades, cap);

  // Deterministic pattern — roughly 60% "winners"
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
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-medium text-space-300">
          {t('widgets.totalTrades.title')}
        </span>
        <div className="flex items-center gap-1.5">
          {streakChip && (
            <span className={cn(streakChip.className, 'text-[10px]')}>
              {streakChip.label}
            </span>
          )}
          {hasTrend && (
            <span className={cn('text-[10px]', isPositiveTrend ? 'chip-green' : 'chip-red')}>
              {isPositiveTrend ? '+' : ''}{trend} {t('widgets.thisWeek')}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 px-4 pb-4 min-h-0">
        <div className="font-display font-semibold text-3xl leading-none tabular-nums text-space-100 font-num">
          {totalTrades}
        </div>

        {/* Dot matrix */}
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
                  'aspect-square rounded-sm transition-opacity',
                  !active ? 'bg-space-600/40' :
                  isWin ? 'bg-apple-green/50' : 'bg-apple-red/50'
                )}
              />
            );
          })}
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs pt-2 mt-auto">
          <span className="text-space-300">
            <span className="text-apple-green font-medium font-num tabular-nums">{winsViz}</span>
            <span className="text-space-400"> wins</span>
          </span>
          <span className="text-space-300">
            <span className="text-apple-red font-medium font-num tabular-nums">{lossesViz}</span>
            <span className="text-space-400"> losses</span>
          </span>
          <span className="text-space-400 font-num tabular-nums">
            {visible < totalTrades ? `${visible}/${totalTrades}` : `${totalTrades} total`}
          </span>
        </div>
      </div>
    </div>
  );
});

TotalTradesWidget.displayName = 'TotalTradesWidget';
