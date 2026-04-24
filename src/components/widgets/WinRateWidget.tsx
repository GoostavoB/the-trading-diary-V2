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
  if (rate >= 70) return { label: 'Elite', chip: 'chip-green', bar: 'bg-apple-green' };
  if (rate >= 55) return { label: 'Strong', chip: 'chip-green', bar: 'bg-apple-green' };
  if (rate >= 45) return { label: 'Solid', chip: 'chip-electric', bar: 'bg-electric' };
  if (rate >= 35) return { label: 'Weak', chip: 'chip-orange', bar: 'bg-apple-orange' };
  return { label: 'Poor', chip: 'chip-red', bar: 'bg-apple-red' };
}

/**
 * Win Rate Widget — Apple Premium.
 * Clean Apple progress bar + chip tier indicator.
 */
export const WinRateWidget = memo(({
  winRate,
  wins,
  losses,
  totalTrades,
}: WinRateWidgetProps) => {
  const { t } = useTranslation();
  const tier = getTier(winRate);
  const clamped = Math.max(0, Math.min(100, winRate));

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-medium text-space-300">
          {t('widgets.winRate.title', 'Win Rate')}
        </span>
        <span className={cn(tier.chip, 'text-[10px]')}>{tier.label}</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-center gap-3 px-4 pb-4 min-h-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display font-semibold text-3xl leading-none tabular-nums text-space-100 font-num">
            {winRate.toFixed(1)}
            <span className="text-space-400 text-2xl">%</span>
          </span>
        </div>

        {/* Smooth progress bar */}
        <div className="h-2 bg-space-600 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700 ease-out', tier.bar)}
            style={{ width: `${clamped}%` }}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-space-300">
            <span className="text-apple-green font-medium font-num tabular-nums">{wins}</span>
            <span className="text-space-400"> wins</span>
          </span>
          <span className="text-space-300">
            <span className="text-apple-red font-medium font-num tabular-nums">{losses}</span>
            <span className="text-space-400"> losses</span>
          </span>
          <span className="text-space-400 font-num tabular-nums">
            n = {totalTrades}
          </span>
        </div>
      </div>
    </div>
  );
});

WinRateWidget.displayName = 'WinRateWidget';
