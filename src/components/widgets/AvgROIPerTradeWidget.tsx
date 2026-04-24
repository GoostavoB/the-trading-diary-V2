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
 * Avg ROI Per Trade Widget — rendered as a 270° gauge ring (HUD dial).
 * Metaphor: a cockpit gauge sweeping from bottom-left to bottom-right.
 */
export const AvgROIPerTradeWidget = memo(({
  avgROIPerTrade,
  totalTrades,
}: AvgROIPerTradeWidgetProps) => {
  const { t } = useTranslation();
  const isPositive = avgROIPerTrade >= 0;

  // Scale: cap ring at +/- 10% per-trade for "full" sweep (realistic max)
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

  const stroke = isPositive ? 'hsl(var(--phosphor))' : 'hsl(var(--danger))';

  return (
    <div className="relative flex flex-col h-full scanlines overflow-hidden">
      <div className="term-header shrink-0">
        <span className="tracking-widest">AVG_ROI // PER_TRADE</span>
        <span className={cn('pulse-dot ml-auto', isPositive ? '' : 'danger')} />
      </div>

      <div className="flex-1 flex items-center justify-center px-3 py-2 min-h-0 gap-3">
        {/* Gauge */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
            {/* track */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke="hsl(var(--phosphor) / 0.15)"
              strokeWidth={8}
              strokeDasharray={`${totalArc} ${gap}`}
            />
            {/* fill */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={stroke}
              strokeWidth={8}
              strokeLinecap="butt"
              strokeDasharray={`${filled} ${circ - filled}`}
              style={{
                transition: 'stroke-dasharray 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                filter: `drop-shadow(0 0 6px ${stroke})`,
              }}
            />
            {/* tick marks */}
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i / 9) * arcFraction * 2 * Math.PI;
              const x1 = cx + Math.cos(angle) * (r - 12);
              const y1 = cy + Math.sin(angle) * (r - 12);
              const x2 = cx + Math.cos(angle) * (r - 16);
              const y2 = cy + Math.sin(angle) * (r - 16);
              return (
                <line
                  key={i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="hsl(var(--phosphor) / 0.35)"
                  strokeWidth={1}
                />
              );
            })}
          </svg>
          {/* center readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              'font-display text-3xl chromatic tabular-nums leading-none',
              isPositive ? 'text-phosphor glow-text' : 'text-danger glow-text-danger'
            )}>
              {isPositive ? '+' : '-'}{Math.abs(avgROIPerTrade).toFixed(2)}
            </span>
            <span className="text-[10px] text-phosphor-dim mt-1 tracking-widest">
              %/TRADE
            </span>
          </div>
        </div>

        {/* Side readout */}
        <div className="flex flex-col gap-1 flex-1 text-[10px] font-mono">
          <div className="flex justify-between border-b border-phosphor-dim pb-0.5">
            <span className="text-phosphor-dim tracking-widest">RANGE</span>
            <span className="text-phosphor">±{scaleMax}%</span>
          </div>
          <div className="flex justify-between border-b border-phosphor-dim pb-0.5">
            <span className="text-phosphor-dim tracking-widest">DUTY</span>
            <span className={isPositive ? 'text-phosphor' : 'text-danger'}>
              {(pct * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between border-b border-phosphor-dim pb-0.5">
            <span className="text-phosphor-dim tracking-widest">N</span>
            <span className="text-phosphor">{totalTrades}</span>
          </div>
          <div className="text-phosphor-dim tracking-widest mt-1">
            {t('widgets.avgROIAcross', { count: totalTrades })}
          </div>
        </div>
      </div>
    </div>
  );
});

AvgROIPerTradeWidget.displayName = 'AvgROIPerTradeWidget';
