import { memo } from 'react';
import { WidgetProps } from '@/types/widget';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface WinRateWidgetProps extends WidgetProps {
  winRate: number;
  wins: number;
  losses: number;
  totalTrades: number;
}

function getTier(rate: number) {
  if (rate >= 70) return { label: 'ELITE', pill: '', color: 'text-phosphor', bg: 'bg-phosphor', glow: 'glow-text' };
  if (rate >= 55) return { label: 'STRONG', pill: '', color: 'text-phosphor', bg: 'bg-phosphor', glow: 'glow-text' };
  if (rate >= 45) return { label: 'OK', pill: 'amber', color: 'text-amber-term', bg: 'bg-amber-term', glow: 'glow-text-amber' };
  return { label: 'POOR', pill: 'danger', color: 'text-danger', bg: 'bg-danger', glow: 'glow-text-danger' };
}

/**
 * Win Rate Widget — rendered as an ASCII progress bar / dos-readout.
 * Metaphor: a terminal utility printing `[████░░░]` style progress.
 */
export const WinRateWidget = memo(({
  winRate,
  wins,
  losses,
  totalTrades,
}: WinRateWidgetProps) => {
  const { t } = useTranslation();
  const tier = getTier(winRate);
  const cells = 24;
  const filled = Math.round((Math.max(0, Math.min(100, winRate)) / 100) * cells);

  return (
    <div className="relative flex flex-col h-full scanlines overflow-hidden">
      <div className="term-header shrink-0">
        <span className="tracking-widest">WR.PCT // ./winrate --live</span>
        <span className={cn('status-pill ml-auto', tier.pill)} style={{ fontSize: '0.6rem', padding: '0 0.4rem' }}>
          [ {tier.label} ]
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-2 px-3 py-2 min-h-0">
        {/* Label + big number */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] tracking-widest text-phosphor-dim uppercase">
            {t('widgets.winRate.title', 'Win Rate')}
          </span>
          <div className={cn('font-display text-3xl leading-none chromatic tabular-nums', tier.color, tier.glow)}>
            {winRate.toFixed(1)}<span className="text-phosphor-dim">%</span>
          </div>
        </div>

        {/* bar: block cells */}
        <div className="flex gap-[2px] mt-1">
          {Array.from({ length: cells }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-3 flex-1 transition-all',
                i < filled ? tier.bg : 'bg-phosphor-dim opacity-40'
              )}
              style={i < filled ? { boxShadow: '0 0 5px currentColor' } : undefined}
            />
          ))}
        </div>

        {/* ASCII echo */}
        <div className="text-[10px] font-mono text-phosphor-dim tracking-widest leading-none">
          [{'█'.repeat(filled)}{'░'.repeat(cells - filled)}] {winRate.toFixed(1)}%
        </div>

        {/* W/L stream */}
        <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-phosphor-dim">
          <span className="text-phosphor">
            <span className="text-phosphor-dim">WIN </span>{wins.toString().padStart(3, '0')}
          </span>
          <span className="text-danger">
            <span className="text-phosphor-dim">LOSS </span>{losses.toString().padStart(3, '0')}
          </span>
          <span className="text-phosphor-dim">
            N={totalTrades}
          </span>
        </div>
      </div>
    </div>
  );
});

WinRateWidget.displayName = 'WinRateWidget';
