import { memo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface AvgROIPerTradeWidgetProps {
  id: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  avgROIPerTrade: number;
  totalTrades: number;
}

/**
 * Avg ROI Per Trade Widget — Apple Premium gauge ring.
 * Minimal 270° arc, electric-blue for positive / apple-red for negative.
 */
export const AvgROIPerTradeWidget = memo(({
  avgROIPerTrade,
  totalTrades,
}: AvgROIPerTradeWidgetProps) => {
  const { t } = useTranslation();
  const isPositive = avgROIPerTrade >= 0;

  // Scale: cap ring at +/- 10% per-trade for full sweep
  const scaleMax = 10;
  const abs = Math.min(Math.abs(avgROIPerTrade), scaleMax);
  const pct = abs / scaleMax;

  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const arcFraction = 0.75;
  const totalArc = circ * arcFraction;
  const filled = totalArc * pct;
  const gap = circ - totalArc;

  const stroke = isPositive ? 'hsl(var(--electric-blue))' : 'hsl(var(--apple-red))';

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-medium text-space-300">
          Avg ROI per trade
        </span>
        <span className={cn('pulse-dot', isPositive ? '' : 'danger')} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-4 min-h-0 gap-4">
        {/* Gauge */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
            {/* track */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke="hsl(var(--space-gray-600))"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${totalArc} ${gap}`}
            />
            {/* fill */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={stroke}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circ - filled}`}
              style={{
                transition: 'stroke-dasharray 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </svg>
          {/* center readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              'font-display font-semibold text-2xl tabular-nums leading-none font-num',
              isPositive ? 'text-space-100' : 'text-apple-red'
            )}>
              {isPositive ? '+' : '-'}{Math.abs(avgROIPerTrade).toFixed(2)}%
            </span>
            <span className="text-[10px] text-space-400 mt-1">per trade</span>
          </div>
        </div>

        {/* Side readout */}
        <div className="flex flex-col gap-2 flex-1 text-xs">
          <div className="flex justify-between">
            <span className="text-space-400">Range</span>
            <span className="text-space-200 font-num tabular-nums">±{scaleMax}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-space-400">Filled</span>
            <span className={cn('font-num tabular-nums', isPositive ? 'text-electric' : 'text-apple-red')}>
              {(pct * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-space-400">Trades</span>
            <span className="text-space-200 font-num tabular-nums">{totalTrades}</span>
          </div>
          <p className="text-[11px] text-space-400 mt-2 leading-snug">
            {t('widgets.avgROIAcross', { count: totalTrades })}
          </p>
        </div>
      </div>
    </div>
  );
});

AvgROIPerTradeWidget.displayName = 'AvgROIPerTradeWidget';
